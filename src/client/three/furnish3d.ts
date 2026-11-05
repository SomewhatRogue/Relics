/**
 * Furniture in 2.5D as the flat view paints it (furnish.ts), from the same block and the same colours
 * (blocks.ts LOOK): a bed with its pillow and blanket, a shelf of pots, a counter, an anvil with its
 * horn, the altar's gilt cross, pews and benches on their legs, a hearth's dark mouth under its lintel
 * (embers in it when it's lit), sacks, the Roll of the Brave, a cottage's inner wall, a loom, a stall
 * of straw. Smashed ones (a turned-over house) are splintered. The halls' own pieces: hallfurn3d.ts.
 */
import * as THREE from 'three';
import type { Block } from '../../shared/arena';
import { LOOK } from '../blocklook';
import { mouth } from '../furnish';
import { Boxes, Seed, jit } from './boxes';
import { G, hex } from './mats';

/** A colour as the block stands now (charred while it burns). */
export type Tint = (c: number) => number;
/** One pixel of the flat painting, in tiles. */
export const T = 1 / 16;

const POTS = [0x7a2a2a, 0x3a5a6a, 0x8a7a3a, 0x5a6a3a];

/** Build a piece of furniture into B (glowing bits into `group`); false if it isn't one of these. */
export function furnish3d(B: Boxes, b: Block, r: Seed, dk: Tint, group: THREE.Group): boolean {
  const L = LOOK[b.kind], x0 = b.x, x1 = b.x + b.w, z0 = b.y, z1 = b.y + b.h, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const W = b.w, D = b.h, top = dk(hex(L.roof)), wall = dk(hex(L.wall)), tall = L.tall * T, smashed = b.look === 1, along = W >= D;
  switch (b.kind) {
    case 'bed':
      // A low frame and headboard, the pillow at the head (the back), the blanket over the rest.
      B.b(cx, 0, cz, W, 0.26, D, wall);
      B.b(cx, 0, z0 + 0.05, W, 0.56, 0.1, wall);
      B.b(cx, 0.26, z0 + 0.27, W - 0.14, 0.1, 0.3, dk(0xd8d0bc));
      B.b(cx, 0.26, (z0 + 0.44 + z1) / 2, W - 0.06, 0.12, D - 0.46, dk(smashed ? 0x3e3456 : 0x5a4a7a));
      break;
    case 'shelf':
      // Boards up the wall, pots and jars on each (gone when the house has been turned over).
      B.b(cx, 0, z0 + 0.05, W, tall, 0.1, wall);
      for (const s of [x0 + 0.04, x1 - 0.04]) B.b(s, 0, cz, 0.08, tall, D, wall);
      for (let p = 3, i = 0; p < L.tall; p += 6, i++) {
        const y = tall - p * T;
        B.b(cx, y - 0.05, cz, W - 0.08, 0.05, D, dk(0x3a2a1a));
        if (!smashed) for (let q = 2, j = 0; q < W * 16 - 2; q += 4, j++) B.b(x0 + (q + 1) * T, y, cz + 0.03, 2 * T, 3 * T, Math.min(0.2, D * 0.5), dk(POTS[(q + p) % 4]));
      }
      break;
    case 'counter':
      // The bar: panelled front, a top proud of it.
      B.b(cx, 0, cz, W - 0.06, tall - 0.08, D - 0.1, wall);
      if (along) for (let x = x0 + 0.45; x < x1 - 0.2; x += 0.8) B.b(x, 0.08, z1 - 0.04, 0.05, tall - 0.24, 0.02, dk(0x3a2818));
      B.b(cx, tall - 0.08, cz, W + 0.06, 0.08, D + 0.06, top);
      B.b(cx, tall - 0.04, z1 + 0.02, W + 0.06, 0.04, 0.04, dk(hex(L.ridge)));
      break;
    case 'anvil':
      // A block under it, the waist, the face (bright where it's struck) and the horn.
      B.b(cx, 0, cz, W * 0.55, 0.16, D * 0.85, wall);
      B.b(cx, 0.16, cz, W * 0.3, 0.16, D * 0.45, wall);
      B.b(cx - W * 0.06, 0.32, cz, W * 0.6, 0.14, D * 0.62, top);
      B.b(cx - W * 0.06, 0.46, cz, W * 0.52, 0.02, D * 0.4, dk(0xa8a2b0));
      B.c(cx + W * 0.32, 0.41, cz, W * 0.24, 0.08, D * 0.3, top, 0, 0, -0.3);
      break;
    case 'altar':
      // Stone under a white cloth hanging over the front, the gilt cross stood on it.
      B.b(cx, 0, cz, W - 0.1, tall - 0.06, D - 0.1, wall);
      B.b(cx, tall - 0.06, cz, W, 0.06, D, top);
      B.b(cx, tall - 0.34, z1 - 0.01, W * 0.5, 0.3, 0.03, top);
      B.b(cx, tall, z0 + 0.3, 0.07, 0.55, 0.07, dk(0xd4a537));
      B.b(cx, tall + 0.34, z0 + 0.3, 0.3, 0.07, 0.07, dk(0xd4a537));
      break;
    case 'pew':
    case 'bench': {
      // A seat on dark legs at either end, a rail between; a pew has its back.
      const seat = b.kind === 'pew' ? 0.36 : 0.4;
      B.b(cx, seat, cz, along ? W : W * 0.8, 0.07, along ? D * 0.8 : D, top);
      for (const e of [-1, 1]) B.b(along ? cx + e * (W / 2 - 0.08) : cx, 0, along ? cz : cz + e * (D / 2 - 0.08), along ? 0.08 : W * 0.7, seat, along ? D * 0.7 : 0.08, dk(0x2a1d12));
      B.b(cx, 0.12, cz, along ? W - 0.2 : 0.05, 0.05, along ? 0.05 : D - 0.2, wall);
      if (b.kind === 'pew' && along) B.b(cx, seat, z0 + 0.06, W, 0.42, 0.07, wall);
      break;
    }
    case 'hearth': {
      // Stone either side of a dark mouth under a lintel, ash in it, a hearthstone before it; embers when lit.
      const m = mouth(Math.round(W * 16), 0, L.tall), mw = m.w * T, mh = m.h * T, mx = x0 + (m.x + m.w / 2) * T, sw = (W - mw) / 2;
      B.b(x0 + sw / 2, 0, cz, sw, tall, D, wall), B.b(x1 - sw / 2, 0, cz, sw, tall, D, wall);
      B.b(mx, mh, cz, mw, tall - mh, D, wall);
      B.b(mx, 0, z0 + D * 0.25, mw, mh, D * 0.5, dk(0x0d0b10));
      B.b(mx, 0, cz + D * 0.25, mw, 0.03, D * 0.5, dk(0x2e2a34));
      for (let x = mx - mw / 2 + 0.06; x < mx + mw / 2 - 0.04; x += 0.12) B.b(x, 0.03, cz + D * 0.2 + r.next() * 0.2, 0.06, 0.04, 0.06, dk(r.next() < 0.5 ? 0x4a4652 : 0x2e2a34));
      B.b(mx, mh - 0.03, z1 + 0.02, mw + 0.14, 0.08, 0.07, dk(0x6a6470));
      B.b(mx, 0, z1 + 0.1, mw + 0.25, 0.03, 0.2, dk(0x57525e));
      B.b(cx, tall, cz, W, 0.04, D, top);
      for (let x = x0 + 0.13; x < x1 - 0.1; x += 0.25) B.b(x, tall + 0.04, cz + (r.next() - 0.5) * D * 0.4, 0.19, 0.05, 0.16, jit(dk(0x3e3a46), 0.1, r));
      if (b.look === 2) {
        const e = new THREE.Mesh(new THREE.BoxGeometry(mw - 0.1, 0.06, D * 0.35), G(0xff6a20, 0.25));
        e.position.set(mx, 0.06, cz + D * 0.12);
        group.add(e);
      }
      break;
    }
    case 'sacks': {
      // Sacks heaped in a row (two deep on a wide pile), each tied at the neck.
      const n = Math.max(1, Math.round(W / 0.4)), rows = D > 0.7 ? 2 : 1;
      for (let j = 0; j < rows; j++) for (let i = 0; i < n; i++) {
        const x = x0 + ((i + 0.5) * W) / n, z = z0 + ((j + 0.5) * D) / rows, s = 0.9 + r.next() * 0.2, lift = rows > 1 && j === 0 ? 0.06 : 0;
        B.lump(x, lift + 0.25 * s, z, (W / n) * 1.08, 0.5 * s, (D / rows) * 0.95, jit(dk(0xb0a06a), 0.08, r), r.next() * 3);
        B.b(x, lift + 0.47 * s, z, 0.09, 0.08, 0.09, dk(0x6a5a3a));
      }
      break;
    }
    case 'monument': {
      // The Roll of the Brave: a stone on a plinth, names cut in rows, a gilt band along its top.
      const f = z1 + 0.005;
      B.b(cx, 0, cz, W + 0.14, 0.12, D + 0.14, dk(0x45414c));
      B.b(cx, 0.12, cz, W, tall - 0.12, D, wall);
      B.b(cx, tall, cz, W + 0.06, 0.07, D + 0.06, top);
      B.b(cx, tall - 2 * T - 0.03, f, W - 2 * T, 0.04, 0.02, dk(0xd4a537));
      for (let p = 5; p < L.tall - 2; p += 3) for (let q = 3; q < W * 16 - 3; q += 4) B.b(x0 + (q + 1) * T, tall - p * T, f, (2 + ((q + p) % 2)) * T, 0.035, 0.02, dk(0x3a3640));
      break;
    }
    case 'partition': {
      // Plaster between timbers, like the room's back wall, rails top and bottom.
      const len = along ? W : D;
      B.b(cx, 0, cz, W, tall, D, wall);
      for (let s = 0; s < len; s += 22 * T) {
        const p = (along ? x0 : z0) + s + 1.5 * T;
        B.b(along ? p : cx, 0, along ? cz : p, along ? 3 * T : W + 0.02, tall, along ? D + 0.02 : 3 * T, top);
      }
      B.b(cx, tall - 2 * T, cz, W + 0.02, 2 * T, D + 0.02, top), B.b(cx, 0, cz, W + 0.02, 3 * T, D + 0.02, top);
      break;
    }
    case 'loom': {
      // Two uprights and a beam, the warp strung between, a band of cloth woven at the bottom.
      const H = tall + 0.3, wood = dk(0x5a3d22);
      B.b(x0 + 0.05, 0, cz, 0.1, H, 0.1, wood), B.b(x1 - 0.05, 0, cz, 0.1, smashed ? H * 0.6 : H, 0.1, wood);
      if (smashed) B.c(x0 + W * 0.3, H - 0.1, cz, W * 0.6, 0.08, 0.08, dk(0x7a5a34), 0, 0, -0.35);
      else B.b(cx, H - 0.1, cz, W, 0.1, 0.1, dk(0x7a5a34));
      B.b(cx, 0.1, cz, W, 0.12, 0.14, dk(0x4a3420));
      for (let x = x0 + 3 * T; x < x1 - 2 * T; x += 2 * T) if (!smashed || x < cx || r.next() < 0.4) B.b(x, 0.22, cz, 0.02, (smashed && x > cx ? H * 0.5 : H) - 0.34, 0.02, dk(0xcfc4a4));
      if (!smashed) for (let i = 0; i < 3; i++) B.b(cx, 0.22 + i * 2 * T, cz + 0.02, W - 0.2, 2 * T, 0.03, dk(i % 2 ? 0x8a6a3a : 0x7a2a2a));
      break;
    }
    case 'pen': {
      // Straw heaped inside its rails, a low gate of two rails across the front.
      for (let i = 0; i < W * D * 5; i++) B.c(x0 + 0.12 + r.next() * (W - 0.24), 0.04 + r.next() * 0.08, z0 + 0.12 + r.next() * (D - 0.24), 0.3, 0.06, 0.12, jit(dk(i % 3 ? 0xa08a54 : 0x6b5a3a), 0.1, r), r.next() * 3);
      for (const [px, pz] of [[x0 + 0.05, z0 + 0.05], [x1 - 0.05, z0 + 0.05], [x0 + 0.05, z1 - 0.05], [x1 - 0.05, z1 - 0.05], [cx, z1 - 0.05]]) B.b(px, 0, pz, 0.1, tall, 0.1, dk(0x5a3d22));
      for (const y of [tall * 0.35, tall * 0.8]) {
        B.b(cx, y, z1 - 0.05, W, 0.08, 0.05, dk(0x7a5a34)), B.b(cx, y, z0 + 0.05, W, 0.08, 0.05, dk(0x6b4a2b));
        for (const x of [x0 + 0.05, x1 - 0.05]) B.b(x, y, cz, 0.05, 0.08, D, dk(0x6b4a2b));
      }
      break;
    }
    default:
      return false;
  }
  // Smashed: boards split and kicked about the floor in front of it.
  if (smashed) for (let i = 0; i < 3 + W * 2; i++) B.c(x0 + r.next() * W, 0.02, z1 + 0.1 + r.next() * 0.6, 0.18 + r.next() * 0.2, 0.03, 0.05, jit(i % 2 ? 0x8b6a3a : 0x2a1d12, 0.1, r), r.next() * 3);
  return true;
}
