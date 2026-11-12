/**
 * Drawing helpers shared by every actor. `lit` is the flat layer the lighting pass shades; `glow`
 * is drawn unlit on top. Each sprite erases the glow under itself, so a telegraph never shows
 * through whoever is standing on it.
 */
import { scaleOf, type BodyPose } from './motion';
import type { Sprite } from './sprites';
import { penOf } from './gobpen';
import { HS } from './heroscale';

export interface Ctx {
  lit: CanvasRenderingContext2D;
  glow: CanvasRenderingContext2D;
  now: number;
  /** The room's own time (hits, parries and dodges are stamped in it); `now` is the wall clock. */
  t?: number;
}

/** Draw a sprite with its feet at (x, y): lit pixels, then knock out and relight its glow. */
export function blit(c: Ctx, s: Sprite, x: number, y: number, flip = false, flash = 0, squash = 1): void {
  blitPose(c, s, x, y, flip, 1, squash, 0, flash);
}

const tints = new WeakMap<Sprite, Map<string, HTMLCanvasElement>>();
/** The sprite's silhouette in one colour (made once, kept). */
export function tinted(s: Sprite, col: string): HTMLCanvasElement {
  let m = tints.get(s);
  if (!m) tints.set(s, (m = new Map()));
  let t = m.get(col);
  if (!t) {
    t = document.createElement('canvas');
    (t.width = s.w), (t.height = s.h);
    const g = t.getContext('2d')!;
    g.drawImage(s.white, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = col;
    g.fillRect(0, 0, s.w, s.h);
    m.set(col, t);
  }
  return t;
}

/**
 * A sprite in a pose: `sx`, `sy` stretch it (feet stay put), `lean` shifts its top third that many
 * pixels sideways (its middle half as many), and `flash` washes it in `tint`. Whole pixels throughout.
 */
export function blitPose(c: Ctx, s: Sprite, x: number, y: number, flip: boolean, sx: number, sy: number, lean: number, flash: number, tint = '#ffffff'): void {
  const w = Math.max(1, Math.round(s.w * sx)), h = Math.max(1, Math.round(s.h * sy));
  const left = Math.round(x - w / 2), top = Math.round(y - h), bands = lean ? 3 : 1;
  const off = (i: number) => (bands === 1 ? 0 : Math.round((lean * (2 - i)) / 2));
  const put = (g: CanvasRenderingContext2D, img: HTMLCanvasElement) => {
    for (let i = 0; i < bands; i++) {
      const r0 = Math.round((s.h * i) / bands), r1 = Math.round((s.h * (i + 1)) / bands);
      const d0 = top + Math.round((r0 * h) / s.h), d1 = top + Math.round((r1 * h) / s.h);
      if (r1 <= r0 || d1 <= d0) continue;
      const dx = left + off(i);
      if (!flip) g.drawImage(img, 0, r0, s.w, r1 - r0, dx, d0, w, d1 - d0);
      else {
        g.save();
        g.translate(dx + w, d0);
        g.scale(-1, 1);
        g.drawImage(img, 0, r0, s.w, r1 - r0, 0, 0, w, d1 - d0);
        g.restore();
      }
    }
  };
  put(c.lit, s.c);
  c.glow.globalCompositeOperation = 'destination-out';
  put(c.glow, s.white);
  c.glow.globalCompositeOperation = 'source-over';
  for (const [gx, gy, col] of s.glow) {
    const band = bands === 1 ? 0 : Math.min(2, Math.floor((gy * 3) / s.h)), px = Math.floor((gx * w) / s.w);
    c.glow.fillStyle = col;
    c.glow.fillRect((flip ? left + w - 1 - px : left + px) + off(band), top + Math.floor((gy * h) / s.h), 1, 1);
  }
  if (flash > 0) {
    c.glow.globalAlpha = Math.min(1, flash);
    put(c.glow, tint === '#ffffff' ? s.white : tinted(s, tint));
    c.glow.globalAlpha = 1;
  }
}

/** A pale afterimage of a body (a lunge's smear frame), on the glow layer; draw it before the body. */
export function ghost(c: Ctx, s: Sprite, x: number, y: number, flip: boolean, alpha: number, sx = 1, sy = 1): void {
  if (alpha <= 0) return;
  const w = Math.round(s.w * sx), h = Math.round(s.h * sy), left = Math.round(x - w / 2), top = Math.round(y - h);
  c.glow.globalAlpha = alpha;
  if (!flip) c.glow.drawImage(s.white, left, top, w, h);
  else (c.glow.save(), c.glow.translate(left + w, top), c.glow.scale(-1, 1), c.glow.drawImage(s.white, 0, 0, w, h), c.glow.restore());
  c.glow.globalAlpha = 1;
}

const SC: [number, number] = [1, 1];
/** A sprite drawn in a body pose (motion.ts), its feet at (x, y): the afterimage first, then the body. */
export function blitBody(c: Ctx, s: Sprite, x: number, y: number, flip: boolean, p: BodyPose): void {
  scaleOf(p, SC);
  if (p.ghost > 0) ghost(c, s, x + p.gx, y + p.gy, flip, p.ghost, SC[0], SC[1]);
  blitPose(c, s, x, y, flip, SC[0], SC[1], p.lean, p.flash, p.tint);
}

/** A sprite turned by `a` radians about its middle (thrown, pinned, lying down). */
export function spin(c: Ctx, s: Sprite, x: number, y: number, a: number, alpha = 1): void {
  c.lit.save();
  c.lit.globalAlpha = alpha;
  c.lit.translate(Math.round(x), Math.round(y));
  c.lit.rotate(a);
  c.lit.drawImage(s.c, -Math.round(s.w / 2), -Math.round(s.h / 2));
  c.lit.restore();
}

/** The low sun this frame (client/daytime.ts): shadows stretch east at dusk (+), west at dawn (-). */
export const SUN = { k: 0 };

/** Drawing a figure onto a 2.5D card (three/figs3d.ts): the 3D floor gives it its shadow instead. */
export const BARE = { on: false };

export function shadow(c: Ctx, x: number, y: number, rx: number): void {
  if (BARE.on) return;
  const k = SUN.k, sx = x + rx * 0.8 * k, w0 = rx * (1 + Math.abs(k) * 0.9);
  c.lit.fillStyle = k ? 'rgba(8,6,12,0.45)' : 'rgba(8,6,12,0.55)';
  const ry = Math.max(1, Math.round(rx / 3));
  for (let dy = -ry; dy <= ry; dy++) {
    const w = Math.round(w0 * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry + 0.01))));
    c.lit.fillRect(Math.round(sx - w), Math.round(y + dy), w * 2 + 1, 1);
  }
}

/** A ring of pixels at the feet: the hero's team colour, or an enemy's health. */
export function ring(c: Ctx, x: number, y: number, rx: number, col: string, share = 1, rest = '#3a1418'): void {
  const ry = Math.max(2, rx / 3);
  for (let a = 0; a < 40; a++) {
    const t = (a / 40) * Math.PI * 2;
    c.glow.fillStyle = a / 40 < share ? col : rest;
    c.glow.fillRect(Math.round(x + Math.cos(t - Math.PI / 2) * rx), Math.round(y + Math.sin(t - Math.PI / 2) * ry), 1, 1);
  }
}

/** A straight run of pixels from r0 to r1 along angle a, `w` pixels thick. */
export function line(g: CanvasRenderingContext2D, x0: number, y0: number, a: number, r0: number, r1: number, col: string, w = 1): void {
  // On a goblin's pen (gobpen.ts): drawn whole in the 1.5x space, one pixel thin.
  const pen = penOf(g);
  if (pen) (x0 = pen.ox + (x0 - pen.ox) * HS), (y0 = pen.oy + (y0 - pen.oy) * HS), (r0 *= HS), (r1 *= HS), (g = pen.raw);
  g.fillStyle = col;
  const nx = -Math.sin(a), ny = Math.cos(a);
  for (let r = r0; r <= r1; r += 0.5) for (let k = 0; k < w; k++) {
    const o = k - (w - 1) / 2;
    g.fillRect(Math.round(x0 + Math.cos(a) * r + nx * o), Math.round(y0 + Math.sin(a) * r + ny * o), 1, 1);
  }
}

/** A swept smear between two angles, from radius r0 to r1 (a weapon's trail). */
export function smear(g: CanvasRenderingContext2D, x: number, y: number, from: number, to: number, r0: number, r1: number, col: string): void {
  const steps = Math.max(6, Math.round(Math.abs(to - from) * 12));
  g.fillStyle = col;
  for (let i = 0; i <= steps; i++) {
    const a = from + ((to - from) * i) / steps;
    g.globalAlpha = 0.2 + 0.65 * (i / steps);
    for (let r = r0; r <= r1; r += 1.5) g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1);
  }
  g.globalAlpha = 1;
}

export function stars(c: Ctx, x: number, y: number, n = 3, r = 6): void {
  for (let i = 0; i < n; i++) {
    const t = c.now * 5 + (i * Math.PI * 2) / n;
    c.glow.fillStyle = i % 2 ? '#fff1b0' : '#ffe070';
    c.glow.fillRect(Math.round(x + Math.cos(t) * r), Math.round(y + Math.sin(t) * r * 0.35), 1, 1);
  }
}

export const ease = (t: number) => 1 - (1 - Math.min(1, Math.max(0, t))) ** 2;
