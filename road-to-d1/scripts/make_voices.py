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

for line in script["lines"]:
    spk = line["speaker"]; v = script["voices"][spk]
    speed = line.get("speed", v["speed"]); gain = line.get("gain", 1.0)
    for n, s in enumerate(line["sentences"]):
        audio, sr = k.create(s.get("tts", s["text"]), voice=v["voice"], speed=speed, lang="en-us")
        audio = trim(audio.astype(np.float64), sr)
        audio = resample_poly(audio, 2, 1)  # 24 kHz -> 48 kHz
        sr = 48000
        if spk == "tre" and line["id"] == "03":
            # Whisper-ish: thinner and quieter, with a little breath noise riding the envelope.
            audio = sosfilt(butter(2, 300, "hp", fs=sr, output="sos"), audio)
            env = np.convolve(np.abs(audio), np.ones(480) / 480, "same")
            audio = audio + np.random.default_rng(3).normal(0, 1, len(audio)) * env * 0.35
        audio = audio / (np.abs(audio).max() + 1e-9) * 0.7 * gain
        path = f"{out_dir}/line_{line['id']}_{spk}_s{n}.wav"
        sf.write(path, np.clip(audio, -1, 1).astype(np.float32), sr, subtype="PCM_16")
        print(path, f"{len(audio)/sr:.2f}s")
