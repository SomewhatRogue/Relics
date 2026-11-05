/**
 * The halls' own furniture in 2.5D, as hallsdraw.ts paints it and from the same blocks: the tower's
 * bookcases (books and jars in the flat view's colours) and its stone stair curling up into the dark,
 * the barracks' bunks, map table, dummy and weapon racks, the lodge's skinning bench, the Rat's dice
 * table, casks and Whisper's curtained booth, desks of open books and jars, the forge's bellows and
 * quench tub. House furniture is furnish3d.ts.
 */
import type { Block } from '../../shared/arena';
import { LOOK } from '../blocklook';
import { BOOKS, JARS } from '../hallsdraw';
import { Boxes, Seed, jit } from './boxes';
import { hex } from './mats';
import { T, type Tint } from './furnish3d';

/** Build one of the halls' pieces into B; false if it isn't one. */
export function hallFurn3d(B: Boxes, b: Block, r: Seed, dk: Tint): boolean {
  const L = LOOK[b.kind], x0 = b.x, x1 = b.x + b.w, z0 = b.y, z1 = b.y + b.h, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const W = b.w, D = b.h, top = dk(hex(L.roof)), tall = L.tall * T, pick = (a: string[]) => dk(hex(a[Math.floor(r.next() * a.length)]));
  // A table: its top, an apron under it, a leg at each corner.
  const table = (h: number, col: number) => {
    B.b(cx, h - 0.07, cz, W, 0.07, D, col), B.b(cx, h - 0.15, cz, W - 0.1, 0.08, D - 0.1, dk(0x3a2818));
    for (const [x, z] of [[x0 + 0.08, z0 + 0.08], [x1 - 0.08, z0 + 0.08], [x0 + 0.08, z1 - 0.08], [x1 - 0.08, z1 - 0.08]]) B.b(x, 0, z, 0.08, h - 0.07, 0.08, dk(0x2a1d12));
    return h;
  };
  // A spot on a table's top by the flat painting's pixel (px across, py down the footprint).
  const at = (px: number, py: number): [number, number] => [x0 + px * T, z0 + py * T];
  switch (b.kind) {
    case 'books': {
      // Shelf on shelf of books, a jar here and there, in a dark case against the wall.
      const frame = dk(0x3a2818), dep = Math.min(0.42, D - 0.16), zf = z0 + 0.1 + dep / 2;
      B.b(cx, 0, z0 + 0.05, W, tall, 0.1, dk(0x2a1d12));
      for (const s of [x0 + 0.04, x1 - 0.04]) B.b(s, 0, cz, 0.08, tall, D, frame);
      B.b(cx, tall - 0.08, cz, W, 0.08, D, frame), B.b(cx, 0, cz, W, 0.1, D, frame);
      for (let row = 0; row < 3; row++) {
        const y = 0.1 + row * 0.47;
        if (row) B.b(cx, y - 0.04, cz, W - 0.1, 0.04, D, dk(0x5a3d22));
        for (let x = x0 + 0.1; x < x1 - 0.14;) {
          if (r.next() < 1 / 6) {
            B.b(x + 0.08, y, zf, 0.16, 0.16, 0.16, pick(JARS)), B.b(x + 0.08, y + 0.16, zf, 0.06, 0.04, 0.06, dk(0x8a8494));
            x += 0.19;
            continue;
          }
          const bw = (1 + Math.floor(r.next() * 2)) * T + 0.01, bh = (4 + Math.floor(r.next() * 2)) * T * 1.05, lean = r.next() < 0.07 ? 0.3 : 0;
          B.c(x + bw / 2, y + bh / 2, zf, bw, bh, dep, pick(BOOKS), 0, 0, lean);
          x += bw + (r.next() < 0.25 ? 0.03 : 0.006);
        }
      }
      return true;
    }
    case 'stair': {
      // Stone steps curling up and round into the dark, a rope on posts for a rail, the stairwell's wall.
      const n = 9, rise = 2.3, dark = dk(0x1d1b24), pw = W * 16 - 16;
      B.b(x1 - 0.12, 0, cz, 0.24, rise + 0.4, D, dark);
      B.b(cx, rise + 0.25, z0 + 0.5, W, 0.25, 1.0, dark);
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1), sx = x0 + (2 + Math.sin(t * 2.4) * pw * 0.5 + pw * 0.5 * t + 7) * T, y = 0.16 + t * (rise - 0.16), sz = z1 - 0.3 - t * (D - 0.65);
        B.b(sx, 0, sz, 14 * T, y, 0.48, jit(dk(0x2e2a34), 0.06, r));
        B.b(sx, y - 0.04, sz + 0.01, 14 * T + 0.02, 0.05, 0.5, dk(0x6a6470));
        B.b(sx + 7 * T + 0.03, y, sz, 0.04, 0.42, 0.04, dk(0x8a7a5a));
        if (i < n - 1) B.b(sx + 7 * T + 0.03, y + 0.4, sz - 0.17, 0.03, 0.03, 0.36, dk(0x8a7a5a));
      }
      return true;
    }
    case 'dummy':
      // A straw man on a post: a crossbar for arms, a target on his chest, an old helm.
      B.b(cx, 0, cz, 0.5, 0.06, 0.4, dk(0x3a2818)), B.b(cx, 0, cz, 0.08, 1.45, 0.08, dk(0x4a3420));
      B.b(cx, 1.02, cz, 0.78, 0.08, 0.08, dk(0x5a3d22)), B.b(cx, 0.52, cz, 0.42, 0.6, 0.3, dk(0x8a7448));
      B.b(cx, 0.72, cz + 0.16, 0.24, 0.24, 0.02, dk(0x7a1d1d)), B.b(cx, 0.79, cz + 0.17, 0.1, 0.1, 0.02, dk(0xd8d0bc));
      B.b(cx, 1.12, cz, 0.3, 0.3, 0.28, dk(0x6a6470)), B.b(cx, 1.24, cz + 0.145, 0.3, 0.05, 0.02, dk(0x4a4652));
      return true;
    case 'maptable': {
      // The valley on a hide: a river winding across, pins where the dens are.
      const h = table(tall, top);
      B.b(cx, h, cz, W - 0.25, 0.015, D - 0.14, dk(0x9a8a62));
      for (let px = 3; px < W * 16 - 3; px++) B.b(x0 + (px + 0.5) * T, h + 0.015, z0 + (2.5 + D * 8 + Math.sin(px * 0.3) * 3) * T, T, 0.01, T, dk(0x3a5a7a));
      for (let i = 0; i < 6; i++) B.b(x0 + 0.25 + r.next() * (W - 0.5), h, z0 + 0.15 + r.next() * (D - 0.3), 0.04, 0.12, 0.04, dk(i % 2 ? 0x7a1d1d : 0x2a2018));
      return true;
    }
    case 'dicetable': {
      // Felt in a frame, two dice and the cup, coins about.
      const h = table(tall, top);
      B.b(cx, h, cz, W - 0.25, 0.015, D - 0.25, dk(0x3a2a1a));
      for (const [px, py] of [[6, 5], [10, 6]]) {
        const [x, z] = at(px, py);
        B.b(x, h + 0.015, z, 0.11, 0.11, 0.11, dk(0xe8e0c8), r.next());
      }
      const [ux, uz] = at(15.5, 4.5);
      B.b(ux, h, uz, 0.17, 0.22, 0.17, dk(0x5a3d22));
      for (let i = 0; i < 5; i++) B.b(x0 + (18 + r.next() * Math.max(1, W * 16 - 24)) * T, h + 0.015, z0 + (3 + r.next() * Math.max(1, D * 16 - 6)) * T, 0.06, 0.02, 0.06, dk(0xd4a537));
      return true;
    }
    case 'skinbench': {
      // A hide stretched on the bench, a knife laid by it.
      const h = table(tall, top);
      B.b(x0 + (4 + (W * 16 - 10) / 2) * T, h, cz, (W * 16 - 10) * T, 0.02, D - 0.25, dk(0x7a5a3a));
      B.b(x0 + (6 + (W * 16 - 14) / 2) * T, h + 0.02, cz, (W * 16 - 14) * T, 0.015, D - 0.4, dk(0x8a6a46));
      B.b(x1 - 4.5 * T, h, z0 + 6 * T, 0.04, 0.02, 6 * T, dk(0xcfd6dc)), B.b(x1 - 4.5 * T, h, z0 + 10 * T, 0.05, 0.04, 2 * T, dk(0x3a2818));
      return true;
    }
    case 'desk': {
      // Open books, jars, an inkwell, a candle stub (ledgers on a long one).
      const h = table(tall, top);
      for (let px = 3; px < W * 16 - 6; px += 9 + Math.floor(r.next() * 6)) {
        const pz = 2 + Math.floor(r.next() * 3);
        B.b(x0 + (px + 3) * T, h, z0 + (pz + 2) * T, 6 * T, 0.025, 4 * T, dk(0xd8d0bc)), B.b(x0 + (px + 3.5) * T, h + 0.025, z0 + (pz + 2) * T, 0.02, 0.01, 4 * T, dk(0x8a8070));
      }
      B.b(x1 - 5 * T, h, z0 + 3.5 * T, 2 * T, 0.1, 2 * T, dk(0x14121a)), B.b(x1 - 2.5 * T, h, z0 + 4 * T, 0.05, 0.16, 0.05, dk(0xe8e0c8));
      for (let i = 0; i < Math.round((W * 16) / 14); i++) B.b(x0 + (3 + r.next() * (W * 16 - 6)) * T, h, z1 - 3 * T, 2 * T, 3 * T, 2 * T, pick(JARS));
      return true;
    }
    case 'tub': {
      // The quench tub (or a basin): plank sides bound in iron, dark water.
      const wood = dk(hex(L.wall)), band = dk(0x2a2630);
      for (const s of [-1, 1]) B.b(cx, 0, cz + s * (D / 2 - 0.04), W, tall, 0.08, wood), B.b(cx + s * (W / 2 - 0.04), 0, cz, 0.08, tall, D, wood);
      for (const y of [0.06, tall - 0.12]) B.b(cx, y, cz, W + 0.02, 0.04, D + 0.02, band);
      for (const s of [-1, 1]) B.b(cx, tall, cz + s * (D / 2 - 0.04), W + 0.02, 0.03, 0.1, top), B.b(cx + s * (W / 2 - 0.04), tall, cz, 0.1, 0.03, D + 0.02, top);
      B.b(cx, 0, cz, W - 0.12, tall - 0.1, D - 0.12, dk(0x1e2a36)), B.b(cx - 3 * T, tall - 0.1, cz - 0.05, W - 10 * T, 0.01, T, dk(0x4a5a6a));
      return true;
    }
    case 'bellows':
      // A leather wedge on a frame, its handle at the back, the nozzle to the fire.
      B.b(cx - 0.05, 0, cz, W * 0.8, 0.08, D * 0.8, dk(0x3a2818));
      B.b(cx - 0.05, 0.08, cz, W * 0.7, 0.16, D * 0.75, dk(hex(L.wall)));
      B.c(cx - 0.05, 0.28, cz, W * 0.75, 0.05, D * 0.8, top, 0, 0, 0.14);
      B.b(x1 - 0.12, 0.12, cz, 0.24, 0.08, 0.08, dk(0x6a6470)), B.b(x0 + 0.06, 0.3, cz, 0.2, 0.05, 0.12, dk(0x3a2818));
      return true;
    case 'booth': {
      // A curtained booth: dark inside, a seat at the back, a heavy curtain mostly drawn across.
      const frame = dk(0x2a1d12);
      B.b(cx, 0, z0 + 0.05, W, tall, 0.1, frame), B.b(cx, tall - 0.08, cz, W, 0.08, D, frame);
      for (const s of [x0 + 0.05, x1 - 0.05]) B.b(s, 0, cz, 0.1, tall, D, frame);
      B.b(cx, 0, cz, W - 0.2, 0.02, D - 0.2, dk(0x14100c)), B.b(cx, 0, z0 + 0.3, W - 0.3, 0.4, 0.35, dk(0x3a2818));
      B.b(cx, tall - 0.2, z1 - 0.06, W, 0.06, 0.06, dk(0x3a2818));
      for (let px = 0; px < W * 16 * 0.7; px += 3) B.b(x0 + (px + 1.5) * T, 0.02, z1 - 0.08 + (px % 6 ? 0.03 : 0), 3 * T, tall - 0.24, 0.05, dk(px % 6 ? 0x5a1e1e : 0x4a1818));
      return true;
    }
    case 'bunk':
      // Two beds one over the other on corner posts, blankets in the barracks' red, pillows at the head.
      for (const [x, z] of [[x0 + 0.04, z0 + 0.04], [x1 - 0.04, z0 + 0.04], [x0 + 0.04, z1 - 0.04], [x1 - 0.04, z1 - 0.04]]) B.b(x, 0, z, 0.08, 1.3, 0.08, top);
      for (const y of [0.18, 0.82]) {
        B.b(cx, y, cz, W - 0.06, 0.08, D - 0.06, top);
        B.b(cx, y + 0.08, cz + 0.16, W - 0.14, 0.1, D - 0.5, dk(0x5a2a2a)), B.b(cx, y + 0.08, z0 + 0.22, W - 0.22, 0.1, 0.26, dk(0xd8d0bc));
      }
      return true;
    case 'casks': {
      // Casks on their sides in a cradle, two high, their round ends to the room.
      const n = Math.max(1, Math.round(W / 0.42)), s = (W / n) * 0.92, len = D / 2 - 0.06, wood = dk(0x6b4a2b);
      B.b(cx, 0, cz, W, 0.08, D, dk(0x2a1d12));
      for (let row = 0; row < 2; row++) for (let i = 0; i < n; i++) for (const seg of [0, 1]) {
        const x = x0 + ((i + 0.5) * W) / n, y = 0.08 + s / 2 + row * s * 0.95, z = z0 + 0.03 + len / 2 + seg * (len + 0.06);
        for (const rz of [0, Math.PI / 4]) {
          B.c(x, y, z, s, s, len, jit(wood, 0.08, r), 0, 0, rz);
          for (const e of [-0.32, 0.32]) B.c(x, y, z + e * len, s * 1.04, s * 1.04, 0.04, dk(0x2a2630), 0, 0, rz);
        }
        if (seg) B.c(x, y, z + len / 2 + 0.005, s * 0.62, s * 0.62, 0.02, dk(0x5a3d22), 0, 0, Math.PI / 8), B.b(x, y - 0.03, z + len / 2 + 0.01, 0.06, 0.06, 0.02, dk(0x3a2818));
      }
      return true;
    }
    case 'rack': {
      // A weapon rack: two posts and two rails, spears and swords stood in it (the flat one's grey staves).
      if (b.label === 'CORDWOOD') return false;
      const along = W >= D, len = along ? W : D, frame = dk(0x4a3420), steel = dk(0x9aa3ad), P = (a: number): [number, number] => (along ? [x0 + a, cz] : [cx, z0 + a]);
      for (const a of [0.05, len - 0.05]) {
        const [x, z] = P(a);
        B.b(x, 0, z, 0.09, 1.0, 0.09, frame);
      }
      for (const y of [0.14, 0.8]) B.c(cx, y, cz, along ? W : 0.06, 0.06, along ? 0.06 : D, frame);
      for (let a = 3 * T, i = 0; a < len - 0.1; a += 3 * T, i++) {
        const [x, z] = P(a), lean = (i % 2 ? 1 : -1) * 0.06;
        if (i % 3 === 2) B.c(x, 0.5, z, 0.07, 0.85, 0.03, steel, along ? 0 : Math.PI / 2, lean), B.c(x, 0.1, z, 0.18, 0.04, 0.05, frame, along ? 0 : Math.PI / 2);
        else B.c(x, 0.55, z, 0.05, 1.1, 0.05, dk(0x8a8494), 0, lean), B.c(x, 1.15, z - lean * 0.6, 0.07, 0.18, 0.04, steel, along ? 0 : Math.PI / 2, lean);
      }
      return true;
    }
  }
  return false;
}
