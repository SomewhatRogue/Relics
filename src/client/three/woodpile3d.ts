/**
 * A house's kindling in 2.5D (shared/kindling.ts): split logs stacked against the side wall, three
 * rows, running along it; black once the house has caught, a low char after it falls. The glint and
 * the ring while it's lit are the flat layer's (extras3d.ts, from kindledraw.ts).
 */
import type { Kindling } from '../../shared/kindling';
import { Seed, jit, type Boxes } from './boxes';

export function woodpile(W: Boxes, k: Kindling, burnt: boolean, ruined: boolean): void {
  const r = new Seed(Math.round(k.x * 13 + k.y * 7)), wall = k.x - k.side * 0.32;
  // The oil-dark ground under it.
  W.b(wall + k.side * 0.3, 0, k.y, 0.62, 0.012, 0.95, 0x17120f);
  if (ruined) return void W.b(wall + k.side * 0.2, 0, k.y, 0.36, 0.06, 0.7, 0x141010);
  for (let row = 0; row < 3; row++) for (let i = 0; i < 3 - row; i++) {
    const x = wall + k.side * (0.1 + i * 0.15 + row * 0.075), y = 0.075 + row * 0.13;
    W.c(x, y, k.y + (r.next() - 0.5) * 0.06, 0.13, 0.13, 0.78, burnt ? 0x1e1612 : jit(0x5c4128, 0.12, r), 0, 0, 0);
    // The cut end toward the street, paler.
    if (!burnt) W.c(x, y, k.y + 0.4, 0.1, 0.1, 0.02, 0xb08a58);
  }
}
