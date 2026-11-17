"""Relic's knight (our own model, docs/design/new-figures.md), third pass: built on the ideas of the knight Kyle
points to as "the exact look and feel" (docs/design/ref/heroes-four.jpg; that picture is another artist's and is not
used, only studied). What makes that figure: a greatsword held upright before him in both hands, its blade rising a
body's half again above the helm; a great cloak hung from the shoulders that wraps him to the ankle like a shell,
dark outside, a red lining in rings inside, a gold line all round its edge; round pauldrons under a gold-edged
collar; banded plates at the waist; a wide stance with the feet turned out. Colours are each part's middle tone: the
game's drawer shades them in four steps with a checker between (the pixel-shaded look).
`build()` makes him on a skeleton (rig.py) and returns it."""
import math
from kit import along, ball, box, cone, sheet
from rig import Rig

STEEL, DARK, MAIL, GOLD, RED, CLOAK, LEATHER, INK, BLADE = '#4b6068', '#34434a', '#20282d', '#b07e26', '#66181c', '#1c1a20', '#4c311f', '#050507', '#9aacc2'
LINE = 0.027


def build():
    r = Rig()
    r.joint('hips', 'root', (0, 0, 1.02))
    r.joint('spine', 'hips', (0, 0, 1.14))
    r.joint('head', 'spine', (0, 0, 1.58))
    # The sword has a joint of its own at the grip, so a blow turns and carries it; the hands ride on it.
    r.joint('sword', 'spine', (0, -0.27, 1.22))
    for i, (z, y) in enumerate([(1.5, 0.12), (1.06, 0.14), (0.62, 0.16)]):
        r.joint(f'cape{i + 1}', f'cape{i}' if i else 'spine', (0, y, z))
    for side, s in (('L', -1), ('R', 1)):
        r.joint('thigh' + side, 'hips', (s * 0.11, 0, 1.0))
        r.joint('shin' + side, 'thigh' + side, (s * 0.11, 0, 0.55))
        r.joint('foot' + side, 'shin' + side, (s * 0.11, 0, 0.09))
        r.joint('uarm' + side, 'spine', (s * 0.27, 0, 1.46))
        r.joint('farm' + side, 'uarm' + side, (s * 0.285, 0, 1.19))

    for side, s in (('L', -1), ('R', 1)):
        # Legs: a broad sabaton, a greave, a knee cop with a fan, a cuisse in two bands over mail.
        x = s * 0.11
        r.hang('foot' + side, box('boot', (0.1, 0.22, 0.08), (x, -0.035, 0.042), DARK), along(cone('toe', 0.05, 0.0, 0.13, (x, -0.2, 0.036), STEEL, sides=5), (0, -1, 0)))
        r.hang('shin' + side, cone('greave', 0.05, 0.07, 0.45, (x, 0, 0.32), STEEL), ball('knee', 0.078, (x, -0.022, 0.55), STEEL, (1, 1, 0.9)),
               box('kneefan', (0.035, 0.09, 0.09), (x + s * 0.075, -0.01, 0.55), DARK), box('ankle', (0.11, 0.11, 0.05), (x, 0, 0.115), DARK))
        r.hang('thigh' + side, cone('mail', 0.07, 0.09, 0.44, (x, 0.004, 0.79), MAIL), cone('cuisse', 0.074, 0.094, 0.17, (x, -0.012, 0.87), STEEL, squash=(1, 0.85, 1)),
               cone('cuisse2', 0.07, 0.08, 0.15, (x, -0.012, 0.715), DARK, squash=(1, 0.85, 1)))
        # Arms: a big round pauldron over two lames, mail, an elbow cop, a vambrace.
        ax = s * 0.285
        r.hang('uarm' + side, ball('pauldron', 0.158, (ax, 0, 1.5), STEEL, (1.1, 1.0, 0.8)), ball('lame', 0.14, (s * 0.315, 0, 1.41), DARK, (1.0, 0.96, 0.5)),
               ball('lame2', 0.122, (s * 0.325, 0, 1.345), STEEL, (0.95, 0.92, 0.42)), cone('upperarm', 0.05, 0.058, 0.2, (ax, 0, 1.3), MAIL))
        r.hang('farm' + side, ball('couter', 0.064, (s * 0.287, 0, 1.19), STEEL), cone('vambrace', 0.05, 0.066, 0.25, (s * 0.288, -0.005, 1.055), STEEL),
               ball('wrist', 0.046, (s * 0.288, -0.012, 0.94), DARK))

    # The waist in five flared bands, alternately light and dark, over a mail skirt; a belt.
    r.hang('hips', cone('skirt', 0.21, 0.16, 0.26, (0, 0, 0.9), MAIL, squash=(1, 0.76, 1)))
    for i in range(5):
        r.hang('hips' if i > 2 else 'spine', cone('band', 0.168 + 0.013 * i, 0.154 + 0.013 * i, 0.062, (0, 0, 1.2 - 0.06 * i), STEEL if i % 2 == 0 else DARK, squash=(1, 0.74, 1)))
    r.hang('spine', cone('belt', 0.16, 0.16, 0.04, (0, 0, 1.24), LEATHER, squash=(1, 0.76, 1)),
           # The breastplate, and across the shoulders a collar plate with a gold line along its lower edge.
           cone('breast', 0.158, 0.225, 0.26, (0, 0, 1.39), STEEL, squash=(1, 0.7, 1)), cone('collar', 0.3, 0.13, 0.11, (0, 0.01, 1.535), DARK, squash=(1, 0.62, 1)),
           cone('collarline', 0.305, 0.305, LINE, (0, 0.01, 1.485), GOLD, squash=(1, 0.62, 1)), cone('gorget', 0.095, 0.085, 0.09, (0, 0, 1.59), STEEL))
    # Head: a great helm, flat-topped, a black slit, a gold line round its crown.
    r.hang('head', cone('helm', 0.112, 0.108, 0.22, (0, 0, 1.72), STEEL), ball('helmtop', 0.108, (0, 0, 1.83), STEEL, (1, 1, 0.45)),
           box('slit', (0.15, 0.06, 0.03), (0, -0.09, 1.755), INK, glow=True), box('breaths', (0.03, 0.05, 0.1), (0, -0.095, 1.68), DARK),
           cone('crown', 0.114, 0.114, LINE, (0, 0, 1.81), GOLD))

    # The cloak: three lengths on their own joints from the shoulders to the ankle, curving round to flank him, so
    # from the front its lining shows either side of the body and between the legs. A gold line down each edge and
    # along the hem.
    rows = [(1.53, 0.31, 0.15, 0.02), (1.3, 0.37, 0.19, -0.04), (1.06, 0.42, 0.22, -0.08), (0.84, 0.45, 0.24, -0.1), (0.6, 0.47, 0.25, -0.11), (0.36, 0.48, 0.26, -0.11), (0.12, 0.47, 0.26, -0.1)]
    for i, (a, b) in enumerate([(0, 4), (2, 6), (4, 7)]):
        cut = rows[a:b]
        r.hang(f'cape{i + 1}', sheet('cloak', cut, CLOAK, n=11, inner=RED, folds=0.012))
        # (The gold line lies just past the cloak's own edge, so it shows from every side.)
        for span in ((-1.065, -0.99), (0.99, 1.065)):
            r.hang(f'cape{i + 1}', sheet('cloakedge', cut, GOLD, n=2, span=span, folds=0.012))
    r.hang('cape3', sheet('cloakhem', [(0.125, 0.47, 0.26, -0.1), (0.07, 0.468, 0.26, -0.1)], GOLD, n=11, span=(-1.065, 1.065), folds=0.012))

    # The greatsword, upright before him: a pommel, a long brown grip, a gold cross, a broad blade to well above the
    # helm. Both fists on the grip.
    gx, gy = 0, -0.27
    r.hang('sword', ball('pommel', 0.042, (gx, gy, 1.0), GOLD), cone('grip', 0.024, 0.024, 0.42, (gx, gy, 1.24), LEATHER, sides=6),
           box('cross', (0.36, 0.05, 0.045), (gx, gy, 1.47), GOLD), box('crossboss', (0.07, 0.06, 0.08), (gx, gy, 1.47), GOLD),
           cone('blade', 0.05, 0.036, 1.12, (gx, gy, 2.05), BLADE, sides=4, squash=(1, 0.42, 1), smooth=False),
           cone('point', 0.036, 0.0, 0.13, (gx, gy, 2.675), BLADE, sides=4, squash=(1, 0.42, 1), smooth=False),
           ball('handlow', 0.056, (gx, gy - 0.004, 1.13), DARK), ball('handhigh', 0.056, (gx, gy - 0.004, 1.34), DARK))
    return r
