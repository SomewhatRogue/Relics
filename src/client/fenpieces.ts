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
const PLANK = 0x6a5034, PLANK2 = 0x584228, PILE = 0x2e2016, STEMS = [0x6a7a42, 0x7a8448, 0x5a6a3a, 0x8a8a52], HEAD = 0x5a4026, RYE = [0x8a7a3a, 0x96843e, 0x7c6c34], EAR = 0xb09c56;

export function fenBoxes(b: Pick<Block, 'kind' | 'w' | 'h' | 'look' | 'ruined'>, r: () => number): Bx[] {
  const w = b.w, d = b.h, out: Bx[] = [];
  // Cut down (sim/buildings.ts `sweepBlocks`): a stubble of short stems where it stood, and what was cut lying on it.
  if (b.kind === 'reeds' && b.ruined) {
    const rye = (b.look ?? 0) >= 1000, stems = rye ? RYE : STEMS;
    for (let i = 0, n = Math.max(5, Math.round(w * d * 6)); i < n; i++) out.push([0.1 + r() * (w - 0.2), -0.05, 0.1 + r() * (d - 0.2), 0.04, 0.12 + r() * 0.08, 0.04, stems[Math.floor(r() * stems.length)]]);
    for (let i = 0, n = Math.max(2, Math.round(w * d * 2.5)); i < n; i++) {
      const along = r() < 0.5, len = 0.35 + r() * 0.3;
      out.push([0.2 + r() * (w - 0.4), 0, 0.2 + r() * (d - 0.4), along ? len : 0.05, 0.04, along ? 0.05 : len, rye ? EAR : stems[0]]);
    }
    return out;
  }
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
  // Rye (`look` 1000 and up: Lowfurrow's standing strips): straw stems all of a height, each with a pale ear
  // bent over at its top. It was drawn as fen reeds, green with brown cattail heads. (docs/design/flora.md, 4.)
  if ((b.look ?? 0) >= 1000) {
    for (let i = 0, n = Math.max(7, Math.round(w * d * 8)); i < n; i++) {
      const x = 0.1 + r() * (w - 0.2), z = 0.1 + r() * (d - 0.2), tall = 0.74 + r() * 0.16;
      out.push([x, -0.05, z, 0.04, tall, 0.04, RYE[Math.floor(r() * RYE.length)]], [x + (r() < 0.5 ? 0.04 : -0.04), tall - 0.1, z, 0.06, 0.13, 0.06, EAR]);
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
