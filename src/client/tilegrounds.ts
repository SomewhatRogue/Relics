/**
 * The tile redraw's other floors (docs/design/tile-redraw.md, R4; ../tilekit.ts is the street): grass, dirt, mud, rock
 * flags and planks, each a 20 by 12 stamp, three to five shades, lit from the upper left, no speckle. Earth floors are
 * read from a blocky value field in world pixels, so a patch or a rut runs over the tile edges and the grid is felt
 * but not drawn; clumps, stones and glints are small stamps laid inside a tile. Cosmetic only; variety from the Rng
 * or from a hash of the tile, never Math.random. Wheat is not drawn here: it keeps today's painting (null).
 */
import type { Rng } from '../shared/rng';
import { KX, KZ, type Rect } from './tilekit';

export type GroundKind = 'grass' | 'dirt' | 'mud' | 'rock' | 'planks';

const GRASS = ['#1b281b', '#223120', '#2a3a25', '#374a2d'];
const DIRT = ['#2b2218', '#362b1f', '#3f3325', '#52432f'];
const MUD = ['#1c1a14', '#24211a', '#2c2920', '#39382a'];
const ROCK = ['#271f19', '#322821', '#3e332a', '#50433a'], CRACK = '#100c09';
const PLANK = ['#20150d', '#3a2819', '#432d1c', '#4c3521', '#5a4129'];

/** A hash of two integers and a seed, 0 to 1. */
function hash(a: number, b: number, s: number): number {
  let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(s, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const cell = (x: number, y: number, cw: number, ch: number, s: number) => hash(Math.floor(x / cw), Math.floor(y / ch), s);
/** Two blocky layers, the second a half cell over, so patches have corners and run across tiles. */
const patch = (x: number, y: number, s: number) => 0.55 * cell(x, y, 6, 4, s) + 0.45 * cell(x + 3, y + 2, 5, 3, s + 1);

/** A tile of earth: `shade(wx, wy)` picks a colour per pixel; equal neighbours along a row go in one rectangle. */
function paintField(rect: Rect, x: number, y: number, cols: string[], shade: (wx: number, wy: number) => number): void {
  for (let j = 0; j < KZ; j++) {
    for (let i = 0; i < KX; ) {
      const c = shade(x + i, y + j);
      let n = 1;
      while (i + n < KX && shade(x + i + n, y + j) === c) n++;
      rect(x + i, y + j, n, 1, cols[c]);
      i += n;
    }
  }
}

/** Pixels of a small sprite: rows of characters, each mapped to a colour, '.' clear. */
function sprite(rect: Rect, x: number, y: number, rows: string[], cols: Record<string, string>): void {
  rows.forEach((row, j) => [...row].forEach((ch, i) => cols[ch] && rect(x + i, y + j, 1, 1, cols[ch])));
}

const tileKey = (x: number, y: number, s: number) => hash(Math.floor(x / KX), Math.floor(y / KZ), s);

function grass(rect: Rect, rng: Rng, x: number, y: number): void {
  const bias = (tileKey(x, y, 31) - 0.5) * 0.1;
  paintField(rect, x, y, GRASS, (wx, wy) => { const v = patch(wx, wy, 11) + bias; return v < 0.3 ? 0 : v < 0.7 ? 1 : 2; });
  // Clumps: a mound with its light on the top left and its shadow under the right.
  const n = rng.next() < 0.4 ? 1 : rng.next() < 0.3 ? 2 : 0;
  for (let k = 0; k < n; k++) {
    const cx = x + 1 + rng.int(13), cy = y + 1 + rng.int(7);
    const tall = rng.next() < 0.5;
    sprite(rect, cx, cy, tall
      ? ['.a.b.', '.bbb.', 'bbbbb', '.dddd']
      : ['.bb..', 'bbbbb', '.dddd'], { a: GRASS[2], b: GRASS[2], d: GRASS[0] });
    rect(cx + (tall ? 1 : 0), cy + (tall ? 1 : 0), 2, 1, GRASS[3]);
  }
}

function dirt(rect: Rect, rng: Rng, x: number, y: number): void {
  paintField(rect, x, y, DIRT, (wx, wy) => {
    if (cell(wx + 7 * Math.floor(wy / 3), wy, 14, 3, 57) < 0.16) return 0;
    const v = patch(wx, wy, 21);
    return v < 0.22 ? 0 : v < 0.8 ? 1 : 2;
  });
  if (rng.next() < 0.2) {
    // A small stone: pale on the top left, a dark foot under it.
    const sx = x + 1 + rng.int(14), sy = y + 1 + rng.int(7);
    sprite(rect, sx, sy, rng.next() < 0.5 ? ['pp.', 'bbb', '.dd'] : ['pb', 'bd'], { p: DIRT[3], b: '#43372a', d: DIRT[0] });
  }
}

function mud(rect: Rect, rng: Rng, x: number, y: number): void {
  paintField(rect, x, y, MUD, (wx, wy) => {
    const v = patch(wx, wy, 41);
    return v < 0.25 ? 0 : v < 0.8 ? 1 : 2;
  });
  if (rng.next() < 0.14) {
    // A puddle: a wide dark pool, a shade cooler than the mud, with a one pixel glint on its upper left.
    const px = x + 1 + rng.int(9), py = y + 2 + rng.int(6);
    sprite(rect, px, py, ['..dddddd..', '.dddddddd.', '..ddddd...'], { d: '#171915' });
    rect(px + 2, py, 6, 1, '#1f221c');
    rect(px + 3, py + 1, 1, 1, '#6c705f');
  }
}

/** One flag: lit on the top and left edges, a shade down on the bottom and right, a crack now and then. */
function flag(rect: Rect, rng: Rng, x: number, y: number, w: number, h: number): void {
  const i = rng.next() < 0.7 ? 1 : rng.next() < 0.5 ? 0 : 2;
  rect(x, y, w, h, ROCK[i]);
  rect(x, y, w - 1, 1, ROCK[i + 1]), rect(x, y, 1, h, ROCK[i + 1]);
  rect(x + w - 1, y + 1, 1, h - 1, ROCK[i - (i ? 1 : 0)]), rect(x + 1, y + h - 1, w - 1, 1, ROCK[i - (i ? 1 : 0)]);
  if (w >= 7 && h >= 6 && rng.next() < 0.14) {
    const cx = x + 2 + rng.int(w - 5), len = 3 + rng.int(Math.min(4, h - 3));
    for (let k = 0; k < len; k++) rect(cx + (k >> 1), y + 1 + k, 1, 1, CRACK);
  }
}

function rock(rect: Rect, rng: Rng, x: number, y: number): void {
  rect(x, y, KX, KZ, CRACK);
  const sx = 6 + rng.int(8), sy = 4 + rng.int(4), sx2 = 6 + rng.int(8), v = rng.next();
  // Each piece is [x, y, w, h] with its seam (1 pixel right and below) inside it.
  const parts: number[][] = v < 0.15 ? [[0, 0, KX, KZ]]
    : v < 0.4 ? [[0, 0, sx, KZ], [sx, 0, KX - sx, KZ]]
    : v < 0.65 ? [[0, 0, KX, sy], [0, sy, sx, KZ - sy], [sx, sy, KX - sx, KZ - sy]]
    : v < 0.85 ? [[0, 0, sx, sy], [sx, 0, KX - sx, sy], [0, sy, KX, KZ - sy]]
    : [[0, 0, sx, sy], [sx, 0, KX - sx, sy], [0, sy, sx2, KZ - sy], [sx2, sy, KX - sx2, KZ - sy]];
  for (const [px, py, pw, ph] of parts) flag(rect, rng, x + px, y + py, pw - 1, ph - 1);
}

const BOARD = 4, LEN = 30;
function planks(rect: Rect, rng: Rng, x: number, y: number): void {
  for (let j = 0; j < KZ; j += BOARD) {
    const row = Math.floor((y + j) / BOARD), off = Math.floor(hash(row, 0, 5) * LEN);
    for (let i = 0; i < KX; ) {
      const wx = x + i, b = Math.floor((wx + off) / LEN), end = (b + 1) * LEN - off;
      const n = Math.min(KX - i, end - wx), fx = wx - (b * LEN - off), c = 1 + Math.floor(hash(row, b, 6) * 3);
      rect(wx, y + j, n, BOARD - 1, PLANK[c]);
      rect(wx, y + j, n, 1, PLANK[c + 1]);
      rect(wx, y + j + BOARD - 1, n, 1, PLANK[0]);
      // A short grain line on some boards, a seam at the end and a nail beside it.
      if (hash(row, b, 7) < 0.5 && fx + n <= LEN - 8 && fx >= 4 && wx === x + i) rect(wx + 2, y + j + 2, Math.min(5, n - 2), 1, PLANK[c - 1]);
      if (end <= x + KX) rect(end - 1, y + j, 1, BOARD, PLANK[0]);
      if (fx === 0 && hash(row, b, 8) < 0.5) rect(wx + 1, y + j + 1, 1, 1, PLANK[0]), rect(wx + 1, y + j + 2, 1, 1, '#6a5844');
      i += n;
    }
  }
  void rng;
}

const STAMPS: Record<GroundKind, (rect: Rect, rng: Rng, x: number, y: number) => void> = { grass, dirt, mud, rock, planks };

/** True when `kind` is drawn here; wheat and anything else is left to today's painting (false). */
export const grounds = (kind: string): kind is GroundKind => kind in STAMPS;

/** One floor tile of `kind` at (x, y), 20 by 12. */
export function groundStamp(kind: GroundKind, rect: Rect, rng: Rng, x: number, y: number): void {
  STAMPS[kind](rect, rng, x, y);
}
