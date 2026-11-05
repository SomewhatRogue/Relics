/**
 * The shortest way a body of radius r can walk from a to b (a fine grid of the ground round the two,
 * each cell kept only where collide() leaves such a body standing), by length and by time (shallow
 * water at the wading pace), and whether that way wades. For scripts/water/crossing.ts.
 */
import { collide, inArea, type GameMap } from '../../src/shared/arena';

const C = 0.25;

function dijkstra(cols: number, rows: number, ok: Uint8Array, slow: Uint8Array, start: number, goal: number, wadeK: number): Float32Array {
  const dist = new Float32Array(cols * rows).fill(Infinity), seen = new Uint8Array(cols * rows), heap: number[] = [start];
  dist[start] = 0;
  const up = (k: number) => { while (k > 0) { const p = (k - 1) >> 1; if (dist[heap[p]] <= dist[heap[k]]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const down = (k: number) => { for (;;) { const l = k * 2 + 1, r = l + 1; let m = k; if (l < heap.length && dist[heap[l]] < dist[heap[m]]) m = l; if (r < heap.length && dist[heap[r]] < dist[heap[m]]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } };
  while (heap.length) {
    const c = heap[0], last = heap.pop()!;
    if (heap.length) (heap[0] = last), down(0);
    if (seen[c]) continue;
    seen[c] = 1;
    if (c === goal) break;
    const i = c % cols, j = Math.floor(c / cols);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ni = i + di, nj = j + dj, n = ni + nj * cols;
      if ((!di && !dj) || ni < 0 || nj < 0 || ni >= cols || nj >= rows || !ok[n]) continue;
      if (di && dj && (!ok[i + nj * cols] || !ok[ni + j * cols])) continue;
      const d = dist[c] + (di && dj ? 1.414 : 1) * C * (slow[n] ? wadeK : 1);
      if (d < dist[n]) (dist[n] = d), heap.push(n), up(heap.length - 1);
    }
  }
  return dist;
}

/** Walk back down a distance field from the goal to the start: the cells on the way. */
function back(cols: number, rows: number, dist: Float32Array, start: number, goal: number): number[] {
  const out = [goal];
  let at = goal;
  for (let s = 0; s < cols * rows && at !== start; s++) {
    let nx = -1, nd = dist[at];
    const i = at % cols, j = Math.floor(at / cols);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ni = i + di, nj = j + dj, n = ni + nj * cols;
      if ((di || dj) && ni >= 0 && nj >= 0 && ni < cols && nj < rows && dist[n] < nd) (nd = dist[n]), (nx = n);
    }
    if (nx < 0) break;
    out.push((at = nx));
  }
  return out;
}

export function geodesic(m: GameMap, r: number, a: { x: number; y: number }, b: { x: number; y: number }, speed: number, wade: number): { len: number; secs: number; wades: boolean } | null {
  const x0 = Math.max(0, Math.min(a.x, b.x) - 14), y0 = Math.max(0, Math.min(a.y, b.y) - 14), x1 = Math.min(m.w, Math.max(a.x, b.x) + 14), y1 = Math.min(m.h, Math.max(a.y, b.y) + 14);
  const cols = Math.ceil((x1 - x0) / C), rows = Math.ceil((y1 - y0) / C), ok = new Uint8Array(cols * rows), slow = new Uint8Array(cols * rows);
  const pools = (m.water ?? []).filter((w) => !w.deep);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = x0 + (i + 0.5) * C, y = y0 + (j + 0.5) * C, q = { x, y, z: 0 };
    collide(q, r);
    ok[j * cols + i] = Math.hypot(q.x - x, q.y - y) < 1e-6 ? 1 : 0;
    slow[j * cols + i] = pools.some((w) => inArea(w, x, y)) ? 1 : 0;
  }
  const cell = (p: { x: number; y: number }) => Math.max(0, Math.min(cols - 1, Math.floor((p.x - x0) / C))) + Math.max(0, Math.min(rows - 1, Math.floor((p.y - y0) / C))) * cols;
  const s = cell(a), g = cell(b);
  ok[s] = ok[g] = 1;
  const byLen = dijkstra(cols, rows, ok, slow, s, g, 1), byTime = dijkstra(cols, rows, ok, slow, s, g, 1 / wade);
  if (!isFinite(byLen[g])) return null;
  // Whether even the quickest way gets its feet wet (else going round is fair, not a dodge).
  const way = back(cols, rows, byTime, s, g);
  return { len: byLen[g], secs: byTime[g] / speed, wades: way.some((c) => slow[c]) };
}
