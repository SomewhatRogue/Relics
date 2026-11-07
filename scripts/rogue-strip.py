# One strip of a tag's crops: the FLAT row over the 2.5D row. Usage: python3 scripts/rogue-strip.py shots/rogue before out.png
import os, sys
from PIL import Image
d, tag, out = sys.argv[1:4]
poses = ['idle', 'walk', 'dash', 'daggers', 'blowpipe', 'scale']
rows = [[Image.open(os.path.join(d, f'{tag}-{v}-{p}-crop.png')) for p in poses] for v in ('flat', '3d')]
W = max(sum(i.size[0] for i in r) for r in rows); H = max(i.size[1] for r in rows for i in r)
s = Image.new('RGB', (W, H * 2), (20, 18, 24))
for y, r in enumerate(rows):
    x = 0
    for im in r: s.paste(im, (x, y * H)); x += im.size[0] + 6
s.save(out)
