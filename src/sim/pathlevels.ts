/**
 * The levels of the path grid (sim/pathgrid.ts): what collide()'s `levels()` lets a body do, cell by cell,
 * so goblins path up a slope, along raised ground and off a face (docs/design/elevation.md).
 *
 * Each cell has a level `lv`, whether its middle is in a ramp, and whether it is a drop. In a ramp a body
 * takes the level of the ground under it, so a ramp cell's level is that and it can be stepped into from
 * anywhere. Outside a ramp a ledge higher than a body is a wall that pushes it out by its radius, so a cell
 * within `r` of a ledge higher than the ground at its middle takes that ledge's level and is a drop: only a
 * body coming from at least that high walks into it (and off the edge, down to the ground beside it), and
 * from it only lower ground is reached. Stepping onto lower ground is allowed (a walk off an edge is never
 * a hurt); stepping onto higher ground, outside a ramp, never.
 */
import { inRamp, levelAt, type GameMap } from '../shared/arena';
import type { Grid } from './pathgrid';

/** Fill a grid's levels for a body of radius r (a map with no ledges is flat and gets none). */
export function layLevels(m: GameMap, g: Grid, C: number, r: number): void {
  const ledges = m.ledges ?? [];
  if (!ledges.length) return;
  const n = g.cols * g.rows, lv = new Uint8Array(n), ramp = new Uint8Array(n), drop = new Uint8Array(n);
  for (let j = 0; j < g.rows; j++) for (let i = 0; i < g.cols; i++) {
    const c = i + j * g.cols, x = (i + 0.5) * C, y = (j + 0.5) * C, base = levelAt(m, x, y);
    lv[c] = base;
    if (inRamp(m, x, y)) {
      ramp[c] = 1;
      continue;
    }
    for (const l of ledges) {
      const h = l.lv ?? 1;
      if (h <= lv[c]) continue;
      const dx = x - Math.max(l.x, Math.min(l.x + l.w, x)), dy = y - Math.max(l.y, Math.min(l.y + l.h, y));
      if (dx * dx + dy * dy < r * r) lv[c] = h;
    }
    if (lv[c] > base) drop[c] = 1;
  }
  Object.assign(g, { flat: false, lv, ramp, drop });
}

/** Can a body walk from cell a into the next cell b? Into a ramp always; out of a drop only down; else never up. */
export function canStep(g: Grid, a: number, b: number): boolean {
  if (g.flat || g.ramp![b]) return true;
  return g.drop![a] ? g.lv![b] < g.lv![a] : g.lv![a] >= g.lv![b];
}

/** A body standing at level z can stand in cell c (open, at that level, not over an edge). */
const stands = (g: Grid, c: number, z: number) => !!g.cost[c] && g.lv![c] === z && !g.drop![c];

/**
 * The cell a body at level z is on, near cell c: c itself if it's at that level, else the nearest open
 * cell within 2 that is (a hero on a bank's very edge has the lane's cell under them). c if there's none,
 * or no level was given.
 */
export function levelled(g: Grid, c: number, z: number | undefined): number {
  if (g.flat || z === undefined || g.lv![c] === z && !g.drop![c]) return c;
  const i0 = c % g.cols, j0 = Math.floor(c / g.cols);
  for (let k = 1; k <= 2; k++) {
    let best = -1, bd = Infinity;
    for (let j = j0 - k; j <= j0 + k; j++) for (let i = i0 - k; i <= i0 + k; i++) {
      if (Math.max(Math.abs(i - i0), Math.abs(j - j0)) !== k || i < 0 || j < 0 || i >= g.cols || j >= g.rows) continue;
      const q = i + j * g.cols, d = (i - i0) ** 2 + (j - j0) ** 2;
      if (stands(g, q, z) && d < bd) (bd = d), (best = q);
    }
    if (best >= 0) return best;
  }
  return c;
}

/** The open cells at cell c's own level nearest it (itself if open), up to `ring` out: openNear, by level. */
export function standNear(g: Grid, c: number, ring: number): number[] {
  if (g.cost[c]) return [c];
  const i0 = c % g.cols, j0 = Math.floor(c / g.cols), z = g.lv![c];
  for (let k = 1; k <= ring; k++) {
    const out: number[] = [];
    for (let j = j0 - k; j <= j0 + k; j++) for (let i = i0 - k; i <= i0 + k; i++) {
      if (Math.max(Math.abs(i - i0), Math.abs(j - j0)) !== k || i < 0 || j < 0 || i >= g.cols || j >= g.rows) continue;
      if (stands(g, i + j * g.cols, z)) out.push(i + j * g.cols);
    }
    if (out.length) return out;
  }
  return [];
}
