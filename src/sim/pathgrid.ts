/**
 * The ground as a goblin of a given size sees it, for sim/pathing.ts: a grid of the room (sim tuning
 * PATH) where a cell is open only if a body that size, set down at the cell's middle, would stay put (what
 * collide() stops when it walks), and costs a little more to cross in shallow water.
 *
 * It used to be one grid for every goblin, each solid thing padded a fixed 0.22: right for a small one,
 * but a butcher (0.62 across the middle) was sent through gaps it can't get through, and the banks are
 * full of them: reeds along every ford's lip and the river's edge, a reed a hand from deep water, the
 * Barrowfields' river stepping bank to bank. It walked into the gap and stood there for good (Kyle: "some
 * shallow water seems to really hurt pathing"). Now there is a grid for each size of body, built the
 * first time one of that size needs it and again when the room changes (a house knocked down).
 */
import { inArea, type GameMap } from '../shared/arena';
import { PATH } from '../shared/tuning';

export interface Grid { cols: number; rows: number; cost: Uint8Array; sig: string; fields: Map<number, Float32Array>; part?: Int32Array; nearest: Map<string, number> }
export const C = PATH.cell;
const grids = new WeakMap<GameMap, Map<number, Grid>>();

/** A grid is kept for each size of body in the room (a goblin's radius, to a hundredth: a handful of sizes). */
export const sizeOf = (r: number) => Math.ceil(r * 100 - 1e-6) / 100;

/**
 * What a cell costs to cross: 0 blocked, 1 dry, 2 wading. Blocked where collide() would push a body of
 * that size set down at the cell's middle: within its radius of a block, deep water or a ledge's face (but
 * for the ramps), of a round thing, a brazier or someone standing, or of the map's edge. Laid shape by
 * shape rather than asked cell by cell, so a grid costs a few milliseconds even on the Barrowfields.
 */
function build(m: GameMap, size: number, sig: string): Grid {
  const cols = Math.ceil(m.w / C), rows = Math.ceil(m.h / C), cost = new Uint8Array(cols * rows).fill(1), r = size * PATH.fit;
  const span = (lo: number, hi: number, n: number): [number, number] => [Math.max(0, Math.floor(lo / C)), Math.min(n - 1, Math.floor(hi / C))];
  const box = (b: { x: number; y: number; w: number; h: number }) => {
    const [i0, i1] = span(b.x - r, b.x + b.w + r, cols), [j0, j1] = span(b.y - r, b.y + b.h + r, rows);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = (i + 0.5) * C, y = (j + 0.5) * C, dx = x - Math.max(b.x, Math.min(b.x + b.w, x)), dy = y - Math.max(b.y, Math.min(b.y + b.h, y));
      if (dx * dx + dy * dy < r * r) cost[j * cols + i] = 0;
    }
  };
  const disc = (cx: number, cy: number, cr: number) => {
    const R = cr + r, [i0, i1] = span(cx - R, cx + R, cols), [j0, j1] = span(cy - R, cy + R, rows);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (Math.hypot((i + 0.5) * C - cx, (j + 0.5) * C - cy) < R) cost[j * cols + i] = 0;
  };
  for (const w of m.water ?? []) if (w.deep) box(w);
  for (const b of m.blocks) if (!b.ruined) box(b);
  for (const c of m.rounds) disc(c.x, c.y, c.r);
  for (const b of m.braziers) disc(b.x, b.y, b.r);
  for (const n of m.npcs ?? []) if (!n.path && !n.pose) disc(n.x, n.y, 0.32);
  // A ledge's face stops anyone on the ground; its ramp is the way up.
  for (const l of m.ledges ?? []) {
    box(l);
    for (const q of l.ramps) {
      const [i0, i1] = span(q.x, q.x + q.w, cols), [j0, j1] = span(q.y, q.y + q.h, rows);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (inArea(q, (i + 0.5) * C, (j + 0.5) * C)) cost[j * cols + i] = 1;
    }
  }
  // The map's edge (collide keeps a body r in from the sides and the foot, 0.6 r from the top).
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = (i + 0.5) * C, y = (j + 0.5) * C;
    if (x < r || x > m.w - r || y < r * 0.6 || y > m.h - r) cost[j * cols + i] = 0;
  }
  for (const w of m.water ?? []) {
    if (w.deep) continue;
    const [i0, i1] = span(w.x, w.x + w.w, cols), [j0, j1] = span(w.y, w.y + w.h, rows);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (cost[j * cols + i] && inArea(w, (i + 0.5) * C, (j + 0.5) * C)) cost[j * cols + i] = 2;
  }
  return { cols, rows, cost, sig, fields: new Map(), nearest: new Map() };
}

/** The grid for a body of radius r on this map (collide() works on the current map, which this is). */
export function gridOf(m: GameMap, r: number): Grid {
  const sig = `${m.blocks.filter((b) => b.ruined).length}.${m.blocks.length}.${m.rounds.length}.${m.water?.length ?? 0}.${m.npcs?.length ?? 0}`;
  const size = sizeOf(r);
  let mine = grids.get(m);
  if (!mine) grids.set(m, (mine = new Map()));
  let g = mine.get(size);
  if (!g || g.sig !== sig) mine.set(size, (g = build(m, size, sig)));
  return g;
}

export const cellOf = (g: Grid, x: number, y: number) => Math.max(0, Math.min(g.cols - 1, Math.floor(x / C))) + Math.max(0, Math.min(g.rows - 1, Math.floor(y / C))) * g.cols;

/** The open cells nearest a cell (itself if open), up to `ring` cells out: where a body that size can stand by it. */
export function openNear(g: Grid, c: number, ring: number): number[] {
  if (g.cost[c]) return [c];
  const i0 = c % g.cols, j0 = Math.floor(c / g.cols);
  for (let k = 1; k <= ring; k++) {
    const out: number[] = [];
    for (let j = j0 - k; j <= j0 + k; j++) for (let i = i0 - k; i <= i0 + k; i++) {
      if (Math.max(Math.abs(i - i0), Math.abs(j - j0)) !== k || i < 0 || j < 0 || i >= g.cols || j >= g.rows) continue;
      if (g.cost[i + j * g.cols]) out.push(i + j * g.cols);
    }
    if (out.length) return out;
  }
  return [];
}

/** Which walled-off part of the ground each open cell is in (-1 blocked), worked out once a grid. */
function parts(g: Grid): Int32Array {
  if (g.part) return g.part;
  const part = new Int32Array(g.cols * g.rows).fill(-1), stack: number[] = [];
  let n = 0;
  for (let c = 0; c < part.length; c++) {
    if (!g.cost[c] || part[c] >= 0) continue;
    part[c] = n;
    stack.push(c);
    while (stack.length) {
      const k = stack.pop()!, i = k % g.cols, j = Math.floor(k / g.cols);
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di, nj = j + dj, q = ni + nj * g.cols;
        if (ni >= 0 && nj >= 0 && ni < g.cols && nj < g.rows && g.cost[q] && part[q] < 0) (part[q] = n), stack.push(q);
      }
    }
    n++;
  }
  return (g.part = part);
}

/**
 * Where a goblin in cell `from` can get nearest to `goal` when the goal is somewhere it can't reach (a
 * hero behind a line of reeds too tight for a butcher): the cell of its own part of the ground closest
 * to it, so it comes as near as it can rather than pressing into the reeds. -1 if `from` is blocked.
 */
export function nearestTo(g: Grid, from: number, goal: number): number {
  const part = parts(g), mine = part[from];
  if (mine < 0) return -1;
  const key = `${goal}:${mine}`, had = g.nearest.get(key);
  if (had !== undefined) return had;
  const gi = goal % g.cols, gj = Math.floor(goal / g.cols);
  let best = from, bd = Infinity;
  for (let c = 0; c < part.length; c++) {
    if (part[c] !== mine) continue;
    const d = (c % g.cols - gi) ** 2 + (Math.floor(c / g.cols) - gj) ** 2;
    if (d < bd) (bd = d), (best = c);
  }
  if (g.nearest.size >= 24) g.nearest.delete(g.nearest.keys().next().value!);
  g.nearest.set(key, best);
  return best;
}
