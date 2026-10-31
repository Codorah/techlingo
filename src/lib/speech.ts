// Text-to-speech and speech recognition through the browser's Web Speech API.
// Recognition is non-standard (prefixed in Chrome, partial in Safari, unconfirmed in an
// installed iPhone PWA), so callers must always offer the fallback (spec §5.5).

let voice: SpeechSynthesisVoice | null = null;
function pickVoice(accent: 'US' | 'GB' = 'US') {
  if (!('speechSynthesis' in window)) return;
  const voices = speechSynthesis.getVoices();
  const lang = accent === 'US' ? /en-US/i : /en-GB/i;
  voice = voices.find((v) => lang.test(v.lang) && /Google|Natural|Samantha|Daniel|Aria|Jenny/i.test(v.name))
    ?? voices.find((v) => lang.test(v.lang)) ?? voices.find((v) => /^en/i.test(v.lang)) ?? null;
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.onvoiceschanged = () => pickVoice();
}

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(text: string, opts: { slow?: boolean } = {}) {
  if (!canSpeak()) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = voice?.lang ?? 'en-US';
  if (voice) u.voice = voice;
  u.rate = opts.slow ? 0.7 : 0.95;
  speechSynthesis.speak(u);
  return true;
}

export const stopSpeaking = () => { if (canSpeak()) speechSynthesis.cancel(); };

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

export type ListenError = 'not-allowed' | 'no-speech' | 'network' | 'unsupported' | 'other';

/**
 * Listens once in en-US. `onPartial` receives the live transcript; resolves with the final one.
 * Audio is never stored: only the text transcript is returned.
 */
export function listen(onPartial: (text: string) => void, opts: { continuous?: boolean } = {}): { done: Promise<string>; stop: () => void } {
  const C = ctor();
  if (!C) return { done: Promise.reject<string>('unsupported' satisfies ListenError), stop: () => {} };
  const r = new C();
  r.lang = 'en-US';
  r.interimResults = true;
  r.continuous = !!opts.continuous;
  r.maxAlternatives = 1;
  let text = '';
  const done = new Promise<string>((resolve, reject) => {
    r.onresult = (e) => {
      text = Array.from(e.results).map((x) => x[0].transcript).join(' ').trim();
      onPartial(text);
    };
    r.onerror = (e) => {
      const code: ListenError = e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'not-allowed'
        : e.error === 'no-speech' ? 'no-speech' : e.error === 'network' ? 'network' : 'other';
      reject(code);
    };
    r.onend = () => resolve(text);
  });
  try { r.start(); } catch { return { done: Promise.reject<string>('other' satisfies ListenError), stop: () => {} }; }
  return { done, stop: () => { try { r.stop(); } catch { /* already stopped */ } } };
}
