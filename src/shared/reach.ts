/**
 * Where a hero is allowed to be: the ground you can walk to from where heroes come into a map, by the
 * same things `collide` stops a body on (blocks still standing, round things, braziers, deep water).
 * A quarter-tile grid, each cell open if its middle is a little clear of all of those, flooded out from
 * the way in. Ledges count as ground (their ramps join them up); standing inside one at its foot is
 * caught by `inSolid`. Built once a map and rebuilt when its blocks change (a gate opened, a house
 * burned down), so a way that opens is walkable at once.
 *
 * Out of bounds is: past the map's edge, inside something solid, or on ground nobody can walk to from
 * the way in (past the wood's tree wall, behind a fence that's never opened, over a river with no ford).
 */
import { inArea, inRamp, onLedge, type Area, type GameMap } from './arena.js';

const CELL = 0.25;
/** How far clear of a thing a cell's middle must be: under half a hero, so any gap a hero fits through stays open. */
const PAD = 0.16;

interface Grid { sig: string; cols: number; rows: number; ok: Uint8Array }
const cache = new WeakMap<GameMap, Grid>();

/** What the grid depends on that can change in play. */
type Pt = { x: number; y: number };
function sigOf(m: GameMap, seeds: Pt[]): string {
  let s = 0, n = 0;
  for (const b of m.blocks) if (!b.ruined) (n++, (s += b.x * 3.1 + b.y * 7.3 + b.w + b.h));
  for (const p of seeds) s += p.x * 11.7 + p.y * 5.3;
  return `${n}:${s.toFixed(2)}:${m.rounds.length}:${m.water?.length ?? 0}:${m.w}x${m.h}:${seeds.length}`;
}

function build(m: GameMap, seeds: Pt[]): Grid {
  const cols = Math.ceil(m.w / CELL), rows = Math.ceil(m.h / CELL), bad = new Uint8Array(cols * rows);
  const span = (a: number, b: number, n: number) => [Math.max(0, Math.floor(a / CELL - 0.5)), Math.min(n - 1, Math.ceil(b / CELL - 0.5))];
  const box = (b: Area) => {
    const [i0, i1] = span(b.x - PAD, b.x + b.w + PAD, cols), [j0, j1] = span(b.y - PAD, b.y + b.h + PAD, rows);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = (i + 0.5) * CELL, y = (j + 0.5) * CELL;
      if (x > b.x - PAD && x < b.x + b.w + PAD && y > b.y - PAD && y < b.y + b.h + PAD) bad[j * cols + i] = 1;
    }
  };
  const round = (c: { x: number; y: number; r: number }) => {
    const r = c.r + PAD, [i0, i1] = span(c.x - r, c.x + r, cols), [j0, j1] = span(c.y - r, c.y + r, rows);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (Math.hypot((i + 0.5) * CELL - c.x, (j + 0.5) * CELL - c.y) < r) bad[j * cols + i] = 1;
  };
  for (const b of m.blocks) if (!b.ruined) box(b);
  for (const c of m.rounds) round(c);
  for (const c of m.braziers) round(c);
  for (const w of m.water ?? []) if (w.deep) box(w);
  // Flood from the way in (the nearest open cell to it, and to any other spot the room counts as one),
  // never cutting a corner between two closed cells.
  const ok = new Uint8Array(cols * rows), q: number[] = [];
  for (const p of [m.hero, ...seeds]) {
    const seed = nearestOpen(bad, cols, rows, p.x / CELL - 0.5, p.y / CELL - 0.5);
    if (seed >= 0 && !ok[seed]) (ok[seed] = 1), q.push(seed);
  }
  while (q.length) {
    const c = q.pop()!, i = c % cols, j = (c - i) / cols;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const a = i + di, b = j + dj;
      if ((!di && !dj) || a < 0 || b < 0 || a >= cols || b >= rows) continue;
      const k = b * cols + a;
      if (ok[k] || bad[k]) continue;
      if (di && dj && bad[j * cols + a] && bad[b * cols + i]) continue;
      ok[k] = 1;
      q.push(k);
    }
  }
  return { sig: sigOf(m, seeds), cols, rows, ok };
}

function nearestOpen(bad: Uint8Array, cols: number, rows: number, fi: number, fj: number): number {
  let best = -1, bd = Infinity;
  const ci = Math.round(fi), cj = Math.round(fj);
  for (let r = 0; r < 40 && best < 0; r++) for (let j = cj - r; j <= cj + r; j++) for (let i = ci - r; i <= ci + r; i++) {
    if (i < 0 || j < 0 || i >= cols || j >= rows || bad[j * cols + i]) continue;
    const d = Math.hypot(i - fi, j - fj);
    if (d < bd) (bd = d), (best = j * cols + i);
  }
  return best;
}

function grid(m: GameMap, seeds: Pt[] = []): Grid {
  let g = cache.get(m);
  if (!g || g.sig !== sigOf(m, seeds)) cache.set(m, (g = build(m, seeds)));
  return g;
}

/**
 * How near walkable ground a body's middle must be. A hero can be squeezed into a gap narrower than
 * itself (a hedge planted close to a cottage) whose own cells are shut; its body still touches the open
 * ground, so it's in. Through a fence into a pen, or past a wall, is further than this from any.
 */
export const TOUCH = 0.6;

/** On ground that can be walked to, or touching it (`TOUCH`). */
export function reachable(m: GameMap, x: number, y: number, seeds: Pt[] = []): boolean {
  const g = grid(m, seeds), n = Math.ceil(TOUCH / CELL), ci = Math.round(x / CELL - 0.5), cj = Math.round(y / CELL - 0.5);
  for (let j = cj - n; j <= cj + n; j++) for (let i = ci - n; i <= ci + n; i++) {
    if (i < 0 || j < 0 || i >= g.cols || j >= g.rows || !g.ok[j * g.cols + i]) continue;
    if (Math.hypot((i + 0.5) * CELL - x, (j + 0.5) * CELL - y) <= TOUCH) return true;
  }
  return false;
}

/** The middle of a body inside something it should have been stopped by (a little inside, past rounding). */
export function inSolid(m: GameMap, x: number, y: number, z = 0): boolean {
  const e = 0.04;
  for (const b of m.blocks) if (!b.ruined && x > b.x + e && x < b.x + b.w - e && y > b.y + e && y < b.y + b.h - e) return true;
  for (const c of m.rounds) if (c.r > e && Math.hypot(x - c.x, y - c.y) < c.r - e) return true;
  for (const c of m.braziers) if (Math.hypot(x - c.x, y - c.y) < c.r - e) return true;
  for (const w of m.water ?? []) if (w.deep && x > w.x + e && x < w.x + w.w - e && y > w.y + e && y < w.y + w.h - e) return true;
  return z < 1 && onLedge(m, x, y) && !inRamp(m, x, y);
}

/** Out of bounds: past the edge, inside something, on ground nobody can walk to, or in an area marked forbidden. */
export function outOfBounds(m: GameMap, x: number, y: number, z = 0, forbid: Area[] = [], seeds: Pt[] = []): boolean {
  if (x < 0 || y < 0 || x > m.w || y > m.h) return true;
  if (forbid.some((a) => inArea(a, x, y))) return true;
  return inSolid(m, x, y, z) || !reachable(m, x, y, seeds);
}

/** Strictly on an open cell that can be walked to (the hole-hunting script starts heroes only there). */
export function onWalkedGround(m: GameMap, x: number, y: number): boolean {
  const g = grid(m), i = Math.floor(x / CELL), j = Math.floor(y / CELL);
  return i >= 0 && j >= 0 && i < g.cols && j < g.rows && !!g.ok[j * g.cols + i];
}
