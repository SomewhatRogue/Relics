/**
 * A fence in 2.5D as the flat view paints one (blocks.ts: a post every 5 pixels, 2 wide, standing the
 * height of the block's face and footprint): posts close together, a hand apart, their heights a little
 * uneven, nailed to two rails behind them. Chained end to end (a palisade across a lane is a row of
 * short fence blocks), they read as one wall of posts, with a gap wherever the map leaves one.
 */
import type { Block } from '../../shared/arena';
import { LOOK } from '../blocklook';
import { jit, type Boxes, type Seed } from './boxes';
import { hex } from './mats';

/** One post every 5 pixels of the flat view (a sixteenth of a tile each), 2 pixels wide. */
const STEP = 5 / 16, POST = 0.13;

export function fence3d(B: Boxes, b: Block, r: Seed, dk: (c: number) => number): void {
  const along = b.w >= b.h, len = along ? b.w : b.h, cx = b.x + b.w / 2, cz = b.y + b.h / 2, L = LOOK.fence;
  const n = Math.max(1, Math.round(len / STEP)), step = len / n, tall = 0.62 + Math.min(0.2, (along ? b.h : b.w) * 0.25);
  for (let i = 0; i < n; i++) {
    const u = (along ? b.x : b.y) + (i + 0.5) * step, h = tall + (r.next() - 0.5) * 0.12;
    B.b(along ? u : cx, 0, along ? cz : u, POST, h, POST, jit(dk(0x6b4a2b), 0.12, r));
  }
  // The rails, behind the posts.
  for (const y of [0.18, tall - 0.22]) B.b(along ? cx : cx - 0.09, y, along ? cz - 0.09 : cz, along ? len : 0.06, 0.07, along ? 0.06 : len, dk(hex(L.wall)));
}
