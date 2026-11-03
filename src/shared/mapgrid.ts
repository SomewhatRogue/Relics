/**
 * What's near, on a big map (shared/bigmap.ts): its round things, braziers and blocks bucketed in
 * cells, so keeping a body out of them looks only at the few by it instead of the whole map. Each
 * cell lists everything within `MARGIN` tiles of it, in the map's own order, so the pushes come out
 * the same as checking the lot. Rooms of today's size don't use it (`collide` checks everything).
 */
import type { Block, Circle, GameMap, Round } from './arena.js';

/** Maps bigger than this (square tiles) are bucketed. */
export const BIG_AREA = 3000;
const CELL = 4, MARGIN = 2.5;
export interface Near { rounds: Round[]; braziers: Circle[]; blocks: Block[] }
const EMPTY: Near = { rounds: [], braziers: [], blocks: [] };
type Grid = { sig: string; cols: number; cells: Near[] };
const grids = new WeakMap<GameMap, Grid>();

function build(m: GameMap, sig: string): Grid {
  const cols = Math.ceil(m.w / CELL) + 1, rows = Math.ceil(m.h / CELL) + 1, cells: Near[] = [];
  for (let i = 0; i < cols * rows; i++) cells.push({ rounds: [], braziers: [], blocks: [] });
  const add = (x0: number, y0: number, x1: number, y1: number, put: (n: Near) => void) => {
    const a = Math.max(0, Math.floor((x0 - MARGIN) / CELL)), b = Math.min(cols - 1, Math.floor((x1 + MARGIN) / CELL));
    const c = Math.max(0, Math.floor((y0 - MARGIN) / CELL)), d = Math.min(rows - 1, Math.floor((y1 + MARGIN) / CELL));
    for (let i = a; i <= b; i++) for (let j = c; j <= d; j++) put(cells[j * cols + i]);
  };
  for (const r of m.rounds) add(r.x - r.r, r.y - r.r, r.x + r.r, r.y + r.r, (n) => n.rounds.push(r));
  for (const r of m.braziers) add(r.x - r.r, r.y - r.r, r.x + r.r, r.y + r.r, (n) => n.braziers.push(r));
  for (const q of m.blocks) add(q.x, q.y, q.x + q.w, q.y + q.h, (n) => n.blocks.push(q));
  return { sig, cols, cells };
}

/** Everything near (x, y) on a big map, or null on a room of the usual size. */
export function nearby(m: GameMap, x: number, y: number): Near | null {
  if (m.w * m.h <= BIG_AREA) return null;
  const sig = `${m.rounds.length}.${m.braziers.length}.${m.blocks.length}`;
  let g = grids.get(m);
  if (!g || g.sig !== sig) grids.set(m, (g = build(m, sig)));
  const i = Math.floor(x / CELL), j = Math.floor(y / CELL);
  return i < 0 || j < 0 || i >= g.cols ? EMPTY : g.cells[j * g.cols + i] ?? EMPTY;
}
