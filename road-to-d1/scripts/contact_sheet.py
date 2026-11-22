"""Tile images (or frames sampled from a video) into one labelled contact sheet.
Usage: python scripts/contact_sheet.py out.jpg img1 img2 ...            (labels = file names)
       python scripts/contact_sheet.py out.jpg --video f.mp4 --every 2.0 (one frame every N seconds)"""
import sys, os, subprocess, glob, tempfile
from PIL import Image, ImageDraw, ImageFont

out = sys.argv[1]; args = sys.argv[2:]
if args and args[0] == "--video":
    video = args[1]; every = float(args[3]) if len(args) > 3 else 2.0
    d = tempfile.mkdtemp(dir="tmp")
    subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-vf", f"fps=1/{every},scale=270:-1", f"{d}/f_%04d.jpg"], check=True)
    files = sorted(glob.glob(f"{d}/f_*.jpg"))
    labels = [f"{i * every:.1f}s" for i in range(len(files))]
else:
    files = args; labels = [os.path.basename(f).rsplit(".", 1)[0] for f in files]
ims = [Image.open(f).convert("RGB") for f in files]
tw = 270; th = int(ims[0].height * tw / ims[0].width)
cols = 8 if len(ims) > 24 else 6
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * tw, rows * (th + 26)), "#111")
dr = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
except OSError:
    font = ImageFont.load_default()
for i, (im, lab) in enumerate(zip(ims, labels)):
    x, y = (i % cols) * tw, (i // cols) * (th + 26)
    sheet.paste(im.resize((tw, th)), (x, y + 26))
    dr.text((x + 6, y + 3), lab, fill="#FFD21F", font=font)
sheet.save(out, quality=82)
print(out, sheet.size, len(ims), "frames")
