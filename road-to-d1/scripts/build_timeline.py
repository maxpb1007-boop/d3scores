"""Assemble the voice track and every timing file the video needs.

Usage: .venv/bin/python scripts/build_timeline.py ep01

Inputs : src/episodes/<ep>/script.json, voice/<ep>/line_*_s*.wav (from make_voices.py)
Outputs: out/<ep>/voice.wav                  full voice-only track, 48 kHz mono
         src/episodes/<ep>/timeline.json     line + sentence + word times (seconds and frames)
         src/episodes/<ep>/captions.json     @remotion/captions Caption[] (one token per word)
         src/episodes/<ep>/mouth/<id>.json   per-frame mouth openness 0..1 for the speaking character

Word timing (no speech-to-text available): each sentence's exact start/end comes from its WAV.
Inside a sentence, time is shared out by syllable count, with extra weight for commas/ellipses
(the voice pauses there). We wrote the script, so caption *words* are exact by construction.
"""
import json, sys, os, re
import numpy as np, soundfile as sf

FPS = 30
ep = sys.argv[1] if len(sys.argv) > 1 else "ep01"
base = f"src/episodes/{ep}"
script = json.load(open(f"{base}/script.json"))
os.makedirs(f"out/{ep}", exist_ok=True); os.makedirs(f"{base}/mouth", exist_ok=True)

def syllables(word):
    w = re.sub(r"[^a-z]", "", word.lower())
    if not w:
        return 1
    groups = re.findall(r"[aeiouy]+", w)
    n = len(groups)
    if w.endswith("e") and not w.endswith(("le", "ee")) and n > 1:
        n -= 1  # silent e: "like", "time"
    # hyphenated words such as "three-star" or "four-seven" are counted per part
    if "-" in word:
        n = sum(syllables(p) for p in word.split("-") if p)
    return max(1, n)

def word_weights(words):
    ws = []
    for w in words:
        wt = syllables(w) + 0.35            # every word has some onset cost
        if re.search(r"[,;:]$", w): wt += 0.9  # comma pause
        if w.endswith("..."): wt += 1.2
        ws.append(wt)
    return np.array(ws)

def mouth_env(x, sr):
    """Per-frame mouth openness from RMS: 30 fps windows, gate, smooth, normalise."""
    hop = sr // FPS
    n = int(np.ceil(len(x) / hop))
    rms = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2) + 1e-12) for i in range(n)])
    db = 20 * np.log10(rms + 1e-9)
    ref = np.percentile(db[db > -60], 90) if np.any(db > -60) else -20
    v = np.clip((db - (ref - 24)) / 30, 0, 1)      # loud speech lands ~0.8, quiet syllables low
    v[db < ref - 30] = 0                             # noise gate
    v = np.convolve(v, [0.25, 0.5, 0.25], "same")    # light smoothing, keeps syllable flicker
    return np.round(np.clip(v, 0, 1), 3)

sr = 48000
gap = script["sentenceGap"]
t = 0.0
timeline = {"fps": FPS, "lines": []}
captions = []
chunks = []  # (start_sec, samples)
for line in script["lines"]:
    t += line.get("pre", 0)
    L = {"id": line["id"], "speaker": line["speaker"], "start": t, "sentences": []}
    for n, s in enumerate(line["sentences"]):
        if n > 0:
            t += gap + s.get("pre", 0)
        x, r = sf.read(f"voice/{ep}/line_{line['id']}_{line['speaker']}_s{n}.wav")
        assert r == sr
        dur = len(x) / sr
        chunks.append((t, x))
        words = s["text"].split()
        # speech occupies the wav minus the ~40 ms pads trimmed on each side
        a, b = t + 0.04, t + dur - 0.04
        w = word_weights(words); edges = a + (b - a) * np.concatenate([[0], np.cumsum(w) / w.sum()])
        S = {"text": s["text"], "start": t, "end": t + dur, "words": []}
        for i, word in enumerate(words):
            ws, we = float(edges[i]), float(edges[i + 1])
            S["words"].append({"text": word, "start": round(ws, 3), "end": round(we, 3),
                               "frame": int(round(ws * FPS))})
            captions.append({"text": (" " if i > 0 else "") + word,
                             "startMs": round(ws * 1000), "endMs": round(we * 1000),
                             "timestampMs": round((ws + we) / 2 * 1000), "confidence": None,
                             "line": line["id"], "sentence": n})
        L["sentences"].append(S)
        t += dur
    L["end"] = t
    L["startFrame"] = int(round(L["start"] * FPS)); L["endFrame"] = int(round(L["end"] * FPS))
    t += line.get("post", 0)
    L["postEndFrame"] = int(round(t * FPS))
    timeline["lines"].append(L)

speech_end = t
timeline["blackStart"] = int(round(speech_end * FPS))
timeline["endCardStart"] = int(round((speech_end + script["endBlack"]) * FPS))
total = speech_end + script["endBlack"] + script["endCard"]
timeline["durationInFrames"] = int(round(total * FPS))
total_samples = int(round(timeline["durationInFrames"] / FPS * sr))

voice = np.zeros(total_samples)
for start, x in chunks:
    i = int(round(start * sr)); voice[i:i + len(x)] += x
sf.write(f"out/{ep}/voice.wav", voice.astype(np.float32), sr, subtype="FLOAT")

# Mouth: one envelope per line, measured over the line's own span of the full voice track.
for L in timeline["lines"]:
    a = L["startFrame"]; b = L["endFrame"] + 2
    seg = voice[int(a / FPS * sr):int(b / FPS * sr)]
    json.dump({"id": L["id"], "speaker": L["speaker"], "startFrame": a,
               "values": mouth_env(seg, sr).tolist()}, open(f"{base}/mouth/{L['id']}.json", "w"))

json.dump(timeline, open(f"{base}/timeline.json", "w"), indent=1)
json.dump(captions, open(f"{base}/captions.json", "w"), indent=0)
print(f"duration {total:.2f}s = {timeline['durationInFrames']} frames; {len(captions)} words")
for L in timeline["lines"]:
    print(L["id"], L["speaker"], f"{L['start']:6.2f}-{L['end']:6.2f}  frames {L['startFrame']}-{L['endFrame']} (post→{L['postEndFrame']})")

# A tiny generated index so the video can import every mouth file statically.
ids = [L["id"] for L in timeline["lines"]]
with open(f"{base}/mouth/index.ts", "w") as fh:
    fh.write("// GENERATED by scripts/build_timeline.py — do not edit.\n")
    for i in ids:
        fh.write(f'import m{i} from "./{i}.json";\n')
    fh.write("export type MouthTrack = { id: string; speaker: string; startFrame: number; values: number[] };\n")
    fh.write("export const MOUTH: MouthTrack[] = [" + ", ".join(f"m{i}" for i in ids) + "];\n")
