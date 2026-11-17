"""The knight's moves as poses (degrees a joint, and metres a joint is moved, rig.py): standing with the greatsword
upright before him, walking, a two-handed blow. Pure maths. The game drives them from its own clocks: `walk(p)` by
ground covered (p from 0 to 1 is two steps), `strike(t)` by the blow's own time (the wind-up ends at WINDUP)."""
import math

# Standing: the feet apart and turned out, both arms brought in to the grip before the chest.
STANCE = {'thighL': (0, 9, 0), 'thighR': (0, -9, 0), 'footL': (0, -9, -24), 'footR': (0, 9, 24)}
ARMS = {'uarmL': (-34, 0, 0), 'farmL': (-10, -82, 0), 'uarmR': (-34, 0, 0), 'farmR': (-10, 82, 0)}
GUARD = {**STANCE, **ARMS, 'cape1': (2, 0, 0), 'cape2': (1, 0, 0), 'cape3': (1, 0, 0)}
WINDUP = 0.34
# Walking: metres the figure covers in one whole cycle (two steps), so the feet don't slide.
STRIDE = 1.6


def mix(a, b, k):
    return {n: tuple(x + (y - x) * k for x, y in zip(a.get(n, (0, 0, 0)), b.get(n, (0, 0, 0)))) for n in set(a) | set(b)}


def ease(k):
    k = max(0.0, min(1.0, k))
    return k * k * (3 - 2 * k)


def idle(p):
    """Standing: the cloak stirs, the helm turns a little."""
    s = math.sin(2 * math.pi * p)
    return {**GUARD, 'cape2': (1 + 1.2 * s, 0, 0), 'cape3': (1 + 2 * math.sin(2 * math.pi * p - 0.9), 0, 0), 'head': (0, 0, 4 * s)}


def walk(p):
    """A leg swings forward as its knee bends; the sword is carried upright, leaning a little with each step; the
    cloak streams."""
    f = 2 * math.pi * p
    out = dict(GUARD)
    for side, a, splay in (('R', f, -6), ('L', f + math.pi, 6)):
        out['thigh' + side] = (-25 * math.sin(a) + 2, splay, 0)
        out['shin' + side] = (44 * max(0.0, math.cos(a)) + 4, 0, 0)
        out['foot' + side] = (-10 * max(0.0, math.cos(a)), 0, 14 if side == 'R' else -14)
    s = math.sin(f)
    out.update({
        'hips': (0, 0, -4 * s), 'spine': (5, 0, 6 * s), 'head': (-3, 0, -4 * s), 'sword': (7, 3 * s, 0), 'sword_at': (0, 0, 0.012 * math.cos(2 * f)),
        'cape1': (7 + 2 * math.sin(2 * f), 0, 0), 'cape2': (4 + 3 * math.sin(2 * f - 0.8), 0, 0), 'cape3': (4 + 4 * math.sin(2 * f - 1.7), 0, 0),
    })
    return out


# The blow: the sword carried up and back over the head, then brought over and down before him.
RAISED = {**GUARD, 'spine': (-10, 0, 0), 'head': (-6, 0, 0), 'sword': (-52, 0, 0), 'sword_at': (0, 0.2, 0.52),
          'uarmL': (-150, -10, 0), 'farmL': (-50, -30, 0), 'uarmR': (-150, 10, 0), 'farmR': (-50, 30, 0),
          'thighL': (-12, 9, 0), 'thighR': (10, -9, 0), 'shinR': (10, 0, 0), 'cape1': (0, 0, 0), 'cape2': (0, 0, 0), 'cape3': (-2, 0, 0)}
THROUGH = {**GUARD, 'spine': (26, 0, 0), 'hips': (6, 0, 0), 'head': (-14, 0, 0), 'sword': (112, 0, 0), 'sword_at': (0, -0.2, -0.16),
           'uarmL': (-62, -14, 0), 'farmL': (-24, -30, 0), 'uarmR': (-62, 14, 0), 'farmR': (-24, 30, 0),
           'thighL': (-34, 9, 0), 'shinL': (30, 0, 0), 'thighR': (16, -9, 0), 'shinR': (14, 0, 0), 'cape1': (12, 0, 0), 'cape2': (8, 0, 0), 'cape3': (8, 0, 0)}


def strike(t):
    """Raise (the tell, to WINDUP), cut over and down in a tenth of the time, hold, come back to guard."""
    if t < WINDUP:
        return mix(GUARD, RAISED, ease(t / WINDUP))
    if t < WINDUP + 0.1:
        return mix(RAISED, THROUGH, ((t - WINDUP) / 0.1) ** 0.7)
    if t < 0.62:
        return THROUGH
    return mix(THROUGH, GUARD, ease((t - 0.62) / 0.38))


# The moves the game is given: name, the pose at a moment, how many samples a loop (or a blow) is cut into.
CLIPS = [('idle', idle, 8), ('walk', walk, 16), ('strike', strike, 16)]
