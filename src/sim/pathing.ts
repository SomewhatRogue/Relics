/**
 * Goblins finding their way (Kyle: "enemies got stuck with the water and didn't path to you"). A goblin
 * with a clear line to where it's going walks straight at it, as ever, shallows and all. When the line is
 * blocked (a river, a hedge, a row of houses) it follows a flow field toward that spot instead: the
 * shortest way round on a grid of the room as a body its size sees it (sim/pathgrid.ts), through fords,
 * bridges and gaps it fits, wading where that's the way. Each field is a pure function of the room, the
 * body's size and the goal's cell, kept for the few goal cells in use, so it's the same on every replay
 * and cheap: one small search when a hero steps into a new cell.
 *
 * The grid knows levels (sim/pathlevels.ts): the field, the walk down it and the straight-line test take
 * only steps a body can (up a slope, along raised ground, off a face onto lower ground, never up a face),
 * and a body or goal on a level is set on a cell of that level.
 */
import { currentMap } from '../shared/arena';
import { PATH } from '../shared/tuning';
import { C, cellOf, gridOf, nearestTo, openNear, type Grid } from './pathgrid';
import { canStep, levelled, standNear } from './pathlevels';

/** Can a goblin walk straight from a to b (every cell on the way open to a body its size)? */
function clear(g: Grid, ax: number, ay: number, bx: number, by: number): boolean {
  const l = Math.hypot(bx - ax, by - ay), n = Math.ceil(l / (C * 0.5)), sx = (-(by - ay) / (l || 1)) * SIDE, sy = ((bx - ax) / (l || 1)) * SIDE;
  // The line down the middle, and a little either side of it (a cell is judged at its middle; the body may be off it).
  for (let k = 1; k < n; k++) {
    const x = ax + ((bx - ax) * k) / n, y = ay + ((by - ay) * k) / n;
    if (!g.cost[cellOf(g, x, y)] || !g.cost[cellOf(g, x + sx, y + sy)] || !g.cost[cellOf(g, x - sx, y - sy)]) return false;
  }
  // On raised ground: every change of cell along each of the three lines, a to b, a step it can take.
  if (!g.flat) for (const s of [0, 1, -1]) {
    let at = cellOf(g, ax + sx * s, ay + sy * s);
    for (let k = 1; k <= n; k++) {
      const c = cellOf(g, ax + ((bx - ax) * k) / n + sx * s, ay + ((by - ay) * k) / n + sy * s);
      if (c !== at && !canStep(g, at, c)) return false;
      at = c;
    }
  }
  return true;
}
/** A diagonal step from a to b on raised ground: open and steppable through both cells beside it. */
const corner = (g: Grid, a: number, b: number, o1: number, o2: number) =>
  !!g.cost[o1] && !!g.cost[o2] && canStep(g, a, o1) && canStep(g, o1, b) && canStep(g, a, o2) && canStep(g, o2, b);
/** How far either side of its line the walk is checked: the grid already allows for the body's size. */
const SIDE = 0.15;

/**
 * A flow field: distance (in dry steps) to the goal from every cell within reach, kept for the square of
 * cells round the goal that the search can touch (all else is out of reach: Infinity).
 */
export type Field = { d: Float32Array; i0: number; j0: number; w: number; h: number };
/** A field's distance at a grid cell. */
const fd = (f: Field, cols: number, c: number): number => {
  const i = (c % cols) - f.i0, j = Math.floor(c / cols) - f.j0;
  return i < 0 || j < 0 || i >= f.w || j >= f.h ? Infinity : f.d[i + j * f.w];
};
// The search's scratch, reused from field to field: the heap (window cells) and which are done.
// (A cell goes on the heap at most once per neighbour that relaxes it, so nine times the window is room enough.)
let heapBuf = new Int32Array(0), seen = new Uint8Array(0);
function up(heap: Int32Array, d: Float32Array, k: number): void {
  while (k > 0) { const p = (k - 1) >> 1; if (d[heap[p]] <= d[heap[k]]) break; const t = heap[p]; (heap[p] = heap[k]), (heap[k] = t), (k = p); }
}
function down(heap: Int32Array, d: Float32Array, k: number, n: number): void {
  for (;;) { const l = k * 2 + 1, r = l + 1; let m = k; if (l < n && d[heap[l]] < d[heap[m]]) m = l; if (r < n && d[heap[r]] < d[heap[m]]) m = r; if (m === k) break; const t = heap[m]; (heap[m] = heap[k]), (heap[k] = t), (k = m); }
}

/**
 * Distance (in dry steps) from every cell within reach to the goal: a small Dijkstra over the grid. A
 * goal no body this size can stand on (a hero in a nook between reeds and the river) starts from the
 * open cells nearest it, so the goblin comes to the nook's mouth rather than walking into the reeds.
 */
function field(g: Grid, goal: number): Field {
  const had = g.fields.get(goal);
  if (had) return had;
  const { cols, rows, cost } = g, R = PATH.reach / C, half = Math.floor(R);
  const gi = goal % cols, gj = Math.floor(goal / cols);
  // The window: every cell within R of the goal either way (the search goes no further), the same size for every goal on this grid.
  const w = Math.min(2 * half + 1, cols), h = Math.min(2 * half + 1, rows);
  const i0 = Math.max(0, Math.min(gi - half, cols - w)), j0 = Math.max(0, Math.min(gj - half, rows - h));
  // The oldest field goes (first in, first out, as ever) and its array is the new one's.
  let old: Field | undefined;
  if (g.fields.size >= 12) { const k = g.fields.keys().next().value!; (old = g.fields.get(k)), g.fields.delete(k); }
  const dist = old && old.d.length === w * h ? old.d.fill(Infinity) : new Float32Array(w * h).fill(Infinity);
  if (seen.length < w * h) (seen = new Uint8Array(w * h)), (heapBuf = new Int32Array(w * h * 9 + 64));
  else seen.fill(0, 0, w * h);
  const heap = heapBuf;
  const L = (c: number) => (c % cols) - i0 + (Math.floor(c / cols) - j0) * w;
  let n = 0;
  const starts = g.flat ? openNear(g, goal, 4) : standNear(g, goal, 4);
  if (!starts.length) starts.push(goal);
  for (const s of starts) { const l = L(s); (dist[l] = Math.hypot((s % cols) - gi, Math.floor(s / cols) - gj)), (heap[n++] = l), up(heap, dist, n - 1); }
  // The four step costs, worked out once: straight or diagonal, dry or wading (the same products as step by step).
  const flat = g.flat, sh = PATH.shallow, dry1 = 1 * 1, dryD = 1.414 * 1, wet1 = 1 * sh, wetD = 1.414 * sh;
  while (n) {
    const lc = heap[0], last = heap[--n];
    if (n) (heap[0] = last), down(heap, dist, 0, n);
    if (seen[lc]) continue;
    seen[lc] = 1;
    const li = lc % w, lj = (lc - li) / w, i = li + i0, j = lj + j0, c = i + j * cols, dc = dist[lc];
    for (let dj = -1; dj <= 1; dj++) {
      const nj = j + dj;
      if (nj < 0 || nj >= rows || Math.abs(nj - gj) > R) continue;
      for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = i + di;
        if (ni < 0 || ni >= cols || Math.abs(ni - gi) > R) continue;
        const nc = ni + nj * cols, k = cost[nc];
        // No cutting a corner past something solid.
        if (!k || (di && dj && (!cost[i + nj * cols] || !cost[ni + j * cols]))) continue;
        // (Walked nc to c: a step it can take, a diagonal through both cells beside it.)
        if (!flat && (!canStep(g, nc, c) || (di && dj && !corner(g, nc, c, i + nj * cols, ni + j * cols)))) continue;
        const ln = lc + di + dj * w, d = dc + (di && dj ? (k === 2 ? wetD : dryD) : k === 2 ? wet1 : dry1);
        if (d < dist[ln]) (dist[ln] = d), (heap[n++] = ln), up(heap, dist, n - 1);
      }
    }
  }
  const f: Field = { d: dist, i0, j0, w, h };
  g.fields.set(goal, f);
  return f;
}

/**
 * Where to head next on the way to (gx, gy): the goal itself if the line is clear, else the farthest
 * point down the flow field that can be walked to straight. The goal, too, if there's no way round.
 * A goblin squeezed somewhere its size can't stand (knocked against a reed) starts from the open cell
 * nearest it. A body carrying `z`, and a goal given its level `gz`, are set on a cell of their own level near
 * them (a hero on a bank's very edge has the lane's cell under them); without, the cell's own level.
 */
export function wayTo(e: { x: number; y: number; radius?: number; z?: number }, gx: number, gy: number, gz?: number): { x: number; y: number } {
  const m = currentMap(), g = gridOf(m, e.radius ?? 0.38);
  if (clear(g, e.x, e.y, gx, gy)) return { x: gx, y: gy };
  const mid = (c: number) => ({ x: ((c % g.cols) + 0.5) * C, y: (Math.floor(c / g.cols) + 0.5) * C });
  let goal = levelled(g, cellOf(g, gx, gy), gz), dist = field(g, goal), at = levelled(g, cellOf(g, e.x, e.y), e.z), best: { x: number; y: number } | null = null;
  const from = g.flat ? openNear(g, at, 3) : standNear(g, at, 3);
  if (from.length && !from.some((c) => isFinite(fd(dist, g.cols, c)))) {
    // Nowhere it can reach is near the goal: as close as its own ground goes, then.
    const to = nearestTo(g, from[0], goal);
    if (to === from[0] || to < 0) return mid(to < 0 ? from[0] : to);
    (goal = to), (dist = field(g, goal));
    if (clear(g, e.x, e.y, mid(goal).x, mid(goal).y)) return mid(goal);
  }
  if (!isFinite(fd(dist, g.cols, at))) {
    const near = from.filter((c) => isFinite(fd(dist, g.cols, c))).sort((a, b) => fd(dist, g.cols, a) - fd(dist, g.cols, b) || a - b)[0];
    if (near === undefined) return { x: gx, y: gy };
    if (!clear(g, e.x, e.y, mid(near).x, mid(near).y)) return mid(near);
    at = near;
    best = mid(near);
  }
  for (let step = 0; step < 14; step++) {
    let next = -1, nd = fd(dist, g.cols, at);
    const i = at % g.cols, j = Math.floor(at / g.cols);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ni = i + di, nj = j + dj, n = ni + nj * g.cols;
      if (!(di || dj) || ni < 0 || nj < 0 || ni >= g.cols || nj >= g.rows || fd(dist, g.cols, n) >= nd) continue;
      if (!g.flat && (!canStep(g, at, n) || (di && dj && !corner(g, at, n, i + nj * g.cols, ni + j * g.cols)))) continue;
      (nd = fd(dist, g.cols, n)), (next = n);
    }
    if (next < 0) break;
    at = next;
    const p = mid(at);
    if (!best || clear(g, e.x, e.y, p.x, p.y)) best = p;
    else break;
  }
  return best ?? { x: gx, y: gy };
}
