/**
 * A lined cloak (docs/decisions/graphics-overhaul.md, 2026-11-17: Kyle picked "B, red and gold"): a cape that widens
 * toward its hem, shows a darker lining facing you, and carries a gold edge down its open sides and along the hem.
 * herolife.ts walks the cape's rows and calls these with its own cloth rect; a look asks for it with `lining` and
 * `trim` (lookkit.ts). Drawing only.
 */
import type { Put } from './cloaklife';
import { HS } from './heroscale';

/** One sprite pixel, in the old body's pixels that herolife.ts counts in. */
const P1 = 1 / HS;

/** The knight's cloak: his red a touch brighter outside, a darker lining, old gold. */
export const KNIGHT_CLOAK: { cape: [string, string]; lining: [string, string]; trim: string } = { cape: ['#641618', '#340a0c'], lining: ['#3c0c0e', '#240608'], trim: '#c8962e' };

/** How much wider each side is at row `i` of `n`: a pixel from a third of the way down, two near the hem. */
export const flare = (i: number, n: number): number => (i > n * 0.72 ? 2 : i > n * 0.36 ? 1 : 0) * P1;

/** Facing you, row `r` from `a` to `b`: from the outside in, the cloth turned forward, the gold edge, then the lining
 *  (in shadow under the shoulders and between the legs). `ext` of it streams out behind in the cloth's colour. */
export function linedFront(put: Put, a: number, b: number, r: number, i: number, n: number, last: boolean, ext: number, col: string, inn: [string, string], trim: string): void {
  const bw = (i > n * 0.72 ? 2 : 1) * P1;
  put('back', a, r, b - a, 1, col);
  if (i < 2) return;
  put('back', a + bw, r, b - a - 2 * bw, 1, i < 4 ? inn[1] : inn[0]);
  put('back', 5, r, 2, 1, inn[1]);
  if (ext > 0) put('back', a, r, ext, 1, col);
  put('back', a + bw, r, P1, 1, trim);
  put('back', b - bw - P1, r, P1, 1, trim);
  if (last) put('back', a + bw, r + 0.6, b - a - 2 * bw, 0.4, trim);
}

/** In profile, row `r` from its trailing edge `a` to the back `b`: the gold edge trailing, a fold beside it, the hem. */
export function linedSide(put: Put, a: number, b: number, r: number, last: boolean, col: string, lin: string, trim: string): void {
  put('back', a, r, b - a, 1, col);
  put('back', a + P1, r, P1, 1, lin);
  put('back', a, r, P1, 1, trim);
  if (last) put('back', a, r + 0.6, b - a, 0.4, trim);
}
