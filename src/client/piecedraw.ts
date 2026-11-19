/**
 * The flat view's layout-4 pieces (pieces.ts holds their boxes, three/pieces3d.ts builds the same in
 * 2.5D): each box painted in three-quarter view, its top a shade lighter than its front, back to front;
 * a crown as a round lump with a lit top, a point as a little triangle. Pixels whole, as everywhere.
 */
import type { Block, Round } from '../shared/arena';
import type { Ctx } from './draw';
import { blockBoxes, roundBoxes, type Bx } from './pieces';
import { PX } from './world';

const css = (hex: number, k = 1) => {
  const r = Math.min(255, Math.round(((hex >> 16) & 255) * k)), g = Math.min(255, Math.round(((hex >> 8) & 255) * k)), b = Math.min(255, Math.round((hex & 255) * k));
  return `rgb(${r},${g},${b})`;
};

/** Paint boxes with the floor's origin (tile 0, 0, height 0) at screen (ox, oy). */
export function paintBoxes(g: CanvasRenderingContext2D, bx: Bx[], ox: number, oy: number): void {
  const order = [...bx].sort((a, b) => a[2] + a[5] / 2 - (b[2] + b[5] / 2) || a[1] - b[1]);
  for (const [x, y, z, w, h, d, col, shape] of order) {
    const sx = Math.round(ox + (x - w / 2) * PX), sw = Math.max(1, Math.round(w * PX)), top = Math.round(oy + (z + d / 2) * PX - (y + h) * PX), fh = Math.max(1, Math.round(h * PX));
    if (shape === 'lump') {
      // Whole pixels, row by row: a dark rim, a shaded underside, a lighter cap up and to the left. (It was two smooth
      // canvas ellipses, soft and blurred beside the crisp sprites: docs/design/flora.md, 6.)
      const cx = Math.round(ox + x * PX), cy = Math.round(oy + z * PX - (y + h / 2) * PX), rx = Math.max(1, Math.round((w * PX) / 2)), ry = Math.max(1, Math.round((h * PX) / 2 + (d * PX) / 6));
      const row = (yy: number, ry1: number, rx1: number) => Math.round(rx1 * Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry1 * ry1))));
      for (let yy = -ry; yy <= ry; yy++) {
        const half = Math.max(1, row(yy, ry + 0.5, rx)), edge = Math.abs(yy) === ry;
        (g.fillStyle = css(col, edge ? 0.62 : yy > ry * 0.4 ? 0.8 : 1)), g.fillRect(cx - half, cy + yy, half * 2, 1);
        if (!edge) (g.fillStyle = css(col, 0.62)), g.fillRect(cx - half, cy + yy, 1, 1), g.fillRect(cx + half - 1, cy + yy, 1, 1);
      }
      const hx = Math.max(1, Math.round(rx * 0.42)), hy = Math.max(1, Math.round(ry * 0.3));
      g.fillStyle = css(col, 1.22);
      for (let yy = -hy; yy <= hy; yy++) { const half = row(yy, hy + 0.5, hx); if (half) g.fillRect(cx - Math.round(rx * 0.3) - half, cy - Math.round(ry * 0.38) + yy, half * 2, 1); }
      continue;
    }
    if (shape === 'cone') {
      g.fillStyle = css(col);
      for (let i = 0; i < fh; i++) {
        const half = Math.max(0, Math.round((sw / 2) * (i / fh)));
        g.fillRect(Math.round(ox + x * PX) - half, top + i, half * 2 || 1, 1);
      }
      continue;
    }
    // Its top (seen from above, a shade lighter), then its front.
    const dh = Math.max(1, Math.round(d * PX));
    g.fillStyle = css(col, 1.18), g.fillRect(sx, top - dh, sw, dh);
    g.fillStyle = css(col), g.fillRect(sx, top, sw, fh);
    if (fh > 3) (g.fillStyle = css(col, 0.78)), g.fillRect(sx, top + fh - 1, sw, 1);
  }
}

/** A piece block with its footprint's top-left corner at (x, y) on screen; erases the glow under it (as a sprite does). */
export function drawPieceBlock(c: Ctx, b: Block, x: number, y: number): void {
  const bx = blockBoxes(b), tall = Math.max(...bx.map((q) => q[1] + q[4])) * PX;
  c.glow.globalCompositeOperation = 'destination-out';
  c.glow.fillRect(Math.round(x), Math.round(y - tall), Math.round(b.w * PX), Math.round(b.h * PX + tall));
  c.glow.globalCompositeOperation = 'source-over';
  paintBoxes(c.lit, bx, x, y);
}

/** A piece round at its foot (x, y) on screen. */
export function drawPieceRound(c: Ctx, r: Round, x: number, y: number): void {
  paintBoxes(c.lit, roundBoxes(r), x, y);
}
