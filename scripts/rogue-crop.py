# Crops each rogue-look phone shot round the hero (found by the blue ring at its feet). Usage: python3 scripts/rogue-crop.py shots/rogue
import glob, os, sys
from PIL import Image
d = sys.argv[1]
seen = {}
# The idle shot first in each view: a pose that hides the ring (a dash in 2.5D) is cropped where the idle was.
for f in sorted(glob.glob(os.path.join(d, '*-flat-*.png')) + glob.glob(os.path.join(d, '*-3d-*.png')), key=lambda f: ('-idle' not in f, f)):
    view = os.path.basename(f).rsplit('-', 1)[0]
    if f.endswith('-crop.png'): continue
    im = Image.open(f).convert('RGB'); w, h = im.size; px = im.load()
    xs, ys = [], []
    for y in range(150, h - 600, 2):
        for x in range(0, w, 2):
            r, g, b = px[x, y]
            if b > 180 and 110 < g < 175 and r < 110: xs.append(x); ys.append(y)
    if xs: xs.sort(); ys.sort(); cx, cy = xs[len(xs) // 2], ys[len(ys) // 2]
    else: cx, cy = seen.get(view, (w // 2, h // 2))
    seen[view] = (cx, cy)
    half = 420 if '-scale' in f else 210
    box = (max(0, cx - half), max(0, cy - 330), min(w, cx + half), min(h, cy + 90))
    im.crop(box).save(f.replace('.png', '-crop.png'))
