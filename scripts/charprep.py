"""
The new look's characters (docs/design/new-look.md, docs/decisions/new-look-characters.md): a character's generated
sheets, one per facing, on flat magenta, each with the same rows of frames (a walk, the attacks, hits, ...), cut into
frames at the game's density (32 px a tile).

python3 scripts/charprep.py <name> <walk height px> <out dir> <rows> <facing>=<sheet.png> ... [glow]
  rows: the rows every sheet has, top to bottom, as name:count (walk:8,slash1:5,slash2:5,slash3:5,misc:6).
  The first row must be the walk: each sheet is scaled so its walking figures stand <walk height> tall.

Out: <name>.png, every frame in a grid of one cell size (facing by facing, a grid row per sheet row), with the hips
at one point in every cell, and <name>-glow.png (hot reds: eyes, flames; only with `glow`, as a cape's highlights
would count), and the cell, the facings and the rows in <out dir>/chars.json. One palette for every frame, no dither,
a one-pixel dark edge, so it stays crisp pixel art. Each frame is placed by its hips (the middle of its body a third
of the way up) and its lowest pixel, so a walk's feet move under a steady body and an attack's lean shows as drawn.
"""
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage

NAME, TALL, OUT, SPEC = sys.argv[1], int(sys.argv[2]), sys.argv[3], sys.argv[4]
ROWS = [(r.split(':')[0], int(r.split(':')[1])) for r in SPEC.split(',')]
SHEETS = [a.split('=', 1) for a in sys.argv[5:] if '=' in a]
GLOW = 'glow' in sys.argv[5:]
COLOURS = 48
OUTLINE = (12, 10, 16)


def figures(path):
    """The sheet's figures, row by row as the spec has them, left to right: (box, mask) in the sheet's pixels."""
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.int32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    bg = (np.minimum(r, b) - g > 70) & (np.abs(r - b) < 90)
    fg = ndimage.binary_opening(~bg, iterations=1)
    for grow in (1, 2, 3, 4, 6, 9):
        lab, n = ndimage.label(ndimage.binary_dilation(fg, iterations=grow))
        lab = np.where(fg, lab, 0)
        objs = ndimage.find_objects(lab)
        areas = ndimage.sum(fg, lab, range(1, n + 1))
        big = [i for i in range(n) if objs[i] is not None and areas[i] > areas.max() * 0.25]
        # A loose bit (a blade's tip, a strand of cape) goes to the nearest figure, if it is near one.
        own = {i: i for i in big}
        cen = {i: ((objs[i][0].start + objs[i][0].stop) / 2, (objs[i][1].start + objs[i][1].stop) / 2) for i in range(n) if objs[i] is not None}
        for i in range(n):
            if objs[i] is None or i in own or areas[i] < 6:
                continue
            d, j = min(((cen[i][0] - cen[j][0]) ** 2 + (cen[i][1] - cen[j][1]) ** 2, j) for j in big)
            if d ** 0.5 < (objs[j][0].stop - objs[j][0].start) * 0.8:
                own[i] = j
        blobs = []
        for j in big:
            parts = [i for i, o in own.items() if o == j]
            m = np.isin(lab, [i + 1 for i in parts])
            ys, xs = np.nonzero(m)
            blobs.append((ys.min(), xs.min(), ys.max() + 1, xs.max() + 1, parts))
        blobs.sort(key=lambda t: t[2])
        rows, cur = [], []
        for t in blobs:
            if cur and t[2] - np.median([c[2] for c in cur]) > (t[2] - t[0]) * 0.45:
                rows.append(cur)
                cur = []
            cur.append(t)
        rows.append(cur)
        rows = [sorted(rw, key=lambda t: t[1]) for rw in rows]
        if [len(rw) for rw in rows] == [n_ for _, n_ in ROWS]:
            return a, [[(t[:4], np.isin(lab[t[0]:t[2], t[1]:t[3]], [i + 1 for i in t[4]])) for t in rw] for rw in rows]
    sys.exit(f'{path}: rows {[len(rw) for rw in rows]}, want {[n for _, n in ROWS]}')


def hips(m, tall):
    """Where a figure stands, in its own box: across, the middle of its body between a third and two thirds of a
    walking height up from its lowest pixel; down, that lowest pixel."""
    ys = np.nonzero(m.any(axis=1))[0]
    y1 = ys[-1] + 1
    band = m[max(0, int(y1 - tall * 0.66)):max(1, int(y1 - tall * 0.33))]
    xs = np.nonzero(band)[1]
    if not len(xs):
        xs = np.nonzero(m)[1]
    return float(np.median(xs)), y1


frames, hot, place = [], [], []   # per facing, per row, per frame
for facing, path in SHEETS:
    a, rows = figures(path)
    walk_h = np.median([box[2] - box[0] for box, _ in rows[0]])
    k = TALL / walk_h
    F, H, P = [], [], []
    for rw in rows:
        fr, hr, pr = [], [], []
        for (y0, x0, y1, x1), m in rw:
            hx, hy = hips(m, walk_h)
            rgba = np.dstack([a[y0:y1, x0:x1], m * 255]).astype(np.uint8)
            # Box-filtered down, premultiplied so the magenta never bleeds in, then cut to whole pixels. The cut is
            # aligned so the hips land on a pixel: the frames of a row then step by whole pixels together.
            w, h = max(1, round((x1 - x0) * k)), max(1, round((y1 - y0) * k))
            pm = rgba.astype(np.float32)
            pm[..., :3] *= pm[..., 3:] / 255
            small = np.asarray(Image.fromarray(pm.astype(np.uint8), 'RGBA').resize((w, h), Image.BOX)).astype(np.float32)
            al = small[..., 3:]
            rgb = np.where(al > 0, small[..., :3] * 255 / np.maximum(al, 1), 0)
            f = np.dstack([np.clip(rgb, 0, 255), (al[..., 0] > 110) * 255]).astype(np.uint8)
            c = f[..., :3].astype(np.int32)
            ht = GLOW & (f[..., 3] > 0) & (c[..., 0] > 165) & (c[..., 0] - c[..., 1] > 85) & (c[..., 0] - c[..., 2] > 85)
            fr.append(f), hr.append(ht), pr.append((hx * k, hy * k))
        F.append(fr), H.append(hr), P.append(pr)
    frames.append(F), hot.append(H), place.append(P)
    print(NAME, facing, 'scale', round(k, 3), 'rows', [len(r) for r in F])

# One palette for every frame (the hot pixels keep their own colours).
opaque = np.concatenate([f[f[..., 3] > 0][:, :3] for F in frames for fr in F for f in fr])
pal = Image.fromarray(opaque.reshape(-1, 1, 3)).quantize(COLOURS, method=Image.MEDIANCUT)


def finish(f, h):
    im = np.asarray(Image.fromarray(f[..., :3]).quantize(palette=pal, dither=Image.NONE).convert('RGB')).copy()
    im[h] = f[..., :3][h]
    f = np.dstack([im, f[..., 3]])
    # A one-pixel dark edge round the silhouette (it keeps a dark figure off a dark floor).
    m = f[..., 3] > 0
    p = np.pad(f, ((1, 1), (1, 1), (0, 0)))
    pm = np.pad(m, 1)
    p[ndimage.binary_dilation(pm) & ~pm] = (*OUTLINE, 255)
    return p, np.pad(h, 1)


done = [[[finish(f, h) for f, h in zip(fr, hr)] for fr, hr in zip(F, H)] for F, H in zip(frames, hot)]
anchor = [[[(round(x) + 1, round(y) + 1) for x, y in pr] for pr in P] for P in place]

# One cell for every frame, the hips at one point.
allf = [(f, an) for D, A in zip(done, anchor) for dr, ar in zip(D, A) for (f, _), an in zip(dr, ar)]
L = max(an[0] for f, an in allf) + 1
R = max(f.shape[1] - an[0] for f, an in allf) + 1
U = max(an[1] for f, an in allf) + 1
D_ = max(f.shape[0] - an[1] for f, an in allf) + 2
CW, CH, COLS = int(L + R), int(U + D_), max(n for _, n in ROWS)
nrows = len(SHEETS) * len(ROWS)
sheet = np.zeros((CH * nrows, CW * COLS, 4), np.uint8)
glow = np.zeros_like(sheet)
for fi, (D, A) in enumerate(zip(done, anchor)):
    for ri, (dr, ar) in enumerate(zip(D, A)):
        for ci, ((f, h), (ax, ay)) in enumerate(zip(dr, ar)):
            ox, oy = ci * CW + L - ax, (fi * len(ROWS) + ri) * CH + U - ay
            sl = sheet[oy:oy + f.shape[0], ox:ox + f.shape[1]]
            m = f[..., 3] > 0
            sl[m] = f[m]
            glow[oy:oy + f.shape[0], ox:ox + f.shape[1]][h] = f[h]

os.makedirs(OUT, exist_ok=True)
Image.fromarray(sheet, 'RGBA').save(os.path.join(OUT, NAME + '.png'), optimize=True)
Image.fromarray(glow, 'RGBA').save(os.path.join(OUT, NAME + '-glow.png'), optimize=True)
meta_p = os.path.join(OUT, 'chars.json')
meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
meta[NAME] = {'w': CW, 'h': CH, 'fx': int(L), 'fy': int(U), 'tall': TALL, 'facings': [f for f, _ in SHEETS], 'rows': [[n, c] for n, c in ROWS]}
json.dump(meta, open(meta_p, 'w'), indent=1)
print(NAME, 'cell', CW, 'x', CH, 'hips', L, U, 'sheet', sheet.shape[1], 'x', sheet.shape[0], 'glow px', int((glow[..., 3] > 0).sum()))
