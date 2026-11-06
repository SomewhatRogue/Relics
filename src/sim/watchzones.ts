/**
 * Where a goblin can be hit, in the field's pixels, and the first zone an arrow's path crosses. The
 * drawing (client/watchgobs.ts) paints each goblin from these same zones, bob and all.
 */
import { SHAPES, groundY, type Box, type Disc } from '../shared/watchtune';
import type { Gob, Part } from './watchtypes';

/** The pixel a walking goblin bobs up on alternate steps (every 4 pixels walked). */
export const bobOf = (g: Gob) => (g.state === 'walk' && Math.floor(g.walked / 4) % 2 === 1 ? -1 : 0);
/** A goblin's feet: its x, on the ground, up its lane, with the step's bob. */
export function feet(g: Gob): [number, number] {
  return [Math.round(g.x), Math.round(groundY(g.x) - g.lane) + bobOf(g)];
}

export interface Zone { part: Part; box?: Box; disc?: Disc }
/** Every zone of a goblin still standing, front first (a shield or torch before the body behind it). */
export function zones(g: Gob): Zone[] {
  if (g.state === 'dead' || g.state === 'gone') return [];
  const s = SHAPES[g.kind], [fx, fy] = feet(g), out: Zone[] = [];
  const box = (b: Box): Box => ({ x0: fx + b.x0, y0: fy + b.y0, x1: fx + b.x1, y1: fy + b.y1 });
  if (s.shield && g.shieldHp > 0) out.push({ part: 'shield', box: box(s.shield) });
  if (s.torch && g.torch) out.push({ part: 'torch', box: box(s.torch) });
  out.push({ part: 'head', disc: { x: fx + s.head.x, y: fy + s.head.y, r: s.head.r } });
  out.push({ part: 'body', box: box(s.body) }, { part: 'legs', box: box(s.legs) });
  return out;
}

/** Where along the path from (x0, y0) by (dx, dy) it first enters a box (0..1), or null. */
export function enterBox(b: Box, x0: number, y0: number, dx: number, dy: number): number | null {
  let lo = 0, hi = 1;
  for (const [p, d, a, z] of [[x0, dx, b.x0, b.x1], [y0, dy, b.y0, b.y1]]) {
    if (Math.abs(d) < 1e-9) {
      if (p < a || p > z) return null;
      continue;
    }
    let t0 = (a - p) / d, t1 = (z - p) / d;
    if (t0 > t1) [t0, t1] = [t1, t0];
    lo = Math.max(lo, t0), hi = Math.min(hi, t1);
    if (lo > hi) return null;
  }
  return lo;
}

/** Where along the path it first enters a disc (0..1), or null. */
export function enterDisc(c: Disc, x0: number, y0: number, dx: number, dy: number): number | null {
  const ox = x0 - c.x, oy = y0 - c.y, a = dx * dx + dy * dy, b = 2 * (ox * dx + oy * dy), k = ox * ox + oy * oy - c.r * c.r;
  if (k <= 0) return 0;
  const disc = b * b - 4 * a * k;
  if (a < 1e-12 || disc < 0) return null;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  return t >= 0 && t <= 1 ? t : null;
}

export interface Hit { gob: Gob; part: Part; at: number }
/** The first goblin zone the path crosses: nearest along it; a front zone wins a tie. */
export function firstHit(gobs: Gob[], x0: number, y0: number, dx: number, dy: number): Hit | null {
  let best: Hit | null = null;
  for (const g of gobs) {
    for (const z of zones(g)) {
      const at = z.box ? enterBox(z.box, x0, y0, dx, dy) : enterDisc(z.disc!, x0, y0, dx, dy);
      if (at !== null && (!best || at < best.at - 1e-9)) best = { gob: g, part: z.part, at };
    }
  }
  return best;
}

