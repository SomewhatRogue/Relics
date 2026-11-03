/**
 * Wickhold under siege, and the gallows in Hangman's Wood, in 3D (siegedraw.ts is the flat one): the
 * gallows, a plank deck on legs with a step up, two uprights and a beam, an empty noose, a crow
 * hunched on the beam; and a wicker hurdle, withies woven between stakes. Merged boxes, like the walls.
 */
import type { Block } from '../../shared/arena';
import { Boxes, Seed, jit } from './boxes';

const PLANK = 0x5a3d22, DARK = 0x2e2016, POST = 0x4a3420, ROPE = 0x8a7a5a;

export function siegeBlock(B: Boxes, b: Block, r: Seed): void {
  const x0 = b.x, x1 = b.x + b.w, z0 = b.y, z1 = b.y + b.h, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  if (b.kind === 'hurdle') {
    for (let x = x0 + 0.06; x <= x1; x += 0.42) B.b(x, 0, cz, 0.08, 0.95 + r.next() * 0.12, 0.08, jit(0x3a2818, 0.1, r));
    for (let y = 0.08, i = 0; y < 0.85; y += 0.11, i++) B.b(cx, y, cz + (i % 2 ? 0.03 : -0.03), b.w - 0.06, 0.08, 0.05, jit(i % 3 ? 0x5a4a30 : 0x4a3c26, 0.12, r));
    return;
  }
  // The deck on its legs, plank by plank, and a step up at the front.
  const deck = 0.5;
  for (const [lx, lz] of [[x0 + 0.1, z0 + 0.1], [x1 - 0.1, z0 + 0.1], [x0 + 0.1, z1 - 0.1], [x1 - 0.1, z1 - 0.1]]) B.b(lx, 0, lz, 0.12, deck, 0.12, DARK);
  for (let x = x0, i = 0; x < x1 - 0.01; x += 0.26, i++) B.b(Math.min(x + 0.13, x1 - 0.13), deck, cz, 0.24, 0.07, b.h, jit(i % 2 ? PLANK : 0x4e3520, 0.08, r));
  B.b(cx, 0, z1 + 0.2, 0.7, 0.25, 0.32, jit(PLANK, 0.1, r));
  // Two uprights, the beam across with braces, an empty noose from the middle.
  const top = deck + 1.75;
  for (const ux of [x0 + 0.2, x1 - 0.2]) {
    B.b(ux, deck, cz, 0.16, top - deck, 0.16, POST);
    B.c(ux + (ux < cx ? 0.22 : -0.22), top - 0.28, cz, 0.08, 0.5, 0.08, POST, 0, 0, ux < cx ? -0.8 : 0.8);
  }
  B.b(cx, top, cz, b.w, 0.16, 0.18, PLANK);
  const nx = cx + 0.12;
  B.b(nx, top - 0.62, cz, 0.04, 0.62, 0.04, ROPE);
  for (let a = 0; a < 8; a++) {
    const q = (a / 8) * Math.PI * 2;
    B.c(nx + Math.cos(q) * 0.13, top - 0.8 + Math.sin(q) * 0.16, cz, 0.04, 0.06, 0.04, ROPE, 0, 0, q);
  }
  // The crow, hunched on the beam, its beak catching the light.
  const crow = x0 + 0.5;
  B.b(crow, top + 0.16, cz, 0.18, 0.14, 0.24, 0x16141c);
  B.b(crow, top + 0.3, cz + 0.08, 0.12, 0.1, 0.12, 0x16141c);
  B.b(crow, top + 0.32, cz + 0.17, 0.04, 0.03, 0.08, 0xc8a040);
}
