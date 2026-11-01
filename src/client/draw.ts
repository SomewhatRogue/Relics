/**
 * Drawing helpers shared by every actor. `lit` is the flat layer the lighting pass shades; `glow`
 * is drawn unlit on top. Each sprite erases the glow under itself, so a telegraph never shows
 * through whoever is standing on it.
 */
import type { Sprite } from './sprites';

export interface Ctx {
  lit: CanvasRenderingContext2D;
  glow: CanvasRenderingContext2D;
  now: number;
}

/** Draw a sprite with its feet at (x, y): lit pixels, then knock out and relight its glow. */
export function blit(c: Ctx, s: Sprite, x: number, y: number, flip = false, flash = 0, squash = 1): void {
  const h = Math.round(s.h * squash), left = Math.round(x - s.w / 2), top = Math.round(y - h);
  const put = (g: CanvasRenderingContext2D, img: HTMLCanvasElement) => {
    g.save();
    if (flip) {
      g.translate(left + s.w, top);
      g.scale(-1, 1);
      g.drawImage(img, 0, 0, s.w, h);
    } else g.drawImage(img, left, top, s.w, h);
    g.restore();
  };
  put(c.lit, s.c);
  c.glow.globalCompositeOperation = 'destination-out';
  put(c.glow, s.white);
  c.glow.globalCompositeOperation = 'source-over';
  if (squash === 1) for (const [gx, gy, col] of s.glow) {
    c.glow.fillStyle = col;
    c.glow.fillRect(flip ? left + s.w - 1 - gx : left + gx, top + gy, 1, 1);
  }
  if (flash > 0) {
    c.glow.globalAlpha = flash;
    put(c.glow, s.white);
    c.glow.globalAlpha = 1;
  }
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

export function shadow(c: Ctx, x: number, y: number, rx: number): void {
  c.lit.fillStyle = 'rgba(8,6,12,0.55)';
  const ry = Math.max(1, Math.round(rx / 3));
  for (let dy = -ry; dy <= ry; dy++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry + 0.01))));
    c.lit.fillRect(Math.round(x - w), Math.round(y + dy), w * 2 + 1, 1);
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
