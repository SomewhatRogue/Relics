/**
 * Fenmere's pieces as boxes (pieces.ts; one source for both views): boards laid over deep water on their
 * piles, worn and gappy, and a clump of reeds standing in the shallows, stems and seed heads swaying a
 * little out of line. Same box format as pieces.ts: [x, y, z, w, h, d, colour, shape?]. Paint only.
 * Neither ever wipes the glowing layer under it in the flat view (blocks.ts): a telegraph on the boards
 * or under the reeds shows.
 */
import type { Block } from '../shared/arena';
import type { Bx } from './pieces';

export const FEN_KINDS = new Set<Block['kind']>(['boards', 'reeds']);
const PLANK = 0x6a5034, PLANK2 = 0x584228, PILE = 0x2e2016, STEMS = [0x6a7a42, 0x7a8448, 0x5a6a3a, 0x8a8a52], HEAD = 0x5a4026;

export function fenBoxes(b: Pick<Block, 'kind' | 'w' | 'h' | 'look'>, r: () => number): Bx[] {
  const w = b.w, d = b.h, out: Bx[] = [];
  if (b.kind === 'boards') {
    const along = w >= d, len = along ? w : d, span = along ? d : w, at = (u: number, v: number): [number, number] => (along ? [u, v] : [v, u]);
    // Piles down into the water at each end and every couple of tiles along both edges.
    for (let u = 0.12; u < len; u += Math.max(1, (len - 0.24) / Math.max(1, Math.round(len / 2)))) for (const v of [0.1, span - 0.1]) {
      const [x, z] = at(u, v);
      out.push([x, -0.6, z, 0.16, 0.7, 0.16, PILE]);
    }
    // The boards across it, one in a dozen missing.
    for (let u = 0.08; u < len - 0.04; u += 0.28) {
      if (r() < 0.08) continue;
      const [x, z] = at(u, span / 2);
      out.push([x, -0.1, z, along ? 0.24 : span, 0.1, along ? span : 0.24, r() < 0.35 ? PLANK2 : PLANK]);
    }
    return out;
  }
  // Reeds: stems in a clump, tallest in the middle, a seed head on most.
  const n = Math.max(6, Math.round(w * d * 7));
  for (let i = 0; i < n; i++) {
    const x = 0.1 + r() * (w - 0.2), z = 0.1 + r() * (d - 0.2), mid = 1 - Math.hypot((x - w / 2) / w, (z - d / 2) / d), tall = 0.55 + mid * 0.7 + r() * 0.25;
    out.push([x, -0.05, z, 0.05, tall, 0.05, STEMS[Math.floor(r() * STEMS.length)]]);
    if (r() < 0.6) out.push([x, tall - 0.05, z, 0.07, 0.18, 0.07, HEAD]);
  }
  return out;
}
