"""QA gate for a finished episode MP4. Every check prints PASS/FAIL; exit code 1 if anything fails.

Usage: .venv/bin/python scripts/qa.py renders/ep01/ep01_final.mp4 ep01 [--sync-sheet review/x.jpg]

Checks
  1. ffprobe: 1080x1920, 30 fps, H.264, yuv420p, AAC 48 kHz, duration 60-78 s
  2. blackdetect: no black run > 0.15 s except the intentional smash cut + end-card transition
  3. freezedetect: no freeze >= 0.4 s
  4. loudness: integrated -14 +/- 1 LUFS, true peak <= -1 dBTP
  5. audio/video duration mismatch < 50 ms
  6. caption text == script text, word for word (programmatic diff)
  7. file size < 50 MB
  8. sync spot-check sheet: 5 seeded-random word onsets, frames -2..+2 tiled for visual review
"""
import json, re, subprocess, sys, os, random

mp4 = sys.argv[1]; ep = sys.argv[2] if len(sys.argv) > 2 else "ep01"
sheet = sys.argv[sys.argv.index("--sync-sheet") + 1] if "--sync-sheet" in sys.argv else None
# duration window: episodes 60-78 s by default; short test clips pass e.g. --dur 10 30
DMIN, DMAX = (float(sys.argv[sys.argv.index("--dur") + 1]), float(sys.argv[sys.argv.index("--dur") + 2])) if "--dur" in sys.argv else (60, 78)
base = f"src/episodes/{ep}"
tl = json.load(open(f"{base}/timeline.json")); FPS = tl["fps"]
results = []
def check(name, ok, detail=""):
    results.append(ok); print(f"{'PASS' if ok else 'FAIL'}  {name}  {detail}")

def run(args): return subprocess.run(args, capture_output=True, text=True)

# 1. stream properties ---------------------------------------------------------
pr = json.loads(run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", mp4]).stdout)
v = next(s for s in pr["streams"] if s["codec_type"] == "video")
a = next((s for s in pr["streams"] if s["codec_type"] == "audio"), None)
num, den = map(int, v["r_frame_rate"].split("/"))
dur = float(pr["format"]["duration"])
check("video 1080x1920", v["width"] == 1080 and v["height"] == 1920, f'{v["width"]}x{v["height"]}')
check("30 fps", abs(num / den - 30) < 0.01, v["r_frame_rate"])
check("H.264 yuv420p", v["codec_name"] == "h264" and v["pix_fmt"] == "yuv420p", f'{v["codec_name"]} {v["pix_fmt"]}')
check("AAC 48 kHz", a is not None and a["codec_name"] == "aac" and a["sample_rate"] == "48000", f'{a and a["codec_name"]} {a and a["sample_rate"]}')
check(f"duration {DMIN:g}-{DMAX:g} s", DMIN <= dur <= DMAX, f"{dur:.2f}s")

# 2. black frames -----------------------------------------------------------------
bd = run(["ffmpeg", "-hide_banner", "-i", mp4, "-vf", "blackdetect=d=0.1:pix_th=0.08", "-an", "-f", "null", "-"]).stderr
blacks = [(float(s), float(e)) for s, e in re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", bd)]
smash = (tl["blackStart"] / FPS, tl["endCardStart"] / FPS)
bad = [(s, e) for s, e in blacks if (e - s) > 0.15 and not (s >= smash[0] - 0.1 and e <= smash[1] + 0.1)]
check("no unintended black > 0.15 s", not bad, f"black runs {blacks} (allowed smash cut {smash[0]:.2f}-{smash[1]:.2f})")

# 3. frozen frames ------------------------------------------------------------------
fd = run(["ffmpeg", "-hide_banner", "-i", mp4, "-vf", "freezedetect=n=0.0005:d=0.4", "-an", "-f", "null", "-"]).stderr
freezes = re.findall(r"freeze_start: ([\d.]+).*?freeze_duration: ([\d.]+)", fd, re.S)
# the smash cut to black is static by design; ignore freezes fully inside it
real = [(float(s), float(d)) for s, d in freezes if not (float(s) >= smash[0] - 0.1 and float(s) + float(d) <= smash[1] + 0.1)]
check("no freeze >= 0.4 s", not real, f"{real}")

# 4. loudness -------------------------------------------------------------------------
lo = run(["ffmpeg", "-hide_banner", "-i", mp4, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", lo)[-1]); TP = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", lo)[-1])
check("loudness -14 +/- 1 LUFS", abs(I + 14) <= 1, f"{I} LUFS")
check("true peak <= -1 dBTP", TP <= -1.0, f"{TP} dBTP")

# 5. A/V duration ------------------------------------------------------------------------
vd = float(run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=duration", "-of", "csv=p=0", mp4]).stdout.strip().strip(","))
ad = float(run(["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=duration", "-of", "csv=p=0", mp4]).stdout.strip().strip(","))
check("A/V mismatch < 50 ms", abs(vd - ad) < 0.05, f"video {vd:.3f}s audio {ad:.3f}s diff {abs(vd-ad)*1000:.0f} ms")

# 6. captions vs script ------------------------------------------------------------------
script = json.load(open(f"{base}/script.json"))
want = [w for l in script["lines"] for s in l["sentences"] for w in s["text"].split()]
got = [c["text"].strip() for c in json.load(open(f"{base}/captions.json"))]
diff = [(i, x, y) for i, (x, y) in enumerate(zip(want, got)) if x != y]
check("caption words == script", not diff and len(want) == len(got), f"{len(got)}/{len(want)} words, {len(diff)} mismatches {diff[:3]}")

# 7. size ---------------------------------------------------------------------------------
mb = os.path.getsize(mp4) / 1e6
check("file < 50 MB", mb < 50, f"{mb:.1f} MB")

# 8. sync spot-check sheet -----------------------------------------------------------------
if sheet:
    words = [w for L in tl["lines"] for s in L["sentences"] for w in s["words"]]
    rnd = random.Random(7)
    picks = sorted(rnd.sample(words, 5), key=lambda w: w["frame"])
    os.makedirs("tmp/sync", exist_ok=True)
    files = []
    for w in picks:
        for d in (-2, 0, 2, 4):
            f = w["frame"] + d
            p = f"tmp/sync/{w['frame']:04d}_{d:+d}.jpg"
            run(["ffmpeg", "-v", "error", "-y", "-ss", f"{f / FPS + 0.001:.4f}", "-i", mp4, "-frames:v", "1", "-vf", "scale=270:-1", p])
            files.append(p)
    subprocess.run([sys.executable, "scripts/contact_sheet.py", sheet] + files, check=True)
    print("sync words:", [(w["text"], w["frame"]) for w in picks])

print(f"\n{sum(results)}/{len(results)} checks passed")
sys.exit(0 if all(results) else 1)
