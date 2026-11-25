"""Import a phone voice memo for one character and cut it into the episode's sentence files.

Usage: .venv/bin/python scripts/import_recording.py <ep> <speaker> <memo file> [--min-pause 0.6]

How the owner records: one memo per character, reading that character's lines from the line sheet
in order, with a ~2 second pause between lines. This script:
  1. decodes any phone format (m4a/mp3/wav/...) to 48 kHz mono,
  2. cleans it: 80 Hz high-pass (rumble), light noise gate, loudness-normalised,
  3. finds the N-1 longest pauses (N = number of sentences that speaker has in script.json)
     and cuts there, so each sentence lands in voice/<ep>/line_<id>_<speaker>_s<n>.wav —
     exactly where make_voices.py would have put a TTS take. Everything downstream
     (timeline, captions, lip sync, retime, audio mix) then works unchanged.
If it can't find enough clear pauses it stops and says so, rather than guessing.
"""
import json, subprocess, sys, os
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

ep, speaker, memo = sys.argv[1], sys.argv[2], sys.argv[3]
MIN_PAUSE = float(sys.argv[sys.argv.index("--min-pause") + 1]) if "--min-pause" in sys.argv else 0.6
SR = 48000
script = json.load(open(f"src/episodes/{ep}/script.json"))
targets = [(L["id"], n) for L in script["lines"] if L["speaker"] == speaker for n, _ in enumerate(L["sentences"])]
texts = [s["text"] for L in script["lines"] if L["speaker"] == speaker for s in L["sentences"]]
if not targets:
    sys.exit(f"speaker '{speaker}' has no lines in {ep}")

raw = subprocess.run(["ffmpeg", "-v", "error", "-i", memo, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
x = sosfilt(butter(2, 80, "hp", fs=SR, output="sos"), x)

# energy envelope in 10 ms hops. "Quiet" is set between the room-noise floor and the speech level
# (measured from this memo), so it works in any room and with any phone gain.
hop = SR // 100
env = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2) + 1e-12) for i in range(0, len(x), hop)])
db = 20 * np.log10(env + 1e-9)
speech_db = np.percentile(db, 90)
noise_db = np.percentile(db, 10)
thresh = noise_db + 0.3 * (speech_db - noise_db)
quiet = db < thresh
# pauses = runs of quiet hops, ignoring the lead-in and tail
runs, start = [], None
for i, q in enumerate(quiet):
    if q and start is None:
        start = i
    if (not q or i == len(quiet) - 1) and start is not None:
        if (i - start) / 100 >= MIN_PAUSE:
            runs.append((i - start, start, i))
        start = None
voiced = np.where(~quiet)[0]
first, last = voiced[0], voiced[-1]
inner = [r for r in runs if r[1] > first and r[2] < last]
need = len(targets) - 1
print(f"{os.path.basename(memo)}: {len(x)/SR:.1f}s, {len(inner)} pauses >= {MIN_PAUSE}s found, {len(targets)} lines expected")
if len(inner) < need:
    sys.exit(f"Not enough clear pauses: found {len(inner)}, need {need}. Ask for a re-record with longer pauses,"
             f" or retry with a smaller --min-pause.")
cuts = sorted(sorted(inner, reverse=True)[:need], key=lambda r: r[1])
bounds = [first] + [(a + b) // 2 for _, a, b in cuts] + [last + 1]

out_dir = f"voice/{ep}"
os.makedirs(out_dir, exist_ok=True)
for k, ((lid, n), text) in enumerate(zip(targets, texts)):
    seg = x[bounds[k] * hop:bounds[k + 1] * hop]
    # trim to the speech inside the segment, keeping 40 ms of air each side
    e = np.array([np.sqrt(np.mean(seg[i:i + hop] ** 2) + 1e-12) for i in range(0, len(seg), hop)])
    on = np.where(20 * np.log10(e + 1e-9) > thresh)[0]
    a = max(0, on[0] * hop - int(0.04 * SR)); b = min(len(seg), (on[-1] + 1) * hop + int(0.04 * SR))
    seg = seg[a:b].copy()
    # light noise gate: duck anything well below speech level
    g = np.convolve(np.abs(seg), np.ones(480) / 480, "same")
    floor = 10 ** ((noise_db + 6) / 20)
    seg *= np.clip(g / floor, 0.15, 1.0)
    f = int(0.008 * SR); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    seg = seg / (np.abs(seg).max() + 1e-9) * 0.7
    path = f"{out_dir}/line_{lid}_{speaker}_s{n}.wav"
    sf.write(path, seg.astype(np.float32), SR, subtype="PCM_16")
    print(f"  {k + 1:2d}. {len(seg)/SR:5.2f}s  {text}")
print("OK — now run build_timeline.py and make_audio.py, then render.")
