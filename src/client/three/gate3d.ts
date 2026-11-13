/**
 * An instance's gate between stretches (sim/stretches.ts) in 2.5D, as gatedraw.ts paints it flat: two posts
 * and a lintel; shut, upright timbers between them with two iron bands; open (`ruined`: no longer solid),
 * the gate hauled up under the lintel. (It fell to the plain box before, and once opened to a burnt ruin.)
 */
import type { Block } from '../../shared/arena';
import type { Boxes } from './boxes';

const H = 1.5, POST = 0x3a2a1a, LINTEL = 0x4a3420, OAK = [0x4a3a28, 0x56442e], IRON = 0x3a3a40, STUD = 0x8a8a94;

export function gate3d(B: Boxes, b: Block): void {
  const x0 = b.x, x1 = b.x + b.w, cz = b.y + b.h / 2, d = Math.min(b.h, 0.5), pw = 0.26;
  B.b(x0 + pw / 2, 0, cz, pw, H, d + 0.1, POST), B.b(x1 - pw / 2, 0, cz, pw, H, d + 0.1, POST);
  B.b((x0 + x1) / 2, H - 0.22, cz, b.w, 0.22, d + 0.16, LINTEL);
  const a = x0 + pw, span = x1 - x0 - pw * 2, n = Math.max(2, Math.round(span / 0.26)), tw = span / n;
  // Shut, the timbers stand floor to lintel; hauled up, only their feet show under it.
  const y0 = b.ruined ? H - 0.5 : 0, th = b.ruined ? 0.28 : H - 0.22;
  for (let i = 0; i < n; i++) B.b(a + tw * (i + 0.5), y0, cz, tw - 0.03, th, d * 0.6, OAK[i % 2]);
  if (b.ruined) return;
  for (const y of [0.4, 1.0]) {
    B.b((x0 + x1) / 2, y, cz, span, 0.1, d * 0.6 + 0.04, IRON);
    for (let x = a + 0.2; x < x1 - pw - 0.1; x += 0.4) B.b(x, y + 0.02, cz + d * 0.3 + 0.03, 0.05, 0.05, 0.02, STUD);
  }
}
