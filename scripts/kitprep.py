"""
The new look's kit (docs/design/new-look.md): generated sheets cut into the game's textures.
python3 scripts/kitprep.py <raw dir> <out dir> [set ...]
Sets (all by default, each only if its raw sheets are there):
  facades    facades0..3.png, four fronts each on black: forge, tavern, chapel, house -> facade-<kind>-<n>
  swatch     swatch0.png, a 3x2 grid: cobble, stone, slate, timber, planks, flags -> mat-<name>
  props      props1.png, props on black, the bottom row's last four the guild signs -> sign-<name>, prop-<name>
  cottages   cottage0..3.png, four single-storey fronts each -> cottage-<n>-<i>
  shops      shop0..3.png, four two-storey shop fronts each -> shop-<n>-<i>
  landmarks  land0..3.png, church, town hall, the Drowned Rat, the forge -> land-<kind>-<n>
  sides      side0..3.png, four long side walls stacked: timber, stone, shop, nave -> side-<kind>-<n>
  parts      parts0.png, a 4x3 grid: plaster, beam, thatch, fieldstone tiles; four windows; four doors
             -> part-<tile> (two tiles square), part-win-<i>, part-door-<i> (each with its glow)
Every front and side wall also gets a -glow.png mask (the lit windows, in their own colours).
Every picture scaled to 32 px a tile and snapped to a small palette with no dither, so it stays crisp pixel art.
"""
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage

RAW, OUT = sys.argv[1], sys.argv[2]
SETS = set(sys.argv[3:]) or {'facades', 'swatch', 'props', 'cottages', 'shops', 'landmarks', 'sides', 'parts'}
os.makedirs(OUT, exist_ok=True)
PX = 32
# How tall each front stands, in tiles (its gable included): two to three storeys.
TALL = {'forge': 5.5, 'tavern': 6.5, 'chapel': 8.5, 'house': 7.0}
# Building variety (docs/decisions/new-look-buildings.md): cottages one storey under their roof, shops two, the
# landmarks well above the houses round them.
TALL_COTTAGE, TALL_SHOP = 4.2, 5.8
LAND = ['church', 'hall', 'tavern', 'forge']
TALL_LAND = {'church': 12.0, 'hall': 9.0, 'tavern': 9.0, 'forge': 8.5}
SIDES = ['timber', 'stone', 'shop', 'nave']
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


def has(name):
    return os.path.exists(os.path.join(RAW, name))


def columns(a, bg, k=4):
    """The k widest runs of picture across a sheet, left to right."""
    cols = runs((~bg).sum(axis=0) > a.shape[0] * 0.12, gap=4, min_len=20)
    return sorted(sorted(cols, key=lambda r: r[0] - r[1])[:k])


def front(a, bg, c0, c1, tall, name):
    """One front from a sheet column: cropped to its picture, scaled to `tall` tiles, its glow mask beside it."""
    sub, keep = a[:, c0:c1], ~bg[:, c0:c1]
    rows = np.where(keep.sum(axis=1) > 2)[0]
    r0, r1 = rows[0], rows[-1] + 1
    sub, keep = sub[r0:r1], keep[r0:r1]
    h = round(tall * PX)
    w = max(8, round(h * sub.shape[1] / sub.shape[0]))
    img = crisp(sub, ndimage.binary_fill_holes(keep).astype(float), w, h)
    img.save(os.path.join(OUT, f'{name}.png'))
    glow(img).save(os.path.join(OUT, f'{name}-glow.png'))


# The fronts.
for n in range(4) if 'facades' in SETS and has('facades0.png') else []:
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

# Cottages and shops: four takes of four fronts each, all one pool.
for kind, tall in (('cottage', TALL_COTTAGE), ('shop', TALL_SHOP)):
    for n in range(4) if kind + 's' in SETS else []:
        if not has(f'{kind}{n}.png'): continue
        a = load(f'{kind}{n}.png'); bg = background(a)
        for i, (c0, c1) in enumerate(columns(a, bg)):
            front(a, bg, c0, c1, tall, f'{kind}-{n}-{i}')

# The landmarks: church, town hall, the Drowned Rat, the forge, in that order on each sheet.
for n in range(4) if 'landmarks' in SETS else []:
    if not has(f'land{n}.png'): continue
    a = load(f'land{n}.png'); bg = background(a)
    for kind, (c0, c1) in zip(LAND, columns(a, bg)):
        front(a, bg, c0, c1, TALL_LAND[kind], f'land-{kind}-{n}')

# Side walls: four long bands stacked, each cut to its picture and scaled so it's 32 px a tile at two storeys'
# height (the game stretches it to each wall's eave).
for n in range(4) if 'sides' in SETS else []:
    if not has(f'side{n}.png'): continue
    a = load(f'side{n}.png'); bg = background(a)
    bands = runs((~bg).sum(axis=1) > a.shape[1] * 0.3, gap=3, min_len=30)
    bands = sorted(sorted(bands, key=lambda r: r[0] - r[1])[:4])
    for kind, (r0, r1) in zip(SIDES, bands):
        sub, keep = a[r0:r1], ~bg[r0:r1]
        cols = np.where(keep.sum(axis=0) > 2)[0]
        sub = sub[:, cols[0] + 2: cols[-1] - 1]
        h = round(4.0 * PX)
        w = max(8, round(h * sub.shape[1] / sub.shape[0]))
        img = crisp(sub, np.ones(sub.shape[:2]), w, h)
        # Twenty tiles of wall is more than any block is deep; the game picks a stretch of it.
        img = img.crop((0, 0, min(w, 20 * PX), h))
        img.save(os.path.join(OUT, f'side-{kind}-{n}.png'))
        glow(img).save(os.path.join(OUT, f'side-{kind}-{n}-glow.png'))

# The material swatches: a 3x2 grid split by its dark gaps, each cell's middle, two tiles across.
if 'swatch' in SETS and has('swatch0.png'):
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

# The prop sheet: the top row's six props, then the bottom row's four props and four guild signs, each at its height
# in tiles.
PROPS = [('barrel', 1.1), ('crates', 1.7), ('lamp', 3.4), ('well', 2.8), ('cart', 1.6), ('stall', 3.0),
         ('bench', 1.0), ('brazier', 1.5), ('sacks', 1.0), ('tree', 2.6)]
if 'props' in SETS and has('props1.png'):
    a = load('props1.png')
    bg = background(a)
    lab, n = ndimage.label(ndimage.binary_closing(~bg, iterations=3))
    boxes = ndimage.find_objects(lab)
    big = [(s, i + 1) for i, s in enumerate(boxes) if (s[0].stop - s[0].start) * (s[1].stop - s[1].start) > 2500]
    mid = (min(s[0].start for s, _ in big) + max(s[0].stop for s, _ in big)) / 2
    top = sorted([b for b in big if (b[0][0].start + b[0][0].stop) / 2 < mid], key=lambda b: b[0][1].start)
    low = sorted([b for b in big if (b[0][0].start + b[0][0].stop) / 2 >= mid], key=lambda b: b[0][1].start)
    for (name, tall), (s, idx) in zip(PROPS, top[:6] + low[:4]):
        sub, keep = a[s], (lab[s] == idx) & ~bg[s]
        h = round(tall * PX)
        w = max(8, round(h * sub.shape[1] / sub.shape[0]))
        img = crisp(sub, keep.astype(float), w, h, 48)
        img.save(os.path.join(OUT, f'prop-{name}.png'))
        glow(img).save(os.path.join(OUT, f'prop-{name}-glow.png'))
    for name, (s, idx) in zip(['anvil', 'tankard', 'lantern', 'mortar'], low[-4:]):
        sub, keep = a[s], (lab[s] == idx) & ~bg[s]
        h = PX * 2
        w = max(8, round(h * sub.shape[1] / sub.shape[0]))
        crisp(sub, keep.astype(float), w, h, 48).save(os.path.join(OUT, f'sign-{name}.png'))

# House parts (the test lane, streethouse.ts): a 4x3 grid on black. The top row's tiles cut to their middles at two
# tiles square; windows a tile tall and doors two, at their own widths.
if 'parts' in SETS and has('parts0.png'):
    a = load('parts0.png')
    bg = background(a)
    lab, _ = ndimage.label(ndimage.binary_closing(~bg, iterations=2))
    boxes = [(s, i + 1) for i, s in enumerate(ndimage.find_objects(lab)) if (s[0].stop - s[0].start) * (s[1].stop - s[1].start) > 4000]
    boxes.sort(key=lambda b: (b[0][0].start + b[0][0].stop) / 2)
    rows = [sorted(boxes[i:i + 4], key=lambda b: b[0][1].start) for i in range(0, 12, 4)]
    for name, (s, idx) in zip(['plaster', 'beam', 'thatch', 'field'], rows[0]):
        r0, r1, c0, c1 = s[0].start, s[0].stop, s[1].start, s[1].stop
        ins = 0.06
        cell = a[r0 + int((r1 - r0) * ins): r1 - int((r1 - r0) * ins), c0 + int((c1 - c0) * ins): c1 - int((c1 - c0) * ins)]
        # (The plaster toned down to sit with the night's stone and timber.)
        if name == 'plaster': cell = (cell.astype(float) * [0.62, 0.6, 0.58]).astype(np.uint8)
        crisp(cell, np.ones(cell.shape[:2]), PX * 2, PX * 2, 48).save(os.path.join(OUT, f'part-{name}.png'))
    for kind, tall, row in (('win', 1.0, rows[1]), ('door', 2.0, rows[2])):
        for i, (s, idx) in enumerate(row):
            sub, keep = a[s], (lab[s] == idx) & ~bg[s]
            h = round(tall * PX)
            w = max(8, round(h * sub.shape[1] / sub.shape[0]))
            img = crisp(sub, keep.astype(float), w, h, 48)
            img.save(os.path.join(OUT, f'part-{kind}-{i}.png'))
            glow(img).save(os.path.join(OUT, f'part-{kind}-{i}-glow.png'))

# Each picture's size in pixels (32 a tile), for the game to lay fronts at their natural width.
sizes = {f[:-4]: Image.open(os.path.join(OUT, f)).size for f in sorted(os.listdir(OUT)) if f.endswith('.png') and not f.endswith('-glow.png')}
json.dump(sizes, open(os.path.join(OUT, 'kit.json'), 'w'), indent=0)
print('kit written to', OUT, len(sizes), 'pictures')
