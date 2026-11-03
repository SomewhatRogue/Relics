/**
 * Roofs from boxes: a gable with its ridge along x (rows of shingles or thatch, the gable ends
 * stepped), and a tent's cloth coming down to the ground. A wrecked roof has holes in it.
 */
import { Boxes, Seed, jit } from './boxes';

export interface RoofOpts {
  /** Shingle (or thatch) colour, ridge colour, gable colour. */
  col: number;
  ridge: number;
  gable: number;
  thatch?: boolean;
  /** A share of shingles missing (a wrecked house). */
  holes?: number;
  /** Pitch (radians). */
  angle?: number;
  /** A span along x with no roof (fallen in). */
  gap?: [number, number];
}

/** Every other row a shade darker, so the rows read. */
const dim = (c: number) => (((c >> 16) & 255) * 0.8) << 16 | (((c >> 8) & 255) * 0.8) << 8 | ((c & 255) * 0.8);

/** A gable roof over x0..x1, z0..z1 from eave height h. Returns the ridge's height. */
export function gable(B: Boxes, x0: number, x1: number, z0: number, z1: number, h: number, o: RoofOpts, r: Seed): number {
  const a = o.angle ?? 0.62, ov = 0.22, zc = (z0 + z1) / 2, hd = (z1 - z0) / 2 + ov;
  const sl = hd / Math.cos(a), ridgeY = h + ((z1 - z0) / 2) * Math.tan(a);
  const rowL = o.thatch ? 0.34 : 0.28, n = Math.ceil(sl / rowL), th = o.thatch ? 0.16 : 0.07;
  for (const side of [1, -1]) {
    // An underlay a shade darker under the courses, so the gaps between shingles read as lines, not holes.
    if (!o.holes) {
      const segs = o.gap ? [[x0 - ov, o.gap[0]], [o.gap[1], x1 + ov]] : [[x0 - ov, x1 + ov]];
      for (const [u0, u1] of segs) if (u1 - u0 > 0.05) B.c((u0 + u1) / 2, ridgeY - (sl / 2) * Math.sin(a) + 0.02, zc + side * (sl / 2) * Math.cos(a), u1 - u0, 0.04, sl, dim(dim(o.col)), 0, side * a);
    }
    for (let i = 0; i < n; i++) {
      const s = ((i + 0.5) * sl) / n;
      let x = x0 - ov - (i % 2) * 0.22;
      while (x < x1 + ov) {
        const L = o.thatch ? 0.8 + r.next() * 0.5 : 0.4 + r.next() * 0.2, xa = Math.max(x, x0 - ov), xb = Math.min(x + L, x1 + ov);
        x += L;
        if (xb - xa < 0.05 || (o.holes && r.next() < o.holes && i > 0 && i < n - 1)) continue;
        if (o.gap && (xa + xb) / 2 > o.gap[0] && (xa + xb) / 2 < o.gap[1]) continue;
        const y = ridgeY - s * Math.sin(a) + th * 0.5 + 0.04, z = zc + side * s * Math.cos(a);
        B.c((xa + xb) / 2, y, z, xb - xa + (o.thatch ? 0.05 : -0.03), th, rowL + 0.06, jit(i % 2 ? o.col : dim(o.col), o.thatch ? 0.16 : 0.14, r), 0, side * a);
        if (!o.thatch) continue;
        // Thatch: each course's cut edge a shade darker, standing proud of the one below, with loose
        // straw here and there, so the roof reads as bundles in rows rather than one tan slope.
        const lo = s + rowL / 2, ly = ridgeY - lo * Math.sin(a) + th * 0.35, lz = zc + side * lo * Math.cos(a);
        B.c((xa + xb) / 2, ly, lz, xb - xa + 0.05, th * 0.7, 0.07, dim(dim(o.col)), 0, side * a);
        for (let t = xa + 0.1; t < xb - 0.1; t += 0.22) if (r.next() < 0.35) B.c(t, ly + 0.03, lz + side * 0.02, 0.05, 0.05, 0.12, jit(r.next() < 0.5 ? 0xb89a5a : 0x6a5634, 0.1, r), 0, side * a + (r.next() - 0.5) * 0.6);
      }
    }
  }
  if (o.gap) {
    for (const [a0, a1] of [[x0 - ov, o.gap[0]], [o.gap[1], x1 + ov]]) if (a1 - a0 > 0.05) B.c((a0 + a1) / 2, ridgeY + 0.06, zc, a1 - a0, 0.14, 0.18, o.ridge);
  } else B.c((x0 + x1) / 2, ridgeY + 0.06, zc, x1 - x0 + ov * 2 + 0.1, o.thatch ? 0.22 : 0.14, o.thatch ? 0.34 : 0.18, o.ridge);
  // The gable ends, stepped.
  for (const gx of [x0 + 0.1, x1 - 0.1]) {
    for (let y = 0; y < ridgeY - h - 0.05; y += 0.25) {
      const half = (z1 - z0) / 2 - (y + 0.25) / Math.tan(a);
      if (half < 0.08) break;
      B.b(gx, h + y, zc, 0.2, 0.25, half * 2, jit(o.gable, 0.06, r));
    }
  }
  return ridgeY;
}

/** A tent: cloth from the ground to a ridge along x, poles at the ends, a dark mouth in front. */
export function tent(B: Boxes, x0: number, x1: number, z0: number, z1: number, col: number, ridge: number, r: Seed): void {
  const zc = (z0 + z1) / 2, half = (z1 - z0) / 2, top = Math.min(1.4, half * 1.5 + 0.3), a = Math.atan2(top, half), sl = Math.hypot(top, half);
  for (const side of [1, -1]) for (let x = x0; x < x1 - 0.01; x += 0.5) {
    const w = Math.min(0.5, x1 - x);
    B.c(x + w / 2, top / 2, zc + (side * half) / 2, w + 0.01, 0.06, sl, jit(col, 0.08, r), 0, side * a);
  }
  B.c((x0 + x1) / 2, top + 0.03, zc, x1 - x0 + 0.1, 0.08, 0.1, ridge);
  for (const px of [x0, x1]) B.b(px, 0, zc, 0.08, top + 0.15, 0.08, 0x3a2a1a);
  // The way in: a dark triangle of shade at the front end.
  for (let y = 0; y < top * 0.7; y += 0.2) B.b(x1 - 0.02, y, zc, 0.04, 0.2, Math.max(0.1, (top - y) / top) * half * 0.9, 0x0e0a0a);
}
