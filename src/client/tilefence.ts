/**
 * The tile redraw's fences and walls (docs/design/tile-redraw.md; `?redraw=1`, tilelook.ts), drawn in the kit's pixels
 * instead of built from boxes (walls3d.ts calls drawnFence). Each is a flat quad whose picture is mapped to the screen's
 * pixels (three/redraw3d.ts screenQuad): a stone wall's coursed face and its coping seen from above, a rock wall's
 * boulders, a fence's posts and two rails (clear between them, so the ground shows), a hurdle's woven withies. A fence or
 * hurdle running north to south is seen end-on, so it is one picture of uprights climbing the screen. Only intact ones;
 * burning, charred and ruined ones stay built. Cosmetic only (seeded from the block's place).
 */
import * as THREE from 'three';
import type { Block } from '../shared/arena';
import { Rng } from '../shared/rng';
import { gradeCanvas } from './darkgold';
import { KY, KZ, ledgeCanvas, type Rect } from './tilekit';
import { screenQuad } from './three/redraw3d';

// (Copied from tilekit.ts, which keeps them private: neutral greys and plain browns, graded once drawn.)
const MORTAR = '#141414', STONE = ['#2c2c2c', '#3c3c3c', '#4f4f4f'], LIGHT = ['#3c3c3c', '#4f4f4f', '#6b6b6b'];
// (Fence timber a step lighter than the kit's, so it stands out of the dark stone behind it.)
const TIMBER = ['#2e2014', '#52402c', '#7a5e40'], WITHY = ['#52402c', '#7a5e40', '#6a5238'];
const ROCK = ['#101010', '#222222', '#303030', '#444444'];
/** The kinds drawn here, and the heights they stand (tiles): the wall as flatBlock builds it, a rock wall's average. */
const HIGH: Record<string, number> = { wall: 1.48, rockwall: 1.0, fence: 0.75, hurdle: 0.95 };

function pad(w: number, h: number): [HTMLCanvasElement, Rect] {
  const c = document.createElement('canvas');
  (c.width = Math.max(1, w)), (c.height = Math.max(1, h));
  const g = c.getContext('2d')!;
  return [c, (x, y, w2, h2, col) => ((g.fillStyle = col), g.fillRect(x, y, w2, h2))];
}

/** A coping slab: its lit edge top and left, its far edge a shade down. */
function slab(rect: Rect, x: number, y: number, w: number, h: number, i: number): void {
  rect(x, y, w, h, STONE[i]);
  rect(x, y, w - 1, 1, LIGHT[i]);
  rect(x, y, 1, h, LIGHT[i]);
  rect(x + w - 1, y + 1, 1, h - 1, STONE[i - 1]);
}

/** A wall's top seen from above: slabs of nine to eleven pixels along its length, mortar between, a pale lit edge. */
function copingCanvas(cols: number, rows: number, rng: Rng): HTMLCanvasElement {
  const [c, rect] = pad(cols, rows), tall = rows > cols, len = tall ? rows : cols;
  rect(0, 0, cols, rows, MORTAR);
  for (let a = 0; a < len; ) {
    const n = Math.min(len - a, 9 + rng.int(3)), i = rng.next() < 0.35 ? 2 : 1;
    if (tall) slab(rect, 0, a, cols - 1, Math.max(1, n - 1), i);
    else slab(rect, a, 0, Math.max(1, n - 1), rows - 1, i);
    a += n;
  }
  gradeCanvas(c, 'wall');
  return c;
}

/** One boulder, a rounded lump w by h with its lit edge upper left and its dark one lower right. */
function boulder(rect: Rect, x: number, y: number, w: number, h: number, rng: Rng): void {
  const base = rng.next() < 0.25 ? 2 : 1;
  for (let j = 0; j < h; j++) {
    const t = (j + 0.5 - h / 2) / (h / 2), hw = Math.max(1, Math.round((w / 2) * Math.sqrt(1 - t * t))), a = x + Math.round(w / 2) - hw, n = hw * 2;
    rect(a, y + j, n, 1, ROCK[base]);
    if (j < h / 2) rect(a, y + j, Math.min(n, j ? 2 : 4), 1, ROCK[3]);
    if (j >= h / 2 || j === h - 1) rect(a + n - 2, y + j, 2, 1, ROCK[0]);
  }
  rect(x + 2, y + h - 1, w - 4, 1, ROCK[0]);
}

/** A rock wall's face: rows of boulders over a dark fill, a ragged top, black at the foot. */
function rockFront(cols: number, rows: number, rng: Rng): HTMLCanvasElement {
  const [c, rect] = pad(cols, rows);
  rect(0, 4, cols, rows - 4, ROCK[0]);
  for (let y = rng.int(3), row = 0; y < rows; y += 5 + rng.int(2), row++) {
    for (let x = -(row % 2) * 5 - rng.int(4); x < cols; ) {
      const w = 9 + rng.int(6);
      boulder(rect, x, y, w, 7 + rng.int(3), rng);
      x += w - 1 - rng.int(2);
    }
  }
  rect(0, rows - 2, cols, 2, ROCK[0]);
  gradeCanvas(c, 'wall');
  return c;
}

/** A rock wall's top: the boulders' crowns, a little paler. */
function rockTop(cols: number, rows: number, rng: Rng): HTMLCanvasElement {
  const [c, rect] = pad(cols, rows);
  rect(0, 0, cols, rows, ROCK[0]);
  for (let y = 0, row = 0; y < rows; y += 5, row++) for (let x = -(row % 2) * 4; x < cols; ) {
    const w = 8 + rng.int(5);
    boulder(rect, x, y, w, Math.min(6, rows - y + 1), rng);
    x += w - 1;
  }
  gradeCanvas(c, 'wall');
  return c;
}

/** A timber upright, three wide, lit left, its top pale. */
function post(rect: Rect, x: number, y: number, h: number, w = 2): void {
  rect(x, y, w, h, TIMBER[1]);
  rect(x, y, 1, h, TIMBER[2]);
  rect(x + w - 1, y + 1, 1, h - 1, TIMBER[0]);
  rect(x, y, w, 1, TIMBER[2]);
}

/** A fence seen from the side: posts every eight pixels, uneven, two rails over them, clear between. */
function fenceFront(cols: number, rows: number, rng: Rng): HTMLCanvasElement {
  const [c, rect] = pad(cols, rows), xs: number[] = [];
  for (let x = 0; x < cols - 3; x += 9) xs.push(x);
  xs.push(cols - 3);
  for (const x of xs) {
    const up = rng.int(2);
    post(rect, x, up, rows - up, 3);
  }
  for (const y of [2, rows - 6]) {
    rect(0, y, cols, 1, TIMBER[2]);
    rect(0, y + 1, cols, 1, TIMBER[1]);
    rect(0, y + 2, cols, 1, TIMBER[0]);
  }
  gradeCanvas(c, 'wall');
  return c;
}

/** A hurdle from the side: stakes every seven pixels with ragged tops, withies two pixels deep woven in front of one stake and behind the next. */
function hurdleFront(cols: number, rows: number, rng: Rng): HTMLCanvasElement {
  const [c, rect] = pad(cols, rows), xs: number[] = [];
  for (let x = 0; x < cols - 2; x += 7) xs.push(x);
  xs.push(cols - 2);
  for (const x of xs) post(rect, x, rng.int(4), rows, 2);
  for (let y = rows - 3, k = 0; y > 4; y -= 3, k++) {
    for (let i = 0; i + 1 < xs.length; i++) {
      const a = xs[i] + (i + k) % 2 * -1 + 2, b = xs[i + 1] + ((i + 1 + k) % 2 ? 2 : 0);
      rect(Math.max(0, a), y, Math.min(cols, b) - Math.max(0, a), 1, WITHY[2]);
      rect(Math.max(0, a), y + 1, Math.min(cols, b) - Math.max(0, a), 1, WITHY[(i * 3 + k) % 4 ? 1 : 0]);
    }
  }
  rect(0, rows - 1, cols, 1, TIMBER[0]);
  gradeCanvas(c, 'wall');
  return c;
}

/**
 * A fence or hurdle running north to south, end-on: stakes three wide climbing the screen, a post every five pixels
 * of depth, drawn far to near, with its rails as lines up the middle behind them. `len`: its length in tiles.
 */
function endOn(cols: number, rows: number, len: number, high: number, hurdle: boolean, rng: Rng): HTMLCanvasElement {
  const [c, rect] = pad(cols, rows), m = Math.floor(cols / 2) - 1, h = Math.round(high * KY), base = (d: number) => rows - Math.round(d * KZ);
  for (const y of hurdle ? [3, 6, 9, 12] : [3, h - 5]) {
    rect(m, base(len) - y, 2, Math.round(len * KZ), hurdle ? WITHY[1] : TIMBER[1]);
    rect(m, base(len) - y, 1, Math.round(len * KZ), hurdle ? WITHY[2] : TIMBER[2]);
  }
  for (let d = len - 0.2; d > 0.05; d -= 0.4) post(rect, m, base(d) - h + rng.int(2), h, 3);
  post(rect, m, base(0.05) - h, h, 3);
  gradeCanvas(c, 'wall');
  return c;
}

const intact = (b: Block) => !b.ruined && !((b.burning ?? -1) >= 0 || b.fate === 'burning' || b.smoulder) && !(b.maxHp && (b.hp ?? 0) < b.maxHp * 0.5) && b.shut !== 'burnt';

/** Add the drawn quads for an intact wall, rock wall, fence or hurdle to `group`; false (nothing added) for anything else. */
export function drawnFence(b: Block, group: THREE.Group): boolean {
  const high = HIGH[b.kind];
  if (!high || !intact(b)) return false;
  const rng = new Rng(Math.round(b.x * 29 + b.y * 13 + 3)), x0 = b.x, x1 = b.x + b.w, z0 = b.y, z1 = b.y + b.h, e = 0.004;
  if (b.kind === 'wall' || b.kind === 'rockwall') {
    const rock = b.kind === 'rockwall';
    group.add(screenQuad([[x0, 0, z1 + e], [x1, 0, z1 + e], [x1, high, z1 + e], [x0, high, z1 + e]], (c, r) => (rock ? rockFront(c, r, rng) : ledgeCanvas(c, r, rng))));
    group.add(screenQuad([[x0, high, z1], [x1, high, z1], [x1, high, z0], [x0, high, z0]], (c, r) => (rock ? rockTop(c, r, rng) : copingCanvas(c, r, rng))));
    return true;
  }
  const hurdle = b.kind === 'hurdle';
  if (b.w >= b.h) {
    const z = (z0 + z1) / 2 + e;
    group.add(screenQuad([[x0, 0, z], [x1, 0, z], [x1, high, z], [x0, high, z]], (c, r) => (hurdle ? hurdleFront(c, r, rng) : fenceFront(c, r, rng))));
    return true;
  }
  // End-on: one picture on the plane at the south end, tall enough for the whole run climbing the screen.
  const mid = (x0 + x1) / 2, top = high + (b.h * KZ) / KY;
  group.add(screenQuad([[mid - 0.5, 0, z1 + e], [mid + 0.5, 0, z1 + e], [mid + 0.5, top, z1 + e], [mid - 0.5, top, z1 + e]], (c, r) => endOn(c, r, b.h, high, hurdle, rng)));
  return true;
}
