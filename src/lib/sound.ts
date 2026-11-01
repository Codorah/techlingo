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

function play(notes: [number, number, number, OscillatorType?][]) {
  if (!soundEnabled() || typeof window === 'undefined') return;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx ??= new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
    for (const [f, s, d, type] of notes) tone(f, s, d, type);
  } catch { /* audio unavailable: silent */ }
}

export const sounds = {
  correct: () => play([[660, 0, 0.12, 'triangle'], [880, 0.09, 0.2, 'triangle']]),
  wrong: () => play([[220, 0, 0.16, 'sine'], [185, 0.12, 0.24, 'sine']]),
  celebrate: () => play([[523, 0, 0.14, 'triangle'], [659, 0.1, 0.14, 'triangle'], [784, 0.2, 0.14, 'triangle'], [1047, 0.3, 0.36, 'triangle']])
};
