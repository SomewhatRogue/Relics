/**
 * The Fen's ground (docs/design/the-fen.md; the land's second map, shared/fenroam.ts): fixed by hand, the same every
 * trip, so every causeway, boardwalk, ford and island is where the tests walked it. Painted as Fenmere's is
 * (shared/fenland.ts) on a fine grid in layers, later winning: deep, then the dry causeways and islands, then the
 * shallows, then the deep channels and cuts, then the boards over deep water. Then merged into boxes: deep stops a
 * body, shallow slows it, dry is ground. Every edge is on the 0.2 tile grid. Pure.
 *
 * South to north: the bog edge (dry, pools); the causeways over deep water (a dog-leg, a ford, an islet, a boardwalk
 * west to an island); the staithe's island; the reed beds (shallows, two channels with boards); the drowned chapel's
 * mere (a path, the old churchyard wall's line, the flooded nave, a graveyard awash, a dry rise); the Peat Cuts.
 */
import type { Block, Water } from './arena.js';

type R = [number, number, number, number];
export const FENROAM = { w: 60, h: 100 };
const DRY = 0, SHALLOW = 1, DEEP = 2, G = 0.2;

/** Deep: the meres either side and north, the water the causeways cross, the chapel's mere. */
const DEEPS: R[] = [[0, 0, 3, 100], [57, 0, 60, 100], [0, 0, 60, 2], [0, 52, 60, 82], [3, 16, 57, 34]];
/** Dry ground standing out of it. */
export const DRIES: R[] = [
  // The causeways: north from the bog edge, east, the dog-leg north to the staithe's island.
  [27, 74, 30.2, 82.4], [27, 73.6, 46, 76.4], [43.2, 61, 46, 76.4], [36, 52, 52, 61.4],
  // The skimmer's islet and the west island.
  [32.6, 68.6, 36.4, 71.4], [6, 75, 12.4, 81.6],
  // The chapel's mere: the path up from the reeds, the churchyard wall's line, the path north, the dry rise.
  [29, 26, 32.6, 34.4], [14, 23, 46, 26], [38, 14, 41.2, 26], [41.2, 16, 50, 22],
];
/** Shallow: the bog edge's pools and its wet line, the ford, the reed beds, the flooded nave, the graveyard awash. */
const SHALLOWS: R[] = [
  [6, 86, 12, 89.6], [40, 88, 47, 91.6], [17, 83, 23.6, 85.6], [46, 82.4, 53, 85.4], [3, 82, 26, 83.2], [31.2, 82, 57, 83.2],
  [43.2, 69, 46, 71.4], [3, 34, 57, 52.4], [12, 15, 28, 23], [42, 26, 52, 31.6],
];
/** The Peat Cuts: old diggings gone to deep water, baulks of dry ground between. */
export const CUTS: R[] = [[8, 4, 11.4, 13], [14.4, 4, 17.8, 13], [20.8, 4, 24.2, 13], [39, 4, 42.4, 13], [45.4, 4, 48.8, 13], [51.6, 4, 55, 13]];
/** Deep again, inside the shallows: the reed beds' two channels and a pool, and the cuts. */
const CHANNELS: R[] = [[3, 44, 57, 45.6], [10, 38, 57, 39.6], [8, 40, 14, 43], ...CUTS];
/** Boards over deep water: over the reed channels, west to the island, to the islet, the staithe's jetty, across each cut. */
export const BOARDWALKS: R[] = [
  [20, 44, 21.4, 45.6], [41, 44, 42.4, 45.6], [30, 38, 31.4, 39.6], [12.4, 78, 27, 79.4], [34, 71.4, 35.4, 73.6], [29, 56, 36, 57.4],
  ...CUTS.map(([x0, , x1]): R => [x0, 8, x1, 9.4]),
];
/** The reed beds' shallows, where the reeds stand. */
export const REEDBEDS: R = [3, 34, 57, 52.4];

const inR = (x: number, y: number) => (r: R) => x >= r[0] && x < r[2] && y >= r[1] && y < r[3];
/** What lies at (x, y): 0 dry, 1 shallow, 2 deep (boards count dry). */
export function fenRoamAt(x: number, y: number): number {
  const at = inR(x, y);
  if (BOARDWALKS.some(at)) return DRY;
  if (CHANNELS.some(at)) return DEEP;
  if (SHALLOWS.some(at)) return SHALLOW;
  if (DRIES.some(at)) return DRY;
  return DEEPS.some(at) ? DEEP : DRY;
}

const r1 = (v: number) => Math.round(v * 10) / 10;

/** The ground as water boxes, and the boards as decks to stand on (never collided with), a hand over each bank. */
export function fenRoamGround(): { water: Water[]; boards: Block[] } {
  const cols = Math.round(FENROAM.w / G), rows = Math.round(FENROAM.h / G), g = new Uint8Array(cols * rows);
  const paint = (r: R, v: number) => {
    const i0 = Math.round(r[0] / G), i1 = Math.round(r[2] / G), j0 = Math.round(r[1] / G), j1 = Math.round(r[3] / G);
    for (let j = Math.max(0, j0); j < Math.min(rows, j1); j++) g.fill(v, j * cols + Math.max(0, i0), j * cols + Math.min(cols, i1));
  };
  for (const r of DEEPS) paint(r, DEEP);
  for (const r of DRIES) paint(r, DRY);
  for (const r of SHALLOWS) paint(r, SHALLOW);
  for (const r of CHANNELS) paint(r, DEEP);
  for (const r of BOARDWALKS) paint(r, DRY);
  // Runs along each row, each joined to the one above when it is the same span.
  const water: Water[] = [];
  let open = new Map<string, Water>();
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
    open = next;
  }
  const boards: Block[] = BOARDWALKS.map(([x0, y0, x1, y1]) => {
    const along = x1 - x0 >= y1 - y0, p = 0.2;
    return { kind: 'boards', deck: true, x: along ? x0 - p : x0, y: along ? y0 : y0 - p, w: along ? x1 - x0 + p * 2 : x1 - x0, h: along ? y1 - y0 : y1 - y0 + p * 2 };
  });
  return { water, boards };
}
