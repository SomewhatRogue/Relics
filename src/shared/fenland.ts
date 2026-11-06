/**
 * Fenmere's ground (shared/fen.ts lays the rest on it): fixed by hand, the same every visit, so every
 * causeway, boardwalk, ford and island is where the tests walked it. Out of the fields at the foot of the
 * map, through the wood's edge and the coppice, the carr where the wood goes to bog, a causeway east over
 * deep bog with a dog-leg north, the ford where the river spreads into the fen, the reed beds with their
 * channels (boards over two), the fire on a dry hummock, a causeway on to the Peat Cuts (old diggings gone
 * to water, baulks between, boards across each cut) and out north. Everything else is water.
 *
 * Painted on a fine grid in layers (later wins), then merged into boxes: deep stops a body, shallow slows
 * it, dry is ground. Every edge is on the 0.2-tile grid, so the boxes are exactly the shapes below.
 */
import type { Block, Mark, Water } from './arena.js';
import { BOARDS, FEN } from './fentune.js';

type R = [number, number, number, number];
const DRY = 0, SHALLOW = 1, DEEP = 2, G = 0.2;

/** Deep: the bog south-east, the river, the mere west, north and east. */
const DEEPS: R[] = [[27, 37, 76, 48], [44, 48, 76, 60], [0, 32, 76, 37], [0, 0, 22, 32], [22, 0, 48, 17.6], [50, 21, 76, 32], [47, 21, 50, 27], [8.4, 43.4, 11, 45.4]];
/** Shallow: the carr's pools, the river's edge by the carr, the fords, the causeway's wet edges, the reed beds. */
const SHALLOWS: R[] = [
  [5, 39, 9, 42], [13, 40.4, 17.6, 42.8], [19, 44.6, 23, 46.6], [0, 37, 27, 37.6],
  [44.8, 32, 49.6, 37], [20, 36, 22.4, 37.6],
  [26, 41, 44.8, 41.6], [26, 44.2, 47.8, 44.8], [44.2, 37, 44.8, 41.6], [47.4, 37, 48, 42.4],
  [22, 17.6, 47, 32], [47, 27, 50, 32],
];
/** Dry ground standing out of it: the causeways, islands, hummocks, the fire's rise and the Peat Cuts. */
const DRIES: R[] = [
  [26, 41.6, 47.4, 44.2], [44.8, 37, 47.4, 44.2], [35.8, 38.4, 39, 40.2], [56, 40.6, 62.4, 45.2], [17, 33, 24.2, 36],
  [30.6, 15.6, 37.4, 20.4], [37.4, 16.2, 48, 18.6], [48, 0, 76, 21], [40, 19, 43.4, 22], [30, 28, 33.2, 30.6],
];
/** Deep again, inside the reeds and the cuts: two channels, two pools, four peat cuts. */
const CHANNELS: R[] = [[22, 24, 42, 25.6], [27, 25.6, 28.6, 32], [37, 27.6, 41, 30.4], [24, 19, 28, 22], [50.6, 4, 53.6, 14], [56.6, 4, 59.6, 14], [62.6, 4, 65.6, 14], [68.6, 4, 71.6, 14]];
/** Boards over deep water, dry to walk on: the skimmer's islet, the long one out to the island, two over the reed channels, one across each cut. */
export const BOARDWALKS: R[] = [
  [37.1, 40.2, 38.3, 41.6], [47.4, 42.4, 56, 42.4 + BOARDS.w], [33, 24, 33 + BOARDS.w, 25.6], [27, 28, 28.6, 28 + BOARDS.w],
  ...[50.6, 56.6, 62.6, 68.6].map((x): R => [x, 8.4, x + 3, 8.4 + BOARDS.w]),
];

/** The reed beds' shallows (painted reeds stand here: shared/fen.ts). */
export const REEDS: R[] = [[22, 17.6, 47, 32], [47, 27, 50, 32]];
/** Places on the ground the scenes are laid at (all on dry ground or shallows, walked by the tests). */
export const LAND = {
  causeway: [26, 41.6, 47.4, 44.2] as R, dogleg: [44.8, 37, 47.4, 44.2] as R, ford: [44.8, 32, 49.6, 37] as R, island: [17, 33, 24.2, 36] as R,
  islet: [35.8, 38.4, 39, 40.2] as R, chest: [56, 40.6, 62.4, 45.2] as R, rise: [30.6, 15.6, 37.4, 20.4] as R, cuts: [48, 0, 76, 21] as R,
  cutsDeep: CHANNELS.slice(4),
};

/** The ground as water boxes and boards (deck blocks), the same every time. */
export function fenGround(): { water: Water[]; boards: Block[]; wet: Mark[] } {
  const cols = Math.round(FEN.w / G), rows = Math.round(FEN.h / G), g = new Uint8Array(cols * rows);
  const paint = (r: R, v: number) => {
    const i0 = Math.round(r[0] / G), i1 = Math.round(r[2] / G), j0 = Math.round(r[1] / G), j1 = Math.round(r[3] / G);
    for (let j = Math.max(0, j0); j < Math.min(rows, j1); j++) g.fill(v, j * cols + Math.max(0, i0), j * cols + Math.min(cols, i1));
  };
  for (const r of DEEPS) paint(r, DEEP);
  for (const r of SHALLOWS) paint(r, SHALLOW);
  for (const r of DRIES) paint(r, DRY);
  for (const r of CHANNELS) paint(r, DEEP);
  for (const r of BOARDWALKS) paint(r, DRY);
  // Runs along each row, then each run joined to the one above it when it's the same span.
  const water: Water[] = [], open = new Map<string, Water>();
  for (let j = 0; j < rows; j++) {
    const next = new Map<string, Water>();
    for (let i = 0; i < cols;) {
      const v = g[j * cols + i];
      let e = i;
      while (e < cols && g[j * cols + e] === v) e++;
      if (v !== DRY) {
        const key = `${i}.${e}.${v}`, up = open.get(key);
        if (up) (up.h = r1(up.h + G)), next.set(key, up);
        else {
          const w: Water = { x: r1(i * G), y: r1(j * G), w: r1((e - i) * G), h: G, ...(v === DEEP ? { deep: true } : {}) };
          water.push(w), next.set(key, w);
        }
      }
      i = e;
    }
    open.clear();
    for (const [k, w] of next) open.set(k, w);
  }
  // Boards: a deck to stand on (never collided with), a hand over each bank so it reads as laid across.
  const boards: Block[] = BOARDWALKS.map(([x0, y0, x1, y1]) => {
    const along = x1 - x0 >= y1 - y0, p = 0.2;
    return { kind: 'boards', deck: true, x: along ? x0 - p : x0, y: along ? y0 : y0 - p, w: along ? x1 - x0 + p * 2 : x1 - x0, h: along ? y1 - y0 : y1 - y0 + p * 2 };
  });
  // Mud at the edges of the causeway and the fords, where it's been trodden.
  const wet: Mark[] = [[26, 41, 21, 0.8], [26, 44, 22, 0.8], [44.6, 36.6, 5.2, 1.2], [44.6, 31.4, 5.2, 1.2], [19.8, 37.4, 2.8, 1]].map(([x, y, w, h]) => ({ kind: 'mud', x, y, w, h }));
  return { water, boards, wet };
}

const r1 = (v: number) => Math.round(v * 10) / 10;

/** What lies at (x, y): 0 dry, 1 shallow, 2 deep (boards count dry). Pure, for laying things on it. */
export function groundAt(x: number, y: number): number {
  const inR = (r: R) => x >= r[0] && x < r[2] && y >= r[1] && y < r[3];
  if (BOARDWALKS.some(inR)) return DRY;
  if (CHANNELS.some(inR)) return DEEP;
  if (DRIES.some(inR)) return DRY;
  if (SHALLOWS.some(inR)) return SHALLOW;
  return DEEPS.some(inR) ? DEEP : DRY;
}
