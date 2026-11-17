"""Relic's knight (our own design, docs/design/new-figures.md), second pass after Kyle's "too HD, not stylised":
nearly black steel in many small layered plates (each catches its own light), gold only as thin lines, a pointed helm
with a horsehair plume, a fur mantle, a long ragged cape, a long sword held forward and a dark heater shield.
`build()` makes him on a skeleton (rig.py) and returns it. Gold lines are one pixel (2.6 cm) on purpose."""
import math
from kit import along, ball, box, cone, plate, sheet
from rig import Rig

STEEL, DARK, MAIL, GOLD, RED, DEEP, LEATHER, INK, BLADE, PLUME, FUR = '#36414f', '#232a35', '#15181e', '#ac8430', '#5e181c', '#411216', '#2b2019', '#050507', '#9ca7b4', '#6e1a1f', '#211915'
LINE = 0.026


def build():
    r = Rig()
    r.joint('hips', 'root', (0, 0, 1.02))
    r.joint('spine', 'hips', (0, 0, 1.14))
    r.joint('head', 'spine', (0, 0, 1.58))
    r.joint('shield', 'spine', (-0.31, -0.3, 1.08))
    for i, (z, y) in enumerate([(1.5, 0.1), (1.08, 0.13), (0.68, 0.16)]):
        r.joint(f'cape{i + 1}', f'cape{i}' if i else 'spine', (0, y, z))
    for side, s in (('L', -1), ('R', 1)):
        r.joint('thigh' + side, 'hips', (s * 0.095, 0, 1.0))
        r.joint('shin' + side, 'thigh' + side, (s * 0.095, 0, 0.55))
        r.joint('foot' + side, 'shin' + side, (s * 0.095, 0, 0.09))
        r.joint('uarm' + side, 'spine', (s * 0.245, 0, 1.47))
        r.joint('farm' + side, 'uarm' + side, (s * 0.26, 0, 1.19))
        r.joint('hand' + side, 'farm' + side, (s * 0.265, -0.01, 0.93))

    for side, s in (('L', -1), ('R', 1)):
        # Legs: a pointed sabaton, a greave with a gold line under the knee, a knee cop, a steel cuisse over mail.
        x = s * 0.095
        r.hang('foot' + side, box('boot', (0.085, 0.2, 0.075), (x, -0.03, 0.04), DARK), along(cone('toe', 0.04, 0.0, 0.15, (x, -0.2, 0.034), STEEL, sides=5), (0, -1, 0)))
        r.hang('shin' + side, cone('greave', 0.044, 0.062, 0.45, (x, 0, 0.32), STEEL), ball('knee', 0.07, (x, -0.022, 0.55), STEEL, (1, 1, 0.95)),
               box('kneeline', (0.118, 0.118, LINE), (x, -0.012, 0.492), GOLD), box('ankle', (0.1, 0.1, 0.05), (x, 0, 0.11), DARK))
        r.hang('thigh' + side, cone('mail', 0.064, 0.084, 0.44, (x, 0.004, 0.79), MAIL), cone('cuisse', 0.064, 0.086, 0.3, (x, -0.014, 0.81), STEEL, squash=(1, 0.8, 1)))
        # Arms: a pauldron of two lames with a gold line and a point, mail, an elbow cop with a point, a vambrace.
        ax = s * 0.26
        r.hang('uarm' + side, ball('pauldron', 0.132, (ax, 0, 1.5), STEEL, (1.12, 0.98, 0.72)), ball('lame', 0.118, (s * 0.288, 0, 1.425), DARK, (1.0, 0.95, 0.5)),
               ball('pauldronline', 0.136, (ax, 0, 1.462), GOLD, (1.13, 1.0, 0.1)), along(cone('spike', 0.03, 0.0, 0.13, (s * 0.33, 0, 1.61), GOLD, sides=5), (s * 0.5, 0, 1)),
               cone('upperarm', 0.045, 0.054, 0.27, (ax, 0, 1.325), MAIL))
        r.hang('farm' + side, ball('couter', 0.058, (s * 0.262, 0, 1.19), STEEL), along(cone('couterpoint', 0.03, 0.0, 0.09, (s * 0.262, 0.07, 1.19), STEEL, sides=5), (0, 1, 0)),
               cone('vambrace', 0.046, 0.062, 0.25, (s * 0.265, -0.005, 1.055), STEEL), box('cuff', (0.122, 0.122, LINE), (s * 0.263, -0.004, 1.17), GOLD))
        r.hang('hand' + side, ball('hand', 0.05, (s * 0.265, -0.012, 0.9), DARK))
        # Hips: a tasset plate over each thigh with a gold line at its foot, and one at each side.
        r.hang('hips', box('tasset', (0.115, 0.03, 0.25), (s * 0.08, -0.132, 0.925), STEEL, rot=(math.radians(-8), 0, 0)), box('tassetline', (0.12, 0.034, LINE), (s * 0.08, -0.15, 0.81), GOLD),
               box('sidetasset', (0.03, 0.17, 0.22), (s * 0.19, 0, 0.94), DARK))

    # Hips and body: a mail skirt, a belt, three flared lames at the waist, the breastplate, a narrow tabard edged in
    # gold line, a gorget, a fur mantle across the shoulders.
    r.hang('hips', cone('skirt', 0.2, 0.15, 0.3, (0, 0, 0.93), MAIL, squash=(1, 0.74, 1)), cone('belt', 0.158, 0.158, 0.05, (0, 0, 1.1), LEATHER, squash=(1, 0.76, 1)),
           box('buckle', (0.05, 0.03, 0.05), (0, -0.12, 1.1), GOLD))
    for i, z in enumerate([1.25, 1.195, 1.14]):
        r.hang('spine', cone('fauld', 0.164 + 0.012 * i, 0.15 + 0.012 * i, 0.06, (0, 0, z), STEEL if i % 2 == 0 else DARK, squash=(1, 0.7, 1)))
    lean = (math.radians(-2.5), 0, 0)
    r.hang('spine', cone('breast', 0.155, 0.218, 0.3, (0, 0, 1.415), STEEL, squash=(1, 0.68, 1)), box('tabard', (0.09, LINE, 0.76), (0, -0.158, 1.1), RED, rot=lean),
           cone('gorget', 0.092, 0.08, 0.1, (0, 0, 1.56), DARK), cone('collar', 0.165, 0.165, LINE, (0, 0, 1.545), GOLD, squash=(1, 0.66, 1)),
           ball('mantle', 0.1, (0, 0.075, 1.5), FUR, (2.7, 1.15, 0.6)))
    for s in (-1, 1):
        r.hang('spine', box('tabardline', (LINE, 0.032, 0.76), (s * 0.058, -0.16, 1.1), GOLD, rot=lean))
    # Head: a bascinet drawn up to a point, a beaked visor with a black slit, a gold line at the brow, horsehair
    # from the point down the back.
    r.hang('head', cone('helm', 0.1, 0.095, 0.19, (0, 0, 1.675), STEEL), cone('helmpoint', 0.095, 0.0, 0.15, (0, 0, 1.845), STEEL),
           along(cone('visor', 0.075, 0.0, 0.15, (0, -0.115, 1.685), DARK, sides=6), (0, -1, -0.12)), box('slit', (0.13, 0.05, 0.03), (0, -0.088, 1.727), INK, glow=True),
           cone('brow', 0.102, 0.102, LINE, (0, 0, 1.772), GOLD),
           along(cone('plume', 0.028, 0.05, 0.2, (0, 0.075, 1.93), PLUME, sides=6), (0, 0.9, 0.3)), along(cone('plumetail', 0.05, 0.012, 0.42, (0, 0.2, 1.76), PLUME, sides=6), (0, 0.3, -1)))

    # The cape: three lengths on their own joints, to the ankle, its hem ragged.
    rows = [(1.52, 0.26, 0.115, 0.09), (1.3, 0.3, 0.135, 0.095), (1.07, 0.34, 0.15, 0.1), (0.86, 0.38, 0.165, 0.105), (0.64, 0.42, 0.18, 0.11), (0.4, 0.45, 0.195, 0.12), (0.14, 0.47, 0.21, 0.13)]
    for i, (a, b) in enumerate([(0, 4), (2, 6), (4, 7)]):
        r.hang(f'cape{i + 1}', sheet('cape', rows[a:b], DEEP, n=9, rag=0.09 if i == 2 else 0.0))

    # The sword in the hand at +x, held forward and down: a long blade, a wide gold guard.
    hand, d = (0.268, -0.03, 0.9), (0.22, -0.5, -0.84)
    n = math.sqrt(sum(v * v for v in d))
    at = lambda k: tuple(h + v / n * k for h, v in zip(hand, d))
    r.hang('handR', along(cone('blade', 0.0, 0.034, 0.98, at(0.57), BLADE, sides=4, squash=(1, 0.5, 1), smooth=False), tuple(-v for v in d)),
           along(box('guard', (0.3, 0.04, LINE + 0.01), at(0.07), GOLD), d), along(cone('grip', 0.02, 0.02, 0.22, at(-0.05), LEATHER, sides=6), d), ball('pommel', 0.034, at(-0.175), GOLD))

    # The shield on its own joint in front of the bent arm: a dark heater, a steel rim, a small gold lozenge.
    turn, at_s = (math.radians(6), 0, math.radians(-14)), (-0.31, -0.3, 1.08)
    heater = lambda k: [(-0.19 * k, 0.27 * k), (-0.2 * k, 0.02 * k), (-0.13 * k, -0.18 * k), (0, -0.33 * k), (0.13 * k, -0.18 * k), (0.2 * k, 0.02 * k), (0.19 * k, 0.27 * k)]
    lozenge = [(0, 0.06), (-0.045, 0), (0, -0.06), (0.045, 0)]
    r.hang('shield', plate('shieldrim', heater(1.0), 0.04, at_s, STEEL, rot=turn), plate('shieldface', heater(0.84), 0.06, (at_s[0], at_s[1] - 0.003, at_s[2] + 0.005), RED, rot=turn),
           plate('device', lozenge, 0.075, (at_s[0], at_s[1] - 0.005, at_s[2] + 0.04), GOLD, rot=turn))
    return r
