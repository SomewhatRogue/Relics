# Brightness and colour of FLAT against 2.5D from scripts/bright-look.cjs's shots: mean luma (Rec. 709,
# 0..255) and mean saturation (HSV, 0..1) of the play area (the HUD bands cut off) and of the hero
# (a box around them from the meta file). Also writes side-by-side strips (flat | tags...).
# Usage: python3 scripts/bright-stats.py <dir> <tag> [<tag> ...]
import json, sys
import numpy as np
from PIL import Image

d, tags = sys.argv[1], sys.argv[2:]
metas = {t: json.load(open(f'{d}/meta-{t}.json')) for t in tags}


def stats(a):
    a = a.astype(np.float32) / 255.0
    luma = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]) * 255
    mx, mn = a.max(-1), a.min(-1)
    sat = np.where(mx > 0.02, (mx - mn) / np.maximum(mx, 1e-4), 0)
    return luma.mean(), sat.mean(), np.percentile(luma, 90)


def area(img):
    w, h = img.size
    return np.asarray(img.convert('RGB'))[int(h * 0.1):int(h * 0.72)]


def hero(img, m, flat):
    a, dpr = np.asarray(img.convert('RGB')), m['dpr']
    if flat:
        x, y, t = m['flat']
        box = (x - t * 0.32, y - t * 0.55, x + t * 0.32, y + t * 0.3)
    else:
        x, y, t = m['d3'][0], m['d3'][1], m['d3'][2]
        box = (x - t * 0.32, y - t * 1.05, x + t * 0.32, y - t * 0.05)
    x0, y0, x1, y1 = (int(round(v * dpr)) for v in box)
    return a[max(0, y0):y1, max(0, x0):x1]


print(f"{'scene':26} {'view':6} {'luma':>6} {'sat':>6} {'p90':>6} | {'hero luma':>9} {'hero sat':>8}")
for key in metas[tags[0]]:
    rows = []
    f = Image.open(f'{d}/{key}-flat.png')
    for name, img, flat, m in [('flat', f, True, metas[tags[0]][key])] + [(t, Image.open(f'{d}/{key}-{t}.png'), False, metas[t][key]) for t in tags]:
        L, S, P = stats(area(img))
        hl, hs, _ = stats(hero(img, m, flat))
        print(f'{key:26} {name:6} {L:6.1f} {S:6.3f} {P:6.1f} | {hl:9.1f} {hs:8.3f}')
        if '--crops' in sys.argv[0:0] or False:
            pass
        Image.fromarray(hero(img, m, flat)).save(f'{d}/crop-{key}-{name}.png')
        rows.append(img.convert('RGB'))
    w, h = rows[0].size
    strip = Image.new('RGB', (w * len(rows), h))
    for i, r in enumerate(rows):
        strip.paste(r, (i * w, 0))
    strip.thumbnail((1800, 1800))
    strip.save(f'{d}/pair-{key}.png')
