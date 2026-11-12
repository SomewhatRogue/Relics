/**
 * Today's sprites cut into parts that can be posed: the same pixels, outline and shading, split by
 * region into the off arm, the legs (left and right), the body, the head and the weapon arm. Nothing
 * is redrawn: every pixel of a sprite goes to exactly one part, so a body at rest is exactly its sprite.
 */
import type { Sprite } from './sprites';

export type JointKind = 'back' | 'legL' | 'legR' | 'torso' | 'head' | 'arm';
/** Where to cut, in the sprite's own pixels (before its outline): rows above `headTo` are the head,
 *  from `hip` down the legs (split down the middle), and the two arm boxes (x0, y0, x1, y1, half-open). */
export interface Cut { headTo: number; hip: number; back: [number, number, number, number]; arm: [number, number, number, number] }

/** A part: a canvas the size of the whole sprite holding only its pixels (so it is a Sprite too), and its box. */
export interface Joint extends Sprite { kind: JointKind; x0: number; y0: number; x1: number; y1: number }
export interface Jointed { s: Sprite; parts: Joint[]; cut: Cut }

export const ORDER: JointKind[] = ['back', 'legL', 'legR', 'torso', 'head', 'arm'];

/** Which part a pixel of the sprite's canvas (outline included, so one wider each side) belongs to. */
export function ownerAt(X: number, Y: number, W: number, H: number, cut: Cut): JointKind {
  const w = W - 2, h = H - 2, x = Math.min(w - 1, Math.max(0, X - 1)), y = Math.min(h - 1, Math.max(0, Y - 1));
  const inR = (r: number[]) => x >= r[0] && y >= r[1] && x < r[2] && y < r[3];
  if (inR(cut.arm)) return 'arm';
  if (inR(cut.back)) return 'back';
  if (y < cut.headTo) return 'head';
  if (y >= cut.hip) return x < w / 2 ? 'legL' : 'legR';
  return 'torso';
}

/** Split RGBA pixels into parts (pure, so tests can check that the parts make the whole). */
export function split(rgba: Uint8ClampedArray, W: number, H: number, cut: Cut): Map<JointKind, { rgba: Uint8ClampedArray; box: number[] }> {
  const out = new Map<JointKind, { rgba: Uint8ClampedArray; box: number[] }>();
  for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) {
    const i = (Y * W + X) * 4;
    if (!rgba[i + 3]) continue;
    const k = ownerAt(X, Y, W, H, cut);
    let p = out.get(k);
    if (!p) out.set(k, (p = { rgba: new Uint8ClampedArray(W * H * 4), box: [W, H, 0, 0] }));
    for (let j = 0; j < 4; j++) p.rgba[i + j] = rgba[i + j];
    (p.box[0] = Math.min(p.box[0], X)), (p.box[1] = Math.min(p.box[1], Y)), (p.box[2] = Math.max(p.box[2], X + 1)), (p.box[3] = Math.max(p.box[3], Y + 1));
  }
  return out;
}

const made = new WeakMap<Sprite, Jointed>();
/** A sprite in parts (made the first time it's asked for, then kept). */
export function jointed(s: Sprite, cut: Cut): Jointed {
  let j = made.get(s);
  if (j) return j;
  const read = (cv: HTMLCanvasElement) => cv.getContext('2d')!.getImageData(0, 0, s.w, s.h).data;
  const colour = split(read(s.c), s.w, s.h, cut), white = split(read(s.white), s.w, s.h, cut);
  const canvas = (px: Uint8ClampedArray) => {
    const cv = document.createElement('canvas');
    (cv.width = s.w), (cv.height = s.h);
    cv.getContext('2d')!.putImageData(new ImageData(px as Uint8ClampedArray<ArrayBuffer>, s.w, s.h), 0, 0);
    return cv;
  };
  const parts = ORDER.filter((k) => colour.has(k)).map((k): Joint => {
    const p = colour.get(k)!;
    return { kind: k, w: s.w, h: s.h, c: canvas(p.rgba), white: canvas(white.get(k)!.rgba), glow: s.glow.filter(([gx, gy]) => ownerAt(gx, gy, s.w, s.h, cut) === k), x0: p.box[0], y0: p.box[1], x1: p.box[2], y1: p.box[3] };
  });
  made.set(s, (j = { s, parts, cut }));
  return j;
}

/** Where each body is cut. A hero is 18 by 24 (`tall` more for a hat or hood), with the legs from row 16,
 *  or only the feet (the bottom row) under a robe; arms on either side of the body. */
export const heroCut = (tall: number, robe: boolean): Cut => ({ headTo: 9 + tall, hip: (robe ? 23 : 16) + tall, back: [0, 9 + tall, 5, 16 + tall], arm: [13, 9 + tall, 18, 16 + tall] });
export const SCRAPPER_CUT: Cut = { headTo: 6, hip: 10, back: [0, 6, 3, 10], arm: [8, 6, 11, 10] };
export const BUTCHER_CUT: Cut = { headTo: 10, hip: 17, back: [0, 8, 4, 17], arm: [14, 8, 18, 17] };
