/** The 2.5D view's layout-4 pieces: the same boxes the flat view paints (../pieces.ts), built into the map's merged mesh. */
import type { Bx } from '../pieces';
import type { Boxes } from './boxes';

/** Put a piece's boxes with its origin at (ox, oz) on the floor; `dk` darkens a colour (charred). */
export function putBoxes(B: Boxes, bx: Bx[], ox: number, oz: number, dk: (c: number) => number = (c) => c): void {
  for (const [x, y, z, w, h, d, col, shape] of bx) {
    if (shape === 'lump') B.lump(ox + x, y + h / 2, oz + z, w, h, d, dk(col));
    else if (shape === 'cone') B.cone(ox + x, y + h / 2, oz + z, w, h, dk(col));
    else B.b(ox + x, y, oz + z, w, h, d, dk(col));
  }
}
