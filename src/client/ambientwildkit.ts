/**
 * Small helpers the wild's ambient figures share (ambientwild.ts, ambientwild2.ts): a repeatable hash, the nearest
 * hero, the map's covers sorted once (trees, bushes, crows) and a plain pixel with an alpha. Cosmetic only.
 */
import type { GameMap, Round } from '../shared/arena';
import type { Ctx } from './draw';

export type At = { x: number; y: number };
/** A repeatable 0..1 from two numbers. */
export const hash = (a: number, b: number) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
/** The nearest hero's distance and the unit way from it to (x, y) (a way is always given). */
export function away(heroes: At[], x: number, y: number): { d: number; ux: number; uy: number } {
  let d = Infinity, ux = 1, uy = 0;
  for (const h of heroes) {
    const e = Math.hypot(x - h.x, y - h.y);
    if (e < d) (d = e), (ux = e > 0.01 ? (x - h.x) / e : 1), (uy = e > 0.01 ? (y - h.y) / e : 0);
  }
  return { d, ux, uy };
}
/** A one-pixel-or-more mark on the lit layer at (X + dx, Y + dy), with an alpha for fading ones (`glow`: on the unlit layer, for what a dark cave would otherwise swallow). */
export function dot(c: Ctx, X: number, Y: number, dx: number, dy: number, w: number, h: number, col: string, a = 1, glow = false): void {
  const g = glow ? c.glow : c.lit;
  g.globalAlpha = a;
  g.fillStyle = col;
  g.fillRect(X + dx, Y + dy, w, h);
  g.globalAlpha = 1;
}
/** The rounds the wild cares about, found once a map. */
export interface Covers { trees: Round[]; pines: Round[]; bushes: Round[]; crows: Round[] }
const seen = new WeakMap<GameMap, Covers>();
export function coversOf(m: GameMap): Covers {
  let c = seen.get(m);
  if (!c) {
    c = { trees: [], pines: [], bushes: [], crows: [] };
    for (const r of m.rounds) {
      if (r.kind === 'tree') c.trees.push(r);
      else if (r.kind === 'pine') c.pines.push(r);
      else if (r.kind === 'bush') c.bushes.push(r);
      else if (r.kind === 'crows') c.crows.push(r);
    }
    seen.set(m, c);
  }
  return c;
}
/** Up to `n` of `rs` within `reach` tiles of a hero, the nearest first. */
export function nearest(rs: Round[], heroes: At[], reach: number, n: number): Round[] {
  const best: { r: Round; d: number }[] = [];
  for (const r of rs) {
    let d = Infinity;
    for (const h of heroes) d = Math.min(d, Math.hypot(h.x - r.x, h.y - r.y));
    if (d > reach) continue;
    best.push({ r, d });
    best.sort((a, b) => a.d - b.d);
    if (best.length > n) best.pop();
  }
  return best.map((b) => b.r);
}
