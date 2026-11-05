/**
 * Graves and barrows in 2.5D (the flat view's `mound` mark, marks.ts): turned earth heaped a little
 * over the mark's footprint, a lighter crest along its top, and the stick cross standing at its head
 * where FLAT paints it (2 pixels in, its foot on the mound's top edge). The painting stays on the floor
 * under it; this stands it up. Built into the map's one merged mesh.
 */
import type { GameMap } from '../../shared/arena';
import { jit, type Boxes, type Seed } from './boxes';

const EARTH = [0x3a2e22, 0x43352a, 0x33281e], CREST = 0x54443a, STICK = 0x6b4a2b;

export function addMounds(B: Boxes, m: GameMap, r: Seed): void {
  for (const k of m.marks ?? []) {
    if (k.kind !== 'mound') continue;
    const cx = k.x + k.w / 2, cz = k.y + k.h / 2, tall = Math.min(0.42, 0.12 + k.h * 0.12);
    // The heap: a long low lump the length of it, two smaller ones to break its line, the crest on top.
    B.lump(cx, tall * 0.4, cz, k.w * 0.95, tall, k.h * 0.85, jit(EARTH[1], 0.06, r), 0);
    for (const s of [-1, 1]) B.lump(cx + s * k.w * 0.22, tall * 0.35, cz + (r.next() - 0.5) * k.h * 0.2, k.w * 0.45, tall * 0.8, k.h * 0.7, jit(EARTH[s < 0 ? 0 : 2], 0.06, r), r.next() * 3);
    B.lump(cx, tall * 0.75, cz - k.h * 0.08, k.w * 0.6, tall * 0.35, k.h * 0.3, CREST, 0);
    // The marker: a stick with a crosspiece, at the head.
    const sx = k.x + 2.5 / 16, sz = k.y + 1 / 16;
    B.b(sx, 0, sz, 0.06, 0.58, 0.06, STICK);
    B.b(sx, 0.36, sz, 0.32, 0.06, 0.06, STICK);
  }
}
