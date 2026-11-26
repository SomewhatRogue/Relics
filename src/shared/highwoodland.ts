/**
 * The High Wood's things on its ground (docs/design/the-high-wood.md; shared/highwoodground.ts lays the banks and the
 * water): the road and its side paths, the Woodward's lodge, the struck oaks, the Coin Oak, the trees and the closed
 * edges. Fixed spots for what has a reason to be somewhere; the seed scatters the trees, stumps and rocks. Pure.
 */
import { claim, mark, patch, path, round, unclaimed, type Kit, type Line, type P } from './expedkit.js';
import type { Block, RoundKind } from './arena.js';
import { HIGHWOOD, RIDGE, highWoodAt, highUp, onEdge } from './highwoodground.js';

/** The shelter: the Woodward's lodge in its palisade at the head of the east lane (its centre, and its safe ground). */
export const LODGE = { x: 62, y: 103, r: 4.5 };
/** Woodward Hild at the lodge's fire, her talk `station:lodge`. */
export const HILD = { x: 58.6, y: 104.2 };
/** The landmark: the Coin Oak on its rise (a `tree` round the wood's set draws as the great oak: client/sets.ts). */
export const COIN_OAK = { x: 49, y: 14, r: 1.6 };
/** Where you come in from the fen. */
export const WAY_IN: P = { x: 48, y: 156 };

/** The road: up the root stair, the middle lane, across by the cut to the east lane, the lodge, over the ridge, through
 * the old trees by the fallen trunk, up the rise to the Coin Oak. */
export const MAIN: Line = [
  WAY_IN, { x: 46, y: 148 }, { x: 45, y: 139 }, { x: 45, y: 124 }, { x: 63, y: 124 }, { x: 63, y: 110 }, { x: LODGE.x, y: LODGE.y },
  { x: 62, y: 97 }, { x: 52, y: 95 }, { x: 48, y: 90 }, { x: 46, y: 84 }, { x: 38, y: 79 }, { x: 36, y: 74 }, { x: 30, y: 69 },
  { x: 28, y: 63 }, { x: 37.5, y: 57 }, { x: 37.5, y: 46 }, { x: 48, y: 41 }, { x: 49, y: 33 }, { x: 49, y: 24 }, { x: 49, y: 18.2 },
];
/** Off the road: the west lane looping back by its cut, the east lanes, along the ridge, west to the hollow's pool,
 * east into the bracken, round the low ground east of the rise. */
export const SIDES: Line[] = [
  [{ x: 46, y: 148 }, { x: 23, y: 143 }, { x: 23, y: 128 }, { x: 45, y: 128 }],
  [{ x: 63, y: 124 }, { x: 63, y: 141 }, { x: 76, y: 147 }, { x: 86, y: 140 }, { x: 86, y: 112 }],
  [{ x: 46, y: 84 }, { x: 66, y: 82 }],
  [{ x: 28, y: 63 }, { x: 12, y: 60 }, { x: 11, y: 46 }],
  [{ x: 48, y: 41 }, { x: 76, y: 44 }, { x: 82, y: 38 }],
  [{ x: 49, y: 30 }, { x: 72, y: 30 }, { x: 80, y: 20 }],
];
const LINES = [MAIN, ...SIDES];
function near(l: Line, x: number, y: number): number {
  let best = Infinity;
  for (let i = 1; i < l.length; i++) {
    const a = l[i - 1], b = l[i], dx = b.x - a.x, dy = b.y - a.y, q = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / q));
    best = Math.min(best, Math.hypot(a.x + dx * t - x, a.y + dy * t - y));
  }
  return best;
}
const off = (x: number, y: number, d: number) => LINES.every((l) => near(l, x, y) >= d);
/** Room at (x, y) for a thing of radius r: dry, off the ways, clear of what is laid, not on a bank's face or a slope. */
function room(k: Kit, x: number, y: number, r: number, way = 1.6): boolean {
  if (x < r + 3 || x > HIGHWOOD.w - r - 3 || y < r + 3 || y > HIGHWOOD.h - r - 2.4 || !unclaimed(k, x, y, r) || !off(x, y, r + way)) return false;
  if (onEdge(x, y, r + 0.8)) return false;
  return [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => highWoodAt(x + dx, y + dy) === 0);
}

/** The road trodden, the soils, the way in claimed clear. */
export function layRoads(k: Kit): void {
  patch(k, 'mud', 4, 141, 88, 16, false), patch(k, 'earth', 56, 98, 12, 11, false), patch(k, 'mud', 0, 54, 96, 4, false);
  for (const l of LINES) path(k, 'earth', l, 0.7);
  k.roads.push(...LINES);
  claim(k, WAY_IN.x, WAY_IN.y, 6), claim(k, LODGE.x, LODGE.y, 6.4), claim(k, COIN_OAK.x, COIN_OAK.y, 3.2);
  for (const [x, y, w, h] of [[43.6, 138.6, 3, 1], [61.4, 109.6, 3.2, 0.8], [36.2, 48.6, 2.6, 0.8], [47.4, 24.4, 3.2, 1]]) mark(k, 'mud', x, y, w, h);
}

/** The Woodward's lodge: a split-oak palisade with a gap north and south for the road, the lodge, a woodpile, the fire. */
export function layLodge(k: Kit): void {
  const L = LODGE, B = (kind: Block['kind'], x: number, y: number, w: number, h: number) => k.blocks.push({ kind, x, y, w, h });
  const x0 = L.x - 6, x1 = L.x + 6, y0 = L.y - 5, y1 = L.y + 5.6;
  for (let x = x0; x < x1 - 0.1; x += 1.2) if (x + 1.2 < L.x - 1.6 || x > L.x + 1.6) B('stakes', x, y0, 1.2, 0.3), B('stakes', x, y1, 1.2, 0.3);
  for (let y = y0 + 0.3; y < y1 - 0.1; y += 1.2) B('stakes', x0, y, 0.3, Math.min(1.2, y1 - y)), B('stakes', x1 - 0.3, y, 0.3, Math.min(1.2, y1 - y));
  B('shack', x0 + 0.8, y0 + 0.9, 3.6, 2.4), B('log', L.x + 2.4, L.y + 3.2, 2.6, 0.6);
  k.braziers.push({ x: L.x - 1.4, y: L.y + 2, r: 0.35, wild: true });
  for (const [x, y] of [[x1 - 1.4, y0 + 1.4], [x1 - 1.4, y0 + 2.4]]) round(k, 'stump', x, y, 0.36);
  claim(k, L.x, L.y, 6.6);
}

/** The struck oaks on the ridge: split pines standing burnt, fallen trunks across the clearing, scorched ground. */
export function layStruck(k: Kit): void {
  for (const [x, y, w, h] of [[30, 85.4, 3, 0.6], [54.6, 86.6, 3.4, 0.7], [58, 79.6, 2.8, 0.6], [40.4, 88.6, 3, 0.6], [27.6, 79, 2.6, 0.6]]) k.blocks.push({ kind: 'log', x, y, w, h }), claim(k, x + w / 2, y + h / 2, w / 2 + 0.3);
  for (const [x, y] of [[33.4, 81.4], [52, 80.6], [64.2, 85.4], [43, 85.6], [68, 79]]) k.blocks.push({ kind: 'struckpine', x, y, w: 1.2, h: 1 }), claim(k, x + 0.6, y + 0.5, 1.2);
  for (const [x, y, w, h] of [[34.4, 82.6, 3, 1], [50.6, 81.8, 3.2, 0.9], [62.6, 86.6, 2.8, 1]]) mark(k, 'debris', x, y, w, h);
}

/** Trees by the part they stand in: thinning alder and birch going to oak on the stair, roots over the banks, burnt
 * stumps round the ridge, the old trees standing close, low pines and rock round the rise (no oak north of the Coin
 * Oak's middle, so the set takes it as the landmark). */
export function layTrees(k: Kit): void {
  const boxes: [number, number, number, number, number, RoundKind[]][] = [
    [3, 140, 93, 157, 56, ['tree', 'deadtree', 'stump', 'bush', 'tree', 'rock']],
    [3, 110, 93, 140, 64, ['tree', 'tree', 'bush', 'stump']],
    [3, 92, 93, 110, 30, ['tree', 'tree', 'pine', 'bush']],
    [3, 70, 93, 92, 40, ['deadtree', 'deadtree', 'stump', 'tree', 'rock']],
    [3, 36, 93, 70, 120, ['tree', 'tree', 'tree', 'pine', 'bush']],
    [3, 18, 93, 36, 34, ['tree', 'tree', 'pine', 'rock']],
    [3, 3, 93, 18, 26, ['pine', 'rock', 'bush', 'stump']],
  ];
  k.rounds.push({ kind: 'tree', ...COIN_OAK });
  for (const [x0, y0, x1, y1, n, kinds] of boxes) for (let i = 0, t = 0; i < n && t < n * 14; t++) {
    const r = k.rng.range(0.45, 0.8), x = k.rng.range(x0, x1), y = k.rng.range(y0, y1);
    if (!room(k, x, y, r, y < 70 && y > 36 ? 1.3 : 1.6)) continue;
    // (On the ridge the dead stand; off it the living.)
    const kind = y >= 70 && y < 92 && !highUp(x, y) ? 'tree' : k.rng.pick(kinds);
    round(k, kind, x, y, kind === 'rock' || kind === 'stump' ? Math.min(r, 0.5) : r), i++;
  }
  // The ridge's struck crown: dead trees thick along its north brow.
  for (let x = RIDGE[0] + 2; x < RIDGE[2] - 2; x += k.rng.range(2.2, 3.4)) {
    const y = RIDGE[1] + k.rng.range(2.4, 4);
    if (room(k, x, y, 0.5)) round(k, 'deadtree', x, y, 0.5);
  }
}

/** The closed edges: thick wood down both sides and across the south either side of the way in, rock and pines along the
 * far north, where nothing lies beyond yet. */
export function layEdges(k: Kit): void {
  const { w, h } = HIGHWOOD, put = (kind: RoundKind, x: number, y: number) => unclaimed(k, x, y, 0.5) && highWoodAt(x, y) === 0 && round(k, kind, x, y, 0.7);
  for (let y = 4; y < h - 2; y += k.rng.range(1.4, 2.2)) put('pine', 1.2 + k.rng.range(0, 0.8), y), put('pine', w - 1.2 - k.rng.range(0, 0.8), y);
  for (let x = 2; x < w - 2; x += k.rng.range(1.4, 2.2)) put(k.rng.next() < 0.6 ? 'rock' : 'pine', x, 1.2 + k.rng.range(0, 0.6));
  for (let x = 3; x < w - 3; x += k.rng.range(1.4, 2.2)) if (Math.abs(x - WAY_IN.x) > 5) put(k.rng.next() < 0.5 ? 'rock' : 'tree', x, h - 1.2);
}
