/**
 * THE OSIER BEDS' ground (shared/sallowbeds.ts; docs/design/territories.md, "3. Sallow Carr"): where it is dry, where
 * it is wading, where it is black water, all fixed by hand and the same on every seed. The drove's raised track in,
 * the beds between their ditches, the cut and its first sluice, the drained bottom beyond, the old causeway half
 * under (broken twice: a log and boards across the gaps), the holm, the second sluice, the last cut.
 *
 * Painted on a half-tile grid in layers (later wins), then merged into boxes, as Fenmere's ground is (shared/
 * fenland.ts): every pool and shore an oval in bands half a tile deep, never one box. Flat: its height is water.
 */
import type { Area, Water } from './arena.js';

export const CARR = { w: 96, h: 112 };
const DRY = 0, SHALLOW = 1, DEEP = 2, G = 0.5;
type Shape = (x: number, y: number) => boolean;
const rect = (x0: number, y0: number, x1: number, y1: number): Shape => (x, y) => x >= x0 && x < x1 && y >= y0 && y < y1;
const oval = (cx: number, cy: number, rx: number, ry: number): Shape => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1;
const along = (pts: [number, number][], half: number): Shape => (x, y) => {
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], dx = bx - ax, dy = by - ay, q = dx * dx + dy * dy;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / q));
    if (Math.hypot(ax + dx * t - x, ay + dy * t - y) < half) return true;
  }
  return false;
};

/** The two sluices (gate blocks) across the cut, each a little wider than the gap it closes. */
export const SLUICE1: Area = { x: 46.3, y: 63.6, w: 3.4, h: 1.6 };
export const SLUICE2: Area = { x: 46.3, y: 6.8, w: 3.4, h: 1.6 };
/** The causeway's line, from the drained bottom's head up to the holm's south shore, and its two breaks. */
export const CAUSEWAY: [number, number][] = [[47.2, 51], [47.2, 45.4], [44, 43.2], [40.4, 41], [40.2, 33.8]];
/** The two breaks in the causeway and the boards the hungry laid over each (a deck you walk; dry under it). */
export const LOG: Area = { x: 46, y: 46.2, w: 2.5, h: 2.8 };
export const BOARDS: Area = { x: 38.8, y: 37.2, w: 2.8, h: 2.6 };
/** The board crossings over the beds' two ditches, on the drove's line. */
export const DITCHES = [{ y0: 88.5, y1: 90 }, { y0: 78.5, y1: 80 }];
export const CROSS = { x0: 46.5, x1: 49.5 };

const LAYERS: [number, Shape[]][] = [
  // The beds' wet edges, the holm's shore, the causeway half under, the wade to the pocket.
  [SHALLOW, [oval(25, 84, 15, 15.5), oval(71, 83.5, 15, 15.5), oval(48, 23, 25, 12.6), along(CAUSEWAY, 1.7), rect(35, 55, 42.5, 57.5)]],
  // Dry: the drove's track, the beds and their bank, the drained bottom, the holm and its spit, the last cut, the
  // pocket's hummock, the causeway's crown at its bend; alder hummocks off the way (nobody's: trees stand on them).
  [DRY, [
    rect(45, 96, 51, 112), oval(48, 98.4, 6, 2.6), rect(18, 67, 78, 96.5), oval(24, 84, 12, 13.5), oval(72, 83, 12, 13.5), rect(16, 66.5, 80, 70.5),
    rect(42.5, 50, 53.5, 62.5), oval(48, 56, 8, 6.2), oval(46, 51.4, 3.2, 1.6), oval(50.6, 60.6, 4.6, 2.4),
    oval(48, 23, 22, 10), oval(37, 27.4, 10, 6.4), oval(60, 18, 11, 6.4), rect(45, 9, 51, 14), rect(45.5, 0, 50.5, 6.5), oval(48, 2.4, 4, 3),
    oval(32.6, 56, 3.2, 2.4), oval(44, 43.2, 1.6, 1.1),
    oval(10, 104, 3, 2), oval(84, 100, 3.4, 2.2), oval(20, 46, 3, 2.2), oval(76, 52, 2.6, 2), oval(12, 22, 3, 2.4), oval(86, 30, 2.4, 2), oval(70, 4, 3, 2),
  ]],
  // The beds' ditches, deep and black, right across: you cross where the drove's boards do. (Wading depth they
  // drew a clean bright turquoise, and were nothing to fight.)
  [DEEP, DITCHES.map((d) => rect(12, d.y0, 84, d.y1))],
  // The cut, deep, right across below the first sluice; deep again either side of the second; the causeway's breaks.
  [DEEP, [rect(0, 62.5, 96, 66.5), rect(0, 6.5, 96, 9), rect(43, 46.5, 52, 48.6), rect(36, 37.5, 45, 39.5)]],
  // Dry under the sluices (the gate block closes each gap) and under the boards.
  [DRY, [rect(46.5, 62.5, 49.5, 66.5), rect(46.5, 6.5, 49.5, 9), rect(39, 37.5, 41.5, 39.5), rect(LOG.x, 46.5, LOG.x + 2.5, 48.6), ...DITCHES.map((d) => rect(CROSS.x0, d.y0, CROSS.x1, d.y1))]],
];

const COLS = CARR.w / G, ROWS = CARR.h / G;
const GRID = (() => {
  const g = new Uint8Array(COLS * ROWS).fill(DEEP);
  for (const [v, shapes] of LAYERS) for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    const x = (i + 0.5) * G, y = (j + 0.5) * G;
    if (shapes.some((s) => s(x, y))) g[j * COLS + i] = v;
  }
  return g;
})();

/** What lies at (x, y): 0 dry, 1 wading, 2 deep. Off the map is deep. */
export function groundAt(x: number, y: number): number {
  const i = Math.floor(x / G), j = Math.floor(y / G);
  if (i < 0 || j < 0 || i >= COLS || j >= ROWS) return DEEP;
  return GRID[j * COLS + i];
}

/** The ground as water boxes: runs along each row, each joined to the one above when it's the same span. */
export function carrWater(): Water[] {
  const water: Water[] = [];
  let open = new Map<string, Water>();
  for (let j = 0; j < ROWS; j++) {
    const next = new Map<string, Water>();
    for (let i = 0; i < COLS;) {
      const v = GRID[j * COLS + i];
      let e = i;
      while (e < COLS && GRID[j * COLS + e] === v) e++;
      if (v !== DRY) {
        const key = `${i}.${e}.${v}`, up = open.get(key);
        if (up) (up.h += G), next.set(key, up);
        else {
          const w: Water = { x: i * G, y: j * G, w: (e - i) * G, h: G, ...(v === DEEP ? { deep: true } : {}) };
          water.push(w), next.set(key, w);
        }
      }
      i = e;
    }
    open = next;
  }
  return water;
}
