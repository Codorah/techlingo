"""Generate the voice-over with Microsoft Edge neural TTS, trim silences, measure
durations and write src/timeline.json + the French WebVTT subtitles.

Usage (from video/):  python scripts/voice.py [--skip-tts]
Requires: pip install edge-tts, ffmpeg + ffprobe on PATH.
"""
import json
import os
import math
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
VOICE_DIR = ROOT / "public" / "voice"
# Raw TTS downloads are intermediate files: set TL_TMP to keep them outside the repo.
RAW_DIR = Path(os.environ.get("TL_TMP", ROOT / "build")) / "voice-raw"
VTT_DIR = ROOT.parent / "public" / "decouvrir" / "video"


def run(cmd):
    subprocess.run(cmd, check=True, capture_output=True)


def duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
        check=True, capture_output=True, text=True,
    ).stdout.strip()
    return float(out)


def tts(text, cfg, out):
    run([
        sys.executable, "-m", "edge_tts", "--voice", cfg["voice"], "--rate", cfg["rate"], "--pitch", cfg["pitch"],
        "--text", text, "--write-media", str(out),
    ])


def trim(src, dst):
    # Trim leading/trailing silence, keep 40 ms of air on each side, mono 48 kHz WAV.
    f = (
        "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,"
        "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse"
    )
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-af", f, "-ar", "48000", "-ac", "1", str(dst)])


def ts(sec):
    ms = int(round(sec * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def split_cues(text, start, dur):
    """Split a segment into sentence cues, timed proportionally to their length."""
    parts = [p.strip() for p in re.split(r"(?<=[.?!])\s+", text) if p.strip()]
    total = sum(len(p) for p in parts)
    cues, t = [], start
    for p in parts:
        d = dur * len(p) / total
        cues.append((t, t + d, p))
        t += d
    return cues


def main():
    skip_tts = "--skip-tts" in sys.argv
    script = json.loads((ROOT / "script.json").read_text(encoding="utf-8"))
    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    scenes, cues, cursor = [], [], 0
    for scene in script["scenes"]:
        t = script["leadIn"]
        segs = []
        for i, seg in enumerate(scene["segments"]):
            name = f"{scene['id']}-{i}"
            raw = RAW_DIR / f"{name}.mp3"
            wav = VOICE_DIR / f"{name}.wav"
            if not skip_tts or not wav.exists():
                tts(seg.get("say", seg["text"]), script["voices"][seg["v"]], raw)
                trim(raw, wav)
            d = duration(wav)
            seg_from = cursor + round(t * FPS)
            segs.append({
                "src": f"voice/{name}.wav", "from": seg_from, "durationInFrames": math.ceil(d * FPS),
                "seconds": round(d, 3), "text": seg["text"], "lang": "fr" if seg["v"] == "fr" else "en",
                "localFrom": round(t * FPS),
            })
            english = seg["v"] != "fr"
            for a, b, p in split_cues(seg["text"], seg_from / FPS, d):
                cues.append((a, b + 0.25, f"<i>{p}</i>" if english else p))
            t += d + script["gap"]
        length = max(scene.get("minDuration", 0), t - script["gap"] + script["tail"])
        frames = round(length * FPS)
        scenes.append({"id": scene["id"], "from": cursor, "durationInFrames": frames, "segments": segs})
        print(f"{scene['id']:<10} {length:5.2f}s  " + " + ".join(f"{s['seconds']:.2f}" for s in segs))
        cursor += frames

    timeline = {"fps": FPS, "durationInFrames": cursor, "scenes": scenes}
    (ROOT / "src" / "timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"TOTAL {cursor / FPS:.2f}s ({cursor} frames)")

    # Cues must not overlap: clamp each end to the next start.
    lines = ["WEBVTT", "Kind: captions", "Language: fr", ""]
    for n, (a, b, p) in enumerate(cues):
        if n + 1 < len(cues):
            b = min(b, cues[n + 1][0] - 0.02)
        lines += [str(n + 1), f"{ts(a)} --> {ts(b)}", p, ""]
    VTT_DIR.mkdir(parents=True, exist_ok=True)
    vtt = "\n".join(lines)
    for name in ("techlingo-vertical.fr.vtt", "techlingo-landscape.fr.vtt"):
        (VTT_DIR / name).write_text(vtt, encoding="utf-8")


if __name__ == "__main__":
    main()
