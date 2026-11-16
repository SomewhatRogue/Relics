/**
 * The new look's own furniture in 2.5D (shared/bighalls.ts): the church's stone font, an armour stand (a helm and a
 * breastplate on a post), a tavern table with its tankards and a candle stub. Furnish3d.ts and hallfurn3d.ts have the
 * rest.
 */
import type { Block } from '../../shared/arena';
import { Boxes, Seed, jit } from './boxes';
import type { Tint } from './furnish3d';

/** Build one of these into B; false if it isn't one. */
export function insideFurn3d(B: Boxes, b: Block, r: Seed, dk: Tint): boolean {
  const x0 = b.x, x1 = b.x + b.w, z0 = b.y, z1 = b.y + b.h, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  switch (b.kind) {
    case 'font': {
      // A stepped foot, an eight-sided stem, a deep bowl with water dark in it.
      const s = Math.min(b.w, b.h);
      B.b(cx, 0, cz, s, 0.12, s, dk(0x3e3a46));
      B.c(cx, 0.12, cz, s * 0.45, 0.42, s * 0.45, dk(0x57525e), Math.PI / 8);
      B.c(cx, 0.52, cz, s * 0.86, 0.32, s * 0.86, dk(jit(0x625c6c, 0.05, r)), Math.PI / 8);
      B.c(cx, 0.8, cz, s * 0.7, 0.04, s * 0.7, dk(0x1e2a36), Math.PI / 8);
      return true;
    }
    case 'stand': {
      // A post on a cross foot, a breastplate, a helm on top, a shield leant on it.
      B.b(cx, 0, cz, b.w * 0.9, 0.06, 0.12, dk(0x2e2016));
      B.b(cx, 0, cz, 0.12, 0.06, b.h * 0.9, dk(0x2e2016));
      B.b(cx, 0, cz, 0.08, 1.5, 0.08, dk(0x3a2818));
      B.b(cx, 0.85, cz, b.w * 0.62, 0.55, 0.3, dk(jit(0x6a6878, 0.06, r)));
      B.b(cx, 0.78, cz, b.w * 0.7, 0.1, 0.32, dk(0x4a4652));
      B.b(cx, 1.42, cz, 0.3, 0.3, 0.3, dk(0x74707e));
      B.b(cx, 1.5, cz + 0.16, 0.22, 0.04, 0.02, dk(0x1a1820));
      B.b(x1 - 0.06, 0.1, cz + 0.12, 0.06, 0.62, 0.5, dk(r.next() < 0.5 ? 0x3a5a4a : 0x6a2a2a));
      return true;
    }
    case 'table': {
      // A board on trestles, tankards and a stub of candle on it.
      const h = 0.62;
      B.b(cx, h - 0.07, cz, b.w, 0.07, b.h, dk(jit(0x5a3d22, 0.06, r)));
      for (const x of [x0 + 0.2, x1 - 0.2]) B.b(x, 0, cz, 0.08, h - 0.07, b.h * 0.8, dk(0x2e2016));
      for (let i = 0, n = 2 + Math.floor(r.next() * 3); i < n; i++)
        B.b(x0 + 0.3 + r.next() * (b.w - 0.6), h, z0 + 0.2 + r.next() * (b.h - 0.4), 0.1, 0.14, 0.1, dk(r.next() < 0.6 ? 0x6a5a48 : 0x8a8494));
      B.b(cx, h, cz, 0.06, 0.1, 0.06, dk(0xd8d0bc));
      return true;
    }
  }
  return false;
}
