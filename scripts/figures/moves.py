"""A hero's moves as poses (degrees a joint, rig.py): standing on guard, walking, a sword blow. Pure maths: the same
numbers pose any figure built on the hero skeleton. The game drives them from its own clocks: `walk(p)` by ground
covered (p from 0 to 1 is two steps), `strike(t)` by the blow's own time (the wind-up ends at WINDUP)."""
import math

GUARD = {
    'uarmL': (-8, 7, 0), 'farmL': (-40, 0, 0), 'shield': (0, 0, 0),
    'uarmR': (10, -9, 0), 'farmR': (-26, 0, 0),
    'cape1': (5, 0, 0), 'cape2': (4, 0, 0), 'cape3': (3, 0, 0),
}
WINDUP = 0.32
# Walking: metres the figure covers in one whole cycle (two steps), so the feet don't slide.
STRIDE = 1.7


def mix(a, b, k):
    return {n: tuple(x + (y - x) * k for x, y in zip(a.get(n, (0, 0, 0)), b.get(n, (0, 0, 0)))) for n in set(a) | set(b)}


def ease(k):
    k = max(0.0, min(1.0, k))
    return k * k * (3 - 2 * k)


def idle(p):
    """Standing on guard: the cape stirs, the sword hand shifts a little."""
    s = math.sin(2 * math.pi * p)
    return {**GUARD, 'cape2': (4 + 1.5 * s, 0, 0), 'cape3': (3 + 3 * math.sin(2 * math.pi * p - 0.9), 0, 0), 'farmR': (-26 + 2 * s, 0, 0), 'head': (0, 0, 3 * s)}


def walk(p):
    """A leg swings forward as its knee bends; the body turns a little against the legs; the cape streams."""
    f = 2 * math.pi * p
    out = dict(GUARD)
    for side, a in (('R', f), ('L', f + math.pi)):
        out['thigh' + side] = (-27 * math.sin(a) + 3, 0, 0)
        out['shin' + side] = (46 * max(0.0, math.cos(a)) + 4, 0, 0)
        out['foot' + side] = (-10 * max(0.0, math.cos(a)), 0, 0)
    s = math.sin(f)
    out.update({
        'hips': (0, 0, -5 * s), 'spine': (4, 0, 9 * s), 'head': (-2, 0, -5 * s),
        'uarmR': (10 + 13 * s, -9, 0), 'farmR': (-30 - 6 * s, 0, 0), 'shield': (0, 0, 2 * s),
        'cape1': (10 + 2 * math.sin(2 * f), 0, 0), 'cape2': (4 + 3 * math.sin(2 * f - 0.8), 0, 0), 'cape3': (4 + 4 * math.sin(2 * f - 1.7), 0, 0),
    })
    return out


RAISED = {**GUARD, 'spine': (-6, 0, 26), 'hips': (0, 0, 8), 'head': (0, 0, -14), 'uarmR': (-158, -22, 0), 'farmR': (-42, 0, 0), 'handR': (-10, 0, 0),
          'thighL': (-10, 0, 0), 'thighR': (10, 0, 0), 'shinR': (12, 0, 0), 'shield': (0, 0, 8),
          'cape1': (2, 0, 0), 'cape2': (2, 0, 0), 'cape3': (0, 0, 0)}
THROUGH = {**GUARD, 'spine': (14, 0, -30), 'hips': (4, 0, -10), 'head': (-6, 0, 16), 'uarmR': (-52, 30, 0), 'farmR': (-8, 0, 0), 'handR': (-26, 0, 0),
           'thighR': (-30, 0, 0), 'shinR': (22, 0, 0), 'thighL': (16, 0, 0), 'shinL': (10, 0, 0), 'shield': (0, 0, -10),
           'cape1': (12, 0, 0), 'cape2': (6, 0, 0), 'cape3': (6, 0, 0)}


def strike(t):
    """Raise (the tell, to WINDUP), cut down and across in a tenth of the time, hold, come back to guard."""
    if t < WINDUP:
        return mix(GUARD, RAISED, ease(t / WINDUP))
    if t < WINDUP + 0.1:
        return mix(RAISED, THROUGH, ((t - WINDUP) / 0.1) ** 0.7)
    if t < 0.6:
        return THROUGH
    return mix(THROUGH, GUARD, ease((t - 0.6) / 0.4))


# The moves the game is given: name, the pose at a moment, how many samples a loop (or a blow) is cut into.
CLIPS = [('idle', idle, 8), ('walk', walk, 16), ('strike', strike, 16)]
