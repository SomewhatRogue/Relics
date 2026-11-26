/**
 * The fallen trunk over the High Wood's stream (shared/highwoodground.ts, block `trunkbridge`; docs/design/the-high-wood.md,
 * THE OLD TREES): a long oak log laid along the crossing, bark in four shades lit from its left, the near end sawn
 * pale where it broke, a green roll of moss down its top and in the dips, a root flare and a snapped branch stub at
 * the south end, shadow under it on the water. A deck: walkable the whole way (`deck: true`, never collided with), so it
 * is built low as boxes in the pieces list (pieces.ts) and not a standing card. Paint only.
 */
import type { Bx } from './pieces';

const D = 0x1a120b, M = 0x2b1d12, L = 0x3f2b19, H = 0x56402a, MOSS = 0x34502a, MOSS_D = 0x1f3a22, HEART = 0xcdbf94, HEART_D = 0x9a875c, SHADE = 0x0a0807;

export function trunkBoxes(b: { w: number; h: number }, r: () => number): Bx[] {
  const w = b.w, d = b.h, cx = w / 2, out: Bx[] = [];
  const lo = 0.12, hi = d - 0.12, len = hi - lo, mid = (lo + hi) / 2;
  // The shadow on the water beneath, then the log in four slabs across: dark under, mid, lit, the lit top.
  out.push([cx, 0, mid, w * 0.78, 0.04, len + 0.1, SHADE]);
  out.push([cx + 0.28, 0.02, mid, 0.5, 0.16, len, D], [cx + 0.06, 0.04, mid, 0.62, 0.22, len, M], [cx - 0.2, 0.06, mid, 0.5, 0.24, len, L]);
  out.push([cx - 0.12, 0.26, mid, 0.78, 0.1, len - 0.04, H, 'lump']);
  // Bark furrows: thin dark strips along it, and a course or two across where it was gnawed.
  for (const x of [-0.3, 0.02, 0.3]) out.push([cx + x, 0.3, mid, 0.04, 0.03, len - 0.1, D]);
  // The ends sawn by the break: pale heart, a dark ring.
  for (const z of [lo + 0.02, hi - 0.02]) out.push([cx, 0.04, z, 0.9, 0.26, 0.05, HEART_D], [cx - 0.1, 0.09, z + (z < mid ? -0.02 : 0.02), 0.5, 0.14, 0.04, HEART]);
  // Moss: a roll down its top, patches in the dips, brighter on the left.
  for (let z = lo + 0.2; z < hi - 0.2; z += 0.5 + r() * 0.3) out.push([cx - 0.02 + (r() - 0.5) * 0.3, 0.32, z, 0.36 + r() * 0.2, 0.07, 0.42 + r() * 0.2, r() < 0.5 ? MOSS : MOSS_D, 'lump']);
  // Root flare and a snapped branch stub at the south end; two more stubs along the side.
  out.push([cx + 0.1, 0, hi - 0.1, 1.6, 0.22, 0.5, M, 'lump'], [cx - 0.5, 0.06, hi - 0.05, 0.4, 0.2, 0.7, L, 'lump'], [cx + 0.6, 0.04, hi - 0.1, 0.4, 0.16, 0.5, D, 'lump']);
  out.push([cx + 0.62, 0.12, mid - 0.5, 0.5, 0.12, 0.14, M], [cx - 0.62, 0.12, mid + 0.7, 0.45, 0.12, 0.14, L]);
  return out;
}
