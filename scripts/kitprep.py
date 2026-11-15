"""
The new look's kit (docs/design/new-look.md): generated sheets cut into the game's textures.
python3 scripts/kitprep.py <raw dir> <out dir>
Raw: facades0..3.png (four fronts each, on black: forge, tavern, chapel, house), swatch0.png (a 3x2 grid: cobble,
stone, slate, timber, planks, flags), props1.png (props on black; the bottom row's four are the guild signs).
Out: facade-<kind>-<n>.png and its -glow.png mask (the lit windows), mat-<name>.png, sign-<name>.png.
Every picture scaled to 32 px a tile and snapped to a small palette with no dither, so it stays crisp pixel art.
"""
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage

RAW, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
PX = 32
# How tall each front stands, in tiles (its gable included): two to three storeys.
TALL = {'forge': 5.5, 'tavern': 6.5, 'chapel': 8.5, 'house': 7.0}
KINDS = ['forge', 'tavern', 'chapel', 'house']


def load(p):
    return np.asarray(Image.open(os.path.join(RAW, p)).convert('RGB')).astype(np.int32)


def background(a, dark=30):
    """The black round the pictures: dark pixels joined to the sheet's edge."""
    lab, _ = ndimage.label(a.max(axis=2) < dark)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    return np.isin(lab, list(edge))


def runs(profile, gap=6, min_len=20):
    """Runs of True in a 1D profile, joining gaps shorter than `gap`."""
    out, start, last = [], None, None
    for i, v in enumerate(profile):
        if v:
            if start is None: start = i
            elif i - last > gap: out.append((start, last + 1)); start = i
            last = i
    if start is not None: out.append((start, last + 1))
    return [r for r in out if r[1] - r[0] >= min_len]


def crisp(rgb, alpha, w, h, colours=64):
    """Scale to w x h and snap to a palette, no dither; alpha cut hard."""
    im = Image.fromarray(rgb.astype(np.uint8)).resize((w, h), Image.LANCZOS)
    q = im.quantize(colors=colours, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    al = Image.fromarray((alpha * 255).astype(np.uint8)).resize((w, h), Image.BOX)
    out = np.dstack([np.asarray(q), np.where(np.asarray(al) > 127, 255, 0)]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


def glow(img):
    """The warm, bright pixels (lit windows, the forge's mouth, lanterns) in their own colours, black elsewhere."""
    a = np.asarray(img).astype(np.int32)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    m = (r > 150) & (g > 85) & (b < 150) & (r - b > 55) & (al > 0)
    return Image.fromarray(np.where(m[..., None], a[..., :3], 0).astype(np.uint8))


# The fronts.
for n in range(4):
    a = load(f'facades{n}.png')
    bg = background(a)
    cols = runs((~bg).sum(axis=0) > a.shape[0] * 0.15)
    cols = sorted(sorted(cols, key=lambda r: r[0] - r[1])[:4])
    for kind, (c0, c1) in zip(KINDS, cols):
        sub, keep = a[:, c0:c1], ~bg[:, c0:c1]
        rows = np.where(keep.sum(axis=1) > 2)[0]
        r0, r1 = rows[0], rows[-1] + 1
        sub, keep = sub[r0:r1], keep[r0:r1]
        h = round(TALL[kind] * PX)
        w = max(8, round(h * sub.shape[1] / sub.shape[0]))
        img = crisp(sub, keep.astype(float), w, h)
        img.save(os.path.join(OUT, f'facade-{kind}-{n}.png'))
        glow(img).save(os.path.join(OUT, f'facade-{kind}-{n}-glow.png'))

# The material swatches: a 3x2 grid split by its dark gaps, each cell's middle, two tiles across.
a = load('swatch0.png')
dark = a.max(axis=2) < 40
cols = runs((~dark).sum(axis=0) > a.shape[0] * 0.3, gap=3, min_len=60)
rows = runs((~dark).sum(axis=1) > a.shape[1] * 0.3, gap=3, min_len=60)
names = ['cobble', 'stone', 'slate', 'timber', 'planks', 'flags']
for i, (r0, r1) in enumerate(rows[:2]):
    for j, (c0, c1) in enumerate(cols[:3]):
        ins = 0.05
        cell = a[r0 + int((r1 - r0) * ins): r1 - int((r1 - r0) * ins), c0 + int((c1 - c0) * ins): c1 - int((c1 - c0) * ins)]
        crisp(cell, np.ones(cell.shape[:2]), PX * 2, PX * 2, 48).save(os.path.join(OUT, f'mat-{names[i * 3 + j]}.png'))

# The guild signs: the bottom row's four pieces on the prop sheet.
a = load('props1.png')
bg = background(a)
lab, n = ndimage.label(ndimage.binary_closing(~bg, iterations=3))
boxes = ndimage.find_objects(lab)
big = [(s, i + 1) for i, s in enumerate(boxes) if (s[0].stop - s[0].start) * (s[1].stop - s[1].start) > 2500]
bottom = max(s[0].stop for s, _ in big)
signs = sorted([b for b in big if b[0][0].stop > bottom - 40], key=lambda b: b[0][1].start)[:4]
for name, (s, idx) in zip(['anvil', 'tankard', 'lantern', 'mortar'], signs):
    sub, keep = a[s], (lab[s] == idx) & ~bg[s]
    h = PX * 2
    w = max(8, round(h * sub.shape[1] / sub.shape[0]))
    crisp(sub, keep.astype(float), w, h, 48).save(os.path.join(OUT, f'sign-{name}.png'))
# Each picture's size in pixels (32 a tile), for the game to lay fronts at their natural width.
sizes = {f[:-4]: Image.open(os.path.join(OUT, f)).size for f in sorted(os.listdir(OUT)) if f.endswith('.png') and not f.endswith('-glow.png')}
json.dump(sizes, open(os.path.join(OUT, 'kit.json'), 'w'), indent=0)
print('kit written to', OUT, len(sizes), 'pictures')
