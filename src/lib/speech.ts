// Text-to-speech and speech recognition through the browser's Web Speech API.
// Recognition is non-standard (prefixed in Chrome, partial in Safari, unconfirmed in an
// installed iPhone PWA), so callers must always offer the fallback (spec §5.5).
import { useSyncExternalStore } from 'react';
import { mergeTranscripts, splitForSpeech } from './speechText';

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

let voice: SpeechSynthesisVoice | null = null;
// Chrome fills the voice list asynchronously: until it has answered, assume a voice exists.
let voicesKnown = false;
const voiceListeners = new Set<() => void>();

function pickVoice(accent: 'US' | 'GB' = 'US') {
  if (!canSpeak()) return;
  const voices = speechSynthesis.getVoices();
  if (voices.length) voicesKnown = true;
  const lang = accent === 'US' ? /en-US/i : /en-GB/i;
  voice = voices.find((v) => lang.test(v.lang) && /Google|Natural|Samantha|Daniel|Aria|Jenny/i.test(v.name))
    ?? voices.find((v) => lang.test(v.lang)) ?? voices.find((v) => /^en/i.test(v.lang)) ?? null;
}

function voicesChanged() {
  voicesKnown = true;
  pickVoice();
  voiceListeners.forEach((f) => f());
}

if (canSpeak()) {
  pickVoice();
  const synth = speechSynthesis as SpeechSynthesis & Partial<EventTarget>;
  if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', voicesChanged);
  else synth.onvoiceschanged = voicesChanged;
  // Some browsers never fire the event when they have no voice at all: stop waiting.
  setTimeout(() => { if (!voicesKnown) voicesChanged(); }, 2500);
}

/** False when the browser has no speech synthesis or no voice installed (listening exercises are then hidden). */
export function hasVoice(): boolean {
  if (!canSpeak()) return false;
  return !voicesKnown || speechSynthesis.getVoices().length > 0;
}

/** Same as hasVoice(), re-rendering when the voice list arrives. */
export function useHasVoice(): boolean {
  return useSyncExternalStore(
    (cb) => { voiceListeners.add(cb); return () => { voiceListeners.delete(cb); }; },
    hasVoice,
    () => false
  );
}

export function speak(text: string, opts: { slow?: boolean } = {}) {
  if (!canSpeak()) return false;
  if (!voice) pickVoice();
  stopSpeaking();
  // Chrome desktop cuts one utterance after about 15 s: long texts are queued in short parts.
  for (const part of splitForSpeech(text, opts.slow ? 120 : 180)) {
    const u = new SpeechSynthesisUtterance(part);
    u.lang = voice?.lang ?? 'en-US';
    if (voice) u.voice = voice;
    u.rate = opts.slow ? 0.7 : 0.95;
    speechSynthesis.speak(u);
  }
  return true;
}

export const stopSpeaking = () => {
  if (canSpeak() && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel();
};

// --- Recognition ------------------------------------------------------------
interface RecognitionResultLike { 0: { transcript: string }; isFinal: boolean }
interface RecognitionEventLike { results: ArrayLike<RecognitionResultLike> }
export interface Recognizer {
  start(): void; stop(): void; abort(): void;
  lang: string; interimResults: boolean; continuous: boolean; maxAlternatives: number;
  onresult: ((e: RecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognizerCtor = new () => Recognizer;

function ctor(): RecognizerCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognizerCtor; webkitSpeechRecognition?: RecognizerCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const canRecognize = () => typeof window !== 'undefined' && !!ctor();

/** 'unsupported' also covers a service the browser refuses (installed iPhone PWA) or a missing microphone. 'aborted' = cancelled by the app. */
export type ListenError = 'not-allowed' | 'no-speech' | 'network' | 'unsupported' | 'aborted' | 'other';

export function listenErrorCode(error: string): ListenError {
  switch (error) {
    case 'not-allowed': return 'not-allowed';
    case 'service-not-allowed': case 'audio-capture': case 'language-not-supported': return 'unsupported';
    case 'no-speech': return 'no-speech';
    case 'network': return 'network';
    case 'aborted': return 'aborted';
    default: return 'other';
  }
}

export interface Listening {
  /** Resolves with the final transcript; rejects with a ListenError. */
  done: Promise<string>;
  /** Ends listening and resolves with what was heard. */
  stop: () => void;
  /** Cancels: `done` rejects with 'aborted', nothing is delivered. */
  abort: () => void;
}

const LIMIT_MS = { single: 12_000, continuous: 60_000 };

/**
 * Listens in en-US. `onPartial` receives the live transcript; resolves with the final one.
 * Audio is never stored: only the text transcript is returned.
 */
export function listen(onPartial: (text: string) => void, opts: { continuous?: boolean } = {}): Listening {
  const noop = () => {};
  const C = typeof window === 'undefined' ? null : ctor();
  if (!C) return { done: Promise.reject<string>('unsupported' satisfies ListenError), stop: noop, abort: noop };
  const r = new C();
  r.lang = 'en-US';
  r.interimResults = true;
  r.continuous = !!opts.continuous;
  r.maxAlternatives = 1;

  let finals = '';
  let live = '';
  let settled = false;
  let guard: ReturnType<typeof setTimeout> | undefined;
  let endFallback: ReturnType<typeof setTimeout> | undefined;
  let settle: (ok: boolean, value: string) => void = noop;

  const done = new Promise<string>((resolve, reject) => {
    settle = (ok, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(guard);
      clearTimeout(endFallback);
      r.onresult = null; r.onerror = null; r.onend = null;
      if (ok) resolve(value); else reject(value);
    };
    r.onresult = (e) => {
      const all = Array.from(e.results);
      // Only final results are kept; the last interim one is shown live but never stacked.
      finals = mergeTranscripts(all.filter((x) => x.isFinal).map((x) => x[0].transcript));
      live = mergeTranscripts(all.map((x) => x[0].transcript));
      onPartial(live);
    };
    r.onerror = (e) => settle(false, listenErrorCode(e.error));
    r.onend = () => settle(true, finals || live);
  });

  const stop = () => {
    if (settled) return;
    try { r.stop(); } catch { /* already stopped */ }
    // Safari sometimes never fires "end" after stop().
    endFallback ??= setTimeout(() => settle(true, finals || live), 1500);
  };
  const abort = () => {
    if (settled) return;
    settle(false, 'aborted');
    try { r.abort(); } catch { /* already stopped */ }
  };

  try { r.start(); } catch { return { done: Promise.reject<string>('other' satisfies ListenError), stop: noop, abort: noop }; }
  // Never leave the microphone open: a silent or forgotten session ends by itself.
  guard = setTimeout(stop, opts.continuous ? LIMIT_MS.continuous : LIMIT_MS.single);
  return { done, stop, abort };
}
