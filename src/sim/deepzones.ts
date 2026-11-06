/**
 * Upright (deep): where a goblin can be hit, in metres on the plane it stands in (across, and up from
 * the field), and the first goblin an arrow's path passes through. The drawing (client/deepgobs.ts)
 * projects these same zones at the goblin's distance, so far goblins are small targets and near ones big.
 */
import { DEEP_SHAPES, deepSpot } from '../shared/deeptune';
import type { Box, Disc } from '../shared/watchtune';
import type { Gob, Part } from './watchtypes';

/** Where a goblin is on the field: across (u) and out (d), in metres. */
export const deepAt = (g: Gob) => deepSpot(g.x, g.u0, g.u1, g.zig);

export interface DeepZone { part: Part; box?: Box; disc?: Disc }
/** Every zone of a goblin still standing, front first (a shield or torch before the body behind it). */
export function deepZones(g: Gob): DeepZone[] {
  if (g.state === 'dead' || g.state === 'gone') return [];
  const s = DEEP_SHAPES[g.kind], { u } = deepAt(g), out: DeepZone[] = [];
  const box = (b: Box): Box => ({ x0: u + b.x0, y0: b.y0, x1: u + b.x1, y1: b.y1 });
  if (s.shield && g.shieldHp > 0) out.push({ part: 'shield', box: box(s.shield) });
  if (s.torch && g.torch) out.push({ part: 'torch', box: box(s.torch) });
  out.push({ part: 'head', disc: { x: u + s.head.x, y: s.head.y, r: s.head.r } }, { part: 'body', box: box(s.body) }, { part: 'legs', box: box(s.legs) });
  return out;
}

/** The zone of `g` a point on its plane falls in (front first), or null. */
export function zoneAt(g: Gob, x: number, y: number): Part | null {
  for (const z of deepZones(g)) {
    if (z.box && x >= z.box.x0 && x <= z.box.x1 && y >= z.box.y0 && y <= z.box.y1) return z.part;
    if (z.disc && (x - z.disc.x) ** 2 + (y - z.disc.y) ** 2 <= z.disc.r * z.disc.r) return z.part;
  }
  return null;
}

export interface DeepHit { gob: Gob; part: Part; x: number; y: number; d: number }
/** The nearest goblin whose plane the arrow crosses going from (x0, y0, d0) to (x1, y1, d1), hit where it crosses. */
export function deepFirstHit(gobs: Gob[], x0: number, y0: number, d0: number, x1: number, y1: number, d1: number): DeepHit | null {
  let best: DeepHit | null = null;
  for (const g of gobs) {
    const { d } = deepAt(g);
    if (d <= d0 || d > d1 || (best && d >= best.d)) continue;
    const k = (d - d0) / (d1 - d0), x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k, part = zoneAt(g, x, y);
    if (part) best = { gob: g, part, x, y, d };
  }
  return best;
}
