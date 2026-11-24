/**
 * The tile redraw's other floors (docs/design/tile-redraw.md, R4; ../tilekit.ts is the street): grass, dirt, mud, rock
 * flags and planks, each a 20 by 12 stamp, three to five shades, lit from the upper left, no speckle. Earth floors are
 * read from a blocky value field in world pixels, so a patch or a rut runs over the tile edges and the grid is felt
 * but not drawn; clumps, stones and glints are small stamps laid inside a tile. Cosmetic only; variety from the Rng
 * or from a hash of the tile, never Math.random. Wheat: rows of standing stalks on dark earth, two rows a tile.
 */
import type { Rng } from '../shared/rng';
import { KX, KZ, type Rect } from './tilekit';

export type GroundKind = 'grass' | 'dirt' | 'mud' | 'rock' | 'planks' | 'wheat';

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

/**
 * Grass, one world pixel (Kyle, 2026-11-23, after Ruinsong: calm ground, "a PLACE"): one base tone covered evenly
 * in small blade marks, a lit pixel or two over a dark one, a mark to a staggered 6 by 4 cell at a jittered spot, so
 * the field reads as grass without a grid or blotches. Shared with soil.ts's grass patches, so both are one ground.
 */
const BLADE = ['#141e16', '#1b281b', '#223120', '#2c3d27'];

/**
 * Clumps, the SNES scallop (grass here, foliage in tiletrees.ts): a jittered clump centre to each staggered `cw` by
 * `ch` cell; a pixel takes the nearest clump and is lit toward its top left, darkened along its lower rim. A nudge to
 * the light, about -0.34 to +0.22.
 */
export function clumpLight(x: number, y: number, cw: number, ch: number, s: number): number {
  let best = 1e9, bdx = 0, bdy = 0;
  const r0 = Math.floor(y / ch);
  for (let r = r0 - 1; r <= r0 + 1; r++) {
    const off = (r & 1) * (cw / 2), c0 = Math.floor((x + off) / cw);
    for (let c = c0 - 1; c <= c0 + 1; c++) {
      const px = c * cw - off + cw / 2 + (hash(c, r, s) - 0.5) * cw * 0.5, py = r * ch + ch / 2 + (hash(c, r, s + 1) - 0.5) * ch * 0.5;
      const dx = x + 0.5 - px, dy = y + 0.5 - py, d = dx * dx + dy * dy * 1.4;
      if (d < best) (best = d), (bdx = dx), (bdy = dy);
    }
  }
  const rad = Math.min(cw, ch) * 0.75, d = Math.sqrt(best) / rad;
  if (d > 0.85 && bdy > 0) return -0.34;
  return 0.22 * Math.max(0, 1 - Math.hypot(bdx + rad * 0.45, bdy + rad * 0.45) / rad) - (bdy > 0 ? 0.1 * d : 0);
}

/**
 * Grass, one world pixel (Kyle, 2026-11-23, after Ruinsong: calm ground, "a PLACE"): low turf in clumps, each lit on
 * its top left with a dark rim under it, four close shades, so the field reads as grass without blotches or a grid.
 * Shared with soil.ts's grass patches, so both are one ground.
 */
export function grassAt(x: number, y: number): string {
  const lv = 0.5 + clumpLight(x, y, 6, 4, 61) * 0.72 + (cell(x, y, 40, 24, 66) - 0.5) * 0.08;
  return BLADE[lv < 0.3 ? 0 : lv < 0.52 ? 1 : lv < 0.64 ? 2 : 3];
}

/**
 * Trodden earth, one world pixel (docs/design/forest-redraw.md, the land): a calm dark base with low ripples, a pale
 * crest over a dark trough in short wavy runs, a rut's worth every five rows, and a broad slow shift of tone; no
 * speckle. `cols`: dark, base, mid, pale. Shared by soil.ts's earth and swept ground in the redraw.
 */
export const EARTH = ['#29211a', '#352c25', '#3b322a', '#453b31'], SWEPT = ['#302a25', '#3f3933', '#46403a', '#4f4840'];
export function earthAt(x: number, y: number, cols: string[] = EARTH): string {
  const row = Math.floor((y + 1.6 * Math.sin(x * 0.27 + Math.floor(y / 5) * 1.9)) / 5), band = Math.floor(y + 1.6 * Math.sin(x * 0.27 + Math.floor(y / 5) * 1.9)) - row * 5;
  // Short runs: about half of each row's length carries a ripple.
  if (band <= 1 && cell(x + row * 7, row, 11, 1, 71) < 0.42) return cols[band === 0 ? 3 : 0];
  return cols[cell(x, y, 34, 20, 72) + cell(x + 17, y + 10, 26, 16, 73) > 1.15 ? 2 : 1];
}

function grass(rect: Rect, rng: Rng, x: number, y: number): void {
  for (let j = 0; j < KZ; j++) {
    for (let i = 0; i < KX; ) {
      const c = grassAt(x + i, y + j);
      let n = 1;
      while (i + n < KX && grassAt(x + i + n, y + j) === c) n++;
      rect(x + i, y + j, n, 1, c);
      i += n;
    }
  }
  // A clump now and then (rarer than before): a mound lit on the top left, its shadow under the right.
  if (rng.next() < 0.12) {
    const cx = x + 1 + rng.int(13), cy = y + 1 + rng.int(7);
    sprite(rect, cx, cy, ['.a.b.', '.bbb.', 'bbbbb', '.dddd'], { a: BLADE[3], b: BLADE[2], d: BLADE[0] });
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

/** Standing wheat: dark trodden earth, two rows of stalks a tile (every six rows), a stalk every three pixels, some gone. */
const WHEAT = ['#5a4a26', '#7a6630', '#98823c', '#b8a052'];
function wheat(rect: Rect, rng: Rng, x: number, y: number): void {
  dirt(rect, rng, x, y);
  for (let j = 5; j < KZ; j += 6) for (let i = (x / 3) % 3 ? 1 : 0; i < KX; i += 3) {
    const wx = x + i, wy = y + j;
    if (hash(wx, wy, 11) < 0.22) continue;
    const h = 3 + Math.floor(hash(wx, wy, 12) * 3), c = hash(wx, wy, 13) < 0.5 ? 1 : 2;
    // A stalk lit on its left, its ear a shade up; a dark foot where it stands.
    rect(wx, wy - h, 1, h, WHEAT[c]);
    rect(wx, wy - h - 1, 1, 1, WHEAT[c + 1]);
    rect(wx + 1, wy - 1, 1, 1, WHEAT[0]);
  }
}

const STAMPS: Record<GroundKind, (rect: Rect, rng: Rng, x: number, y: number) => void> = { grass, dirt, mud, rock, planks, wheat };

/** True when `kind` is drawn here; anything else is left to today's painting (false). */
export const grounds = (kind: string): kind is GroundKind => kind in STAMPS;

/** One floor tile of `kind` at (x, y), 20 by 12. */
export function groundStamp(kind: GroundKind, rect: Rect, rng: Rng, x: number, y: number): void {
  STAMPS[kind](rect, rng, x, y);
}
