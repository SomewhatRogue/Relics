/**
 * The tile redraw's last boxed furniture (tilefurn.ts routes it): shelf and books, rack, loom, dummy, booth, bunk, armour
 * stand, bellows and font, drawn in the kit's pixels as cards (docs/design/tile-redraw.md). Same rules as the rest: light
 * from the upper left, a darker edge right and bottom, a clear pixel where the floor shows. Cosmetic only.
 */
import type { Rect } from './tilekit';
import { bulge, CLOTH, ell, IRON, planks, roundShade, ROCK, slab, TIM } from './tilefurnkit';

export type Draw3 = (r: Rect, W: number, D: number, T: number) => void;

const CLAY = ['#2a1810', '#4a2a1a', '#6a4028', '#8a5636', '#a66c46'];
const GLASS = ['#101c18', '#1c2e28', '#2c4a3e', '#3e6656', '#5a8470'];
const RED = ['#2a0c0c', '#3e1414', '#5a1e1e', '#722828', '#8a3434'];
const STRAW = ['#3a2e14', '#5a4a22', '#7a6430', '#9a8444', '#b49c58'];
const LEATHER = ['#1c1008', '#2e1c10', '#44281a', '#5c3a26', '#74503a'];
const tint = (h: string, f: number) => '#' + [1, 3, 5].map((i) => Math.min(255, Math.round(parseInt(h.slice(i, i + 2), 16) * f)).toString(16).padStart(2, '0')).join('');
const SPINE = [RED[3], '#2e4a3a', '#3a3a6a', STRAW[2], CLAY[3], '#5a3a5a', '#6a5a3a'].map((c) => [tint(c, 0.3), tint(c, 0.55), c, tint(c, 1.35), tint(c, 1.6)]);
const hash = (i: number, k = 7) => (i * 2654435761 + k * 40503) >>> 0;

/** A column-shaded block (lit left, dark right) with a 1-row lit top: a jar, a book, a bundle. */
function body(r: Rect, x: number, y: number, w: number, h: number, P: string[]): void {
  for (let c = 0; c < w; c++) r(x + c, y, 1, h, roundShade(c, w, P));
  r(x, y, w, 1, P[4]);
  r(x, y + h - 1, w, 1, P[0]);
}

/** One thing standing on a board (its foot at row yb): a jar, a round pot, a bundle of herbs or a stack of books. */
function item(r: Rect, x: number, yb: number, w: number, h: number, n: number): void {
  const k = (hash(n) >> 9) % 4;
  if (k === 0) (body(r, x, yb - h, w, h, GLASS), r(x + 1, yb - h - 1, w - 2, 1, TIM[3]), r(x + 1, yb - h + 2, 1, h - 5, GLASS[4]));
  else if (k === 1) {
    const ph = Math.min(h, w);
    for (let c = 0; c < w; c++) { const b = bulge(c, w, ph); r(x + c, Math.round(yb - ph / 2 - b), 1, Math.max(1, Math.round(b * 2)), roundShade(c, w, CLAY)); }
    r(x + 1, yb - ph - 1, w - 2, 2, CLAY[1]);
  } else if (k === 2) (body(r, x + 1, yb - h + 2, w - 2, h - 2, CLOTH), r(x, yb - h, 1, 3, CLOTH[3]), r(x + w - 1, yb - h, 1, 3, CLOTH[2]), r(x + 1, yb - h + 3, w - 2, 1, CLOTH[0]));
  else (body(r, x, yb - h + 2, w, h - 2, CLAY), r(x + 1, yb - h, w - 2, 2, TIM[2]));
}

/** A shelf: a timber frame with boards, and on them jars, pots and bundles (or, with `books`, spines). */
const shelf = (books: boolean): Draw3 => (r, W, D, T) => {
  const H = D + T, n = books ? 3 : 2, gap = Math.floor((T - 3) / n);
  planks(r, 0, 0, W, D);
  r(1, D, W - 2, T, TIM[0]);
  for (let k = 0; k < n; k++) {
    const by = D + 3 + (k + 1) * gap - 3, top = D + 3 + k * gap;
    if (k === n - 1) (slab(r, 0, H - 3, W, 3, TIM), r(2, H - 4, W - 4, 1, TIM[1]));
    else slab(r, 1, by, W - 2, 3, TIM);
    const yb = k === n - 1 ? H - 4 : by;
    const room = yb - top - 2;
    for (let x = 6, i = 0; x < W - 10; i++) {
      const s = hash(i, k * 3 + W), w = books ? 3 + (s % 3) : 4 + (s % 4), h = books ? room - (s >> 3) % 3 : Math.min(room, 5 + (s % 5));
      if (books) { body(r, x, yb - h, w, h, SPINE[s % 7]); h > 9 && (r(x, yb - h + 3, w, 1, '#a08a4c'), r(x, yb - 4, w, 1, '#a08a4c')); }
      else if (s % 5 !== 0) item(r, x, yb, w, h, s);
      x += w + (books ? ((s >> 6) % 9 === 0 ? 2 : 0) : 2 + ((s >> 5) % 5));
    }
  }
  slab(r, 0, D, 4, T, TIM), slab(r, W - 4, D, 4, T, TIM);
  slab(r, 0, D, W, 3, TIM);
};

/** A diagonal 2-wide haft from (x0, y0) to (x1, y1), lit on the left. */
function haft(r: Rect, x0: number, y0: number, x1: number, y1: number, P = TIM): void {
  for (let y = y0; y <= y1; y++) {
    const x = Math.round(x0 + ((x1 - x0) * (y - y0)) / Math.max(1, y1 - y0));
    r(x, y, 1, 1, P[4]), r(x + 1, y, 1, 1, P[2]);
  }
}

/** A weapon rack: two uprights, a cross bar high and low, hafts and blades leaning in it. */
const rack: Draw3 = (r, W, D, T) => {
  const H = D + T, yHi = D + Math.round(T * 0.22), yLo = D + Math.round(T * 0.62);
  slab(r, 0, 0, W, D, TIM, 3);
  const ups = [0, W - 4, ...(W >= 48 ? [Math.round(W / 2) - 2] : [])];
  for (let i = 0, x = 7; x < W - 9; i++, x += 8) {
    const k = i % 3, lean = k === 1 ? 0 : (i % 2 ? 2 : -2);
    if (k === 0) { // a spear to the top, leaf head
      haft(r, x, 5, x + lean, H - 1);
      r(x, 0, 2, 5, IRON[3]), r(x - 1, 2, 4, 2, IRON[2]), r(x, 0, 1, 4, IRON[4]);
    } else if (k === 1) { // an axe, a wedge of iron on the haft's head
      haft(r, x, yHi - 3, x, H - 1);
      r(x - 3, yHi - 4, 4, 6, IRON[3]), r(x - 3, yHi - 4, 4, 1, IRON[4]), r(x - 3, yHi + 1, 4, 1, IRON[1]), r(x, yHi - 3, 2, 3, IRON[2]);
    } else { // a sword hung point down: hilt above the high bar
      r(x, D + 1, 2, 3, TIM[3]), r(x - 2, D + 4, 6, 1, IRON[3]), r(x, D + 5, 2, yLo - D - 2, IRON[4]), r(x + 1, D + 5, 1, yLo - D - 2, IRON[2]);
    }
  }
  for (const x of ups) slab(r, x, D, 4, T, TIM);
  slab(r, 0, yHi, W, 3, TIM), slab(r, 0, yLo, W, 3, TIM);
  slab(r, 0, H - 2, 5, 2, TIM), slab(r, W - 5, H - 2, 5, 2, TIM);
};

/** A loom: timber frame, warp threads, a half-woven band, the cloth beam and a shuttle. */
const loom: Draw3 = (r, W, D, T) => {
  const H = D + T;
  slab(r, 0, D - 5, W, 5, TIM, 3), slab(r, 0, 0, 5, D, TIM, 3), slab(r, W - 5, 0, 5, D, TIM, 3);
  r(5, D, W - 10, T - 5, TIM[0]);
  for (let x = 7; x < W - 7; x += 2) r(x, D + 4, 1, T - 9, CLOTH[2]);
  const bandY = H - 18, bandH = 9;
  slab(r, 5, D + Math.round(T * 0.28), W - 10, 3, TIM, 2);
  r(6, bandY, W - 12, bandH, CLOTH[2]);
  for (let j = 0; j < bandH; j++) for (let x = 6 + (j % 2); x < W - 6; x += 2) r(x, bandY + j, 1, 1, j < 2 ? CLOTH[4] : CLOTH[3]);
  r(6, bandY + 3, W - 12, 1, RED[2]), r(6, bandY + 5, W - 12, 1, RED[2]), r(6, bandY + bandH - 1, W - 12, 1, CLOTH[1]);
  slab(r, 5, bandY - 4, W - 10, 3, TIM, 3);
  slab(r, 0, D, 5, T, TIM), slab(r, W - 5, D, 5, T, TIM), slab(r, 0, D, W, 4, TIM);
  slab(r, 0, H - 5, W, 5, TIM);
  r(W - 15, H - 10, 7, 2, TIM[4]), r(W - 15, H - 9, 7, 1, TIM[1]);
};

/** A straw-man training dummy: a post on a cross foot, a stuffed body on a cross arm, a ring on the chest. */
const dummy: Draw3 = (r, W, D, T) => {
  const H = D + T, cx = Math.floor(W / 2), bw = W - 6, by = 14, bh = Math.round(H * 0.42);
  slab(r, 0, H - 4, W, 4, TIM), slab(r, cx - 1, 8, 3, H - 12, TIM);
  slab(r, 0, by + 2, W, 3, TIM), r(0, by + 1, 2, 1, STRAW[4]), r(W - 2, by + 1, 2, 1, STRAW[3]);
  for (let c = 0; c < bw; c++) { const b = bulge(c, bw, bh); r(3 + c, Math.round(by + bh / 2 - b), 1, Math.round(b * 2), roundShade(c, bw, STRAW)); }
  r(3, by + bh - 3, bw, 1, CLOTH[0]);
  for (const x of [4, 7, W - 6, W - 9]) r(x, by + bh - 1, 1, 3, STRAW[4]);
  const ty = by + 3, tx = cx - 4;
  ell(r, tx, ty, 8, 8, '#d8d0bc'), ell(r, tx + 1, ty + 1, 6, 6, '#7a1d1d'), ell(r, tx + 2, ty + 2, 4, 4, '#d8d0bc'), ell(r, tx + 3, ty + 3, 2, 2, '#7a1d1d');
  for (let c = 0; c < 8; c++) r(cx - 4 + c, 1 + Math.round(4 - bulge(c, 8, 8)), 1, Math.round(bulge(c, 8, 8) * 2), roundShade(c, 8, CLOTH));
  r(cx - 3, 5, 6, 1, CLOTH[0]);
};

/** A curtained booth: a dark timber stall, a heavy red curtain drawn most of the way, a rod with rings. */
const booth: Draw3 = (r, W, D, T) => {
  const H = D + T;
  slab(r, 0, 0, W, D, TIM, 2);
  for (let y = 4; y < D - 1; y += 4) r(1, y, W - 2, 1, TIM[1]);
  r(4, D, W - 8, T - 3, '#0a0806');
  const cw = Math.round((W - 8) * 0.7), FOLD = [3, 2, 2, 1, 1, 2];
  for (let c = 0; c < cw; c++) r(4 + c, D + 5, 1, T - 11 + (c % 6 === 3 ? 1 : 0), RED[FOLD[c % 6]]);
  r(4, D + T - 6, cw, 1, RED[0]), r(4, D + 5, cw, 1, RED[4]);
  for (let x = 6; x < 4 + cw; x += 6) r(x, D + 3, 1, 3, '#8a7448');
  slab(r, 0, D, 5, T - 2, TIM, 2), slab(r, W - 5, D, 5, T - 2, TIM, 2);
  slab(r, 0, D, W, 4, TIM, 2), r(2, D + 4, W - 4, 1, TIM[0]);
  slab(r, 0, H - 4, W, 4, TIM, 2);
};

/** A bunk: two berths one over the other seen from the foot, blankets and a pillow on the top one. */
const bunk: Draw3 = (r, W, D, T) => {
  const H = D + T, BL = ['#241010', '#3a1a1a', '#5a2a2a', '#743636', '#8a4646'];
  slab(r, 0, 0, W, D, TIM, 2);
  r(2, 2, W - 4, D - 3, BL[2]), r(2, 2, W - 4, 1, BL[3]), r(W - 3, 2, 1, D - 3, BL[1]);
  slab(r, 3, 3, W - 6, 7, CLOTH, 3), r(3, 3, W - 6, 1, '#b8a468');
  r(2, 12, W - 4, 1, BL[3]), r(2, D - 2, W - 4, 1, BL[1]);
  r(3, D, W - 6, T, TIM[0]);
  slab(r, 0, D, W, 5, TIM);
  r(3, D + 15, W - 6, 6, BL[2]), r(3, D + 15, W - 6, 1, BL[3]), r(W - 4, D + 15, 1, 6, BL[1]);
  slab(r, 0, D + 21, W, 4, TIM);
  slab(r, 0, D, 3, T, TIM), slab(r, W - 3, D, 3, T, TIM);
  r(0, H - 2, 4, 2, TIM[0]), r(W - 4, H - 2, 4, 2, TIM[0]);
};

/** An armour stand: a post on a cross foot, a breastplate with pauldrons, a helm on top, a shield leant at its foot. */
const stand: Draw3 = (r, W, D, T) => {
  const H = D + T, cx = Math.floor(W / 2), py = 15, ph = Math.round(T * 0.34);
  slab(r, 0, H - 4, W, 4, TIM), slab(r, cx - 1, 8, 3, H - 12, TIM);
  for (let c = 0; c < W - 4; c++) r(2 + c, py, 1, ph, roundShade(c, W - 4, IRON));
  r(2, py, W - 4, 1, IRON[4]), r(2, py + ph - 1, W - 4, 1, IRON[0]), r(cx, py + 1, 1, ph - 3, IRON[4]);
  r(2, py + Math.round(ph * 0.6), W - 4, 1, IRON[1]);
  slab(r, 0, py - 1, 4, 4, IRON, 3), slab(r, W - 4, py - 1, 4, 4, IRON, 2);
  for (let c = 0; c < 8; c++) r(cx - 4 + c, Math.round(4 - bulge(c, 8, 9)) + 4, 1, Math.round(bulge(c, 8, 9) * 2), roundShade(c, 8, IRON));
  r(cx - 3, 6, 6, 1, IRON[0]), r(cx - 1, 2, 2, 1, IRON[4]);
  const sx = W - 7, sy = H - 17;
  r(sx, sy, 6, 11, '#2c4a3a'), r(sx + 1, sy + 11, 4, 2, '#2c4a3a'), r(sx + 2, sy + 13, 2, 1, '#2c4a3a');
  r(sx, sy, 6, 1, IRON[3]), r(sx, sy, 1, 11, IRON[3]), r(sx + 5, sy, 1, 11, IRON[1]), r(sx + 2, sy + 3, 2, 3, '#a08a4c');
};

/** Bellows: a plank top, folds of leather, a plank foot, an iron nozzle and a handle. */
const bellows: Draw3 = (r, W, D, T) => {
  const H = D + T, x1 = W - 6, top = D - 1, bot = H - 5;
  for (let j = top + 3; j < bot; j++) {
    const f = (j - top) % 3, inset = Math.round(((j - top) / Math.max(1, bot - top)) * 2);
    r(1 + inset, j, x1 - 2 * inset, 1, LEATHER[f === 0 ? 1 : f === 1 ? 3 : 2]);
  }
  slab(r, 0, top, x1 + 1, 3, TIM), slab(r, 0, bot, x1 + 1, 4, TIM);
  r(x1 + 1, H - 8, 6, 2, IRON[3]), r(x1 + 1, H - 8, 6, 1, IRON[4]), r(x1 + 5, H - 8, 1, 2, IRON[1]);
  haft(r, 2, 0, 2, top, TIM);
};

/** A stone font: a stepped foot, a stem, a wide bowl with water dark in it. */
const font: Draw3 = (r, W, D, T) => {
  const H = D + T, cx = Math.floor(W / 2);
  slab(r, 2, H - 5, W - 4, 5, ROCK, 2);
  slab(r, cx - 4, D, 8, H - D - 5, ROCK, 2);
  for (let c = 0; c < W; c++) { const b = bulge(c, W, D); r(c, Math.round(D / 2), 1, Math.round(b) + 6, roundShade(c, W, ROCK)); }
  ell(r, 0, 0, W, D, ROCK[3]), ell(r, 1, 1, W - 2, D - 1, ROCK[4]);
  ell(r, 3, 2, W - 6, Math.max(2, D - 4), '#1c2228'), r(5, 3, Math.max(1, W - 11), 1, '#2c3640');
};

export const DRAW3: Record<string, Draw3> = { shelf: shelf(false), books: shelf(true), rack, loom, dummy, booth, bunk, stand, bellows, font };
