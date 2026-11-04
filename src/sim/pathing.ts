/**
 * Goblins finding their way (Kyle: "enemies got stuck with the water and didn't path to you"). A goblin
 * with a clear line to where it's going walks straight at it, as ever. When the line is blocked (a river,
 * a hedge, a row of houses) it follows a flow field toward that spot instead: the shortest way round on a
 * grid of the room (sim tuning PATH), through fords, bridges and gaps, wading only where it must. Each
 * field is a pure function of the room and the goal's cell, kept for the few goal cells in use, so it's
 * the same on every replay and cheap: one small search when a hero steps into a new cell.
 */
import { currentMap, type GameMap } from '../shared/arena';
import { PATH } from '../shared/tuning';

interface Grid { cols: number; rows: number; cost: Uint8Array; sig: string; fields: Map<number, Float32Array> }
const grids = new WeakMap<GameMap, Grid>();
const C = PATH.cell;

/** What a cell costs to cross: 0 blocked, 1 dry, 2 wading. */
function build(m: GameMap, sig: string): Grid {
  const cols = Math.ceil(m.w / C), rows = Math.ceil(m.h / C), cost = new Uint8Array(cols * rows).fill(1), p = PATH.pad;
  const box = (x: number, y: number, w: number, h: number, v: number) => {
    for (let j = Math.max(0, Math.floor((y - p) / C)); j <= Math.min(rows - 1, Math.floor((y + h + p) / C)); j++)
      for (let i = Math.max(0, Math.floor((x - p) / C)); i <= Math.min(cols - 1, Math.floor((x + w + p) / C)); i++) {
        const cx = (i + 0.5) * C, cy = (j + 0.5) * C;
        if (cx > x - p && cx < x + w + p && cy > y - p && cy < y + h + p && (v === 0 || cost[j * cols + i] === 1)) cost[j * cols + i] = v;
      }
  };
  const disc = (x: number, y: number, r: number) => {
    const R = r + p;
    for (let j = Math.max(0, Math.floor((y - R) / C)); j <= Math.min(rows - 1, Math.floor((y + R) / C)); j++)
      for (let i = Math.max(0, Math.floor((x - R) / C)); i <= Math.min(cols - 1, Math.floor((x + R) / C)); i++)
        if (Math.hypot((i + 0.5) * C - x, (j + 0.5) * C - y) < R) cost[j * cols + i] = 0;
  };
  for (const w of m.water ?? []) if (!w.deep) box(w.x + p, w.y + p, w.w - 2 * p, w.h - 2 * p, 2);
  for (const w of m.water ?? []) if (w.deep) box(w.x, w.y, w.w, w.h, 0);
  for (const b of m.blocks) if (!b.ruined) box(b.x, b.y, b.w, b.h, 0);
  for (const r of m.rounds) if (r.r > 0.15) disc(r.x, r.y, r.r);
  for (const b of m.braziers) disc(b.x, b.y, b.r);
  // A ledge's face stops anyone on the ground; its ramp is the way up.
  for (const l of m.ledges ?? []) {
    box(l.x, l.y, l.w, l.h, 0);
    for (const r of l.ramps) for (let j = Math.floor(r.y / C); j <= Math.floor((r.y + r.h) / C); j++) for (let i = Math.floor(r.x / C); i <= Math.floor((r.x + r.w) / C); i++) if (i >= 0 && j >= 0 && i < cols && j < rows) cost[j * cols + i] = 1;
  }
  return { cols, rows, cost, sig, fields: new Map() };
}

function gridOf(m: GameMap): Grid {
  const sig = `${m.blocks.filter((b) => b.ruined).length}.${m.blocks.length}.${m.rounds.length}.${m.water?.length ?? 0}`;
  let g = grids.get(m);
  if (!g || g.sig !== sig) grids.set(m, (g = build(m, sig)));
  return g;
}

const cellOf = (g: Grid, x: number, y: number) => Math.max(0, Math.min(g.cols - 1, Math.floor(x / C))) + Math.max(0, Math.min(g.rows - 1, Math.floor(y / C))) * g.cols;

/** Can a goblin walk straight from a to b (no blocked cell on the way)? */
function clear(g: Grid, ax: number, ay: number, bx: number, by: number): boolean {
  const l = Math.hypot(bx - ax, by - ay), n = Math.ceil(l / (C * 0.5)), sx = (-(by - ay) / (l || 1)) * BODY, sy = ((bx - ax) / (l || 1)) * BODY;
  // The line down the middle, and either side of it a body's half-width out (a hedge or a wall's corner it would graze).
  for (let k = 1; k < n; k++) {
    const x = ax + ((bx - ax) * k) / n, y = ay + ((by - ay) * k) / n;
    if (!g.cost[cellOf(g, x, y)] || !g.cost[cellOf(g, x + sx, y + sy)] || !g.cost[cellOf(g, x - sx, y - sy)]) return false;
  }
  return true;
}
/** How far either side of its line a goblin's body reaches, for walking straight (a little under its radius). */
const BODY = 0.3;

/** Distance (in dry steps) from every cell within reach to the goal cell: a small Dijkstra over the grid. */
function field(g: Grid, goal: number): Float32Array {
  const had = g.fields.get(goal);
  if (had) return had;
  const { cols, rows, cost } = g, dist = new Float32Array(cols * rows).fill(Infinity), R = PATH.reach / C;
  const gi = goal % cols, gj = Math.floor(goal / cols), heap: number[] = [goal];
  dist[goal] = 0;
  const up = (k: number) => { while (k > 0) { const p = (k - 1) >> 1; if (dist[heap[p]] <= dist[heap[k]]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const down = (k: number) => { for (;;) { const l = k * 2 + 1, r = l + 1; let m = k; if (l < heap.length && dist[heap[l]] < dist[heap[m]]) m = l; if (r < heap.length && dist[heap[r]] < dist[heap[m]]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } };
  const seen = new Uint8Array(cols * rows);
  while (heap.length) {
    const c = heap[0], last = heap.pop()!;
    if (heap.length) (heap[0] = last), down(0);
    if (seen[c]) continue;
    seen[c] = 1;
    const i = c % cols, j = Math.floor(c / cols);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ni = i + di, nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= cols || nj >= rows || Math.abs(ni - gi) > R || Math.abs(nj - gj) > R) continue;
      const n = ni + nj * cols;
      // No cutting a corner past something solid.
      if (!cost[n] || (di && dj && (!cost[i + nj * cols] || !cost[ni + j * cols]))) continue;
      const d = dist[c] + (di && dj ? 1.414 : 1) * (cost[n] === 2 ? PATH.shallow : 1);
      if (d < dist[n]) (dist[n] = d), heap.push(n), up(heap.length - 1);
    }
  }
  if (g.fields.size >= 12) g.fields.delete(g.fields.keys().next().value!);
  g.fields.set(goal, dist);
  return dist;
}

/**
 * Where to head next on the way to (gx, gy): the goal itself if the line is clear, else the farthest
 * point down the flow field that can be walked to straight. The goal, too, if there's no way round.
 */
export function wayTo(e: { x: number; y: number }, gx: number, gy: number): { x: number; y: number } {
  const m = currentMap(), g = gridOf(m);
  if (clear(g, e.x, e.y, gx, gy)) return { x: gx, y: gy };
  const dist = field(g, cellOf(g, gx, gy));
  let at = cellOf(g, e.x, e.y), best: { x: number; y: number } | null = null;
  for (let step = 0; step < 14; step++) {
    let next = -1, nd = dist[at];
    const i = at % g.cols, j = Math.floor(at / g.cols);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ni = i + di, nj = j + dj, n = ni + nj * g.cols;
      if ((di || dj) && ni >= 0 && nj >= 0 && ni < g.cols && nj < g.rows && dist[n] < nd) (nd = dist[n]), (next = n);
    }
    if (next < 0) break;
    at = next;
    const p = { x: ((at % g.cols) + 0.5) * C, y: (Math.floor(at / g.cols) + 0.5) * C };
    if (!best || clear(g, e.x, e.y, p.x, p.y)) best = p;
    else break;
  }
  return best ?? { x: gx, y: gy };
}
