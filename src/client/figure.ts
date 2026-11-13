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
export const LAYOUT = { left: 0, top: 0, flip: false, drop: 0, lean: 0, ax: 0, ay: 0, step: 0, skirt: 0 };
/** Of a crouch, how far the body drops (a share of its height), at most this share of the legs; rising, one pixel at most. */
const DROP = 0.55, FOLD = 0.6;

/** `k`: how much bigger the body is drawn than the pose's pixels were set for (a hero's 1.5, heroscale.ts). */
export function layout(j: Jointed, x: number, y: number, flip: boolean, p: BodyPose, k = 1): typeof LAYOUT {
  const s = j.s, L = LAYOUT, legs = s.h - 1 - j.cut.hip;
  L.flip = flip;
  L.skirt = j.cut.skirt ?? 0;
  L.left = Math.round(x - s.w / 2);
  L.top = Math.round(y - s.h);
  L.drop = Math.max(-1, Math.min(Math.round(legs * FOLD), Math.round(p.crouch * s.h * DROP)));
  L.lean = Math.round(p.lean * k);
  L.ax = Math.round(p.reach * k * p.dx);
  L.ay = Math.round(p.reach * k * p.dy * 0.5) - Math.round(p.raise * k);
  L.step = p.step;
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

/**
 * The walk cycle (Kyle, 2026-11-12: "lets do it", a real walk for the tall heroes). `step` 1 to 4 walks toward
 * or away from you, 11 to 14 across the screen; each leg is cut at the knee and posed by thigh and shin:
 * contact (one foot forward, the other back, both down), passing (the back leg comes through, knee bent, its
 * foot a pixel up), then the same with the other foot. Toward you, the forward foot is drawn a pixel lower and
 * the back one a pixel higher. Under a robe (the legs only the feet) the feet just peek in turn, never out past
 * the hem. The body, drawn after the legs, covers the tops of the thighs.
 */
const STRIDE: Record<number, [number, number, number, number, number, number]> = {
  // [A thigh dx, A shin dx, A dy, B thigh dx, B shin dx, B dy]; A is the left leg, dx forward along the walk.
  11: [1, 2, 0, -1, -2, 0], 12: [0, 0, 0, 0, -1, -1], 13: [-1, -2, 0, 1, 2, 0], 14: [0, -1, -1, 0, 0, 0],
  1: [0, 0, 1, 0, 0, -1], 2: [0, 0, 0, 0, 0, -1], 3: [0, 0, -1, 0, 0, 1], 4: [0, 0, -1, 0, 0, 0],
};
/** A leg's offset at a row: [dx on screen, dy]. */
function legAt(part: Joint, row: number): [number, number] {
  const s = STRIDE[LAYOUT.step];
  if (!s || (part.kind !== 'legL' && part.kind !== 'legR')) return [0, 0];
  const a = part.kind === 'legL' ? 0 : 3, robe = part.y1 - part.y0 < 6, knee = part.y0 + Math.ceil((part.y1 - part.y0) * 0.45);
  const fwd = LAYOUT.flip ? -1 : 1, dx = robe ? 0 : (row < knee ? s[a] : s[a + 1]) * fwd;
  // (Under a robe a foot only lifts up into the hem, never drops out below it: Kyle, "boots out the middle".)
  return [dx, robe ? Math.min(0, s[a + 2]) : s[a + 2]];
}

function slice(g: CanvasRenderingContext2D, img: HTMLCanvasElement, part: Joint, sy: number, sh: number, x: number, y: number, dh: number): void {
  const w = part.x1 - part.x0;
  if (!LAYOUT.flip) return g.drawImage(img, part.x0, sy, w, sh, x, y, w, dh);
  g.save();
  g.translate(x + w, y);
  g.scale(-1, 1);
  g.drawImage(img, part.x0, sy, w, sh, 0, 0, w, dh);
  g.restore();
}

/** A cloak's lower half on the walk (the cut's `skirt`): trailing a pixel behind as a foot lands across the screen,
 *  swinging side to side toward or away from you (Kyle, 2026-11-12: the Rogue's cloak "doesn't really move right"). */
const SWAY: Record<number, number> = { 11: -1, 13: -1, 1: 1, 3: -1 };

function put(g: CanvasRenderingContext2D, part: Joint, img: HTMLCanvasElement): void {
  const [x0, y0, dh] = place(part, AT), h = part.y1 - part.y0, L = LAYOUT;
  if (part.kind === 'torso' && L.skirt > part.y0 && L.skirt < part.y1 && SWAY[L.step]) {
    const top = L.skirt - part.y0, sw = SWAY[L.step] * (L.step > 10 ? (L.flip ? -1 : 1) : 1);
    slice(g, img, part, part.y0, top, x0, y0, top);
    return slice(g, img, part, L.skirt, h - top, x0 + sw, y0 + top, dh - top);
  }
  if ((part.kind !== 'legL' && part.kind !== 'legR') || !STRIDE[L.step]) return slice(g, img, part, part.y0, h, x0, y0, dh);
  // A leg in two: thigh and shin, each at its own offset (the stretch from a crouch goes to the shin).
  const knee = Math.ceil(h * 0.45), [tx, ty] = legAt(part, part.y0), [sx, sy] = legAt(part, part.y1 - 1);
  slice(g, img, part, part.y0, knee, x0 + tx, y0 + ty, knee);
  slice(g, img, part, part.y0 + knee, h - knee, x0 + sx, y0 + sy + knee, dh - knee);
}

/** Draw the figure laid out by `layout`: afterimage, parts, their glow, the pose's flash. */
export function drawFigure(c: Ctx, j: Jointed, x: number, y: number, p: BodyPose): void {
  const L = LAYOUT;
  if (p.ghost > 0) ghost(c, j.s, x + p.gx, y + p.gy, L.flip, p.ghost);
  // Nothing moved apart: the parts make exactly the sprite, so draw it whole (one call, not six).
  if (!L.drop && !L.lean && !L.ax && !L.ay && !L.step) return blitPose(c, j.s, x, y, L.flip, 1, 1, 0, p.flash, p.tint);
  for (const part of j.parts) put(c.lit, part, part.c);
  c.glow.globalCompositeOperation = 'destination-out';
  for (const part of j.parts) put(c.glow, part, part.white);
  c.glow.globalCompositeOperation = 'source-over';
  for (const part of j.parts) {
    if (!part.glow.length) continue;
    const [px, py] = place(part, AT);
    for (const [gx, gy, col] of part.glow) {
      c.glow.fillStyle = col;
      const [lx, ly] = legAt(part, gy);
      c.glow.fillRect(px + lx + (L.flip ? part.x1 - 1 - gx : gx - part.x0), py + ly + gy - part.y0, 1, 1);
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
