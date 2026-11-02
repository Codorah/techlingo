// Short feedback sounds synthesized with Web Audio: no files to download, nothing to cache.
// On by default like most learning apps; the learner can turn them off in the profile.
const KEY = 'techlingo.sound';
let ctx: AudioContext | null = null;

export function soundEnabled(): boolean {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}
export function setSoundEnabled(on: boolean) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* storage unavailable */ }
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = 'sine', volume = 0.12) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ctx.currentTime + start;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx || ctx.state === 'closed') ctx = new Ctor();
  // iOS also reports 'interrupted' (after a call or the app going to the background).
  if (ctx.state !== 'running') void ctx.resume().catch(() => {});
  return ctx;
}

function play(notes: [number, number, number, OscillatorType?][]) {
  if (!soundEnabled()) return;
  try {
    if (!audioContext()) return;
    for (const [f, s, d, type] of notes) tone(f, s, d, type);
  } catch { /* audio unavailable: silent */ }
}

// iOS only lets an AudioContext start inside a user gesture. The celebration sound plays
// after an await (database write), outside the tap: unlock the context on the first touches.
// Listeners stay on: iOS can interrupt the context again later (call, background).
function unlock() {
  if (!soundEnabled() || ctx?.state === 'running') return;
  try {
    const c = audioContext();
    if (!c) return;
    const buffer = c.createBuffer(1, 1, 22050);
    const src = c.createBufferSource();
    src.buffer = buffer;
    src.connect(c.destination);
    src.start(0);
  } catch { /* audio unavailable */ }
}
if (typeof window !== 'undefined') {
  for (const e of ['pointerdown', 'touchend', 'keydown']) window.addEventListener(e, unlock, { capture: true, passive: true });
}

export const sounds = {
  correct: () => play([[660, 0, 0.12, 'triangle'], [880, 0.09, 0.2, 'triangle']]),
  wrong: () => play([[220, 0, 0.16, 'sine'], [185, 0.12, 0.24, 'sine']]),
  celebrate: () => play([[523, 0, 0.14, 'triangle'], [659, 0.1, 0.14, 'triangle'], [784, 0.2, 0.14, 'triangle'], [1047, 0.3, 0.36, 'triangle']]),
  badge: () => play([[784, 0, 0.12, 'triangle'], [988, 0.09, 0.12, 'triangle'], [1319, 0.18, 0.2, 'triangle'], [1568, 0.3, 0.45, 'sine']]),
  levelUp: () => play([[392, 0, 0.12, 'triangle'], [523, 0.1, 0.12, 'triangle'], [659, 0.2, 0.12, 'triangle'], [784, 0.3, 0.14, 'triangle'], [1047, 0.42, 0.5, 'triangle']])
};
