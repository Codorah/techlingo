"""Synthesize every non-voice sound of the video (no samples, so no licensing question):
UI sound effects in public/sfx/ and a soft background bed in public/music/bed.wav.

Usage (from video/):  python scripts/sounds.py
Requires numpy + scipy. Reads src/timeline.json for the bed length.
"""
import json
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
rng = np.random.default_rng(7)


def write(path, data):
    """Write mono or stereo float data (-1..1) as 16-bit WAV."""
    path.parent.mkdir(parents=True, exist_ok=True)
    data = np.asarray(data, dtype=np.float64)
    if data.ndim == 1:
        data = np.stack([data, data], axis=1)
    peak = np.max(np.abs(data))
    if peak > 0.98:
        data = data * (0.98 / peak)
    pcm = (data * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def t_axis(sec):
    return np.arange(int(sec * SR)) / SR


def env(sec, attack, decay_rate):
    t = t_axis(sec)
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-t * decay_rate)


def bell(freq, sec=0.9, decay=6.0, level=0.5):
    t = t_axis(sec)
    tone = np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 10)
    tone += 0.08 * np.sin(2 * np.pi * freq * 3.01 * t) * np.exp(-t * 18)
    return level * tone * env(sec, 0.004, decay)


def place(buf, sig, at):
    i = int(at * SR)
    buf[i:i + len(sig)] += sig[: max(0, len(buf) - i)]
    return buf


def lowpass(x, cutoff, order=2):
    return sosfilt(butter(order, cutoff, "low", fs=SR, output="sos"), x)


def bandpass(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def whoosh(sec=0.55):
    n = int(sec * SR)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    # Sweep a band-pass across blocks and overlap-add (Hann).
    block, hop = 2048, 512
    win = np.hanning(block)
    for start in range(0, n - block, hop):
        p = start / n
        center = 250 + 2600 * np.sin(np.pi * p) ** 1.5
        seg = bandpass(noise[start:start + block], center * 0.6, min(center * 1.6, 20000))
        out[start:start + block] += seg * win
    shape = np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    return 0.35 * out * shape / (np.max(np.abs(out)) + 1e-9)


def tap():
    t = t_axis(0.08)
    click = np.sin(2 * np.pi * 1500 * t * (1 - 0.35 * t / 0.08)) * np.exp(-t * 70)
    click += 0.3 * lowpass(rng.standard_normal(len(t)), 4000) * np.exp(-t * 160)
    return 0.45 * click


def pop():
    t = t_axis(0.12)
    f = 980 - 420 * (t / 0.12)
    phase = 2 * np.pi * np.cumsum(f) / SR
    return 0.4 * np.sin(phase) * env(0.12, 0.003, 32)


def correct():
    buf = np.zeros(int(0.9 * SR))
    place(buf, bell(1046.5, 0.7, 7, 0.4), 0)        # C6
    place(buf, bell(1567.98, 0.8, 6, 0.42), 0.09)    # G6
    return buf


def success():
    buf = np.zeros(int(1.4 * SR))
    for k, f in enumerate([783.99, 987.77, 1174.66, 1567.98]):  # G5 B5 D6 G6
        place(buf, bell(f, 1.0, 5, 0.32), k * 0.075)
    return buf


def rise():
    t = t_axis(0.35)
    f = 420 + 700 * (t / 0.35) ** 2
    phase = 2 * np.pi * np.cumsum(f) / SR
    return 0.28 * np.sin(phase) * np.sin(np.pi * t / 0.35)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def bed(total):
    """Soft pad (Dmaj9 / Bm7 / Gmaj7 / Asus) with a gentle plucked arpeggio, 96 bpm."""
    n = int(total * SR)
    t = np.arange(n) / SR
    left, right = np.zeros(n), np.zeros(n)
    bar = 60 / 96 * 4
    chords = [
        [50, 57, 61, 64, 66],  # D A C# E F#
        [47, 54, 57, 62, 66],  # B F# A D F#
        [43, 50, 54, 59, 62],  # G D F# B D
        [45, 52, 57, 59, 64],  # A E A B E
    ]
    nbars = int(np.ceil(total / bar)) + 1
    for b in range(nbars):
        notes = chords[b % 4]
        s0 = b * bar
        i0, i1 = int(s0 * SR), min(n, int((s0 + bar + 0.6) * SR))
        if i0 >= n:
            break
        tt = t[i0:i1] - s0
        e = np.clip(tt / 0.9, 0, 1) * np.clip((bar + 0.6 - tt) / 0.9, 0, 1)
        for k, m in enumerate(notes):
            f = midi(m)
            amp = 0.05 if k else 0.07
            left[i0:i1] += amp * e * (np.sin(2 * np.pi * f * 0.998 * tt) + 0.2 * np.sin(2 * np.pi * f * 2 * tt))
            right[i0:i1] += amp * e * (np.sin(2 * np.pi * f * 1.002 * tt + 0.7) + 0.2 * np.sin(2 * np.pi * f * 2 * tt))
        # Arpeggio: eighth notes, one octave up, alternating pan.
        step = bar / 8
        pattern = [1, 2, 3, 4, 3, 2, 3, 4]
        for j, idx in enumerate(pattern):
            st = s0 + j * step
            if st >= total:
                break
            f = midi(notes[idx] + 12)
            pl = bell(f, 0.6, 7, 0.07)
            pan = 0.35 if j % 2 else -0.35
            place(left, pl * (1 - pan), st)
            place(right, pl * (1 + pan), st)
        # Soft kick on 1 and 3 for a light pulse.
        for beat in (0, 2):
            st = s0 + beat * bar / 4
            kt = t_axis(0.25)
            kick = 0.16 * np.sin(2 * np.pi * (55 + 60 * np.exp(-kt * 30)) * kt) * np.exp(-kt * 14)
            place(left, kick, st)
            place(right, kick, st)
    left, right = lowpass(left, 5200), lowpass(right, 5200)
    fade = np.clip(t / 1.5, 0, 1) * np.clip((total - t) / 2.5, 0, 1)
    stereo = np.stack([left * fade, right * fade], axis=1)
    return 0.8 * stereo / np.max(np.abs(stereo))


def main():
    sfx = ROOT / "public" / "sfx"
    write(sfx / "whoosh.wav", whoosh())
    write(sfx / "tap.wav", tap())
    write(sfx / "pop.wav", pop())
    write(sfx / "correct.wav", correct())
    write(sfx / "success.wav", success())
    write(sfx / "rise.wav", rise())
    timeline = json.loads((ROOT / "src" / "timeline.json").read_text(encoding="utf-8"))
    total = timeline["durationInFrames"] / timeline["fps"] + 0.5
    write(ROOT / "public" / "music" / "bed.wav", bed(total))
    print("sounds written")


if __name__ == "__main__":
    main()
