/**
 * THE RISE's ground (shared/lowfurrowrise.ts; docs/design/territories.md, "Map 2, THE RISE"; heights by
 * docs/design/elevation.md): the hedges down both sides, the hill's four levels, the road, the fold gate's line,
 * the drain at the foot and the soil. All fixed by hand: the seed only bends the road a little between its fixed
 * points and shuffles the hedge's elms and brambles. Pure.
 *
 *   level 0: the far bank of the drain (y 93 to 104). Level 1: the foot of the hill and the hollow lane, a slope
 *   whose line wanders at about y 92. Level 2: both banks either side of the lane (their lane sides earth faces,
 *   with a slope at each south end and sheep tracks up them) and the whole top north of y 59. Level 3: the brow,
 *   north of y 15.5, up a slope the whole width.
 */
import { levelAt, type Area, type GameMap, type Ledge, type Stretch } from './arena.js';
import { block, claim, patch, type Kit, type Line, type P } from './expedkit.js';
import { gateIn, ledge, road } from './terrkit.js';

export const RISE = { w: 96, h: 104 };
/** What the places need from the ground. */
export interface RiseLand { ledges: Ledge[]; lv: (x: number, y: number) => number; road: Line; stretches: Stretch[] }

/** The road's fixed points, bottom to top, and how far the seed may bend it between each pair (little in the lane). */
export const ROAD: P[] = [
  { x: 48, y: 103 }, { x: 48, y: 95 }, { x: 40, y: 84 }, { x: 38, y: 74 }, { x: 46, y: 64 }, { x: 50, y: 57 }, { x: 50, y: 53 },
  { x: 52, y: 44 }, { x: 53, y: 32 }, { x: 51, y: 22 }, { x: 52, y: 14 }, { x: 52, y: 1 },
];
const BENDS = [0, 0.8, 0.5, 0.5, 0.4, 0, 0.8, 1, 1, 0.8, 0.4];

/** The lane's faces, by band of y: [y0, y1, west face x, east face x] (each band's banks overlap the next by a tile). */
export const LANE: [number, number, number, number][] = [[77, 86, 35.1, 45.9], [69, 78, 34.5, 45.5], [62, 70, 37.7, 50.5], [57.5, 63, 43, 52.5]];
/** Sheep tracks worn up the banks from the lane: [side, y of the track's middle]. */
export const TRACKS: ['W' | 'E', number][] = [['W', 81], ['W', 74.5], ['W', 66.5], ['E', 82.5], ['E', 75.5], ['E', 66.5]];
/** The fold gate in its line across the top. */
export const GATE: Area = { x: 48.4, y: 54.3, w: 3.2, h: 1.4 };

/** A slope along a ledge's south edge, run a tile and a half past its ends so a step between two never leaves a scrap of face. */
function southSlope(l: Ledge): Ledge {
  l.ramps.push({ x: l.x - 1.5, y: l.y + l.h - 1, w: l.w + 3, h: 2 });
  return l;
}

/** The heights (fixed). */
export function heights(): Ledge[] {
  // Level 1: the foot steps up at about y 92, its line wandering in three boxes.
  const foot = [southSlope(ledge(0, 0, 36, 92.8, 1)), southSlope(ledge(35, 0, 27, 91.6, 1)), southSlope(ledge(61, 0, 35, 92.2, 1))];
  // Level 2: the banks, band by band (the first with a slope at its south end), and the top.
  const banks: Ledge[] = [];
  LANE.forEach(([y0, y1, wx, ex], i) => {
    const w = ledge(0, y0, wx, y1 - y0, 2), e = ledge(ex, y0, RISE.w - ex, y1 - y0, 2);
    if (i === 0) southSlope(w), southSlope(e);
    banks.push(w, e);
  });
  for (const [side, y] of TRACKS) {
    const b = banks.find((l, i) => (i % 2 === 0) === (side === 'W') && y > l.y + 0.5 && y < l.y + l.h - 0.5)!;
    const fx = side === 'W' ? b.x + b.w : b.x;
    b.ramps.push({ x: fx - 1, y: y - 1.5, w: 2, h: 3 });
  }
  const top = ledge(0, 0, RISE.w, 59, 2);
  // The lane climbs onto the top by a slope across its width.
  top.ramps.push({ x: 42.5, y: 58, w: 10.5, h: 2 });
  // Level 3: the brow, up a slope the whole width.
  const brow = ledge(0, 0, RISE.w, 15.5, 3, ['S']);
  return [...foot, ...banks, top, brow];
}

/** A hedge's line down one side: [y, x] points (fixed: it wanders a tile or two). */
const WEST: [number, number][] = [[0, 4.6], [9, 5.4], [18, 4.4], [27, 5.2], [36, 6], [45, 5], [54, 4.4], [63, 5.6], [72, 6.4], [81, 5.6], [90, 4.8], [98, 5.4], [104, 4.8]];
const EAST: [number, number][] = [[0, 91.4], [9, 90.6], [18, 91.8], [27, 90.8], [36, 90], [45, 91.2], [54, 91.8], [63, 90.6], [72, 89.8], [81, 90.8], [90, 91.6], [98, 90.8], [104, 91.4]];
/** Where a fallen elm fills a gap in each hedge's inner row: [y0, y1]. */
const FALLEN = { W: [65.6, 69.6], E: [37.6, 41.4] };

/** The hedge's x at y. */
export function hedgeX(side: 'W' | 'E', y: number): number {
  const pts = side === 'W' ? WEST : EAST;
  for (let i = 1; i < pts.length; i++) if (y <= pts[i][0]) {
    const [y0, x0] = pts[i - 1], [y1, x1] = pts[i];
    return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
  }
  return pts[pts.length - 1][1];
}

/** Both sides: two touching rows of bushes nothing gets through (the inner one broken where an elm fell), elms in the line. */
function sides(k: Kit): void {
  for (const side of ['W', 'E'] as const) {
    const out = side === 'W' ? -1 : 1, [g0, g1] = FALLEN[side];
    for (const off of [0, 0.62]) for (let y = 0.3; y < RISE.h; y += 0.66) {
      if (!off && y > g0 && y < g1) continue;
      const x = hedgeX(side, y) + off * out;
      k.rounds.push({ kind: 'bush', x, y, r: 0.4 }), claim(k, x, y, 0.4);
    }
    // The fallen elm across the gap.
    const gx = hedgeX(side, (g0 + g1) / 2);
    block(k, 'log', gx - 0.45, g0 - 0.2, 0.9, g1 - g0 + 0.4);
    // Hedgerow elms in the line, and the wood behind.
    for (let y = 4 + k.rng.range(0, 3); y < RISE.h - 2; y += k.rng.range(6, 9)) {
      if (y > g0 - 2 && y < g1 + 2) continue;
      const r = k.rng.range(0.85, 1.1), x = hedgeX(side, y) + out * 0.4;
      k.rounds.push({ kind: 'tree', x, y, r }), claim(k, x, y, r);
    }
    for (let y = 1; y < RISE.h - 0.5; y += 2.2) {
      const r = k.rng.range(0.6, 0.9), h = hedgeX(side, y), x = side === 'W' ? k.rng.range(0.4, h - 1.5) : k.rng.range(h + 1.5, RISE.w - 0.4);
      k.rounds.push({ kind: k.rng.pick(['tree', 'tree', 'bush', 'pine']), x, y: y + k.rng.range(-0.5, 0.5), r });
    }
  }
}

/** The fold gate's line across the top: drystone wall from each hedge, hurdles either side of the gate. Fixed and solid. */
function gateLine(k: Kit): void {
  const y = GATE.y + 0.4;
  const run = (kind: 'rockwall' | 'hurdle', x0: number, x1: number, step: number, h: number) => {
    for (let x = x0; x < x1 - 0.01; x += step) block(k, kind, x, y + (0.45 - h) / 2, Math.min(step, x1 - x), h);
  };
  run('rockwall', 2.6, 30, 3, 0.62), run('hurdle', 30, GATE.x, 2.2, 0.45);
  run('hurdle', GATE.x + GATE.w, 64, 2.2, 0.45), run('rockwall', 64, 93.4, 3, 0.62);
}

/** The soil under everything (fixed shapes; the places add their own over it). */
function ground(k: Kit): void {
  patch(k, 'grass', -1, -1, RISE.w + 2, RISE.h + 2, false);
  // The drain's bank: wet earth along the water, trodden where the planks were laid back.
  patch(k, 'mud', 0, 100.6, RISE.w, 2.6, false), patch(k, 'earth', 44, 98, 8, 5);
  // The hollow lane's floor, band by band, wetter at the foot of its banks.
  for (const [y0, y1, wx, ex] of LANE) patch(k, 'earth', wx, y0 + 0.5, ex - wx, y1 - y0, false);
  patch(k, 'mud', 36, 80, 6, 5), patch(k, 'mud', 41, 64, 6, 4), patch(k, 'wet', 37.2, 74.6, 2.6, 1.6);
}

export function layLand(k: Kit): RiseLand {
  const ledges = heights(), lv = (x: number, y: number) => levelAt({ ledges } as unknown as GameMap, x, y);
  const line = road(k, ROAD, BENDS);
  // Kept clear: the way in and out, the gate's gathering ground and checkpoint, the lane's head, each sheep track's foot and top.
  for (const [x, y, r] of [[48, 100.5, 2.6], [52, 1.8, 2.2], [50, 57, 2.6], [50, 52.2, 2], [47.6, 59, 2.2]]) claim(k, x, y, r);
  for (const [side, y] of TRACKS) {
    const band = LANE.find(([y0, y1]) => y > y0 + 0.5 && y < y1 - 0.5)!, fx = side === 'W' ? band[2] : band[3], o = side === 'W' ? -1 : 1;
    claim(k, fx - o * 1.2, y, 1.4), claim(k, fx + o * 1.6, y, 1.6);
  }
  sides(k), ground(k), gateLine(k);
  // The drain the party has just crossed, deep but for the planks they laid back.
  k.water.push({ x: 0, y: 102.6, w: 46.4, h: 1.4, deep: true }, { x: 49.6, y: 102.6, w: 46.4, h: 1.4, deep: true });
  const s0 = gateIn(k, GATE, 'THE BARN ROAD', []);
  const s1: Stretch = { name: 'THE FOLD YARD', keep: [], packs: [122] };
  return { ledges, lv, road: line, stretches: [s0, s1] };
}
