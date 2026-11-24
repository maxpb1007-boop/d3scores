"""Render the Ep 2 opening with several voice setups so the owner can pick by ear.
Output: voice_samples/options/<n>_<name>.wav (small, committed)."""
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

k = Kokoro("models/kokoro-v1.0.onnx", "models/voices-v1.0.bin")
V = np.load("models/voices-v1.0.bin")
S = ["In this town, everyone's recruiting rating floats above their head.",
     "Five stars? You're basically famous.", "Three stars? You're Tre.",
     "And me? Zero stars. Just an empty gray circle."]
blend = lambda a, b, w: V[a] * w + V[b] * (1 - w)

def per_sentence(voice, speed):
    out = []
    for s in S:
        a, sr = k.create(s, voice=voice, speed=speed)
        out += [a, np.zeros(int(sr * 0.16))]
    return np.concatenate(out), sr

def whole(voice, speed):
    return k.create(" ".join(S), voice=voice, speed=speed)

OPTS = [
    ("1_current_michael_per_sentence", lambda: per_sentence("am_michael", 1.17)),
    ("2_michael_whole_line", lambda: whole("am_michael", 1.12)),
    ("3_puck_whole_line", lambda: whole("am_puck", 1.1)),
    ("4_fenrir_whole_line", lambda: whole("am_fenrir", 1.1)),
    ("5_adam_whole_line", lambda: whole("am_adam", 1.08)),
    ("6_blend_michael_puck", lambda: whole(blend("am_michael", "am_puck", 0.5), 1.1)),
    ("7_british_george_deadpan", lambda: whole("bm_george", 1.08)),
    ("8_blend_michael_fenrir", lambda: whole(blend("am_michael", "am_fenrir", 0.6), 1.1)),
]
for name, fn in OPTS:
    a, sr = fn()
    a = a / (np.abs(a).max() + 1e-9) * 0.8
    sf.write(f"voice_samples/options/{name}.wav", a, sr, subtype="PCM_16")
    print(name, f"{len(a)/sr:.1f}s")
