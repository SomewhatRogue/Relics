/**
 * The square's job board and Public Works sign in the 2.5D view (../postdraw.ts draws the flat view's): the
 * same pieces built of boxes on the stalls' footprints. The board: two posts, a planked board with notices
 * pinned to it, a fascia under a shingle roof (its word is tags3d.ts's), a lantern off the eave. The works:
 * scaffold poles, a top board for its word, a sign hung on ropes, planks stacked and a mortar tub.
 */
import type { Block } from '../../shared/arena';
import type { Boxes } from './boxes';

/** Where the word sits (tiles up), for tags3d.ts. */
export const POST_WORD_Y: Record<string, number> = { JOBS: 2.42, 'PUBLIC WORKS': 2.66 };

export function post3d(B: Boxes, b: Block): void {
  const x0 = b.x, x1 = b.x + b.w, cx = (x0 + x1) / 2, cz = b.y + b.h / 2, front = b.y + b.h;
  if (b.label === 'JOBS') {
    for (const px of [x0 + 0.3, x1 - 0.3]) B.b(px, 0, cz, 0.16, 2.3, 0.16, 0x5a3d22);
    B.b(cx, 0.55, cz, b.w - 0.5, 0.08, 0.12, 0x5a3d22);
    // The board and its notices, a hair proud of it.
    B.b(cx, 0.75, cz, b.w - 0.6, 1.45, 0.08, 0x7a5a36);
    const nz = cz + 0.06;
    for (const [dx, y, w, h, col] of [[-0.55, 1.55, 0.42, 0.55, 0xe6dcc0], [-0.02, 1.5, 0.5, 0.66, 0xd8cca8], [0.52, 1.6, 0.32, 0.5, 0xe6dcc0], [-0.4, 0.92, 0.55, 0.42, 0xd8cca8], [0.35, 0.9, 0.6, 0.38, 0xe6dcc0]] as const)
      B.b(cx + dx, y, nz, w, h, 0.02, col);
    // The WANTED's red band and the goblin's face, a red seal.
    B.b(cx - 0.02, 2.06, nz + 0.01, 0.38, 0.05, 0.02, 0x7a1d1d), B.b(cx - 0.02, 1.8, nz + 0.01, 0.24, 0.18, 0.02, 0x5a7a3a), B.b(cx - 0.4, 1.6, nz + 0.01, 0.06, 0.06, 0.02, 0x9a2020);
    // Fascia and roof.
    B.b(cx, 2.3, cz + 0.06, b.w + 0.1, 0.42, 0.06, 0x5a3d22);
    B.c(cx, 2.85, cz - 0.12, b.w + 0.3, 0.1, 0.62, 0x5a4848, 0, -0.5);
    B.c(cx, 2.85, cz + 0.36, b.w + 0.3, 0.1, 0.62, 0x4e3e3e, 0, 0.5);
    // A lantern off the eave, a paste pot at the foot.
    B.b(x1 - 0.05, 2.0, cz + 0.2, 0.16, 0.24, 0.16, 0xffd27a);
    B.b(x0 + 0.65, 0, front - 0.05, 0.28, 0.24, 0.24, 0x6a5a48);
    return;
  }
  // Public Works: poles, the top board, a lower board, the sign on ropes, planks and a mortar tub.
  for (const px of [x0 + 0.12, x1 - 0.12]) B.b(px, 0, cz, 0.13, 2.95, 0.13, 0x8a6a3a);
  B.b(cx, 2.42, cz + 0.05, b.w, 0.45, 0.08, 0x7a5a32);
  B.b(cx, 1.12, cz, b.w, 0.12, 0.1, 0x7a5a32);
  for (const dx of [-0.6, 0.6]) B.b(cx + dx, 2.06, cz + 0.05, 0.04, 0.36, 0.04, 0xc8b88a);
  B.b(cx, 1.38, cz + 0.06, 1.6, 0.68, 0.06, 0x9a7a4a);
  B.b(cx - 0.25, 1.68, cz + 0.1, 0.55, 0.06, 0.02, 0x5a3d22), B.b(cx + 0.05, 1.62, cz + 0.1, 0.24, 0.24, 0.02, 0x8a8f9a);
  B.b(cx + 0.48, 1.5, cz + 0.1, 0.36, 0.44, 0.02, 0xd8d0bc);
  for (let i = 0; i < 3; i++) B.b(cx - 0.55 + (i % 2) * 0.06, i * 0.13, front - 0.25, 1.3, 0.12, 0.3, i % 2 ? 0x7a5a32 : 0x9a7a4a);
  B.b(cx + 0.95, 0, front - 0.25, 0.5, 0.42, 0.4, 0x6a6a70);
}
