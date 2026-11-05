/**
 * The room's water as a picture to draw from (paint only): a grid of `n` cells a tile, each dry,
 * shallow or deep, how far in from the bank it is, and which way the water there runs. A river (a
 * stretch of water much longer one way than the other) runs along its length, east or down the room,
 * as the broken bridge's wreck is carried; pools and the Barrowfields' bog lie still. Built once a map,
 * for the flat painting (waterpaint.ts), the 3D water (three/water3d.ts) and the blood that drifts in
 * it (wetfx.ts).
 */
import type { GameMap } from '../shared/arena';

export const DRY = 0, SHALLOW = 1, DEEP = 2;
/** Which way water runs: still, east (along x), or down the room (along y). */
export const STILL = 0, EAST = 1, SOUTH = 2;

export interface WaterField { n: number; cols: number; rows: number; level: Uint8Array; far: Uint8Array; flow: Uint8Array }

const cache = new WeakMap<GameMap, WaterField | null>();

export function waterField(m: GameMap): WaterField | null {
  if (cache.has(m)) return cache.get(m)!;
  const f = build(m);
  cache.set(m, f);
  return f;
}

function build(m: GameMap): WaterField | null {
  const all = m.water ?? [];
  if (!all.length) return null;
  // Sixteen to a tile (the painting's own pixels) in a room; eight on a big map.
  const n = m.w * m.h > 3000 ? 8 : 16, cols = Math.ceil(m.w * n), rows = Math.ceil(m.h * n), N = cols * rows;
  const level = new Uint8Array(N), far = new Uint8Array(N), flow = new Uint8Array(N);
  for (const w of all) {
    const v = w.deep ? DEEP : SHALLOW;
    for (let j = Math.max(0, Math.floor(w.y * n)); j < Math.min(rows, Math.ceil((w.y + w.h) * n)); j++)
      for (let i = Math.max(0, Math.floor(w.x * n)); i < Math.min(cols, Math.ceil((w.x + w.w) * n)); i++) {
        const x = (i + 0.5) / n, y = (j + 0.5) / n;
        // Shallow wins where the two overlap (the room wades it: shared/arena.ts wadeAt).
        if (x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h && (!level[j * cols + i] || v === SHALLOW)) level[j * cols + i] = v;
      }
  }
  // How far in from the nearest dry ground (cells, a two-pass chamfer), capped at 255.
  const d = new Float32Array(N);
  for (let k = 0; k < N; k++) d[k] = level[k] ? 1e6 : 0;
  const pass = (k: number, o: number, c: number) => { if (o >= 0 && o < N && d[o] + c < d[k]) d[k] = d[o] + c; };
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const k = j * cols + i;
    if (!d[k]) continue;
    if (i > 0) pass(k, k - 1, 1);
    if (j > 0) pass(k, k - cols, 1), i > 0 && pass(k, k - cols - 1, 1.41), i < cols - 1 && pass(k, k - cols + 1, 1.41);
  }
  for (let j = rows - 1; j >= 0; j--) for (let i = cols - 1; i >= 0; i--) {
    const k = j * cols + i;
    if (!d[k]) continue;
    if (i < cols - 1) pass(k, k + 1, 1);
    if (j < rows - 1) pass(k, k + cols, 1), i < cols - 1 && pass(k, k + cols + 1, 1.41), i > 0 && pass(k, k + cols - 1, 1.41);
  }
  // The map's edges aren't banks: a river from wall to wall runs on under them.
  for (let k = 0; k < N; k++) far[k] = Math.min(255, Math.round(d[k]));
  runs(level, flow, cols, rows, n);
  return { n, cols, rows, level, far, flow };
}

/** Each joined body of water: a river if it's long and thin (runs along its length), else still. */
function runs(level: Uint8Array, flow: Uint8Array, cols: number, rows: number, n: number): void {
  const seen = new Uint8Array(level.length), stack: number[] = [], body: number[] = [];
  for (let s = 0; s < level.length; s++) {
    if (!level[s] || seen[s]) continue;
    let x0 = cols, x1 = 0, y0 = rows, y1 = 0;
    body.length = 0;
    stack.push(s), (seen[s] = 1);
    while (stack.length) {
      const k = stack.pop()!, i = k % cols, j = (k - i) / cols;
      body.push(k), (x0 = Math.min(x0, i)), (x1 = Math.max(x1, i)), (y0 = Math.min(y0, j)), (y1 = Math.max(y1, j));
      for (const q of [i > 0 ? k - 1 : -1, i < cols - 1 ? k + 1 : -1, j > 0 ? k - cols : -1, j < rows - 1 ? k + cols : -1]) if (q >= 0 && level[q] && !seen[q]) (seen[q] = 1), stack.push(q);
    }
    const bw = (x1 - x0 + 1) / n, bh = (y1 - y0 + 1) / n, way = bw > 8 && bw > bh * 2.5 ? EAST : bh > 8 && bh > bw * 2.5 ? SOUTH : STILL;
    for (const k of body) flow[k] = way;
  }
}

/** What's at (x, y) in tiles: DRY, SHALLOW or DEEP. */
export function levelAt(f: WaterField | null, x: number, y: number): number {
  if (!f) return DRY;
  const i = Math.floor(x * f.n), j = Math.floor(y * f.n);
  return i < 0 || j < 0 || i >= f.cols || j >= f.rows ? DRY : f.level[j * f.cols + i];
}

/** Which way the water at (x, y) carries things, in tiles a second (a river's current, a pool's stir). */
export function currentAt(f: WaterField | null, x: number, y: number): [number, number] {
  if (!f) return [0, 0];
  const i = Math.floor(x * f.n), j = Math.floor(y * f.n);
  if (i < 0 || j < 0 || i >= f.cols || j >= f.rows) return [0, 0];
  const w = f.flow[j * f.cols + i];
  return w === EAST ? [0.42, 0] : w === SOUTH ? [0, 0.42] : [0.04, 0.02];
}
