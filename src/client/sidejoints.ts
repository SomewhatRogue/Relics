/**
 * A look in profile cut into parts (docs/design/side-view.md), as joints.ts cuts the front: the head, the
 * torso and the near leg from the side body; the far leg made from the near one, a pixel behind and a
 * shade darker, drawn first; the near arm from its own map, drawn last. The parts together are the whole
 * sprite, so a hero at rest is drawn in one call. No far arm: it's behind the body (the shield is held up).
 */
import { makeSprite, type Sprite } from './sprites';
import { ORDER, split, heroCut, type Cut, type Joint, type JointKind, type Jointed } from './joints';
import type { LookDef } from './lookkit';
import { HERO_W } from './heroscale';

/** How dark the far leg is against the near one. */
const FAR = 0.68;

type Px = { rgba: Uint8ClampedArray; box: number[] };

function boxOf(rgba: Uint8ClampedArray, W: number, H: number): number[] {
  const b = [W, H, 0, 0];
  for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) if (rgba[(Y * W + X) * 4 + 3]) (b[0] = Math.min(b[0], X)), (b[1] = Math.min(b[1], Y)), (b[2] = Math.max(b[2], X + 1)), (b[3] = Math.max(b[3], Y + 1));
  return b;
}
/** Both halves of the front's leg split as one leg (in profile they're the same leg). */
function oneLeg(m: Map<JointKind, Px>, W: number, H: number): Px | undefined {
  const a = m.get('legL'), b = m.get('legR');
  if (!a || !b) return a ?? b;
  const out = new Uint8ClampedArray(a.rgba);
  for (let i = 0; i < out.length; i += 4) if (b.rgba[i + 3]) for (let j = 0; j < 4; j++) out[i + j] = b.rgba[i + j];
  return { rgba: out, box: boxOf(out, W, H) };
}
/** A leg moved a pixel toward the back (west, facing east), its colour a shade darker (`k`). */
function behind(p: Px, W: number, H: number, k: number): Px {
  const out = new Uint8ClampedArray(p.rgba.length);
  for (let Y = 0; Y < H; Y++) for (let X = 0; X < W - 1; X++) {
    const s = (Y * W + X + 1) * 4, d = (Y * W + X) * 4;
    if (!p.rgba[s + 3]) continue;
    for (let j = 0; j < 3; j++) out[d + j] = Math.round(p.rgba[s + j] * k);
    out[d + 3] = p.rgba[s + 3];
  }
  return { rgba: out, box: boxOf(out, W, H) };
}

const canvas = (px: Uint8ClampedArray, W: number, H: number) => {
  const cv = document.createElement('canvas');
  (cv.width = W), (cv.height = H);
  cv.getContext('2d')!.putImageData(new ImageData(px as Uint8ClampedArray<ArrayBuffer>, W, H), 0, 0);
  return cv;
};
const read = (cv: HTMLCanvasElement, W: number, H: number) => cv.getContext('2d')!.getImageData(0, 0, W, H).data;

const made = new WeakMap<LookDef, Jointed>();
/** The look in profile, in parts (made the first time it's asked for, then kept). Only for a look with `side`. */
export function sideJointed(d: LookDef): Jointed {
  let j = made.get(d);
  if (j) return j;
  const sd = d.side!, base = d.cut ?? heroCut(d.tall, !!d.robe);
  // (No arm boxes: the near arm is its own map, the far arm isn't seen.)
  const cut: Cut = { ...base, back: [0, 0, 0, 0], arm: [0, 0, 0, 0] };
  const body = makeSprite(HERO_W, d.h, sd.body), arm = makeSprite(HERO_W, d.h, sd.arm), W = body.w, H = body.h;
  const col = split(read(body.c, W, H), W, H, cut), wht = split(read(body.white, W, H), W, H, cut);
  const near = oneLeg(col, W, H), nearW = oneLeg(wht, W, H);
  const parts = new Map<JointKind, [Px, Px]>();
  for (const k of ['torso', 'head'] as const) if (col.has(k)) parts.set(k, [col.get(k)!, wht.get(k)!]);
  if (near && nearW) parts.set('legR', [near, nearW]), parts.set('legL', [behind(near, W, H, FAR), behind(nearW, W, H, 1)]);
  const ar = read(arm.c, W, H), aw = read(arm.white, W, H);
  parts.set('arm', [{ rgba: new Uint8ClampedArray(ar), box: boxOf(ar, W, H) }, { rgba: new Uint8ClampedArray(aw), box: boxOf(aw, W, H) }]);
  const joints = ORDER.filter((k) => parts.has(k)).map((k): Joint => {
    const [p, w] = parts.get(k)!;
    const glow = k === 'arm' ? arm.glow : k === 'legL' ? [] : body.glow.filter(([, gy]) => (k === 'head' ? gy - 1 < cut.headTo : k === 'legR' ? gy - 1 >= cut.hip : gy - 1 >= cut.headTo && gy - 1 < cut.hip));
    return { kind: k, w: W, h: H, c: canvas(p.rgba, W, H), white: canvas(w.rgba, W, H), glow, x0: p.box[0], y0: p.box[1], x1: p.box[2], y1: p.box[3] };
  });
  // The whole sprite: every part laid in order (what's drawn when nothing has moved apart).
  const lay = (pick: (p: Joint) => HTMLCanvasElement) => {
    const cv = document.createElement('canvas');
    (cv.width = W), (cv.height = H);
    const g = cv.getContext('2d')!;
    for (const p of joints) g.drawImage(pick(p), 0, 0);
    return cv;
  };
  const s: Sprite = { c: lay((p) => p.c), white: lay((p) => p.white), w: W, h: H, glow: [...body.glow, ...arm.glow] };
  made.set(d, (j = { s, parts: joints, cut }));
  return j;
}
