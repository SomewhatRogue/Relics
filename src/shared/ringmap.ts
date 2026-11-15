/**
 * The clearing for choosing a new hero round the fire (docs/design/hero-select.md), as both views see it:
 * where the fire is, where each class stands, where the road leaves. The flat ring (client/heroring.ts,
 * ringdraw.ts) paints from these in pixels; the 2.5D ring draws `ringMap()` through the game's 3D view.
 * No room steps on it: nothing walks or fights here.
 */
import type { GameMap, Round, Soil } from './arena.js';
import { CLASS_ORDER, type HeroClass } from './weapons.js';

/** The fire (tiles), each class's spot from it (tiles; the ends lower and wider so names clear), the road from it. */
export const RING = {
  fire: { x: 17, y: 13 },
  spots: [[-4.6, 0.25], [-2.75, -1.1], [0, -1.75], [2.75, -1.1], [4.6, 0.25]] as [number, number][],
  road: { from: [-4.4, 1.6], to: [-20.6, 20.6] } as { from: [number, number]; to: [number, number] },
  /** A pace forward when picked (tiles): toward you, a little in toward the fire. */
  step: { in: 0.2, down: 0.55 },
};
export const ringSpot = (cls: HeroClass): [number, number] => RING.spots[CLASS_ORDER.indexOf(cls)];

/** A steady number in [0, 1) for a seed (the pines stand the same every time). */
const hash = (i: number, k: number) => {
  let h = Math.imul(i * 374761393 + k * 668265263, 1274126177);
  h ^= h >>> 13;
  return ((h >>> 0) % 1000) / 1000;
};

/** How far from the road's middle (tiles, relative to the fire; Infinity before it starts). */
export function roadDist(x: number, y: number): number {
  const [ax, ay] = RING.road.from, [bx, by] = RING.road.to, dx = bx - ax, dy = by - ay;
  const k = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  if (k <= 0) return Infinity;
  return Math.hypot(x - (ax + dx * k + Math.sin(k * 9) * 0.6), (y - (ay + dy * k)) * 1.2);
}

/** The pines round the clearing, relative to the fire (tiles): none on the road, none near the ring. */
export function ringPines(): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let i = 0; i < 70; i++) {
    const a = hash(i, 3) * Math.PI * 2, r = 1.25 + hash(i, 5) * 1.6, x = Math.cos(a) * 7.5 * r, y = Math.sin(a) * 4.1 * r;
    if (roadDist(x, y) < 2.1 || Math.abs(x) > 16.5 || y < -12.5 || y > 22) continue;
    out.push([x, y, 0.8 + hash(i, 9) * 0.5]);
  }
  return out;
}

/** The clearing as a map, for the 2.5D view: grass at night, bare earth round the fire, the road, the pines. */
export function ringMap(): GameMap {
  const { x: fx, y: fy } = RING.fire, [ax, ay] = RING.road.from, [bx, by] = RING.road.to;
  const pines: Round[] = ringPines().map(([x, y, s]) => ({ x: fx + x, y: fy + y, r: 0.42 * s, kind: 'pine' }));
  const soil: Soil[] = [{ mat: 'earth', x: fx - 6, y: fy - 2.6, w: 12, h: 5.2, round: true }];
  for (let k = 0; k < 6; k++) {
    const t0 = k / 6, t1 = (k + 1) / 6, at = (t: number): [number, number] => [fx + ax + (bx - ax) * t + Math.sin(t * 9) * 0.6, fy + ay + (by - ay) * t];
    const [x0, y0] = at(t0), [x1, y1] = at(t1);
    soil.push({ mat: 'earth', x: x0, y: y0, w: x1 - x0, h: y1 - y0, line: 0.8 });
  }
  return {
    name: 'THE FIRE', w: 34, h: 36, wallFace: 3, blocks: [], soil,
    rounds: [...pines, { x: fx, y: fy, r: 0.45, kind: 'cookfire' }],
    braziers: [], torches: [], hero: { x: fx, y: fy + 2 }, exit: null,
    theme: { floor: 'grass', back: 'trees', ambient: [0.1, 0.11, 0.17], moon: 0.18 },
  };
}
