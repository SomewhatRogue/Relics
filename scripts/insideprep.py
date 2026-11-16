"""
The new look's insides (docs/design/new-look-interiors.md): showpieces cut from the concept shots in Kyle's flow
"Relic: HD-2D look tests" and cleaned into the kit at 32 px a tile, like scripts/kitprep.py's pictures.
python3 scripts/insideprep.py <concepts dir> <kit dir>
The concepts dir holds three takes as downloaded (1280 x 720): church-3.png (generation GPiAq0vUECEVrDprIIxT),
townhall-4.png (VJkqY33DMn6p7yUqiSqp) and tavern-4.png (W1ClGPRXhPVVb0VyMNPS).
  inside-rose     the church's rose window (round; glows: a -glow.png too)
  inside-map      the town hall's painted map of the valley
  inside-ratsign  the Drowned Rat's carved rat (oval)
"""
import sys, os, json
import numpy as np
from PIL import Image

RAW, OUT = sys.argv[1], sys.argv[2]
PX = 32
# name: (file, crop box in the take, mask shape, width in tiles)
PIECES = {
    'rose': ('church-3.png', (590, -6, 690, 94), 'round', 3.6),
    'map': ('townhall-4.png', (514, 172, 770, 306), 'rect', 5.2),
    'ratsign': ('tavern-4.png', (598, 102, 738, 183), 'round', 2.6),
}


def crop(path, box):
    """The box from the take; rows above the top edge padded with the edge's own row (the rose's top is clipped)."""
    a = np.asarray(Image.open(path).convert('RGB'))
    x0, y0, x1, y1 = box
    sub = a[max(0, y0):y1, x0:x1]
    if y0 < 0: sub = np.concatenate([np.repeat(sub[:1], -y0, axis=0), sub])
    return sub


def crisp(sub, shape, tiles):
    w = round(tiles * PX)
    h = max(8, round(w * sub.shape[0] / sub.shape[1]))
    im = Image.fromarray(sub).resize((w, h), Image.LANCZOS)
    q = np.asarray(im.quantize(colors=48, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB'))
    yy, xx = np.mgrid[0:h, 0:w]
    inside = np.ones((h, w), bool) if shape == 'rect' else (((xx + 0.5 - w / 2) / (w / 2)) ** 2 + ((yy + 0.5 - h / 2) / (h / 2)) ** 2) <= 1
    return Image.fromarray(np.dstack([q, np.where(inside, 255, 0)]).astype(np.uint8), 'RGBA')


sizes = json.load(open(os.path.join(OUT, 'kit.json')))
for name, (f, box, shape, tiles) in PIECES.items():
    p = os.path.join(RAW, f)
    if not os.path.exists(p): continue
    img = crisp(crop(p, box), shape, tiles)
    img.save(os.path.join(OUT, f'inside-{name}.png'))
    sizes[f'inside-{name}'] = list(img.size)
    print(f'inside-{name}', img.size)
json.dump(dict(sorted(sizes.items())), open(os.path.join(OUT, 'kit.json'), 'w'), indent=0)
