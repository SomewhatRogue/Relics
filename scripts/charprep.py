"""
The new look's characters (docs/design/new-look.md, docs/decisions/new-look-characters.md): a generated sheet of one
character on flat magenta (3 rows: facing you, side-on facing right, walking away; 7 columns: idle, a four-frame walk,
the attack drawn back, the attack through) cut into frames at the game's density, 32 px a tile.
python3 scripts/charprep.py <sheet.png> <name> <idle height px> <out dir> [glow]
Out: <name>.png (the frames in a grid, every cell the same size, the feet at one point) and <name>-glow.png (eyes and
flames, drawn unlit; only with `glow`, as a cape's highlights would count), and the cell's size, feet and per-frame boxes added to <out dir>/chars.json.
Every frame shares one scale and one small palette with no dither, so it stays crisp pixel art.
"""
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage

SRC, NAME, TALL, OUT = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
GLOW = 'glow' in sys.argv[5:]
ROWS, COLS = ['front', 'side', 'back'], ['idle', 'walk1', 'walk2', 'walk3', 'walk4', 'draw', 'strike']
COLOURS = 40
OUTLINE = (12, 10, 16)

a = np.asarray(Image.open(SRC).convert('RGB')).astype(np.int32)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
# Magenta and the pink fringe round each figure: red and blue both well above green.
bg = (np.minimum(r, b) - g > 70) & (np.abs(r - b) < 90)
fg = ~bg
fg = ndimage.binary_opening(fg, iterations=1)

# Figures: the foreground in blobs (joined across small gaps so a sword stays with its hand), the specks dropped.
lab, n = ndimage.label(ndimage.binary_dilation(fg, iterations=4))
boxes = []
for i, sl in enumerate(ndimage.find_objects(lab)):
    h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
    if h * w > 400 and h > 20:
        boxes.append((sl[0].start, sl[1].start, sl[0].stop, sl[1].stop, i + 1))
# Into rows by where they stand, then left to right.
boxes.sort(key=lambda t: t[2])
rows, cur = [], []
for t in boxes:
    if cur and t[2] - cur[-1][2] > (t[2] - t[0]) * 0.5:
        rows.append(cur), (cur := [])
    cur.append(t)
rows.append(cur)
rows = [sorted(rw, key=lambda t: t[1]) for rw in rows]
print(NAME, 'rows', [len(rw) for rw in rows])
if len(rows) != len(ROWS) or any(len(rw) != len(COLS) for rw in rows):
    sys.exit('expected 3 rows of 7 figures; check the sheet')

# One scale for the sheet: the front idle figure stands TALL pixels.
y0, x0, y1, x1, _ = rows[0][0]
k = TALL / (y1 - y0)

def frame(t):
    y0, x0, y1, x1, i = t
    m = (lab[y0:y1, x0:x1] == i) & fg[y0:y1, x0:x1]
    rgba = np.dstack([a[y0:y1, x0:x1], m * 255]).astype(np.uint8)
    w, h = max(1, round((x1 - x0) * k)), max(1, round((y1 - y0) * k))
    im = Image.fromarray(rgba, 'RGBA')
    # Box-filtered down (premultiplied, so the magenta never bleeds in), then cut to whole pixels.
    pm = np.asarray(im).astype(np.float32)
    pm[..., :3] *= pm[..., 3:] / 255
    small = np.asarray(Image.fromarray(pm.astype(np.uint8), 'RGBA').resize((w, h), Image.BOX)).astype(np.float32)
    al = small[..., 3:]
    rgb = np.where(al > 0, small[..., :3] * 255 / np.maximum(al, 1), 0)
    return np.dstack([np.clip(rgb, 0, 255), (al[..., 0] > 110) * 255]).astype(np.uint8)

frames = [[frame(t) for t in rw] for rw in rows]

def hot(f):
    """What glows: hot, saturated reds and oranges (a goblin's eyes, a torch's flame), found before the palette, which
    would fold a few bright pixels into the nearest dark red. The knight's cape is too dark to count."""
    c = f[..., :3].astype(np.int32)
    return GLOW & (f[..., 3] > 0) & (c[..., 0] > 165) & (c[..., 0] - c[..., 1] > 85) & (c[..., 0] - c[..., 2] > 85)
hots = [[hot(f) for f in rw] for rw in frames]

# One palette for all the frames.
opaque = np.concatenate([f[f[..., 3] > 0][:, :3] for rw in frames for f in rw])
pal_img = Image.fromarray(opaque.reshape(-1, 1, 3)).quantize(COLOURS, method=Image.MEDIANCUT)
def snap(f, h):
    im = np.asarray(Image.fromarray(f[..., :3]).quantize(palette=pal_img, dither=Image.NONE).convert('RGB')).copy()
    im[h] = f[..., :3][h]
    return np.dstack([im, f[..., 3]])
frames = [[snap(f, h) for f, h in zip(rw, hr)] for rw, hr in zip(frames, hots)]

def outline(f):
    """A one-pixel dark edge round the silhouette (the flat sprites carry one; it keeps a dark figure off a dark floor)."""
    m = f[..., 3] > 0
    p = np.pad(f, ((1, 1), (1, 1), (0, 0)))
    pm = np.pad(m, 1)
    ring = ndimage.binary_dilation(pm) & ~pm
    p[ring] = (*OUTLINE, 255)
    return p

frames = [[outline(f) for f in rw] for rw in frames]
hots = [[np.pad(h, 1) for h in hr] for hr in hots]

def feet(f):
    """Where the figure stands: the middle of its lowest quarter's pixels, across; its last row, down."""
    m = f[..., 3] > 0
    ys = np.nonzero(m.any(axis=1))[0]
    lo = m[ys[-1] - max(1, (ys[-1] - ys[0]) // 4):ys[-1] + 1]
    xs = np.nonzero(lo.any(axis=0))[0]
    return (xs[0] + xs[-1]) / 2, ys[-1] + 1

# One cell for every frame, the feet at one point.
L = max(round(feet(f)[0]) for rw in frames for f in rw) + 1
R = max(f.shape[1] - round(feet(f)[0]) for rw in frames for f in rw) + 1
U = max(feet(f)[1] for rw in frames for f in rw) + 1
D = 2
CW, CH = L + R, U + D
sheet = np.zeros((CH * len(ROWS), CW * len(COLS), 4), np.uint8)
glow = np.zeros_like(sheet)
for ri, rw in enumerate(frames):
    for ci, f in enumerate(rw):
        h = hots[ri][ci]
        fx, fy = feet(f)
        ox, oy = ci * CW + L - round(fx), ri * CH + U - fy
        sl = sheet[oy:oy + f.shape[0], ox:ox + f.shape[1]]
        m = f[..., 3] > 0
        sl[m] = f[m]
        glow[oy:oy + f.shape[0], ox:ox + f.shape[1]][h] = f[h]


os.makedirs(OUT, exist_ok=True)
Image.fromarray(sheet, 'RGBA').save(os.path.join(OUT, NAME + '.png'), optimize=True)
Image.fromarray(glow, 'RGBA').save(os.path.join(OUT, NAME + '-glow.png'), optimize=True)
meta_p = os.path.join(OUT, 'chars.json')
meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
meta[NAME] = {'w': int(CW), 'h': int(CH), 'fx': int(L), 'fy': int(U), 'rows': ROWS, 'cols': COLS}
json.dump(meta, open(meta_p, 'w'), indent=1)
print(NAME, 'cell', CW, 'x', CH, 'feet', L, U, 'glow px', int((glow[..., 3] > 0).sum()))
