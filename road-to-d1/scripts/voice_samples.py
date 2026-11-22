"""Render one test sentence with every American male Kokoro voice.

Output: voice_samples/<voice>.wav (24 kHz mono, small, committed so the owner can
listen from a phone). Run: .venv/bin/python scripts/voice_samples.py
"""
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

TEXT = "My best friend is a three-star receiver. I'm the long snapper. Guess which one of us thinks he's famous."
k = Kokoro("models/kokoro-v1.0.onnx", "models/voices-v1.0.bin")
voices = sorted(v for v in np.load("models/voices-v1.0.bin").files if v.startswith("am_"))
for v in voices:
    audio, sr = k.create(TEXT, voice=v, speed=1.0)
    sf.write(f"voice_samples/{v}.wav", audio, sr, subtype="PCM_16")
    # simple stats help pick a voice without ears: duration and pitch spread
    print(v, f"{len(audio)/sr:.2f}s")
