/**
 * The Fen's ground (docs/design/the-fen.md; the land's second map, shared/fenroam.ts): fixed by hand, the same every
 * trip, so every causeway, boardwalk, ford and island is where the tests walked it. Painted as Fenmere's is
 * (shared/fenland.ts) on a fine grid in layers, later winning: deep, then the dry causeways and islands, then the
 * shallows, then the deep channels and cuts, then the boards over deep water. Then merged into boxes: deep stops a
 * body, shallow slows it, dry is ground. Every edge is on the 0.2 tile grid. Pure.
 *
 * South to north: the bog edge (dry, pools); the causeways over deep water (a dog-leg, a ford, an islet, a boardwalk
 * west to an island and a causeway winding on to a far islet, boards winding east to an island); the staithe's
 * island; the reed beds (shallows, three channels with boards, two pools); the drowned chapel's mere (a path, the old
 * churchyard wall's line, a bank to the sexton's isle, the flooded nave, a graveyard awash, a dry rise); the Peat Cuts.
 */
import type { Block, Water } from './arena.js';

type R = [number, number, number, number];
export const FENROAM = { w: 90, h: 150 };
const DRY = 0, SHALLOW = 1, DEEP = 2, G = 0.2;

/** Deep: the meres either side and north, the water the causeways cross, the chapel's mere. */
const DEEPS: R[] = [[0, 0, 4.6, 150], [85.6, 0, 90, 150], [0, 0, 90, 3], [0, 78, 90, 123], [4.6, 24, 85.6, 51]];
/** Dry ground standing out of it. */
export const DRIES: R[] = [
  // The causeways: north from the bog edge, east, the dog-leg north to the staithe's island.
  [40.6, 111, 45.4, 123.6], [40.6, 110.4, 69, 114.6], [64.8, 91.6, 69, 114.6], [54, 78, 78, 92.2],
  // The skimmer's islet and the west island; the causeway winding north off the west island to the far islet (a dead end).
  [49, 103, 54.6, 107.2], [9, 112.6, 18.6, 122.4], [12, 104, 14.4, 112.8], [12, 104, 24, 106.4], [21.6, 95, 24, 106.4], [16, 88, 28, 95],
  // The east island, at the end of the boards off the dog-leg.
  [77.4, 99, 84, 108.4],
  // The chapel's mere: the path up from the reeds, the churchyard wall's line, the path north, the dry rise.
  [43.6, 39, 49, 51.6], [21, 34.6, 69, 39], [57, 21, 61.8, 39], [61.8, 24, 75, 33],
  // Off the wall's west end, a bank west and south to the sexton's isle (a dead end).
  [11.2, 34.6, 21.2, 37], [9.6, 34.6, 12.2, 43], [5, 42, 16, 48.4],
];
/** Shallow: the bog edge's pools and its wet line, the ford, the reed beds, the flooded nave, the graveyard awash. */
const SHALLOWS: R[] = [
  [9, 129, 18, 134.4], [60, 132, 70.6, 137.4], [25.6, 124.6, 35.4, 128.4], [69, 123.6, 79.6, 128.2], [72, 138, 80, 142.4], [14, 139.4, 20.6, 143],
  [4.6, 123, 39, 124.8], [46.8, 123, 85.6, 124.8],
  [64.8, 103.6, 69, 107.2], [4.6, 51, 85.6, 78.6], [18, 22.6, 42, 34.6], [63, 39, 78, 47.4],
];
/** The Peat Cuts: old diggings gone to deep water, baulks of dry ground between. */
export const CUTS: R[] = [[12, 6, 17.2, 19.6], [21.6, 6, 26.8, 19.6], [31.2, 6, 36.4, 19.6], [58.6, 6, 63.6, 19.6], [68.2, 6, 73.2, 19.6], [77.4, 6, 82.6, 19.6]];
/** Deep again, inside the shallows: the reed beds' three channels, a pool west and one east, and the cuts. */
const CHANNELS: R[] = [[4.6, 66, 85.6, 68.4], [15, 57, 85.6, 59.4], [34, 53.2, 85.6, 54.8], [12, 60, 21, 64.6], [74, 69.6, 81, 75.6], ...CUTS];
/** Boards over deep water: over the reed channels, west to the island, to the islet, the staithe's jetty, the winding
 * boards east off the dog-leg to the east island, across each cut. */
export const BOARDWALKS: R[] = [
  [30, 66, 32.2, 68.4], [61.6, 66, 63.6, 68.4], [45, 57, 47.2, 59.4], [45, 53.2, 47.2, 54.8], [18.6, 117, 40.6, 119.2], [51, 107.2, 53.2, 110.4],
  [43.6, 84, 54, 86.2], [69, 96, 75, 98.2], [72.8, 96, 75, 104], [72.8, 101.8, 77.4, 104],
  ...CUTS.map(([x0, , x1]): R => [x0, 12, x1, 14.2]),
  // The far end: over the last of the deep to the High Wood's root stair (shared/landlinks.ts).
  [45.4, 0, 47.6, 3.2],
];
/** The reed beds' shallows, where the reeds stand. */
export const REEDBEDS: R = [4.6, 51, 85.6, 78.6];
/** The islands and isles out in the deep, for the reeds round their edges (shared/fenroamland.ts). */
export const ISLES: R[] = [[9, 112.6, 18.6, 122.4], [16, 88, 28, 95], [77.4, 99, 84, 108.4], [49, 103, 54.6, 107.2], [5, 42, 16, 48.4]];

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
