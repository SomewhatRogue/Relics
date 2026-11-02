/**
 * Drawing a sprite cut into parts (joints.ts) in a pose (motion.ts), a whole pixel at a time: the
 * head leans the most and the body half as much, the body drops onto the legs in a crouch (rising,
 * the legs grow a pixel), the weapon arm reaches along the blow and lifts, the whole shifts for a
 * lunge or a recoil. Each part erases the glow under itself and puts its own glowing pixels back.
 * `layout` first (so a weapon can go behind the body, at the hand), then `drawFigure`.
 */
import { blitPose, ghost, tinted, type Ctx } from './draw';
import type { Joint, Jointed } from './joints';
import { WHITE, type BodyPose } from './motion';

/** Where everything goes this frame (scene pixels). */
export const LAYOUT = { left: 0, top: 0, flip: false, drop: 0, lean: 0, ax: 0, ay: 0 };
/** Of a crouch, how far the body drops (a share of its height), at most this share of the legs; rising, one pixel at most. */
const DROP = 0.55, FOLD = 0.6;

export function layout(j: Jointed, x: number, y: number, flip: boolean, p: BodyPose): typeof LAYOUT {
  const s = j.s, L = LAYOUT, legs = s.h - 1 - j.cut.hip;
  L.flip = flip;
  L.left = Math.round(x - s.w / 2);
  L.top = Math.round(y - s.h);
  L.drop = Math.max(-1, Math.min(Math.round(legs * FOLD), Math.round(p.crouch * s.h * DROP)));
  L.lean = Math.round(p.lean);
  L.ax = Math.round(p.reach * p.dx);
  L.ay = Math.round(p.reach * p.dy * 0.5) - Math.round(p.raise);
  return L;
}

const AT = [0, 0, 0];
/** Where a part goes: its top left, and how many rows tall it's drawn (legs grow when the body rises). */
function place(part: Joint, out: number[]): number[] {
  const L = LAYOUT, half = Math.round(L.lean / 2), h = part.y1 - part.y0;
  let dx = half, dy = L.drop, dh = h;
  if (part.kind === 'head') dx = L.lean;
  else if (part.kind === 'arm') (dx = half + L.ax), (dy = L.drop + L.ay);
  else if (part.kind === 'legL' || part.kind === 'legR') (dx = 0), (dy = Math.min(0, L.drop)), (dh = h - dy);
  (out[0] = (L.flip ? L.left + part.w - part.x1 : L.left + part.x0) + dx), (out[1] = L.top + part.y0 + dy), (out[2] = dh);
  return out;
}

function put(g: CanvasRenderingContext2D, part: Joint, img: HTMLCanvasElement): void {
  const [x, y, dh] = place(part, AT), w = part.x1 - part.x0, h = part.y1 - part.y0;
  if (!LAYOUT.flip) return g.drawImage(img, part.x0, part.y0, w, h, x, y, w, dh);
  g.save();
  g.translate(x + w, y);
  g.scale(-1, 1);
  g.drawImage(img, part.x0, part.y0, w, h, 0, 0, w, dh);
  g.restore();
}

/** Draw the figure laid out by `layout`: afterimage, parts, their glow, the pose's flash. */
export function drawFigure(c: Ctx, j: Jointed, x: number, y: number, p: BodyPose): void {
  const L = LAYOUT;
  if (p.ghost > 0) ghost(c, j.s, x + p.gx, y + p.gy, L.flip, p.ghost);
  // Nothing moved apart: the parts make exactly the sprite, so draw it whole (one call, not six).
  if (!L.drop && !L.lean && !L.ax && !L.ay) return blitPose(c, j.s, x, y, L.flip, 1, 1, 0, p.flash, p.tint);
  for (const part of j.parts) put(c.lit, part, part.c);
  c.glow.globalCompositeOperation = 'destination-out';
  for (const part of j.parts) put(c.glow, part, part.white);
  c.glow.globalCompositeOperation = 'source-over';
  for (const part of j.parts) {
    if (!part.glow.length) continue;
    const [px, py] = place(part, AT);
    for (const [gx, gy, col] of part.glow) {
      c.glow.fillStyle = col;
      c.glow.fillRect(px + (L.flip ? part.x1 - 1 - gx : gx - part.x0), py + gy - part.y0, 1, 1);
    }
  }
  if (p.flash > 0) {
    c.glow.globalAlpha = Math.min(1, p.flash);
    for (const part of j.parts) put(c.glow, part, p.tint === WHITE ? part.white : tinted(part, p.tint));
    c.glow.globalAlpha = 1;
  }
}

/** How far the weapon hand has moved from where it rests (after `layout`). */
export const armOffset = (out: [number, number]): [number, number] => ((out[0] = Math.round(LAYOUT.lean / 2) + LAYOUT.ax), (out[1] = LAYOUT.drop + LAYOUT.ay), out);
