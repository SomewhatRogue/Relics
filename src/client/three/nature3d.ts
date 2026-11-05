/**
 * The round things the flat view draws as rounded sprites (sprites.ts, sitedraw.ts), stood up rounded
 * in 2.5D rather than as cubes: a boulder (an ellipse with a lighter top), a standing stone (taller than
 * it is wide, its top rounded: a barrow's ring, the Barrowfields' stones), a bush (three round clumps,
 * two red berries: a hedge is a row of them), a hay bale (a round bale, a lighter crown, its band) and a
 * charcoal clamp (a low earth mound, turf on top). Into the map's one merged mesh.
 */
import type { Round } from '../../shared/arena';
import { jit, type Boxes, type Seed } from './boxes';

/** Build `o` if it's one of these; false if not. */
export function addNature(B: Boxes, o: Round, r: Seed): boolean {
  const x = o.x, z = o.y, R = Math.max(0.25, o.r);
  switch (o.kind) {
    case 'rock':
      // The sprite's boulder (14 by 9 pixels), a smaller one leaning on it, a lighter top where the light falls.
      B.lump(x, R * 0.42, z, R * 1.9, R * 1.1, R * 1.5, jit(0x4a4652, 0.1, r), r.next() * 3);
      B.lump(x - R * 0.35, R * 0.75, z - R * 0.1, R * 0.95, R * 0.5, R * 0.8, jit(0x5a5664, 0.08, r), r.next() * 3);
      B.lump(x + R * 0.7, R * 0.22, z + R * 0.35, R * 0.7, R * 0.5, R * 0.6, jit(0x34313a, 0.1, r), r.next() * 3);
      return true;
    case 'stone': {
      // A standing stone (8 by 10 pixels): upright, its top rounded, a dark line at its foot.
      const w = R * 0.95, d = R * 0.6, h = R * 1.55, ry = (r.next() - 0.5) * 0.5;
      B.c(x, h / 2, z, w, h, d, jit(0x5a5664, 0.06, r), ry, (r.next() - 0.5) * 0.08, (r.next() - 0.5) * 0.12);
      B.lump(x, h, z, w * 1.02, w * 0.62, d * 1.05, jit(0x5a5664, 0.06, r), ry);
      B.c(x, h * 0.62, z + d / 2, w * 0.35, 0.05, 0.02, 0x45414c, ry);
      B.b(x, 0, z, w * 0.75, 0.04, d * 1.15, 0x34313a, ry);
      return true;
    }
    case 'bush':
      // Three round clumps in the sprite's three greens, two red berries showing.
      B.lump(x, 0.3, z, R * 2.1, 0.62, R * 1.5, jit(0x26361f, 0.08, r), r.next() * 3);
      B.lump(x - R * 0.35, 0.48, z + R * 0.1, R * 1.15, 0.45, R * 0.95, jit(0x2f4a28, 0.08, r), r.next() * 3);
      B.lump(x + R * 0.4, 0.42, z + R * 0.15, R * 1.0, 0.4, R * 0.85, jit(0x2a4024, 0.08, r), r.next() * 3);
      for (const [dx, dy] of [[-0.45, 0.32], [0.45, 0.38]]) B.c(x + dx * R, dy, z + R * 0.62, 0.06, 0.06, 0.06, 0x7a2a3a);
      return true;
    case 'hay':
      // A bale (the sprite's 16 by 11 pixels): its sides, a rounded top no wider than them, lighter
      // where the light falls, and the band round its foot.
      B.b(x, 0, z, R * 1.8, 0.4, R * 1.3, jit(0xa08c44, 0.04, r));
      B.lump(x, 0.4, z, R * 1.8, 0.4, R * 1.3, jit(0xa89448, 0.04, r), 0);
      B.lump(x - R * 0.25, 0.52, z - R * 0.15, R * 0.9, 0.22, R * 0.65, 0xb8a050, 0);
      B.b(x, 0.12, z, R * 1.84, 0.05, R * 1.34, 0x8a7a3a);
      return true;
    case 'clamp':
      // A charcoal clamp: earth heaped low and wide, turf over its crown, vents dark in its side.
      B.lump(x, 0.18, z, R * 3.0, 0.5, R * 1.6, jit(0x2a2420, 0.06, r), 0);
      B.lump(x, 0.32, z - R * 0.05, R * 2.3, 0.4, R * 1.2, jit(0x33302a, 0.06, r), 0);
      B.lump(x - R * 0.1, 0.44, z - R * 0.1, R * 1.6, 0.26, R * 0.8, jit(0x2e3a22, 0.08, r), 0);
      for (const dx of [-0.8, 0.5]) B.c(x + dx * R, 0.16, z + R * 0.74, 0.18, 0.06, 0.04, 0x1a1410);
      return true;
    default:
      return false;
  }
}
