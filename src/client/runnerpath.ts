/**
 * A runner's way through the street (runner.ts): around the buildings, not through them, on a half-tile
 * grid, then pulled straight wherever the way is clear. Drawing only; nothing the room decides.
 */
import type { GameMap } from '../shared/arena';

type P = { x: number; y: number };
const CELL = 0.5, MARGIN = 0.35;

/** Inside a building (with a little room), or off the map. */
export function blocked(map: GameMap, x: number, y: number): boolean {
  if (x < 0.6 || y < 0.6 || x > map.w - 0.6 || y > map.h - 0.6) return true;
  return map.blocks.some((b) => x > b.x - MARGIN && x < b.x + b.w + MARGIN && y > b.y - MARGIN && y < b.y + b.h + MARGIN);
}

/** Nothing in the way on the straight line from a to b. */
export function clearLine(map: GameMap, a: P, b: P): boolean {
  const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 0.2);
  for (let i = 1; i < n; i++) if (blocked(map, a.x + ((b.x - a.x) * i) / n, a.y + ((b.y - a.y) * i) / n)) return false;
  return true;
}

/** The points from `a` to `b` (both ends included); a straight line if there's no way round. */
export function wayThrough(map: GameMap, a: P, b: P): P[] {
  if (clearLine(map, a, b)) return [a, b];
  const W = Math.ceil(map.w / CELL), H = Math.ceil(map.h / CELL), at = (p: P) => [Math.floor(p.x / CELL), Math.floor(p.y / CELL)];
  const free = (i: number, j: number) => i >= 0 && j >= 0 && i < W && j < H && !blocked(map, (i + 0.5) * CELL, (j + 0.5) * CELL);
  const [si, sj] = at(a), [ei, ej] = at(b), from = new Int32Array(W * H).fill(-1), q = [si + sj * W];
  from[si + sj * W] = si + sj * W;
  for (let h = 0; h < q.length && from[ei + ej * W] < 0; h++) {
    const c = q[h], i = c % W, j = (c / W) | 0;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const ni = i + di, nj = j + dj, k = ni + nj * W;
      // (The ends may sit by a wall, a doorway: they're always allowed.)
      if (ni < 0 || nj < 0 || ni >= W || nj >= H || from[k] >= 0) continue;
      if (!free(ni, nj) && k !== ei + ej * W) continue;
      if (di && dj && (!free(i + di, j) || !free(i, j + dj))) continue;
      from[k] = c, q.push(k);
    }
  }
  if (from[ei + ej * W] < 0) return [a, b];
  const cells: P[] = [];
  for (let c = ei + ej * W; c !== si + sj * W; c = from[c]) cells.unshift({ x: ((c % W) + 0.5) * CELL, y: (((c / W) | 0) + 0.5) * CELL });
  // Pulled straight: from each point, on to the furthest one in clear sight.
  const pts = [a, ...cells.slice(0, -1), b], out = [a];
  for (let i = 0; i < pts.length - 1; ) {
    let j = pts.length - 1;
    while (j > i + 1 && !clearLine(map, pts[i], pts[j])) j--;
    out.push(pts[j]), (i = j);
  }
  return out;
}
