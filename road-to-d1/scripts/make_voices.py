"""Generate one WAV per sentence for an episode with Kokoro (CPU, local).

Usage: .venv/bin/python scripts/make_voices.py ep01

Reads src/episodes/<ep>/script.json. Writes voice/<ep>/line_<id>_<speaker>_s<n>.wav at 48 kHz mono,
silence trimmed to ~40 ms each side. Generating sentence-by-sentence is what gives us exact
caption timing without a speech-to-text model (Hugging Face is blocked here).
"""
import json, sys, os
import numpy as np, soundfile as sf
from scipy.signal import resample_poly, butter, sosfilt
from kokoro_onnx import Kokoro

ep = sys.argv[1] if len(sys.argv) > 1 else "ep01"
script = json.load(open(f"src/episodes/{ep}/script.json"))
out_dir = f"voice/{ep}"
os.makedirs(out_dir, exist_ok=True)
k = Kokoro("models/kokoro-v1.0.onnx", "models/voices-v1.0.bin")

def trim(x, sr, pad=0.04, thresh_db=-42):
    """Cut leading/trailing silence, keeping `pad` seconds of air on each side."""
    hop = int(sr * 0.005)
    env = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2) + 1e-12) for i in range(0, len(x), hop)])
    db = 20 * np.log10(env / (env.max() + 1e-12))
    on = np.where(db > thresh_db)[0]
    if len(on) == 0:
        return x
    a = max(0, on[0] * hop - int(pad * sr)); b = min(len(x), (on[-1] + 1) * hop + int(pad * sr))
    y = x[a:b].copy()
    f = int(0.008 * sr)  # 8 ms fades stop clicks at the cut points
    y[:f] *= np.linspace(0, 1, f); y[-f:] *= np.linspace(1, 0, f)
    return y

def split_at_pauses(x, sr, n):
    """Split one whole-line take into n sentence chunks at its n-1 longest pauses.
    Whole-line takes keep natural intonation across sentences (per-sentence takes sound choppy),
    and cutting at the real pauses keeps caption timing exact."""
    if n == 1:
        return [x]
    hop = int(sr * 0.01)
    env = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2) + 1e-12) for i in range(0, len(x), hop)])
    quiet = env < env.max() * 0.03
    runs, start = [], None
    for i, q in enumerate(quiet):
        if q and start is None: start = i
        if (not q or i == len(quiet) - 1) and start is not None:
            if start > 5 and i < len(quiet) - 5: runs.append((i - start, start, i))
            start = None
    cuts = sorted(sorted(runs, reverse=True)[: n - 1], key=lambda r: r[1])
    if len(cuts) < n - 1:
        return None
    pts = [0] + [((a + b) // 2) * hop for _, a, b in cuts] + [len(x)]
    return [x[pts[i]:pts[i + 1]] for i in range(n)]

whole_line = script.get("wholeLine", False)
for line in script["lines"]:
    spk = line["speaker"]; v = script["voices"][spk]
    speed = line.get("speed", v["speed"]); gain = line.get("gain", 1.0)
    voice = v["voice"]
    texts = [s.get("tts", s["text"]) for s in line["sentences"]]
    chunks = None
    if whole_line and len(texts) > 1:
        full, sr0 = k.create(" ".join(texts), voice=voice, speed=speed, lang="en-us")
        chunks = split_at_pauses(full.astype(np.float64), sr0, len(texts))
        if chunks is None:
            print(f"line {line['id']}: could not find {len(texts) - 1} pauses, falling back to per-sentence")
    if chunks is None:
        chunks = []
        for t in texts:
            a, sr0 = k.create(t, voice=voice, speed=speed, lang="en-us")
            chunks.append(a.astype(np.float64))
    for n, audio in enumerate(chunks):
        audio = trim(audio, sr0)
        audio = resample_poly(audio, 2, 1)  # 24 kHz -> 48 kHz
        sr = 48000
        if line.get("whisper"):
            audio = sosfilt(butter(2, 300, "hp", fs=sr, output="sos"), audio)
            env = np.convolve(np.abs(audio), np.ones(480) / 480, "same")
            audio = audio + np.random.default_rng(3).normal(0, 1, len(audio)) * env * 0.35
        audio = audio / (np.abs(audio).max() + 1e-9) * 0.7 * gain
        path = f"{out_dir}/line_{line['id']}_{spk}_s{n}.wav"
        sf.write(path, np.clip(audio, -1, 1).astype(np.float32), sr, subtype="PCM_16")
        print(path, f"{len(audio)/sr:.2f}s")
