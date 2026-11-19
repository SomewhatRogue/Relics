/**
 * THE OSIER BEDS' own small helpers (shared/sallowbeds.ts): a spot's footing by the carr's ground (shared/
 * sallowbedsland.ts), rows of osier stools, marks sprinkled over a box, and the pollard willows standing in the black
 * water all round. All on the kit's seeded stream and its claims (shared/expedkit.ts). Pure.
 */
import type { MarkKind, RoundKind } from './arena.js';
import { claim, mark, offLine, unclaimed, type Kit } from './expedkit.js';
import { CARR, groundAt } from './sallowbedsland.js';

/** Clear of every claim and `road` tiles off the roads, its whole foot on ground `want` (0 dry, 1 wading, 2 deep). */
export function ok(k: Kit, x: number, y: number, r: number, want = 0, road = 1.2): boolean {
  if (x < r + 0.6 || y < r + 0.6 || x > CARR.w - r - 0.6 || y > CARR.h - r - 0.6) return false;
  if (!unclaimed(k, x, y, r) || k.roads.some((l) => offLine(l, x, y) < r + road)) return false;
  const e = r + 0.15;
  return [[0, 0], [e, 0], [-e, 0], [0, e], [0, -e]].every(([dx, dy]) => groundAt(x + dx, y + dy) === want);
}

/** A round thing at (x, y) if there's room for it there. */
export function put(k: Kit, kind: RoundKind, x: number, y: number, r: number, want = 0, road = 1.2): boolean {
  if (!ok(k, x, y, r, want, road)) return false;
  k.rounds.push({ kind, x, y, r }), claim(k, x, y, r);
  return true;
}

/** A mark centred on (x, y). */
export const markAt = (k: Kit, kind: MarkKind, x: number, y: number, w: number, h: number) => mark(k, kind, x - w / 2, y - h / 2, w, h);

/** `n` marks of `kind` (about w by h) in the box, sized a little by the seed, each on dry ground. Paint only. */
export function sprinkle(k: Kit, kind: MarkKind, n: number, x0: number, y0: number, x1: number, y1: number, w: number, h: number): void {
  for (let i = 0; i < n; i++) {
    const s = k.rng.range(0.7, 1.3), x = k.rng.range(x0, x1), y = k.rng.range(y0, y1);
    if (groundAt(x, y) === 0) markAt(k, kind, x, y, w * s, h * s);
  }
}

/**
 * A row of osier stools along y from x0 to x1: cut ones (whips just showing) or a stool let grow (a bush), one in
 * eight gone (the stool rotted out, a weedy gap). Spaced so a body squeezes between, never walks straight through.
 */
export function stools(k: Kit, y: number, x0: number, x1: number, cut: number): void {
  // The row's own ground, worked bare round the stools, so the rows read from across the beds.
  k.soil.push({ mat: 'mud', x: x0 - 0.4, y, w: x1 - x0 + 0.4, h: 0, line: 0.5 });
  for (let x = x0; x < x1; x += 1.5) {
    const px = x + k.rng.range(-0.2, 0.2), py = y + k.rng.range(-0.15, 0.15);
    if (k.rng.next() < 0.12) { if (groundAt(px, py) === 0) markAt(k, 'weeds', px, py, 1.2, 0.6); continue; }
    const c = k.rng.next() < cut;
    put(k, c ? 'reed' : 'bush', px, py, c ? k.rng.range(0.26, 0.32) : k.rng.range(0.34, 0.42));
  }
}

/** Pollards and dead willows standing in the water of the box: thick where the water meets ground, thin out in it. */
export function willows(k: Kit, x0: number, y0: number, x1: number, y1: number, step = 2.1): void {
  for (let y = y0; y < y1; y += step) for (let x = x0 + ((y / step) % 2) * step * 0.5; x < x1; x += step) {
    const px = x + k.rng.range(-0.6, 0.6), py = y + k.rng.range(-0.5, 0.5), shore = nearGround(px, py);
    if (k.rng.next() > (shore < 3 ? 0.9 : shore < 7 ? 0.45 : 0.16)) continue;
    const r = k.rng.range(0.52, 0.86), kind: RoundKind = k.rng.next() < 0.1 ? 'deadtree' : 'tree';
    if (!put(k, kind, px, py, r, 2, 0.4)) put(k, kind, px, py, r, 1, 0.4);
  }
}

/** How far (roughly, in tiles) from (x, y) to ground anyone can stand on. */
function nearGround(x: number, y: number): number {
  for (let d = 1; d < 8; d += 1) for (let a = 0; a < 8; a++) if (groundAt(x + Math.cos(a * 0.785) * d, y + Math.sin(a * 0.785) * d) < 2) return d;
  return 9;
}
