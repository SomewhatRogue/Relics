"""Relic's knight, first pass (our own design): a tall figure in blackened plate edged with gold, a closed great
helm, a crimson surcoat and cape, a heater shield on the left arm and a long sword in the right hand.
blender --background --factory-startup --python knight.py -- <out.png> [yaw degrees]"""
import bpy, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import along, ball, box, cone, render, sheet, stage, taper

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
out = args[0] if args else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'knight.png')
yaw = float(args[1]) if len(args) > 1 else 22

bpy.ops.wm.read_factory_settings(use_empty=True)
STEEL, DARK, MAIL, GOLD, RED, DEEP, LEATHER, INK, BLADE = '#4d545f', '#2c3038', '#1f2228', '#d4a537', '#7a1a1c', '#521012', '#2a1c16', '#07070a', '#c3cad2'

# Legs: sabatons, greaves, knee cops, mailed thighs.
for s in (-1, 1):
    x = s * 0.105
    box('boot', (0.1, 0.27, 0.08), (x, -0.045, 0.04), DARK)
    box('toe', (0.1, 0.02, 0.03), (x, -0.185, 0.03), GOLD)
    cone('greave', 0.052, 0.07, 0.44, (x, 0, 0.30), STEEL)
    ball('knee', 0.074, (x, -0.012, 0.535), STEEL, (1, 1, 0.9))
    box('kneerim', (0.13, 0.13, 0.016), (x, -0.012, 0.50), GOLD)
    cone('thigh', 0.072, 0.092, 0.40, (x, 0, 0.75), MAIL)

# Hips and body: a skirt of plates, a belt, a cuirass narrow at the waist and broad at the chest.
cone('tassets', 0.235, 0.165, 0.30, (0, 0, 0.93), DARK, squash=(1, 0.7, 1))
cone('skirtrim', 0.24, 0.24, 0.022, (0, 0, 0.79), GOLD, squash=(1, 0.7, 1))
cone('belt', 0.172, 0.172, 0.05, (0, 0, 1.085), LEATHER, squash=(1, 0.72, 1))
box('buckle', (0.05, 0.02, 0.05), (0, -0.126, 1.085), GOLD)
cone('cuirass', 0.165, 0.245, 0.42, (0, 0, 1.30), STEEL, squash=(1, 0.64, 1))
# The surcoat: a crimson panel from the collar to the knee, gold at its edges.
box('surcoat', (0.118, 0.018, 0.74), (0, -0.168, 1.10), RED, rot=(math.radians(-3.5), 0, 0))
for s in (-1, 1):
    box('surcoatrim', (0.014, 0.022, 0.74), (s * 0.064, -0.17, 1.10), GOLD, rot=(math.radians(-3.5), 0, 0))
box('surcoathem', (0.14, 0.022, 0.016), (0, -0.147, 0.735), GOLD)
cone('gorget', 0.085, 0.075, 0.09, (0, 0, 1.535), DARK)

# Arms: gold-rimmed pauldrons with a point, mailed upper arms, elbow cops, gauntlets.
for s in (-1, 1):
    x = s * 0.305
    ball('pauldronrim', 0.138, (x, 0, 1.415), GOLD, (1.18, 0.95, 0.3))
    ball('pauldron', 0.13, (x, 0, 1.45), STEEL, (1.12, 0.9, 0.72))
    along(cone('spike', 0.03, 0.0, 0.11, (s * 0.37, 0, 1.56), GOLD, sides=6), (s * 0.5, 0, 1))
    cone('upperarm', 0.05, 0.062, 0.30, (s * 0.325, 0, 1.24), MAIL)
    ball('elbow', 0.062, (s * 0.335, 0, 1.085), STEEL)
    cone('gauntlet', 0.058, 0.066, 0.27, (s * 0.345, -0.03, 0.935), STEEL)
    box('cuff', (0.14, 0.14, 0.018), (s * 0.345, -0.03, 1.06), GOLD)
    ball('hand', 0.056, (s * 0.35, -0.05, 0.785), DARK)

# The helm: a closed great helm, a black slit, a gold brow band and a low crest.
cone('helm', 0.118, 0.112, 0.21, (0, 0, 1.665), STEEL)
ball('helmtop', 0.112, (0, 0, 1.77), STEEL, (1, 1, 0.55))
box('slit', (0.17, 0.05, 0.024), (0, -0.095, 1.695), INK, glow=True)
box('nasal', (0.022, 0.03, 0.15), (0, -0.112, 1.655), DARK)
cone('brow', 0.121, 0.121, 0.022, (0, 0, 1.735), GOLD)
box('crest', (0.02, 0.17, 0.03), (0, 0.0, 1.838), GOLD)
cone('collar', 0.2, 0.2, 0.02, (0, 0, 1.5), GOLD, squash=(1, 0.62, 1))

# The cape: from the shoulders to the calf, wider and further back toward its hem.
sheet('cape', [(1.50, 0.30, 0.13, 0.10), (1.25, 0.36, 0.17, 0.11), (1.0, 0.41, 0.2, 0.12), (0.75, 0.46, 0.23, 0.14), (0.5, 0.5, 0.26, 0.16), (0.27, 0.53, 0.28, 0.18)], DEEP)

# The sword, in the hand at +x (the viewer's right): the blade down and out, its point near the ground.
hand, d = (0.35, -0.07, 0.785), (0.2, -0.16, -0.96)
n = math.sqrt(sum(v * v for v in d))
at = lambda k: tuple(h + v / n * k for h, v in zip(hand, d))
along(cone('blade', 0.0, 0.034, 0.78, at(0.46), BLADE, sides=4, squash=(1, 0.45, 1), smooth=False), tuple(-v for v in d))
along(box('guard', (0.24, 0.035, 0.032), at(0.055), GOLD), d)
along(cone('grip', 0.019, 0.019, 0.2, at(-0.06), LEATHER, sides=8), d)
ball('pommel', 0.032, at(-0.175), GOLD)

# The shield, on the arm at -x: a heater, crimson with a gold chevron, a steel rim, turned a little outward.
turn = (math.radians(4), 0, math.radians(-16))
taper(box('shieldrim', (0.37, 0.03, 0.5), (-0.4, -0.15, 1.0), DARK, rot=turn), -0.1, 0.42)
taper(box('shield', (0.32, 0.035, 0.45), (-0.4, -0.166, 1.005), RED, rot=turn), -0.1, 0.42)
box('device', (0.11, 0.03, 0.11), (-0.405, -0.19, 1.06), GOLD, rot=(turn[0], math.radians(45), turn[2]))
box('boss', (0.05, 0.035, 0.05), (-0.405, -0.196, 1.06), RED, rot=(turn[0], math.radians(45), turn[2]))

stage(yaw=yaw)
render(out)
