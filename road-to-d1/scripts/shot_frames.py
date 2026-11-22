"""Print `Comp:frame:path` jobs for one still per shot (middle frame) — feeds scripts/stills.mjs.
Usage: python3 scripts/shot_frames.py ep01 [outdir] [where=mid|start|end]"""
import re, sys
ep = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else "tmp/shots"; where = sys.argv[3] if len(sys.argv) > 3 else "mid"
src = open(f"src/episodes/{ep}/shots.tsx").read()
comp = ep[0].upper() + ep[1:]
for sid, a, b in re.findall(r'id: "([^"]+)", start: (\d+), end: (\d+)', src):
    a, b = int(a), int(b)
    f = {"mid": (a + b) // 2, "start": a + 1, "end": b - 2}[where]
    print(f"{comp}:{f}:{out}/{sid}_{f}.jpg")
