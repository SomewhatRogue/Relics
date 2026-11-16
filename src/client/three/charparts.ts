/**
 * The new look's characters, the parts way (`&chars=parts`, docs/decisions/new-look-characters.md): a character's idle
 * frame for a facing, cut into parts as today's sprites are (joints.ts: head, body, the two legs, the weapon arm, the
 * off arm) and moved by the same pose code (figure.ts with heropose.ts or foepose.ts), at the new density. The cut is
 * found from the frame's own shape: the head the top quarter, the legs below the hips, the weapon arm on the side the
 * weapon is held (on your left facing you, on your right walking away, in front side-on). Only draws.
 */
import type { Ctx } from '../draw';
import { drawFigure, layout } from '../figure';
import { jointed, type Cut, type Jointed } from '../joints';
import type { BodyPose } from '../motion';
import type { Sprite } from '../sprites';
import type { Facing } from '../charframe';

/** A character's sheet as canvases, its cell (charkit/chars.json), and where each facing's idle frame is (grid row, column). */
export interface Kit { lit: HTMLCanvasElement; glow: HTMLCanvasElement; white: HTMLCanvasElement; w: number; h: number; fx: number; fy: number; idle: Record<Facing, [number, number]> }

const cuts = new Map<Kit, Record<Facing, Jointed>>();
const FACINGS: Facing[] = ['front', 'side', 'back'];

function cell(src: HTMLCanvasElement, k: Kit, [row, col]: [number, number]): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  (cv.width = k.w), (cv.height = k.h);
  cv.getContext('2d')!.drawImage(src, col * k.w, row * k.h, k.w, k.h, 0, 0, k.w, k.h);
  return cv;
}

/** The cut for one facing, from the opaque box of its idle frame (the sprite's own pixels, one in from the canvas). */
function cutFor(px: Uint8ClampedArray, k: Kit, facing: Facing): Cut {
  let x0 = k.w, y0 = k.h, x1 = 0, y1 = 0;
  for (let y = 0; y < k.h; y++) for (let x = 0; x < k.w; x++) if (px[(y * k.w + x) * 4 + 3]) (x0 = Math.min(x0, x)), (y0 = Math.min(y0, y)), (x1 = Math.max(x1, x + 1)), (y1 = Math.max(y1, y + 1));
  const w = x1 - x0, h = y1 - y0, at = (f: number) => Math.round(y0 + h * f) - 1, ya = at(0.25), yb = at(0.85);
  const L = (f: number): [number, number, number, number] => [x0 - 1, ya, Math.round(x0 + w * f) - 1, yb];
  const R = (f: number): [number, number, number, number] => [Math.round(x1 - w * f) - 1, ya, x1, yb];
  const arm = facing === 'front' ? L(0.32) : R(0.35), back = facing === 'front' ? R(0.3) : L(facing === 'side' ? 0.25 : 0.3);
  return { headTo: at(0.27), hip: at(0.62), arm, back };
}

/** The idle frame of each facing, cut into parts (made once a kit). */
function parts(k: Kit): Record<Facing, Jointed> {
  let j = cuts.get(k);
  if (j) return j;
  j = {} as Record<Facing, Jointed>;
  for (const facing of FACINGS) {
    const at = k.idle[facing], c = cell(k.lit, k, at), white = cell(k.white, k, at), g = cell(k.glow, k, at);
    const px = c.getContext('2d')!.getImageData(0, 0, k.w, k.h).data, gp = g.getContext('2d')!.getImageData(0, 0, k.w, k.h).data;
    const glow: Sprite['glow'] = [];
    for (let i = 0; i < gp.length; i += 4) if (gp[i + 3]) glow.push([(i / 4) % k.w, Math.floor(i / 4 / k.w), `rgb(${gp[i]},${gp[i + 1]},${gp[i + 2]})`]);
    const s: Sprite = { c, white, w: k.w, h: k.h, glow };
    j[facing] = jointed(s, cutFor(px, k, facing));
  }
  cuts.set(k, j);
  return j;
}

/**
 * Draw the character into `c` (a canvas the size of its cell, its hips and feet at the cell's; mirrored, its hips at
 * its width less them) in the pose. `scale`: the pose code's pixels to this density (a hero's 1.5 at twice the density is 3).
 */
export function drawParts(c: Ctx, k: Kit, facing: Facing, flip: boolean, p: BodyPose, scale: number, moving: boolean, now: number): void {
  const j = parts(k)[facing];
  if (moving && p.phase === 'rest') p.step = (facing === 'side' ? 21 : 1) + (Math.floor(now * 9) % 4);
  const x = k.w / 2 + Math.round(p.ox * scale), y = k.h + Math.round(p.oy * scale);
  layout(j, x, y, flip, p, scale);
  drawFigure(c, j, x, y, p);
}
