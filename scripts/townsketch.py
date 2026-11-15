"""
Wickhold re-laid out (docs/design/town-layout.md): draws the plan as a map sketch, top-down, north up.
Run: python3 scripts/townsketch.py docs/design/ref/town-layout-sketch.png
Levels shaded (0 the lower quarter, 1 the town, 2 Kirkhill), lanes in cobble, steps hatched, each building's
front marked with a bright edge and its door, the chase camera's views as arrows. A sketch, not the map:
the build fits these numbers with the reachability tests.
"""
import sys
from PIL import Image, ImageDraw, ImageFont

W, H, T = 64, 52, 15  # tiles, pixels a tile

# Levels: (x, y, w, h, level); later wins.
LEVELS = [(0, 0, 64, 36, 1), (0, 36, 13, 16, 1), (55, 36, 9, 16, 1), (13, 1, 29, 12, 2)]
# Steps and slopes (ramps), with a name.
RAMPS = [(27.5, 11, 5, 4.5, 'KIRK STEPS'), (30, 34, 5, 4, 'RAT STEPS'), (39, 34, 3, 4, 'EAST STAIR'), (11, 36, 3.5, 3.5, '')]
# Lanes and open ground (cobble), with a name and where to write it.
LANES = [
    (23, 18.5, 19, 16, 'LANTERN SQUARE', 26, 22), (23, 34.5, 19, 1.5, '', 0, 0),
    (27.5, 13, 5, 5.5, '', 0, 0), (25, 8.5, 17, 4.5, 'CHURCH CLOSE', 33.3, 10.4),
    (9, 20.5, 14, 3, "SMITHS' LANE", 11, 21.3), (9, 23.5, 3.5, 13, 'WALL\nLANE', 9.4, 26.5),
    (45, 0, 3.5, 20, 'GATE\nROAD', 45.4, 11.5), (42, 20, 13, 4, 'MARKET LANE', 43, 20.9),
    (13, 36, 42, 3.5, 'LOWER LANE', 15, 36.9), (41, 42.5, 14, 3, 'RESCUE ROW', 44, 43.3),
    (38.5, 39.5, 2.5, 11.5, '', 0, 0), (1, 1, 11, 14, 'TRAINING YARD', 2, 7), (55, 20, 1.5, 4, '', 0, 0),
]
# Buildings: x, y, w, h, kind, label, front (the way the front looks: S N E W), enterable.
B = [
    (25, 2, 10, 6.5, 'church', 'CHURCH', 'S', 1), (36, 2.5, 5, 4.5, 'granary', 'GRANARY', 'S', 1),
    (33, 13, 9, 5.5, 'hall', 'TOWN HALL', 'S', 1), (14, 14.5, 7.5, 6, 'forge', 'FORGE', 'S', 1),
    (1.5, 17, 7.5, 10, 'hall', 'BARRACKS', 'E', 1), (16.5, 27, 6.5, 6, 'hall', 'COUNTING\nHOUSE', 'E', 1),
    (1.5, 29, 7.5, 7, 'house', 'INFIRMARY', 'E', 1), (26.5, 39.5, 12, 6.5, 'tavern', 'THE DROWNED\nRAT', 'N', 1),
    (49, 1, 6, 8, 'keep', 'THE KEEP', 'W', 0), (49.5, 10.5, 5, 6, 'tower', 'TOWER', 'W', 1),
    (43, 24, 7.5, 6, 'house', "HUNTERS'\nLODGE", 'N', 1), (57.5, 18.5, 5.5, 7, 'chapel', 'OLD\nCHAPEL', 'W', 0),
    # Rescue Row's homes, four a side, facing each other across the row.
    *[(41 + i * 3.5, 39.5, 3.5, 3, 'home', '', 'S', 1) for i in range(4)],
    *[(41 + i * 3.5, 45.5, 3.5, 3, 'home', '', 'N', 1) for i in range(4)],
    # Town houses packed along every lane (no door, a front on their lane).
    (22.5, 13, 5, 2.7, 'house', '', 'E', 0), (22.5, 15.7, 5, 2.8, 'house', '', 'E', 0),
    (9.5, 14.5, 2.2, 6, 'house', '', 'S', 0), (11.7, 14.5, 2.3, 6, 'house', '', 'S', 0),
    *[(12.5 + i * 2.6, 23.5, 2.6, 3.5, 'house', '', 'N', 0) for i in range(4)],
    *[(12.5, 27 + i * 2.7, 4, 2.7, 'house', '', 'W', 0) for i in range(3)],
    *[(1.5, 37 + i * 4.6, 7.5, 4.4, 'cottage', '', 'E', 0) for i in range(3)],
    *[(42, 1 + i * 3.8, 3, 3.8, 'house', '', 'E', 0) for i in range(3)], (42, 13, 3, 5.5, 'house', '', 'E', 0),
    (14, 1, 2.3, 1.6, 'house', '', 'S', 0), (36, 7.5, 5.5, 1, 'house', '', 'S', 0),
    (13, 33, 3.5, 3, 'cottage', '', 'S', 0), (43, 30.5, 7.5, 2, 'house', '', 'W', 0), (43, 32.5, 7.5, 2, 'house', '', 'W', 0),
    (51, 9.5, 0, 0, 'house', '', 'S', 0),
]
WALLS = [(0, 0, 64, 1), (0, 0, 1, 52), (0, 51, 64, 1), (63, 0, 1, 52), (55, 0, 1.5, 20), (55, 24, 1.5, 28)]
WATER = [(14, 41, 11, 7.5, 'MILLPOND')]
GRAVES = [(15 + (i % 4) * 2, 3 + (i // 4) * 2.2) for i in range(16)]
TARGETS = [(54, 26 + i * 2.6) for i in range(3)]
LANTERN = (32.5, 25.8)
# The square's things, where they sit today moved with it (the build fits them): stalls, benches, the cart, the well.
SQUARE = [(27.4, 19.8, 2.4, 0.6, 'JOBS'), (34.8, 19.8, 3.4, 0.6, 'WORKS'), (41.5, 18.7, 3, 2, 'TRADER'), (41.5, 22.7, 3, 2, 'PAWN'),
          (28, 31.2, 2, 0.5, ''), (35.5, 31.2, 2, 0.5, ''), (39.5, 28.2, 2.2, 1.2, 'CART')]
WELL = (26.5, 27.6)
GATE, RUBBLE, GRATE = (46.75, 0.5), (55.75, 22), (39.75, 48)
HERO = (32.5, 31)
# The chase camera's views: from, to, label (what it comes upon).
VIEWS = [((31.2, 38.2), (31.2, 21.5), '1'), ((30, 17.5), (30, 9.5), '2'), ((33.8, 33), (33.8, 38.8), '3'),
         ((21, 22), (10.5, 22), '4'), ((43, 22), (55, 22), '5'), ((46.75, 2.5), (46.75, 22.5), '6'),
         ((42, 44), (53, 44), '7'), ((10.75, 25), (10.75, 34), '8')]

LV = {0: (54, 58, 52), 1: (88, 92, 82), 2: (122, 124, 110)}
KIND = {'church': (150, 150, 170), 'hall': (130, 120, 112), 'forge': (150, 90, 60), 'tavern': (160, 110, 60),
        'house': (112, 84, 70), 'home': (132, 104, 78), 'cottage': (120, 100, 70), 'keep': (90, 90, 100),
        'tower': (110, 100, 140), 'granary': (150, 130, 80), 'chapel': (120, 120, 130)}


def px(v): return int(round(v * T))


def main(out):
    im = Image.new('RGB', (W * T, H * T + 150), (24, 24, 28))
    d = ImageDraw.Draw(im)
    try:
        f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 11)
        fs = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
        fb = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 16)
    except OSError:
        f = fs = fb = ImageFont.load_default()
    d.rectangle([0, 0, W * T, H * T], fill=LV[0])
    for x, y, w, h, lv in LEVELS:
        d.rectangle([px(x), px(y), px(x + w), px(y + h)], fill=LV[lv])
    # Retaining walls: the edge of every raised level, a dark line.
    for x, y, w, h, lv in LEVELS:
        d.rectangle([px(x), px(y), px(x + w), px(y + h)], outline=(20, 20, 22), width=3)
    for x, y, w, h, name, lx, ly in LANES:
        d.rectangle([px(x), px(y), px(x + w), px(y + h)], fill=tuple(c + 26 for c in (88, 84, 80)))
    for x, y, w, h, name, lx, ly in LANES:
        if name:
            d.multiline_text((px(lx), px(ly)), name, font=f, fill=(235, 225, 200))
    for x, y, w, h, name in RAMPS:
        d.rectangle([px(x), px(y), px(x + w), px(y + h)], fill=(150, 140, 120))
        for k in range(int(h * 3)):
            yy = px(y) + k * T // 3
            d.line([px(x), yy, px(x + w), yy], fill=(80, 74, 66), width=1)
        if name:
            d.text((px(x + w) + 3, px(y + h / 2) - 6), name, font=f, fill=(255, 235, 170))
    for x, y, w, h, name in WATER:
        d.rectangle([px(x), px(y), px(x + w), px(y + h)], fill=(40, 70, 95))
        d.text((px(x + 2.5), px(y + 3)), name, font=f, fill=(200, 220, 240))
    for gx, gy in GRAVES:
        d.rectangle([px(gx), px(gy), px(gx + 0.7), px(gy + 0.4)], fill=(170, 170, 160))
    for x, y, w, h in WALLS:
        d.rectangle([px(x), px(y), px(x + w), px(y + h)], fill=(60, 58, 66))
    d.rectangle([px(GATE[0] - 1.5), 0, px(GATE[0] + 1.5), px(1)], fill=(200, 170, 90))
    d.text((px(GATE[0] - 4.5), px(1.2)), 'NORTH GATE', font=f, fill=(255, 225, 140))
    d.rectangle([px(55), px(20), px(56.5), px(24)], fill=(110, 95, 80))
    d.text((px(51), px(18.7)), 'RUBBLE', font=f, fill=(230, 200, 160))
    for x, y, w, h, kind, label, front, door in B:
        if not w:
            continue
        d.rectangle([px(x), px(y), px(x + w), px(y + h)], fill=KIND[kind], outline=(30, 26, 24))
        # The front: a bright edge on the side it looks out of, the door a gold notch in its middle.
        e = {'S': [px(x), px(y + h) - 3, px(x + w), px(y + h)], 'N': [px(x), px(y), px(x + w), px(y) + 3],
             'E': [px(x + w) - 3, px(y), px(x + w), px(y + h)], 'W': [px(x), px(y), px(x) + 3, px(y + h)]}[front]
        d.rectangle(e, fill=(240, 230, 200))
        if door:
            cx, cy = x + w / 2, y + h / 2
            dx, dy = {'S': (cx, y + h), 'N': (cx, y), 'E': (x + w, cy), 'W': (x, cy)}[front]
            d.ellipse([px(dx) - 5, px(dy) - 5, px(dx) + 5, px(dy) + 5], fill=(255, 190, 60), outline=(60, 40, 10))
        if label:
            lines = label.split('\n')
            for i, ln in enumerate(lines):
                tw = d.textlength(ln, font=f)
                d.text((px(x + w / 2) - tw / 2, px(y + h / 2) - 7 * len(lines) + i * 13), ln, font=f, fill=(20, 16, 14))
    for tx, ty in TARGETS:
        d.ellipse([px(tx) - 6, px(ty) - 6, px(tx) + 6, px(ty) + 6], fill=(200, 60, 50), outline=(240, 230, 200))
    d.text((px(50.8), px(32.5)), 'BUTTS', font=f, fill=(235, 225, 200))
    for x, y, w, h, lab in SQUARE:
        d.rectangle([px(x), px(y), px(x + w), px(y + h)], fill=(70, 50, 36), outline=(200, 180, 140))
        if lab:
            d.text((px(x), px(y + h) + 1), lab, font=f, fill=(235, 225, 200))
    d.ellipse([px(WELL[0]) - 7, px(WELL[1]) - 7, px(WELL[0]) + 7, px(WELL[1]) + 7], fill=(40, 70, 95), outline=(200, 200, 200), width=2)
    d.text((px(WELL[0]) - 12, px(WELL[1]) + 8), 'WELL', font=f, fill=(235, 225, 200))
    lx, ly = LANTERN
    d.ellipse([px(lx - 2.2), px(ly - 2.2), px(lx + 2.2), px(ly + 2.2)], fill=(140, 132, 120), outline=(40, 36, 30), width=2)
    d.ellipse([px(lx) - 7, px(ly) - 7, px(lx) + 7, px(ly) + 7], fill=(255, 210, 90))
    d.text((px(lx - 3.5), px(ly + 2.5)), 'THE LANTERN', font=f, fill=(255, 225, 140))
    d.rectangle([px(GRATE[0]) - 6, px(GRATE[1]) - 6, px(GRATE[0]) + 6, px(GRATE[1]) + 6], fill=(30, 30, 30), outline=(150, 150, 150))
    d.text((px(GRATE[0] + 0.6), px(GRATE[1] - 0.4)), 'GRATE', font=f, fill=(220, 220, 220))
    hx, hy = HERO
    d.polygon([(px(hx), px(hy) - 8), (px(hx) - 6, px(hy) + 6), (px(hx) + 6, px(hy) + 6)], fill=(90, 200, 255))
    for (ax, ay), (bx, by), lab in VIEWS:
        d.line([px(ax), px(ay), px(bx), px(by)], fill=(255, 120, 200), width=3)
        import math
        a = math.atan2(by - ay, bx - ax)
        tip = (px(bx), px(by))
        d.polygon([tip, (tip[0] - 12 * math.cos(a - 0.45), tip[1] - 12 * math.sin(a - 0.45)), (tip[0] - 12 * math.cos(a + 0.45), tip[1] - 12 * math.sin(a + 0.45))], fill=(255, 120, 200))
        d.ellipse([px(ax) - 9, px(ay) - 9, px(ax) + 9, px(ay) + 9], fill=(255, 120, 200))
        d.text((px(ax) - 4, px(ay) - 7), lab, font=f, fill=(30, 10, 25))
    # The key.
    y0 = H * T + 10
    d.text((10, y0), 'WICKHOLD RE-LAID OUT (sketch, north up, 64 x 52 tiles)', font=fb, fill=(240, 230, 200))
    for i, (lv, name) in enumerate([(2, 'Kirkhill, level 2'), (1, 'the town, level 1'), (0, 'the lower quarter, level 0')]):
        d.rectangle([10 + i * 230, y0 + 30, 34 + i * 230, y0 + 48], fill=LV[lv], outline=(200, 200, 200))
        d.text((40 + i * 230, y0 + 32), name, font=fs, fill=(230, 230, 230))
    d.rectangle([700, y0 + 30, 724, y0 + 48], fill=(150, 140, 120))
    d.text((730, y0 + 32), 'steps', font=fs, fill=(230, 230, 230))
    d.text((10, y0 + 58), 'Bright edge: the side a building\'s front looks out of. Gold dot: its door. Blue: where you arrive.', font=fs, fill=(230, 230, 230))
    d.text((10, y0 + 78), 'Pink arrows: what the chase camera comes upon. 1 up the Rat Steps: the Lantern, the hall, the church above. 2 up the Kirk', font=fs, fill=(230, 230, 230))
    d.text((10, y0 + 96), 'Steps: the church door. 3 down: the Drowned Rat. 4 west: the barracks. 5 east: the rubble (the Old Chapel). 6 in at', font=fs, fill=(230, 230, 230))
    d.text((10, y0 + 114), 'the gate: the lodge. 7 along Rescue Row: homes facing each other. 8 down Wall Lane: the infirmary, steps to the pond.', font=fs, fill=(230, 230, 230))
    im.save(out)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'town-layout-sketch.png')
