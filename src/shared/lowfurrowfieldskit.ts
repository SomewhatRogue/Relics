/**
 * THE FIELDS' own tools (shared/lowfurrowfields.ts): a hedge along a wandering line, rye standing in clumps
 * you walk through, a goblin set down at the height of the ground, and a little scatter of marks. On top of
 * the expedition kit (shared/expedkit.ts) and the territory kit (shared/terrkit.ts). Pure.
 */
import type { Block, Ledge, Mark, RoundKind } from './arena.js';
import { claim, free, offLine, unclaimed, type Kit, type Line, type P } from './expedkit.js';
import type { Foe } from './terrain.js';
import { wall } from './terrkit.js';

/** What every scene needs from the ground: the level at a point, the road, the rides. */
export interface FieldsLand { ledges: Ledge[]; lv: (x: number, y: number) => number; road: Line; rides: Line[] }

/** A thick hedge nobody gets through along `pts`: two staggered rows of solid bushes, `skip` its gaps (by y). */
export function hedgeLine(k: Kit, pts: P[], skip: (p: P) => boolean = () => false): void {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], l = Math.hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / l, ny = (b.x - a.x) / l;
    const n = Math.max(1, Math.ceil(l / 0.7));
    for (let j = 0; j < n; j++) {
      const p = { x: a.x + ((b.x - a.x) * j) / n, y: a.y + ((b.y - a.y) * j) / n }, q = { x: a.x + ((b.x - a.x) * (j + 1)) / n, y: a.y + ((b.y - a.y) * (j + 1)) / n };
      if (skip(p) || skip(q)) continue;
      wall(k, { x: p.x - nx * 0.3, y: p.y - ny * 0.3 }, { x: q.x - nx * 0.3, y: q.y - ny * 0.3 });
      wall(k, { x: p.x + nx * 0.3, y: p.y + ny * 0.3 }, { x: q.x + nx * 0.3, y: q.y + ny * 0.3 });
    }
  }
}

/** Where a wandering line is at `y` (its x), for a line laid top to bottom. */
export function xAt(pts: P[], y: number): number {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if (y >= Math.min(a.y, b.y) && y <= Math.max(a.y, b.y)) return a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y || 1);
  }
  return pts[y < pts[0].y ? 0 : pts.length - 1].x;
}

/**
 * Rye standing in a box: clumps you walk through (soft, as the fen's reeds are), on a loose grid, kept off
 * the road and the rides and off anything laid. `thin` leaves more gaps (wild oat gone to seed).
 */
export function rye(k: Kit, land: FieldsLand, x0: number, y0: number, x1: number, y1: number, thin = 0.12): void {
  for (let y = y0 + 0.8; y < y1 - 0.6; y += 1.45) for (let x = x0 + 0.8; x < x1 - 0.7; x += 1.6) {
    const cx = x + k.rng.range(-0.45, 0.45), cy = y + k.rng.range(-0.35, 0.35), w = k.rng.range(1.5, 2.2), h = k.rng.range(1.1, 1.6);
    if (k.rng.next() < thin) continue;
    if (offLine(land.road, cx, cy) < 1.9 || land.rides.some((l) => offLine(l, cx, cy) < 1.25)) continue;
    if (!unclaimed(k, cx, cy, 0.5)) continue;
    k.blocks.push({ kind: 'reeds', soft: true, x: cx - w / 2, y: cy - h / 2, w, h, look: 1000 + k.rng.int(1000) } as Block);
  }
}

/** A goblin of `pack` at (x, y), on whatever level is under it (a foe on raised ground carries `z`). */
export function put(k: Kit, land: FieldsLand, x: number, y: number, pack: number, more: Partial<Foe> = {}): Foe {
  const f: Foe = { kind: 'scrapper', x, y, pack, role: 'fodder', ...more };
  const z = land.lv(x, y);
  if (z) f.z = z;
  k.foes.push(f);
  claim(k, x, y, 0.5);
  return f;
}

/** A round thing at a spot only if it's free there (seeded scenery that must never land on a laid thing). */
export function maybe(k: Kit, kind: RoundKind, x: number, y: number, r: number, road = 1.2): boolean {
  if (!free(k, x, y, r, road)) return false;
  k.rounds.push({ kind, x, y, r });
  claim(k, x, y, r);
  return true;
}

/** `n` marks of `kind` about (x, y), each `w` by `h`, spread `sx` by `sy` (a clump, never even). */
export function marks(k: Kit, kind: Mark['kind'], x: number, y: number, n: number, sx: number, sy: number, w: number, h: number): void {
  for (let i = 0; i < n; i++) {
    const ww = w * k.rng.range(0.7, 1.2), hh = h * k.rng.range(0.7, 1.2);
    k.marks.push({ kind, x: x + k.rng.range(-sx, sx) - ww / 2, y: y + k.rng.range(-sy, sy) - hh / 2, w: ww, h: hh });
  }
}

/** Trees in a clump about (x, y): `n` tries, `kinds` as given, kept off the road and anything laid. */
export function grove(k: Kit, x: number, y: number, n: number, spread: number, kinds: RoundKind[], r: [number, number], road = 1.6): void {
  for (let i = 0; i < n; i++) {
    const a = k.rng.range(0, Math.PI * 2), d = k.rng.range(0, spread), rr = k.rng.range(r[0], r[1]);
    maybe(k, k.rng.pick(kinds), x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, rr, road);
  }
}
