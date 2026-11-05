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
      const cx = ox + x * PX, cy = oy + z * PX - (y + h / 2) * PX;
      g.fillStyle = css(col);
      g.beginPath(), g.ellipse(Math.round(cx), Math.round(cy), (w * PX) / 2, (h * PX) / 2 + (d * PX) / 6, 0, 0, Math.PI * 2), g.fill();
      g.fillStyle = css(col, 1.25);
      g.beginPath(), g.ellipse(Math.round(cx - w * 2), Math.round(cy - h * 3), (w * PX) / 4, (h * PX) / 5, 0, 0, Math.PI * 2), g.fill();
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
