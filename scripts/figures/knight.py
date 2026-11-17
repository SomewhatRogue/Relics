"""Relic's knight (our own design, docs/design/new-figures.md): tall and slender in blackened plate edged with gold,
a closed helm, a crimson surcoat and a long cape, a heater shield on one arm and a long sword in the other hand.
`build()` makes him on a skeleton (rig.py) and returns it. Nothing thinner than about 3 cm: at 70 pixels tall a
pixel is 2.5 cm, and thinner things flicker."""
import math
from kit import along, ball, box, cone, plate, sheet
from rig import Rig

STEEL, DARK, MAIL, GOLD, RED, DEEP, LEATHER, INK, BLADE = '#5b6676', '#3a414e', '#272b34', '#e0ac3a', '#8e1e22', '#6a1418', '#3a2a20', '#07070a', '#cfd6de'


def build():
    r = Rig()
    r.joint('hips', 'root', (0, 0, 1.02))
    r.joint('spine', 'hips', (0, 0, 1.14))
    r.joint('head', 'spine', (0, 0, 1.58))
    r.joint('shield', 'spine', (-0.3, -0.3, 1.1))
    for i, (z, y) in enumerate([(1.5, 0.1), (1.08, 0.13), (0.68, 0.16)]):
        r.joint(f'cape{i + 1}', f'cape{i}' if i else 'spine', (0, y, z))
    for side, s in (('L', -1), ('R', 1)):
        r.joint('thigh' + side, 'hips', (s * 0.09, 0, 1.0))
        r.joint('shin' + side, 'thigh' + side, (s * 0.09, 0, 0.55))
        r.joint('foot' + side, 'shin' + side, (s * 0.09, 0, 0.09))
        r.joint('uarm' + side, 'spine', (s * 0.24, 0, 1.47))
        r.joint('farm' + side, 'uarm' + side, (s * 0.255, 0, 1.19))
        r.joint('hand' + side, 'farm' + side, (s * 0.26, -0.01, 0.93))

    # Legs: sabatons with a gold toe, greaves, knee cops, dark cuisses.
    for side, s in (('L', -1), ('R', 1)):
        x = s * 0.09
        r.hang('foot' + side, box('boot', (0.09, 0.25, 0.085), (x, -0.05, 0.043), DARK), box('toe', (0.09, 0.035, 0.045), (x, -0.172, 0.035), GOLD))
        r.hang('shin' + side, cone('greave', 0.046, 0.064, 0.46, (x, 0, 0.32), STEEL), ball('knee', 0.07, (x, -0.02, 0.55), STEEL, (1, 1, 0.95)),
               box('kneerim', (0.125, 0.125, 0.035), (x, -0.012, 0.49), GOLD))
        r.hang('thigh' + side, cone('cuisse', 0.066, 0.088, 0.44, (x, 0, 0.79), MAIL))
        # Arms: a gold-rimmed pauldron with a point, a mailed upper arm, an elbow cop, a gauntlet with a gold cuff.
        ax = s * 0.25
        r.hang('uarm' + side, ball('pauldronrim', 0.125, (ax, 0, 1.455), GOLD, (1.16, 0.98, 0.34)), ball('pauldron', 0.118, (ax, 0, 1.49), STEEL, (1.1, 0.94, 0.74)),
               along(cone('spike', 0.034, 0.0, 0.13, (s * 0.315, 0, 1.6), GOLD, sides=5), (s * 0.45, 0, 1)), cone('upperarm', 0.046, 0.056, 0.27, (ax, 0, 1.325), MAIL))
        r.hang('farm' + side, ball('elbow', 0.058, (s * 0.255, 0, 1.19), STEEL), cone('gauntlet', 0.05, 0.06, 0.25, (s * 0.258, -0.005, 1.055), STEEL),
               box('cuff', (0.125, 0.125, 0.035), (s * 0.256, -0.004, 1.165), GOLD))
        r.hang('hand' + side, ball('hand', 0.052, (s * 0.26, -0.012, 0.9), DARK))

    # Hips: a skirt of plates with a gold hem, a belt and buckle.
    r.hang('hips', cone('tassets', 0.205, 0.15, 0.27, (0, 0, 0.955), DARK, squash=(1, 0.74, 1)), cone('skirtrim', 0.212, 0.212, 0.04, (0, 0, 0.83), GOLD, squash=(1, 0.74, 1)),
           cone('belt', 0.156, 0.156, 0.055, (0, 0, 1.105), LEATHER, squash=(1, 0.76, 1)), box('buckle', (0.06, 0.03, 0.06), (0, -0.118, 1.105), GOLD))
    # Body: a cuirass narrow at the waist, the surcoat down its front to the knee, a gold collar.
    lean = (math.radians(-2.5), 0, 0)
    r.hang('spine', cone('cuirass', 0.142, 0.215, 0.44, (0, 0, 1.34), STEEL, squash=(1, 0.68, 1)), box('surcoat', (0.115, 0.03, 0.8), (0, -0.152, 1.1), RED, rot=lean),
           box('surcoathem', (0.15, 0.036, 0.04), (0, -0.136, 0.71), GOLD), cone('gorget', 0.09, 0.08, 0.1, (0, 0, 1.56), DARK),
           cone('collar', 0.19, 0.19, 0.035, (0, 0, 1.535), GOLD, squash=(1, 0.66, 1)))
    for s in (-1, 1):
        r.hang('spine', box('surcoatrim', (0.03, 0.036, 0.8), (s * 0.068, -0.154, 1.1), GOLD, rot=lean))
    # Head: a closed helm rounded on top, a black slit, a gold brow band, a low gold fin.
    r.hang('head', cone('helm', 0.108, 0.106, 0.2, (0, 0, 1.69), STEEL), ball('helmtop', 0.106, (0, 0, 1.785), STEEL, (1, 1, 0.62)),
           box('slit', (0.15, 0.06, 0.036), (0, -0.085, 1.715), INK, glow=True), box('nasal', (0.034, 0.04, 0.15), (0, -0.1, 1.675), DARK),
           cone('brow', 0.112, 0.112, 0.036, (0, 0, 1.76), GOLD), box('fin', (0.034, 0.17, 0.05), (0, 0.0, 1.86), GOLD))

    # The cape: three lengths, each on its own joint so it can stream, to the calf, a gold hem on the last.
    rows = [(1.52, 0.27, 0.115, 0.09), (1.3, 0.31, 0.135, 0.095), (1.07, 0.35, 0.15, 0.1), (0.86, 0.39, 0.165, 0.105), (0.67, 0.42, 0.18, 0.11), (0.46, 0.45, 0.195, 0.12), (0.26, 0.47, 0.21, 0.13)]
    # (Each length runs a row past the next one's start, so no gap opens between them when they swing.)
    for i, (a, b) in enumerate([(0, 4), (2, 6), (4, 7)]):
        r.hang(f'cape{i + 1}', sheet('cape', rows[a:b], DEEP))
    r.hang('cape3', sheet('capehem', [(0.3, 0.468, 0.213, 0.133), (0.25, 0.472, 0.217, 0.137)], GOLD))

    # The sword in the hand at +x: the blade down and a little forward, a gold guard and pommel.
    hand, d = (0.262, -0.03, 0.9), (0.06, -0.2, -0.98)
    n = math.sqrt(sum(v * v for v in d))
    at = lambda k: tuple(h + v / n * k for h, v in zip(hand, d))
    r.hang('handR', along(cone('blade', 0.0, 0.036, 0.8, at(0.47), BLADE, sides=4, squash=(1, 0.5, 1), smooth=False), tuple(-v for v in d)),
           along(box('guard', (0.24, 0.045, 0.04), at(0.06), GOLD), d), along(cone('grip', 0.022, 0.022, 0.2, at(-0.05), LEATHER, sides=6), d), ball('pommel', 0.036, at(-0.165), GOLD))

    # The shield, on its own joint in front of the bent arm: a heater, crimson, a steel rim, a gold lozenge.
    turn, at_s = (math.radians(6), 0, math.radians(-14)), (-0.3, -0.3, 1.1)
    heater = lambda k: [(-0.19 * k, 0.26 * k), (-0.2 * k, 0.02 * k), (-0.13 * k, -0.17 * k), (0, -0.31 * k), (0.13 * k, -0.17 * k), (0.2 * k, 0.02 * k), (0.19 * k, 0.26 * k)]
    lozenge = [(0, 0.075), (-0.06, 0), (0, -0.075), (0.06, 0)]
    r.hang('shield', plate('shieldrim', heater(1.0), 0.04, at_s, DARK, rot=turn), plate('shieldface', heater(0.84), 0.06, (at_s[0], at_s[1] - 0.003, at_s[2] + 0.005), RED, rot=turn),
           plate('device', lozenge, 0.075, (at_s[0], at_s[1] - 0.005, at_s[2] + 0.03), GOLD, rot=turn))
    return r
