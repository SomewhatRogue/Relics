/**
 * Helpers for the tile redraw's furniture and stumps (tilefurn.ts, tilefurn2.ts): the materials in a few shades each
 * (light from the upper left, a darker edge on the right and bottom), a pixel ellipse and a lit slab, and the cut
 * a card is made from. Neutral greys and plain browns: gradeCanvas (darkgold.ts) turns them to the game's shades.
 */
import { gradeCanvas } from './darkgold';
import type { Rect } from './tilekit';
import type { Cut } from './three/propcards';

/** Timber, dark to light: deep gap, shaded edge, body, lit, highlight (the kit's three, tilekit.ts, and two more). */
export const TIM = ['#1a110a', '#24180f', '#3a2a1e', '#4e3826', '#654a33'];
/** Iron in slate greys, and cloth in dull ochre, and stone, each dark to light. */
export const IRON = ['#101215', '#1c1f24', '#2c3138', '#414852', '#5e6874'];
export const CLOTH = ['#2e2618', '#4a3c22', '#665430', '#85703c', '#a08a4c'];
export const ROCK = ['#1a1a1a', '#2c2c2c', '#3c3c3c', '#4f4f4f', '#6b6b6b'];

/** A canvas painted by `fn` and graded onto the game's shades. */
export function paint(W: number, H: number, fn: (r: Rect) => void): HTMLCanvasElement {
  const c = document.createElement('canvas');
  (c.width = Math.max(1, W)), (c.height = Math.max(1, H));
  const g = c.getContext('2d')!;
  fn((x, y, w, h, col) => ((g.fillStyle = col), g.fillRect(x, y, w, h)));
  gradeCanvas(c, 'wall');
  return c;
}

/** A card cut: the picture, an empty glow, anchored at the foot's middle (the bottom row). */
export const toCut = (lit: HTMLCanvasElement): Cut => ({
  lit, glow: Object.assign(document.createElement('canvas'), { width: lit.width, height: lit.height }),
  w: lit.width, h: lit.height, ax: lit.width / 2, ay: lit.height,
});

/** A filled pixel ellipse in the box (x, y, w, h). */
export function ell(r: Rect, x: number, y: number, w: number, h: number, col: string): void {
  for (let j = 0; j < h; j++) {
    const t = (j + 0.5 - h / 2) / (h / 2), half = (w / 2) * Math.sqrt(Math.max(0, 1 - t * t));
    const a = Math.round(x + w / 2 - half), b = Math.round(x + w / 2 + half);
    if (b > a) r(a, y + j, b - a, 1, col);
  }
}

/** Half the ellipse's height at column c of width w and depth d (how far a round top or foot bulges there). */
export const bulge = (c: number, w: number, d: number): number => {
  const t = (c + 0.5 - w / 2) / (w / 2);
  return (d / 2) * Math.sqrt(Math.max(0, 1 - t * t));
};

/** A lit slab: body, lit top and left, shaded right and bottom. */
export function slab(r: Rect, x: number, y: number, w: number, h: number, P: string[], body = 2): void {
  if (w < 1 || h < 1) return;
  r(x, y, w, h, P[body]);
  r(x, y, w, 1, P[body + 1]);
  r(x, y, 1, h, P[body + 1]);
  r(x + w - 1, y, 1, h, P[body - 1]);
  r(x, y + h - 1, w, 1, P[body - 1]);
}

/** A top seen from above (x, y, w, d): planks running along x, butt joints staggered, a lit back and left edge. */
export function planks(r: Rect, x: number, y: number, w: number, d: number, P: string[] = TIM): void {
  r(x, y, w, d, P[3]);
  for (let j = 3, k = 0; j < d; j += 4, k++) {
    r(x, y + j, w, 1, P[2]);
    const jx = x + ((k * 17 + 9) % Math.max(1, w - 6)) + 3;
    if (w > 14 && j + 1 < d) r(jx, y + j - 3, 1, 3, P[2]);
  }
  r(x, y, w, 1, P[4]);
  r(x, y, 1, d, P[4]);
  r(x + w - 1, y, 1, d, P[2]);
}

/** Column shading of a rounded wood body: lit on the left, dark on the right. */
export const roundShade = (c: number, w: number, P: string[]): string => {
  const f = c / Math.max(1, w - 1);
  return f < 0.2 ? P[3] : f < 0.55 ? P[2] : f < 0.88 ? P[1] : P[0];
};
