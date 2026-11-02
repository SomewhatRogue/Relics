/**
 * Drawing a body part by part from its pose (motion.ts): the head leans the most and the torso half
 * as much, the legs fold under a crouch (the body drops onto them) and stretch when it rises, the
 * weapon arm reaches along the blow, the whole shifts for a lunge or a recoil, and steps lift one foot
 * then the other. Each part erases the glow under itself, then its own glowing pixels go back on.
 * `layout` first (so a weapon can be drawn behind the body at the hand), then `drawFigure`.
 */
import { ghost, tinted, type Ctx } from './draw';
import type { BodyPart, Figure } from './hd/grid';
import { WHITE, type BodyPose } from './motion';

/** Where everything goes this frame, in canvas pixels of the figure (scene pixels times its k). */
export const LAYOUT = { left: 0, top: 0, k: 2, flip: false, drop: 0, lean: 0, ax: 0, ay: 0, walk: 0, bob: 0 };

/** How far the weapon arm reaches along the blow at full stretch, in scene pixels. */
const REACH = 10;
/** Of a crouch, how much the body drops (a share of its height), at most this share of the legs. */
const DROP = 0.55, FOLD = 0.6;

/**
 * Lay a figure out: feet at (x, y) (scene pixels, whole numbers), in pose `p`, stepping (`walk`
 * -1, 0 or 1: which foot is up) and breathing (`bob` 0 or 1, the body down a hair).
 */
export function layout(f: Figure, x: number, y: number, flip: boolean, p: BodyPose, walk = 0, bob = 0): typeof LAYOUT {
  const k = f.whole.k ?? 1, L = LAYOUT, legs = f.whole.h - f.hip;
  L.k = k;
  L.flip = flip;
  L.left = Math.round(x) * k - f.whole.w / 2;
  L.top = Math.round(y) * k - f.whole.h;
  L.drop = Math.max(-legs * 0.3, Math.min(legs * FOLD, Math.round(p.crouch * f.whole.h * DROP)));
  L.lean = Math.round(p.lean * k);
  const reach = p.stretch * REACH * k;
  L.ax = Math.round(reach * p.dx);
  L.ay = Math.round(reach * p.dy * 0.5 - p.raise * k);
  L.walk = walk;
  L.bob = bob;
  return L;
}

/** Where a part goes (canvas pixels): its offset, and how tall its rows are drawn (legs fold). */
function place(part: BodyPart, out: number[]): number[] {
  const L = LAYOUT, half = Math.round(L.lean / 2), h = part.y1 - part.y0;
  let dx = 0, dy = 0, dh = h;
  switch (part.kind) {
    case 'head': (dx = L.lean), (dy = L.drop + L.bob); break;
    case 'arm': (dx = half + L.ax), (dy = L.drop + L.bob + L.ay); break;
    case 'legL':
    case 'legR': {
      // The legs fold under the drop (or stretch when it rises), feet on the ground; a step lifts one.
      dh = Math.max(2, h - L.drop);
      dy = h - dh - ((part.kind === 'legL' ? L.walk > 0 : L.walk < 0) ? 1 : 0);
      break;
    }
    default: (dx = half), (dy = L.drop + L.bob);
  }
  const x0 = L.flip ? L.left + (part.s.w - part.x1) : L.left + part.x0;
  (out[0] = x0 + dx), (out[1] = L.top + part.y0 + dy), (out[2] = dh);
  return out;
}

const AT = [0, 0, 0];
function put(g: CanvasRenderingContext2D, part: BodyPart, img: HTMLCanvasElement): void {
  const k = LAYOUT.k, [x, y, dh] = place(part, AT), w = part.x1 - part.x0, h = part.y1 - part.y0;
  if (!LAYOUT.flip) return g.drawImage(img, part.x0, part.y0, w, h, x / k, y / k, w / k, dh / k);
  g.save();
  g.translate((x + w) / k, y / k);
  g.scale(-1, 1);
  g.drawImage(img, part.x0, part.y0, w, h, 0, 0, w / k, dh / k);
  g.restore();
}

/** Draw the figure laid out by `layout`, with the pose's flash and afterimage. */
export function drawFigure(c: Ctx, f: Figure, x: number, y: number, p: BodyPose): void {
  const L = LAYOUT, k = L.k;
  if (p.ghost > 0) ghost(c, f.whole, x + p.gx, y + p.gy, L.flip, p.ghost);
  for (const part of f.parts) put(c.lit, part, part.s.c);
  c.glow.globalCompositeOperation = 'destination-out';
  for (const part of f.parts) put(c.glow, part, part.s.white);
  c.glow.globalCompositeOperation = 'source-over';
  for (const part of f.parts) {
    if (!part.s.glow.length) continue;
    const [px, py] = place(part, AT);
    for (const [gx, gy, col] of part.s.glow) {
      if (gy >= part.y1 || (part.kind.startsWith('leg') && AT[2] !== part.y1 - part.y0)) continue;
      c.glow.fillStyle = col;
      c.glow.fillRect((px + (L.flip ? part.x1 - 1 - gx : gx - part.x0)) / k, (py + gy - part.y0) / k, 1 / k, 1 / k);
    }
  }
  if (p.flash > 0) {
    c.glow.globalAlpha = Math.min(1, p.flash);
    for (const part of f.parts) put(c.glow, part, p.tint === WHITE ? part.s.white : tinted(part.s, p.tint));
    c.glow.globalAlpha = 1;
  }
}

/** The weapon hand this frame, in scene pixels (after `layout`). */
export function handAt(f: Figure, out: [number, number]): [number, number] {
  const L = LAYOUT, k = L.k, hx = L.flip ? f.whole.w - f.hand[0] : f.hand[0];
  out[0] = (L.left + hx + Math.round(L.lean / 2) + L.ax) / k;
  out[1] = (L.top + f.hand[1] + L.drop + L.bob + L.ay) / k;
  return out;
}

/** Each eye this frame, in scene pixels (after `layout`): `fn(x, y)` once per eye pixel. */
export function eachEye(f: Figure, fn: (x: number, y: number) => void): void {
  const L = LAYOUT, k = L.k;
  for (const [ex, ey] of f.eyes) fn((L.left + (L.flip ? f.whole.w - 1 - ex : ex) + L.lean) / k, (L.top + ey + L.drop + L.bob) / k);
}
