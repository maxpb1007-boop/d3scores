"""Build the episode soundtrack: voice + synthesized SFX + original music, ducked and mastered.

Usage: .venv/bin/python scripts/make_audio.py ep01
Inputs : out/<ep>/voice.wav (build_timeline.py), src/episodes/<ep>/sfx.json, timeline.json
Outputs: out/<ep>/mix_music.wav    voice + SFX + music, -14 LUFS / <= -1 dBTP, 48 kHz stereo
         out/<ep>/mix_nomusic.wav  voice + SFX only (so a trending sound can be added in-app)
"""
import json, sys, subprocess, re
import numpy as np, soundfile as sf
sys.path.insert(0, "scripts")
from sfx_synth import SR, KINDS, music, lp

ep = sys.argv[1] if len(sys.argv) > 1 else "ep01"
base = f"src/episodes/{ep}"
tl = json.load(open(f"{base}/timeline.json")); cues = json.load(open(f"{base}/sfx.json"))
FPS = tl["fps"]; N = int(round(tl["durationInFrames"] / FPS * SR))
voice, sr = sf.read(f"out/{ep}/voice.wav"); assert sr == SR
voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]
db = lambda x: 10 ** (x / 20)

# --- SFX bus ------------------------------------------------------------
sfx = np.zeros(N)
for c in cues["cues"]:
    x = KINDS[c["kind"]]() * c.get("gain", 1.0)
    s = int(round(c["f"] / FPS * SR)); e = min(N, s + len(x)); sfx[s:e] += x[: e - s]
sfx *= 0.62

# --- music bus ----------------------------------------------------------
m = music(N / SR + 0.1, cues["bpm"])[:N]
m = np.pad(m, (0, max(0, N - len(m))))
speech = np.abs(voice)
def rms_db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
active = voice[np.abs(voice) > 0.02]
voice_db = rms_db(active) if len(active) else -20
m *= db(voice_db - 6 - rms_db(m))          # music sits 6 dB under the voice before ducking
# sidechain ducking: fast attack (15 ms), slow release (300 ms) on the voice envelope -> extra -6 dB
env = np.zeros(N); a = np.exp(-1 / (0.015 * SR)); r = np.exp(-1 / (0.30 * SR)); v = 0.0
lvl = np.convolve(speech, np.ones(240) / 240, "same")
for i in range(0, N, 48):  # control rate 1 kHz is plenty
    target = min(1.0, lvl[i] / 0.03)
    coef = a ** 48 if target > v else r ** 48
    v = target + (v - target) * coef
    env[i:i + 48] = v
duck = db(-6 * env)
gate = np.ones(N)  # music drop-outs ("Nobody claps", the cliffhanger)
fade = int(0.08 * SR)
for f0, f1 in cues["musicOff"]:
    s, e = int(f0 / FPS * SR), int(f1 / FPS * SR)
    gate[s:e] = 0
    gate[max(0, s - fade):s] = np.minimum(gate[max(0, s - fade):s], np.linspace(1, 0, s - max(0, s - fade)))
    gate[e:e + fade] = np.minimum(1, np.linspace(0, 1, len(gate[e:e + fade])))
# music also stops under the end card, where the sting plays
gate[int(tl["endCardStart"] / FPS * SR) - fade:] = 0
m = m * duck * gate

def master(x, out):
    st = np.stack([x, x], axis=1)
    st /= max(1.0, np.abs(st).max() / 0.95)
    raw = out.replace(".wav", "_raw.wav")
    sf.write(raw, st.astype(np.float32), SR, subtype="FLOAT")
    # two-pass EBU R128 loudness normalisation; TP target -1.5 leaves headroom for the AAC encode
    p1 = subprocess.run(["ffmpeg", "-hide_banner", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                        capture_output=True, text=True).stderr
    j = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", p1, re.S).group(0))
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
          f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-hide_banner", "-v", "error", "-y", "-i", raw, "-af", af, "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", out], check=True)
    # loudnorm can change the length by a few samples: pad/trim to the exact video length
    y, _ = sf.read(out); y = np.pad(y, ((0, max(0, N - len(y))), (0, 0)))[:N]; sf.write(out, y, SR, subtype="PCM_16")
    print(out, f"in {j['input_i']} LUFS -> -14 (linear={j['normalization_type']})")

master(voice + sfx + m, f"out/{ep}/mix_music.wav")
master(voice + sfx, f"out/{ep}/mix_nomusic.wav")
sf.write(f"out/{ep}/stem_music.wav", m.astype(np.float32), SR)
sf.write(f"out/{ep}/stem_sfx.wav", sfx.astype(np.float32), SR)
