/**
 * A runner's way through the street (runner.ts): around the buildings, not through them, on a half-tile
 * grid, then pulled straight wherever the way is clear. Drawing only; nothing the room decides.
 */
import { doorAt, type GameMap } from '../shared/arena';

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

/** A hall's doorstep (shared/arena.ts doorAt) and a step back inside its doorway. */
function doorway(map: GameMap, door: string): { step: P; inDoor: P } | null {
  const b = map.blocks.find((x) => x.door === door);
  if (!b) return null;
  const step = doorAt(b), cx = b.x + b.w / 2 - step.x, cy = b.y + b.h / 2 - step.y, d = Math.hypot(cx, cy) || 1;
  return { step, inDoor: { x: step.x + (cx / d) * 0.55, y: step.y + (cy / d) * 0.55 } };
}

/**
 * A runner's whole way in (runner.ts, and others' runners as this screen plays them: runnerecho.ts):
 * from just inside their hall's doorway (`door`, a town door id) out and round to `stand`. The same on
 * every screen for the same map, so only the end needs telling.
 */
export function runnerWay(map: GameMap, door: string, stand: P): P[] {
  const d = doorway(map, door);
  if (!d) return [{ x: stand.x, y: Math.min(map.h - 1.5, stand.y + 6) }, stand];
  return [d.inDoor, ...wayThrough(map, d.step, stand)];
}

/** Where the runner stops by the hero: a tile or so off toward where they come from. */
export function standBy(map: GameMap, door: string, me: P): P {
  const step = doorway(map, door)?.step ?? { x: me.x, y: me.y + 6 }, d = Math.hypot(step.x - me.x, step.y - me.y) || 1;
  return { x: me.x + ((step.x - me.x) / d) * 1.1, y: me.y + ((step.y - me.y) / d) * 0.6 + 0.15 };
}
