/**
 * The Staithe's pieces as boxes (pieces.ts; one source for both views, Kyle's rule): the eel-catchers's
 * jetty on its piles (charred stumps once it's burnt through), the log laid across the gap with planks
 * lashed over it, the smokehouse (planked, a steep roof, its louvre), a drying rack hung with eels, and a
 * net hung between two poles. Same box format as pieces.ts: [x, y, z, w, h, d, colour, shape?]. Paint only.
 */
import type { Block } from '../shared/arena';
import type { Bx } from './pieces';

export const STAITHE_KINDS = new Set<Block['kind']>(['jetty', 'gangway', 'smokehouse', 'dryrack', 'hungnet']);
const PLANK = 0x6a5034, PLANK2 = 0x5a4228, PILE = 0x2e2016, CHAR = 0x1e1814, ROPE = 0x8a7a5a, EEL = 0x2a2a22, ROOF = 0x3a3036;

export function staitheBoxes(b: Pick<Block, 'kind' | 'w' | 'h' | 'ruined' | 'deck'>, r: () => number): Bx[] {
  const w = b.w, d = b.h, cx = w / 2, cz = d / 2, out: Bx[] = [], along = w >= d, len = along ? w : d, at = (u: number, v: number): [number, number] => (along ? [u, v] : [v, u]);
  if (b.kind === 'jetty') {
    // Piles down into the water along both long edges; the deck's boards across it, worn and gappy.
    for (let u = 0.15; u < len; u += 1.25) for (const v of [0.12, (along ? d : w) - 0.12]) {
      const [x, z] = at(u, v);
      out.push([x, -0.7, z, 0.18, b.ruined ? 0.45 + r() * 0.35 : 0.86, 0.18, b.ruined ? CHAR : PILE]);
    }
    if (b.ruined) return out;
    for (let u = 0.12; u < len - 0.05; u += 0.3) {
      const [x, z] = at(u, along ? cz : cx);
      out.push([x, -0.1, z, along ? 0.26 : w, 0.12, along ? d : 0.26, r() < 0.3 ? PLANK2 : PLANK]);
    }
    // Its lamp on a post at the far end, a coil of rope, a creel.
    const [lx, lz] = at(len - 0.25, 0.25), [cx2, cz2] = at(len * 0.45, (along ? d : w) - 0.35);
    out.push([lx, 0, lz, 0.08, 1.15, 0.08, PILE], [lx, 1.15, lz, 0.18, 0.18, 0.18, 0xd8a050]);
    out.push([cx2, 0.02, cz2, 0.3, 0.1, 0.3, ROPE, 'lump'], [cx2 + 0.5, 0.02, cz2, 0.32, 0.26, 0.26, 0x6a5a38]);
    return out;
  }
  if (b.kind === 'gangway') {
    // Only once it's across: the trunk, planks lashed over it so you can walk it.
    if (!b.deck || b.ruined) return out;
    for (let u = 0.1; u < len - 0.05; u += 0.45) {
      const [x, z] = at(u, along ? cz : cx);
      out.push([x, -0.25, z, along ? 0.48 : 0.6, 0.28, along ? 0.6 : 0.48, r() < 0.5 ? 0x4a3a2a : 0x3e3022]);
    }
    for (const u of [0.35, len / 2, len - 0.35]) {
      const [x, z] = at(u, along ? cz : cx);
      out.push([x, 0.0, z, along ? 0.22 : w * 0.9, 0.06, along ? d * 0.9 : 0.22, PLANK]);
    }
    return out;
  }
  if (b.kind === 'smokehouse') {
    // Planked walls, a steep roof, the louvre on its ridge, the door at the front, soot up the boards.
    out.push([cx, 0, cz, w, 1.5, d, 0x4a3a2a]);
    for (let i = 0; i < 4; i++) out.push([cx, 1.5 + i * 0.24, cz, w + 0.2 - i * 0.04, 0.24, d + 0.2 - i * (d / 4.2), ROOF]);
    out.push([cx, 2.46, cz, 0.6, 0.3, 0.5, 0x2a2026], [cx, 2.76, cz, 0.8, 0.06, 0.6, ROOF]);
    out.push([cx, 0, d - 0.02, 0.7, 1.05, 0.06, 0x2a1e14], [cx - 0.42, 0.55, d - 0.02, 0.08, 0.5, 0.06, 0x8a7a5a]);
    out.push([cx + w * 0.3, 1.1, d - 0.01, 0.5, 0.4, 0.04, 0x1e1a1e]);
    return out;
  }
  if (b.kind === 'dryrack') {
    // Two posts, two rails, eels hung split and drying.
    for (const u of [0.05, len - 0.05]) { const [x, z] = at(u, along ? cz : cx); out.push([x, 0, z, 0.12, 1.35, 0.12, PILE]); }
    for (const y of [0.95, 1.25]) { const [x, z] = at(len / 2, along ? cz : cx); out.push([x, y, z, along ? len : 0.06, 0.05, along ? 0.06 : len, 0x5a4a30]); }
    for (let u = 0.2; u < len - 0.1; u += 0.18) { const [x, z] = at(u, along ? cz : cx); out.push([x, 0.55 + r() * 0.2, z, 0.06, 0.38 + r() * 0.12, 0.06, r() < 0.3 ? 0x5a4a3a : EEL]); }
    return out;
  }
  // A net hung on two poles to dry: its mesh as a lattice of cord, weights along its foot.
  for (const u of [0, len]) { const [x, z] = at(u, along ? cz : cx); out.push([x, 0, z, 0.1, 1.45, 0.1, PILE]); }
  for (let y = 0.25; y <= 1.35; y += 0.22) { const [x, z] = at(len / 2, along ? cz : cx); out.push([x, y, z, along ? len : 0.03, 0.03, along ? 0.03 : len, ROPE]); }
  for (let u = 0.12; u < len; u += 0.24) { const [x, z] = at(u, along ? cz : cx); out.push([x, 0.22, z, 0.03, 1.15, 0.03, ROPE]); }
  for (let u = 0.2; u < len; u += 0.5) { const [x, z] = at(u, along ? cz : cx); out.push([x, 0.16, z, 0.08, 0.08, 0.08, 0x6a6470]); }
  return out;
}
