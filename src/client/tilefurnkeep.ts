/**
 * The Keeping Room's own furniture (docs/design/keeping-room.md, slice 2), drawn in the kit as cards (tilefurn.ts
 * routes it; docs/design/tile-redraw.md "Making a new asset"): the trough under its drip, the empty cradle among the
 * hoard, and the hoard's shelves (pewter, rings, plate, a tallow stub on every board). Light from the upper left, a
 * darker edge right and bottom, three to five shades a material, clean outlines from the card. Cosmetic only.
 */
import type { Rect } from './tilekit';
import { IRON, ROCK, slab, TIM, planks, roundShade } from './tilefurnkit';

export type DrawK = (r: Rect, W: number, D: number, T: number) => void;

/** Still, dark cistern water, and the drip's ring on it. */
const WATER = ['#070c0c', '#0c1616', '#122222', '#1c3434', '#2e5050'];
/** Pewter and old plate, dull grey-blue; tallow, a dirty cream; its flame, small. */
const PEWTER = ['#1e2226', '#2e343a', '#454d55', '#5e6872', '#7c8892'];
const TALLOW = ['#3a3426', '#5a5038', '#7a6e4e', '#9a8c64', '#b4a67a'];
const FLAME = ['#7a3a10', '#c07020', '#f0b048'];
const hash = (i: number, k = 5): number => {
  let x = Math.imul(i + k * 97 + 1, 0x9e3779b1);
  x ^= x >>> 15, x = Math.imul(x, 0x85ebca6b), x ^= x >>> 13;
  return x >>> 0;
};

/** A stone basin: a thick rim round dark water, the drip's ring on it, the front in two courses. */
const trough: DrawK = (r, W, D, T) => {
  slab(r, 0, 0, W, D, ROCK, 2);
  r(0, 0, W, 1, ROCK[4]);
  // The water, its far edge in shadow under the rim, a lit line where the upper-left light catches it.
  r(3, 2, W - 6, D - 4, WATER[2]);
  r(3, 2, W - 6, 1, WATER[0]);
  r(3, 3, 1, D - 6, WATER[1]);
  r(5, D - 3, W - 10, 1, WATER[3]);
  // The drip's ring, two-thirds along.
  const dx = Math.round(W * 0.62), dy = Math.max(3, Math.round(D / 2));
  r(dx - 2, dy, 5, 1, WATER[3]), r(dx - 1, dy - 1, 3, 1, WATER[4]), r(dx - 1, dy + 1, 3, 1, WATER[1]), r(dx, dy, 1, 1, WATER[4]);
  // The front: two courses of stone, lit left, a joint here and there.
  slab(r, 0, D, W, T, ROCK, 2);
  const mid = D + Math.floor(T / 2);
  r(1, mid, W - 2, 1, ROCK[1]);
  for (let x = 6; x < W - 3; x += 9) r(x, D + 1, 1, mid - D - 1, ROCK[1]);
  for (let x = 10; x < W - 3; x += 9) r(x, mid + 1, 1, D + T - mid - 2, ROCK[1]);
};

/** An empty wooden cradle on its rockers, a hood at the head end (the left, toward the light). */
const cradle: DrawK = (r, W, D, T) => {
  const H = D + T;
  // The box seen from above: its rim, and empty inside but for a fold of old cloth.
  slab(r, 1, 0, W - 2, D, TIM, 2);
  r(3, 2, W - 6, D - 4, TIM[0]);
  r(Math.round(W * 0.55), D - 4, Math.round(W * 0.25), 2, '#4a4030');
  // The hood over the head end.
  const hw = Math.max(4, Math.round(W * 0.3));
  for (let c = 0; c < hw; c++) r(1 + c, 0, 1, D + 3, roundShade(c, hw, TIM));
  r(1, 0, hw, 1, TIM[4]);
  // Its sides, in planks; then the two rockers, curved, darker underneath.
  planks(r, 1, D, W - 2, T - 4);
  for (let c = 0; c < W; c++) {
    const lift = Math.round(((c - W / 2) / (W / 2)) ** 2 * 2);
    r(c, H - 3 - lift, 1, 2, c < W / 2 ? TIM[3] : TIM[2]);
    r(c, H - 1 - lift, 1, 1, TIM[0]);
  }
};

/** One thing on a hoard board, its foot at row yb: a pewter jug, a stack of plate, a ring, or a tallow stub lit. */
function kept(r: Rect, x: number, yb: number, room: number, n: number): number {
  const k = hash(n) % 4;
  if (k === 0) {
    const h = Math.min(room, 7);
    for (let c = 0; c < 4; c++) r(x + c, yb - h, 1, h, roundShade(c, 4, PEWTER));
    r(x + 4, yb - h + 2, 1, 3, PEWTER[2]), r(x, yb - h, 4, 1, PEWTER[4]);
    return 6;
  }
  if (k === 1) {
    for (let i = 0; i < 3; i++) r(x, yb - 1 - i * 2, 6, 1, PEWTER[i === 2 ? 4 : 3]), r(x, yb - i * 2, 6, 1, PEWTER[1]);
    return 8;
  }
  if (k === 2) return r(x, yb - 2, 3, 1, '#a08a4c'), r(x, yb - 1, 1, 1, '#a08a4c'), r(x + 2, yb - 1, 1, 1, '#665430'), r(x + 1, yb - 1, 1, 1, '#2e2618'), 4;
  // A tallow stub, and its small flame (drawn here; the room's light is the brazier's and the hero's).
  const h = Math.min(room - 3, 4);
  r(x, yb - h, 3, h, TALLOW[2]), r(x, yb - h, 1, h, TALLOW[3]), r(x + 2, yb - h, 1, h, TALLOW[1]);
  r(x + 1, yb - h - 1, 1, 1, '#1a1208'), r(x + 1, yb - h - 3, 1, 2, FLAME[1]), r(x + 1, yb - h - 3, 1, 1, FLAME[2]);
  return 5;
}

/** The hoard's shelves: a dark timber frame, two boards, and on them what the town didn't give. */
const hoard: DrawK = (r, W, D, T) => {
  const H = D + T, gap = Math.floor((T - 3) / 2);
  planks(r, 0, 0, W, D);
  r(1, D, W - 2, T, TIM[0]);
  r(0, D, 1, T, TIM[2]), r(W - 1, D, 1, T, TIM[1]);
  for (let k = 0; k < 2; k++) {
    const yb = k === 1 ? H - 4 : D + 3 + gap - 3, top = D + 3 + k * gap;
    if (k === 1) slab(r, 0, H - 3, W, 3, TIM);
    else slab(r, 1, yb, W - 2, 3, TIM);
    for (let x = 3, i = 0; x < W - 7; i++) x += kept(r, x, yb, yb - top - 1, i + k * 31 + W) + 2;
  }
  // A ring of iron at one end, where something hangs.
  r(W - 5, D + 2, 3, 1, IRON[3]), r(W - 5, D + 3, 1, 2, IRON[2]), r(W - 3, D + 3, 1, 2, IRON[1]);
};

/** The cistern's lip: a low kerb of dressed stone, its top worn pale, the black water beyond it at the back edge. */
const lip: DrawK = (r, W, D, T) => {
  slab(r, 0, 0, W, D, ROCK, 2);
  r(0, 0, W, 1, ROCK[4]);
  r(0, D - 2, W, 2, WATER[0]);
  slab(r, 0, D, W, T, ROCK, 2);
  for (let x = 4 + (W % 7); x < W - 2; x += 7) r(x, D + 1, 1, T - 2, ROCK[1]);
};

export const DRAWK: Record<string, DrawK> = { trough, cradle, hoard, lip };
