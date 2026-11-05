/**
 * Goblins finding their way (Kyle: "enemies got stuck with the water and didn't path to you"). A goblin
 * with a clear line to where it's going walks straight at it, as ever, shallows and all. When the line is
 * blocked (a river, a hedge, a row of houses) it follows a flow field toward that spot instead: the
 * shortest way round on a grid of the room as a body its size sees it (sim/pathgrid.ts), through fords,
 * bridges and gaps it fits, wading where that's the way. Each field is a pure function of the room, the
 * body's size and the goal's cell, kept for the few goal cells in use, so it's the same on every replay
 * and cheap: one small search when a hero steps into a new cell.
 */
import { currentMap } from '../shared/arena';
import { PATH } from '../shared/tuning';
import { C, cellOf, gridOf, nearestTo, openNear, type Grid } from './pathgrid';

/** Can a goblin walk straight from a to b (every cell on the way open to a body its size)? */
function clear(g: Grid, ax: number, ay: number, bx: number, by: number): boolean {
  const l = Math.hypot(bx - ax, by - ay), n = Math.ceil(l / (C * 0.5)), sx = (-(by - ay) / (l || 1)) * SIDE, sy = ((bx - ax) / (l || 1)) * SIDE;
  // The line down the middle, and a little either side of it (a cell is judged at its middle; the body may be off it).
  for (let k = 1; k < n; k++) {
    const x = ax + ((bx - ax) * k) / n, y = ay + ((by - ay) * k) / n;
    if (!g.cost[cellOf(g, x, y)] || !g.cost[cellOf(g, x + sx, y + sy)] || !g.cost[cellOf(g, x - sx, y - sy)]) return false;
  }
  return true;
}
/** How far either side of its line the walk is checked: the grid already allows for the body's size. */
const SIDE = 0.15;

/**
 * Distance (in dry steps) from every cell within reach to the goal: a small Dijkstra over the grid. A
 * goal no body this size can stand on (a hero in a nook between reeds and the river) starts from the
 * open cells nearest it, so the goblin comes to the nook's mouth rather than walking into the reeds.
 */
function field(g: Grid, goal: number): Float32Array {
  const had = g.fields.get(goal);
  if (had) return had;
  const { cols, rows, cost } = g, dist = new Float32Array(cols * rows).fill(Infinity), R = PATH.reach / C;
  const gi = goal % cols, gj = Math.floor(goal / cols), heap: number[] = [];
  const up = (k: number) => { while (k > 0) { const p = (k - 1) >> 1; if (dist[heap[p]] <= dist[heap[k]]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const down = (k: number) => { for (;;) { const l = k * 2 + 1, r = l + 1; let m = k; if (l < heap.length && dist[heap[l]] < dist[heap[m]]) m = l; if (r < heap.length && dist[heap[r]] < dist[heap[m]]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } };
  const starts = openNear(g, goal, 4);
  if (!starts.length) starts.push(goal);
  for (const s of starts) (dist[s] = Math.hypot((s % cols) - gi, Math.floor(s / cols) - gj)), heap.push(s), up(heap.length - 1);
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
 * A goblin squeezed somewhere its size can't stand (knocked against a reed) starts from the open cell
 * nearest it.
 */
export function wayTo(e: { x: number; y: number; radius?: number }, gx: number, gy: number): { x: number; y: number } {
  const m = currentMap(), g = gridOf(m, e.radius ?? 0.38);
  if (clear(g, e.x, e.y, gx, gy)) return { x: gx, y: gy };
  const mid = (c: number) => ({ x: ((c % g.cols) + 0.5) * C, y: (Math.floor(c / g.cols) + 0.5) * C });
  let goal = cellOf(g, gx, gy), dist = field(g, goal), at = cellOf(g, e.x, e.y), best: { x: number; y: number } | null = null;
  const from = openNear(g, at, 3);
  if (from.length && !from.some((c) => isFinite(dist[c]))) {
    // Nowhere it can reach is near the goal: as close as its own ground goes, then.
    const to = nearestTo(g, from[0], goal);
    if (to === from[0] || to < 0) return mid(to < 0 ? from[0] : to);
    (goal = to), (dist = field(g, goal));
    if (clear(g, e.x, e.y, mid(goal).x, mid(goal).y)) return mid(goal);
  }
  if (!isFinite(dist[at])) {
    const near = from.filter((c) => isFinite(dist[c])).sort((a, b) => dist[a] - dist[b] || a - b)[0];
    if (near === undefined) return { x: gx, y: gy };
    if (!clear(g, e.x, e.y, mid(near).x, mid(near).y)) return mid(near);
    at = near;
    best = mid(near);
  }
  for (let step = 0; step < 14; step++) {
    let next = -1, nd = dist[at];
    const i = at % g.cols, j = Math.floor(at / g.cols);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ni = i + di, nj = j + dj, n = ni + nj * g.cols;
      if ((di || dj) && ni >= 0 && nj >= 0 && ni < g.cols && nj < g.rows && dist[n] < nd) (nd = dist[n]), (next = n);
    }
    if (next < 0) break;
    at = next;
    const p = mid(at);
    if (!best || clear(g, e.x, e.y, p.x, p.y)) best = p;
    else break;
  }
  return best ?? { x: gx, y: gy };
}
