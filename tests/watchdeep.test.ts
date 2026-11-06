// The Night Watch held upright (sim/deepshot.ts, sim/deepzones.ts): goblins run at you up the screen.
// Perspective hit zones near and far (the drawn pixels are the judged ones), the arrow's flight time and
// leading, spread growing with range (a tap wild, a full draw tight), the wall, the seed, the best apart.
import { describe, expect, it } from 'vitest';
import { advance, newWatch, stepWatch } from '../src/sim/watch';
import { newGob } from '../src/sim/watchnight';
import { deepAt, deepFirstHit } from '../src/sim/deepzones';
import { deepFly, deepLoose } from '../src/sim/deepshot';
import type { Gob, WatchIntent, WatchState } from '../src/sim/watchtypes';
import { DEEP, DEEP_BOW, DEEP_SHAPES, EYE, deepSpot, proj, type Lens } from '../src/shared/deeptune';
import { GOBS } from '../src/shared/watchtune';
import { bestOf, settleWatch } from '../src/shared/watchpay';

const IDLE: WatchIntent = { ax: 0, ay: 0.2, held: false, looses: 0 };
/** The phone's canvas (195 x 422 at 6x, as deepview.ts sizes it on a 390-wide phone). */
const L: Lens = { cx: 97, hz: 72, par: 350, f: ((350 - 72) * (DEEP.reach + EYE.back)) / EYE.up, lw: 195, lh: 422 };
function field(kind: Gob['kind'], d: number, u = 0): { s: WatchState; g: Gob } {
  const s = newWatch(1, 'deep');
  s.nextSpawn = 1e9;
  const g = newGob(s, kind, DEEP.far - d, 0);
  (g.u0 = g.u1 = u), (g.zig = 0);
  s.gobs.push(g);
  return { s, g };
}
/** What a ray from the eye through canvas pixel (px, py) hits first (no drop: the line of the sight). */
function through(s: WatchState, px: number, py: number) {
  const ax = (px - L.cx) / L.f, ay = (py - L.hz) / L.f, D = 200;
  return deepFirstHit(s.gobs, 0, EYE.up, -EYE.back, ax * D, EYE.up - ay * D, D - EYE.back);
}
/** The head's pixels as deepgobs.ts paints them (every pixel whose middle is in the projected disc). */
function headPixels(g: Gob): { inside: [number, number][]; outside: [number, number][] } {
  const { u, d } = deepAt(g), h = DEEP_SHAPES[g.kind].head, [cx, cy, sc] = proj(L, u + h.x, h.y, d), r = h.r * sc;
  const inside: [number, number][] = [], outside: [number, number][] = [];
  for (let y = Math.floor(cy - r - 2); y <= cy + r + 2; y++)
    for (let x = Math.floor(cx - r - 2); x <= cx + r + 2; x++) ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r ? inside : outside).push([x + 0.5, y + 0.5]);
  return { inside, outside };
}

describe('the night watch upright: perspective hit zones', () => {
  it('near, the head is a big target, and every pixel drawn as head is judged head', () => {
    const { s, g } = field('plain', 3), { inside } = headPixels(g);
    expect(inside.length).toBeGreaterThan(60);
    for (const [x, y] of inside) expect(through(s, x, y)?.part).toBe('head');
  });
  it('far, the head is a pixel or two: and still what is drawn is what is judged', () => {
    const { s, g } = field('plain', 50), { inside, outside } = headPixels(g);
    expect(inside.length).toBeLessThan(6);
    for (const [x, y] of inside) expect(through(s, x, y)?.part).toBe('head');
    for (const [x, y] of outside) expect(through(s, x, y)?.part).not.toBe('head');
  });
  it('the shield faces you: hit first, the head over its rim still a target', () => {
    const { s, g } = field('shield', 6), { u, d } = deepAt(g), sh = DEEP_SHAPES.shield;
    const [bx, by] = proj(L, u, (sh.body.y0 + sh.body.y1) / 2, d), [hx, hy] = proj(L, u, sh.head.y + 0.1, d);
    expect(through(s, bx, by)?.part).toBe('shield');
    expect(through(s, hx, hy)?.part).toBe('head');
  });
});

/** Turn off the random spread for a clean shot (a test only). */
function steady<T>(f: () => T): T {
  const was = [DEEP_BOW.spreadTap, DEEP_BOW.spreadFull];
  DEEP_BOW.spreadTap = DEEP_BOW.spreadFull = 0;
  try {
    return f();
  } finally {
    [DEEP_BOW.spreadTap, DEEP_BOW.spreadFull] = was;
  }
}
/** Loose a full-draw arrow at the spot (u, y, d), and fly it till it lands; when, and what it did. */
function fire(s: WatchState, u: number, y: number, d: number): { t: number; k: string[] } {
  const D = d + EYE.back;
  Object.assign(s, { ax: u / D, ay: (EYE.up - y) / D, draw: 1 });
  deepLoose(s);
  const t0 = s.t, k: string[] = [];
  for (let i = 0; i < 600 && s.arrows.length; i++) {
    s.events = [];
    s.t += 1 / 60;
    for (const g of s.gobs) if (g.state === 'walk') g.x += GOBS[g.kind].speed * DEEP.pace / 60;
    deepFly(s, 1 / 60);
    k.push(...s.events.map((e) => e.k + ('part' in e ? ':' + e.part : '')));
  }
  return { t: s.t - t0, k };
}

describe('the night watch upright: the arrow in flight', () => {
  it('takes time to get out there: about 1 s to 40 m at a full draw (48 m from the eye)', () =>
    steady(() => {
      const { s } = field('plain', 40);
      s.gobs[0].state = 'aim';
      // (Held over for the drop: about 1.1 m by 40 m.)
      const T = (40 + EYE.back) / DEEP_BOW.vFull, r = fire(s, 0, 0.7 + 0.5 * DEEP_BOW.gravity * T * T, 40);
      expect(r.k).toContain('hit:body');
      expect(r.t).toBeGreaterThan(0.85);
      expect(r.t).toBeLessThan(1.1);
    }));
  it('a goblin crossing the field needs leading: aimed where it is, the arrow misses; where it will be, it hits', () =>
    steady(() => {
      const make = () => {
        const { s, g } = field('plain', 35);
        (g.u0 = -12), (g.u1 = 12);
        return { s, g };
      };
      const a = make(), now = deepAt(a.g), drop = (y: number, T: number) => y + 0.5 * DEEP_BOW.gravity * T * T;
      expect(fire(a.s, now.u, drop(0.7, 0.85), now.d).k).not.toContain('hit:body');
      const b = make(), v = GOBS.plain.speed * DEEP.pace;
      let T = 0.8, at = now;
      for (let i = 0; i < 5; i++) (at = deepSpot(b.g.x + v * T, -12, 12, 0)), (T = (at.d + EYE.back) / DEEP_BOW.vFull);
      expect(fire(b.s, at.u, drop(0.7, T), at.d).k.some((k) => k.startsWith('hit'))).toBe(true);
    }));
  it('spread grows with range; a tap is wild, a full draw tight', () => {
    const across = (draw: number, d: number) => {
      const s = newWatch(3, 'deep');
      const out: number[] = [];
      for (let i = 0; i < 200; i++) {
        Object.assign(s, { ax: 0, ay: 0.1, draw: draw * 0.5 });
        deepLoose(s);
        const a = s.arrows.pop()!;
        out.push(Math.abs((a.vx / a.vd!) * (d + EYE.back)));
      }
      return Math.max(...out);
    };
    expect(across(0, 30)).toBeGreaterThan(1);
    expect(across(1, 30)).toBeLessThan(0.2);
    expect(across(0, 40)).toBeGreaterThan(across(0, 10) * 2.5);
  });
});

describe('the night watch upright: the wall, the seed, the best', () => {
  it('a goblin reaching the foot of the wall drops out of sight: the watch have it', () => {
    const { s, g } = field('plain', DEEP.reach + 0.01);
    s.streak = 4;
    stepWatch(s, IDLE, 1 / 60);
    expect(g.state).toBe('gone');
    expect(s.lost).toBe(1);
    expect(s.streak).toBe(0);
    expect(s.events.some((e) => e.k === 'wall')).toBe(true);
  });
  it('goblins come in small and far, spread across, and run for the stretch of wall in front of you', () => {
    const s = newWatch(8, 'deep');
    for (let i = 0; i < 600; i++) advance(s, IDLE, 0.1);
    for (const g of s.gobs) expect(Math.abs(g.u1)).toBeLessThanOrEqual(DEEP.wallU);
    const fresh = newGob(s, 'plain');
    expect(deepAt(fresh).d).toBe(DEEP.far);
  });
  it('plays the same from the same seed', () => {
    const play = () => {
      const s = newWatch(21, 'deep');
      for (let i = 0; i < 1800; i++) advance(s, { ax: ((i % 40) - 20) / 60, ay: 0.12 + (i % 13) / 60, held: i % 20 < 12, looses: Math.floor(i / 20) }, 0.1);
      return [s.score, s.kills, s.heads, s.shots, s.hits, s.lost, s.nextId];
    };
    const a = play();
    expect(a[3]).toBeGreaterThan(50);
    expect(play()).toEqual(a);
  });
  it('keeps the upright best apart from the side-on one', () => {
    const a = settleWatch(undefined, 900, 5, 'wide'), b = settleWatch(a.record, 400, 5, 'deep');
    expect(b.best).toBe(true);
    expect(bestOf(b.record, 'wide')).toBe(900);
    expect(bestOf(b.record, 'deep')).toBe(400);
  });
});
