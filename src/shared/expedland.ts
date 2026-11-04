/**
 * The lie of the Barrowfields on an expedition's map (shared/expedmap.ts): a river across the middle
 * with two fords, a cart road along each bank (the south road and the north road) joined by a road over
 * each ford, the way in (the cart road up from the south, or a ford at the map's side) and the way out
 * (the drove road off the top, as far from the way in as the map allows). Pure, from the kit's stream.
 */
import { along, COLS, mark, MH, MW, NODE, path, type Kit, type Line, type P } from './expedkit.js';

export interface Land {
  /** The river's middle at x, and its half-width. */
  riverAt: (x: number) => number;
  fords: { x: number; w: number }[];
  /** Where the party comes in, by which way, and the node it's in. */
  ins: P & { how: 'road' | 'ford'; c: number; r: number };
  /** The way out's gap in the top edge, and the node it's in (top row). */
  ext: P & { c: number };
  south: Line; north: Line; links: Line[]; out: Line; in?: Line;
}
export const RIVER_HALF = 1.7;

/** Where a road running across the map is at x. */
export function yOn(l: Line, x: number): number {
  for (let i = 1; i < l.length; i++) if (x <= l[i].x) {
    const a = l[i - 1], b = l[i], t = (x - a.x) / (b.x - a.x || 1);
    return a.y + (b.y - a.y) * t;
  }
  return l[l.length - 1].y;
}

const wavy = (k: Kit, y0: number, y1: number): Line => {
  const out: Line = [];
  for (let x = 2; x <= MW - 2; x += 12) out.push({ x, y: k.rng.range(y0, y1) });
  out[out.length - 1].x = MW - 2;
  return out;
};

export function layLand(k: Kit): Land {
  const rng = k.rng, knots = Array.from({ length: COLS + 1 }, () => NODE + rng.range(8.5, 15.5));
  const riverAt = (x: number) => {
    const i = Math.min(COLS - 1, Math.max(0, Math.floor(x / NODE))), t = (x - i * NODE) / NODE, s = (1 - Math.cos(t * Math.PI)) / 2;
    return knots[i] + (knots[i + 1] - knots[i]) * s;
  };
  const how: 'road' | 'ford' = rng.next() < 0.5 ? 'road' : 'ford';
  const edge = rng.next() < 0.5 ? 0 : COLS - 1;
  // Two fords, in different quarters; with the way in by a ford, one of them at the map's side.
  const cols = rng.shuffle([0, 1, 2, 3]).slice(0, 2);
  if (how === 'ford' && !cols.includes(edge)) cols[0] = edge;
  const fords = cols.sort((a, b) => a - b).map((c) => ({ x: c * NODE + (c === 0 ? rng.range(5, 10) : c === COLS - 1 ? rng.range(14, 19) : rng.range(8, 16)), w: 2.6 }));
  const inC = how === 'road' ? 1 + rng.int(2) : edge;
  const extC = inC <= 1 ? COLS - 1 : 0;
  const ford = fords.find((f) => Math.floor(f.x / NODE) === edge)!;
  const ins = how === 'road' ? { x: inC * NODE + rng.range(8, 16), y: MH - 2.2, how, c: inC, r: 2 } : { x: ford.x, y: riverAt(ford.x) + RIVER_HALF + 2.6, how, c: inC, r: 1 };
  const ext = { x: extC * NODE + rng.range(8, 16), y: 0, c: extC };
  const south = wavy(k, 55, 62), north = wavy(k, 9, 15);
  const links = fords.map((f) => {
    const r = riverAt(f.x);
    return [{ x: f.x, y: yOn(north, f.x) }, { x: f.x, y: r - 5 }, { x: f.x, y: r + 5 }, { x: f.x, y: yOn(south, f.x) }];
  });
  const out = [{ x: ext.x, y: yOn(north, ext.x) }, { x: ext.x + rng.range(-1, 1), y: 4 }, { x: ext.x, y: 0 }];
  const inRoad = how === 'road' ? [{ x: ins.x, y: MH }, { x: ins.x + rng.range(-1.5, 1.5), y: MH - 7 }, { x: ins.x, y: yOn(south, ins.x) }] : undefined;
  k.roads.push(south, north, ...links, out, ...(inRoad ? [inRoad] : []));
  // The river: two-tile strips of deep water, wadeable across each ford; mud at its banks.
  for (let x = 0; x < MW; x += 2) {
    const yc = riverAt(x + 1), deep = !fords.some((f) => Math.abs(x + 1 - f.x) < f.w + 0.5);
    k.water.push({ x, y: yc - RIVER_HALF, w: 2, h: RIVER_HALF * 2, deep });
    if (x % 6 === 0) k.soil.push({ mat: 'mud', x: x - 1, y: yc - RIVER_HALF - 1, w: 4, h: RIVER_HALF * 2 + 2, round: true });
  }
  for (const r of k.roads) path(k, 'earth', r, 1.05);
  for (const r of k.roads) for (const p of along(r, 3.6)) if (Math.abs(p.dy) < 0.5 && k.rng.next() < 0.5) mark(k, 'ruts', p.x - 0.8, p.y - 0.6, 1.6, 1.2);
  return { riverAt, fords, ins, ext, south, north, links, out, in: inRoad };
}
