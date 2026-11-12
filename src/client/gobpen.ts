/**
 * A pen for what goblins carry at 1.5x (docs/design/art-pass.md). The kit files (foekits*.ts and the
 * kits they hand on to) draw in the old body's pixels round the feet; through this pen each rect lands on
 * the 1.5x grid at whole pixels, its edges where the old ones fall, a one-pixel detail (a rope's knot, an
 * eye, a pole) kept one pixel so nothing turns blocky. A `line` drawn on it (draw.ts) is drawn whole in
 * the new space, so lines stay one pixel thin. A sprite drawn on it keeps its size, put where it belongs.
 * Never for anything the room decides: telegraphs and reach are drawn without it.
 */
import type { Ctx } from './draw';
import { HS } from './heroscale';

/** What a penned canvas maps round: its own canvas, and the feet. */
export interface Pen { raw: CanvasRenderingContext2D; ox: number; oy: number; k: number }

function penned(raw: CanvasRenderingContext2D, ox: number, oy: number, k: number): CanvasRenderingContext2D {
  const pen: Pen = { raw, ox, oy, k }, X = (x: number) => ox + Math.round((x - ox) * k), Y = (y: number) => oy + Math.round((y - oy) * k);
  const size = (w: number) => (Math.abs(w) <= 1 ? w : Math.sign(w) * Math.round(Math.abs(w) * k));
  return new Proxy(raw, {
    get(t, k) {
      if (k === '__pen') return pen;
      if (k === 'fillRect' || k === 'clearRect') return (x: number, y: number, w: number, h: number) => t[k](X(x), Y(y), size(w), size(h));
      if (k === 'moveTo' || k === 'lineTo') return (x: number, y: number) => t[k](X(x), Y(y));
      if (k === 'drawImage') return (img: CanvasImageSource, ...a: number[]) => (a.length === 2 ? t.drawImage(img, X(a[0]), Y(a[1])) : a.length === 4 ? t.drawImage(img, X(a[0]), Y(a[1]), a[2], a[3]) : t.drawImage(img, a[0], a[1], a[2], a[3], X(a[4]), Y(a[5]), a[6], a[7]));
      const v = Reflect.get(t, k, t);
      return typeof v === 'function' ? v.bind(t) : v;
    },
    set(t, k, v) {
      return Reflect.set(t, k, v, t);
    },
  });
}

/** `c` with both layers penned round the feet at (x, y) for this draw; `k` how much bigger (1.5x, or more for a bigger body). */
export function gobPen(c: Ctx, x: number, y: number, k = HS): Ctx {
  return { lit: penned(c.lit, x, y, k), glow: penned(c.glow, x, y, k), now: c.now, t: c.t };
}

/** A penned canvas's pen (draw.ts's line draws through it whole), or null. */
export const penOf = (g: CanvasRenderingContext2D): Pen | null => (g as unknown as { __pen?: Pen }).__pen ?? null;

/**
 * A body's extra size this draw (a BIG ONE, a meaty sort, a grown gorger: strawman.ts sets it round the
 * draw). The goblin and the butcher draw their shapes again at it (foes.ts), never a stretched canvas.
 */
export const BODY = { k: 1 };
