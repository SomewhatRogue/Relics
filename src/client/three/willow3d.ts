/**
 * A pollard willow in the 2.5D view (docs/design/flora.md, slice 3; ../flora.ts for its look by place, ../florasprites.ts
 * for the flat one): a short fat trunk, a knuckled head where it has been cut back for a hundred years, and a
 * spray of upright shoots in grey-green, the middle ones tallest. It is a tree round with `look: 1`; Sallow Carr's
 * trees are all these, so the carr reads as a willow wood and not a park of round crowns.
 */
import type { Round } from '../../shared/arena';
import { graded as gr } from '../darkgold';
import { CROWN, floraLook, tintHex } from '../flora';
import { Boxes, Seed, jit } from './boxes';

export function addWillow(B: Boxes, o: Round, r: Seed): void {
  const x = o.x, z = o.y, R = Math.max(0.3, o.r), L = floraLook('willow', o.x, o.y, o.r), [kw, kh] = CROWN[L.shape], side = L.flip ? -1 : 1;
  const th = 0.5 + R * 0.55, tw = 0.24 + R * 0.26, top = th + 0.28;
  B.b(x, 0, z, tw, th, tw, jit(gr(0x4c4032, 'wall'), 0.08, r), r.next());
  B.lump(x, th + 0.1, z, tw * 1.9, 0.36, tw * 1.8, jit(gr(0x584a3a, 'wall'), 0.08, r), r.next() * 3);
  const g = (c: number) => jit(gr(tintHex(c, L.green), 'wall'), 0.07, r);
  // (Its leaves move in the wind as any tree's do: wind3d.ts.)
  B.sway = 1;
  // A low dark skirt round the head, then five sprays fanned across it, and two pale tops.
  B.lump(x, top + R * 0.45 * kh, z, R * 2.5 * kw, R * 1.2 * kh, R * 2.2 * kw, g(0x34493a), r.next() * 3);
  for (let i = 0; i < 5; i++) {
    const a = (i - 2) / 2, h = R * (2.3 - Math.abs(a) * 0.75) * kh;
    B.lump(x + a * R * 1.05 * kw * side, top + h * 0.5, z + (i % 2 ? 0.18 : -0.1) * R, R * 0.78 * kw, h, R * 0.7 * kw, g(i % 2 ? 0x567260 : 0x4a6450), r.next() * 3);
  }
  for (const [dx, hh] of [[-0.35, 1.5], [0.3, 1.65]]) B.lump(x + dx * R * kw * side, top + R * hh * kh, z + 0.12 * R, R * 0.42, R * 0.9 * kh, R * 0.4, g(0x7a9480), r.next() * 3);
  B.sway = 0;
}
