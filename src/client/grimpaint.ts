/**
 * What the goblins left (shared/grim.ts), painted once into the room's still layer, so it's lit by the
 * same fire as everything else and sits in the dark where there's none: a body torn apart, the pieces
 * round one they're still at, a heap of bones and clothes, what's left of the last one by a cage, a
 * body dragged across the floor, one tied to the back wall and opened, bloody hands, a count in fives.
 * Dark shapes, blood and bone at one pixel to the pixel.
 */
import type { GameMap, Grim } from '../shared/arena';
import { Rng } from '../shared/rng';
import { OX, OY, PX } from './world';

type Rect = (x: number, y: number, w: number, h: number, col: string) => void;

export const BLOOD = ['#3a0e0e', '#4a1212', '#5a1616', '#2e0a0a'];
const WET = ['#6a1212', '#7a1414', '#5a1010'];
export const BONE = ['#d8d0bc', '#c8bea4', '#b8ae96'];
export const GUT = ['#9a3a46', '#b0505a', '#7a2a36'];
export const SKIN = ['#b08c70', '#9a7a62'];
const CLOTH = [['#5a4a3a', '#4a3a2a'], ['#4a5a6a', '#3a4654'], ['#6a5a48', '#54463a'], ['#5a3a3a', '#463030']];

function pool(rect: Rect, rng: Rng, x: number, y: number, w: number, h: number, cols = BLOOD): void {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const dx = (i - w / 2) / (w / 2), dy = (j - h / 2) / (h / 2), d = dx * dx + dy * dy;
    if (d < 0.8 || (d < 1.2 && rng.next() < 0.3)) rect(x + i, y + j, 1, 1, cols[rng.int(cols.length)]);
  }
  for (let i = 0; i < w / 2; i++) rect(x - 3 + rng.int(w + 6), y - 2 + rng.int(h + 4), 1, 1, cols[rng.int(cols.length)]);
}

/** A limb: a short line of cloth ending in skin, at an angle, a red end where it came off. */
function limb(rect: Rect, x: number, y: number, a: number, len: number, cloth: string, thick = 1): void {
  for (let k = 0; k < len; k++) rect(Math.round(x + Math.cos(a) * k), Math.round(y + Math.sin(a) * k), thick, thick, k === 0 ? '#7a1010' : k > len - 3 ? SKIN[0] : cloth);
}

function head(rect: Rect, x: number, y: number, hair: string): void {
  rect(x, y, 3, 3, SKIN[1]), rect(x, y, 3, 1, hair), rect(x + 1, y + 3, 1, 1, '#7a1010');
}

/** The torso, opened: ribs showing either side of a dark split, guts trailing out of it. */
function opened(rect: Rect, rng: Rng, x: number, y: number, cloth: string[], trail: number): void {
  rect(x, y, 7, 5, cloth[0]), rect(x, y + 4, 7, 1, cloth[1]);
  rect(x + 2, y + 1, 3, 3, '#2e0a0a'), rect(x + 3, y + 1, 1, 3, '#5a1010');
  for (const yy of [1, 2, 3]) rect(x + 1, y + yy, 1, 1, BONE[1]), rect(x + 5, y + yy, 1, 1, BONE[1]);
  let gx = x + 3, gy = y + 4;
  for (let k = 0; k < trail; k++) (gx += rng.int(3) - 1), (gy += rng.next() < 0.6 ? 1 : 0), rect(gx, gy, 1, 1, GUT[rng.int(GUT.length)]);
}

const FLOOR: Partial<Record<Grim['kind'], (rect: Rect, rng: Rng, x: number, y: number, q: Grim) => void>> = {
  torn(rect, rng, x, y, q) {
    const cloth = CLOTH[q.k % 4], f = q.k % 2 ? 1 : -1;
    pool(rect, rng, x - 12, y - 5, 24, 11);
    opened(rect, rng, x - 3, y - 3, cloth, 7);
    head(rect, x + f * 9 - 1, y - 2 + (q.k % 3), ['#2a1a10', '#5a4a2a', '#8a8070'][q.k % 3]);
    limb(rect, x - f * 6, y + 2, f > 0 ? 2.6 : 0.5, 6, cloth[0]);
    limb(rect, x + f * 4, y + 6, f > 0 ? 0.3 : 2.8, 7, cloth[1], 2);
    if (q.k % 3) limb(rect, x - f * 10, y - 4, 1.2, 5, cloth[0]);
    for (let i = 0; i < 5; i++) rect(x - 10 + rng.int(20), y - 6 + rng.int(12), 1, 1, BONE[rng.int(3)]);
  },
  strewn(rect, rng, x, y, q) {
    // Round one they're at: the blood it's lying in, a piece or two pulled off and dropped.
    pool(rect, rng, x - 13, y - 5, 26, 11, [...BLOOD, ...WET]);
    const cloth = CLOTH[q.k % 4];
    limb(rect, x + 12, y + 3, 0.2 + (q.k % 3) * 0.4, 6, cloth[0]);
    if (q.k % 2) limb(rect, x - 14, y + 1, 3, 5, cloth[1], 2);
    for (let i = 0; i < 6; i++) rect(x - 14 + rng.int(28), y - 5 + rng.int(11), 2, 1, i % 2 ? BONE[rng.int(3)] : GUT[rng.int(3)]);
  },
  bones(rect, rng, x, y, q) {
    pool(rect, rng, x - 10, y - 3, 20, 7, ['#2a1414', '#241010', '#301818']);
    for (let i = 0; i < 22; i++) {
      const bx = x - 8 + rng.int(16), by = y - 3 - rng.int(5) + Math.abs(bx - x) / 3, along = rng.next() < 0.6;
      rect(bx, Math.round(by), along ? 3 : 1, along ? 1 : 3, BONE[rng.int(3)]);
      if (i % 4 === 0) rect(x - 8 + rng.int(16), Math.round(by) + 1, 2, 2, CLOTH[rng.int(4)][rng.int(2)]);
    }
    for (let i = 0; i < 1 + (q.k % 2); i++) {
      const sx = x - 5 + i * 6, sy = y - 7 + i;
      rect(sx, sy, 3, 3, BONE[0]), rect(sx, sy + 1, 1, 1, '#14100c'), rect(sx + 2, sy + 1, 1, 1, '#14100c'), rect(sx + 1, sy + 3, 1, 1, BONE[2]);
    }
    rect(x + 6, y, 3, 2, '#2a1e14');
  },
  remains(rect, rng, x, y) {
    // The last one kept in the cage, or what's left: a ribcage, a skull, a rag, a stain gone brown.
    pool(rect, rng, x - 7, y - 3, 14, 6, ['#2a1414', '#341818', '#241010']);
    for (let i = 0; i < 4; i++) rect(x - 3, y - 4 + i, 1, 1, BONE[1]), rect(x + 2, y - 4 + i, 1, 1, BONE[1]), rect(x - 2, y - 4 + i, 4, 1, i % 2 ? BONE[2] : '#14100c');
    rect(x - 1, y - 5, 2, 6, BONE[0]);
    rect(x + 4, y - 2, 3, 3, BONE[0]), rect(x + 4, y - 1, 1, 1, '#14100c'), rect(x + 6, y - 1, 1, 1, '#14100c');
    rect(x - 7, y, 4, 2, CLOTH[rng.int(4)][0]);
  },
  hung(rect, rng, x, y) {
    // Under one on a hook: what's run off it.
    pool(rect, rng, x - 5, y - 2, 10, 5, [...BLOOD, ...WET]);
  },
};

const WALL: Partial<Record<Grim['kind'], (rect: Rect, rng: Rng, x: number, top: number, q: Grim) => void>> = {
  pinned(rect, rng, x, top, q) {
    // Tied up by the wrists, arms out, feet off the floor, opened down the front and left.
    const cloth = CLOTH[q.k % 4], y = top + 11, slump = q.k % 2;
    // The ropes up to the pegs, the arms stretched up to them, two pixels thick.
    for (const s of [-1, 1]) {
      rect(x + s * 12, y - 6, 2, 2, '#14100c'), rect(x + s * 11, y - 4, 2, 2, '#8a7a5a');
      for (let k = 0; k < 9; k++) rect(x + s * (3 + k) - (s < 0 ? 1 : 0), y + 1 - Math.floor(k / 2), 2, 2, k > 6 ? SKIN[0] : cloth[0]);
    }
    rect(x - 2 + slump, y - 3 + slump, 4, 4, SKIN[0]), rect(x - 2 + slump, y - 3 + slump, 4, 1, ['#2a1a10', '#5a4a2a', '#8a8070'][q.k % 3]);
    rect(x - 1 + slump, y - 1 + slump, 1, 1, '#14100c'), rect(x + 1 + slump, y - 1 + slump, 1, 1, '#14100c');
    rect(x - 3, y + 2, 7, 12, cloth[0]), rect(x - 3, y + 13, 7, 1, cloth[1]);
    // Split from the throat to the belly: a dark cavity, ribs either side, red at the edges.
    rect(x - 1, y + 3, 3, 10, '#2e0a0a'), rect(x, y + 4, 1, 8, '#7a1010'), rect(x - 2, y + 3, 1, 10, '#6a1212'), rect(x + 2, y + 3, 1, 10, '#6a1212');
    for (const yy of [4, 6, 8]) rect(x - 3, y + yy, 2, 1, BONE[0]), rect(x + 2, y + yy, 2, 1, BONE[0]);
    // What came out of it hangs down in loops, and the wall's red under it to the floor.
    for (const ox of [-1, 1]) {
      let gx = x + ox;
      for (let k = 0; k < 12; k++) (gx += rng.int(3) - 1), rect(gx, y + 13 + k, 2, 1, GUT[rng.int(3)]);
    }
    for (const s of [-1, 1]) rect(x + s * 2 - (s < 0 ? 1 : 0), y + 14, 2, 9, cloth[1]), rect(x + s * 2 - (s < 0 ? 1 : 0), y + 23, 2, 2, SKIN[0]);
    rect(x - 3, y + 21, 7, 1, '#8a7a5a');
    for (let i = 0; i < 7; i++) {
      const sx = x - 4 + rng.int(9);
      for (let yy = y + 14 + rng.int(4); yy < OY - 3; yy += 1) if (rng.next() < 0.85) rect(sx, yy, 1, 1, BLOOD[rng.int(3)]);
    }
    for (let i = 0; i < 20; i++) rect(x - 13 + rng.int(26), y - 6 + rng.int(22), 1, 1, BLOOD[rng.int(4)]);
    pool(rect, rng, x - 8, OY - 1, 16, 6, [...BLOOD, ...WET]);
  },
  smear(rect, rng, x) {
    // Hands on the plaster, and where they slid down it.
    for (let i = 0, n = 2 + rng.int(3); i < n; i++) {
      const hx = x - 8 + rng.int(16), hy = OY - 22 + rng.int(12);
      rect(hx, hy + 2, 3, 2, BLOOD[1]);
      for (let f = 0; f < 4; f++) rect(hx - 1 + f, hy + (f === 0 ? 2 : 0), 1, 2, BLOOD[2]);
      for (let f = 0; f < 3; f++) for (let d = 0, len = 3 + rng.int(8); d < len; d++) if (rng.next() < 0.85) rect(hx + f, hy + 4 + d, 1, 1, BLOOD[d > len / 2 ? 0 : 1]);
    }
  },
  tally(rect, rng, x) {
    // A count in fives scratched through the plaster.
    for (let gi = 0, n = 3 + rng.int(6); gi < n; gi++) {
      const gx = x - 10 + (gi % 4) * 6, gy = OY - 30 + Math.floor(gi / 4) * 8;
      for (let s = 0; s < 4; s++) rect(gx + s, gy, 1, 5, '#9a8e7c');
      for (let s = 0; s < 5; s++) rect(gx - 1 + s, gy + 4 - s, 1, 1, '#a89c88');
    }
  },
};

/** A body dragged along: two smeared lines, broken, a hand's clawing where it started. */
function trail(rect: Rect, rng: Rng, q: Grim): void {
  const x0 = OX + q.x * PX, y0 = OY + q.y * PX, x1 = OX + q.x2! * PX, y1 = OY + q.y2! * PX, len = Math.hypot(x1 - x0, y1 - y0);
  const nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
  for (let d = 0; d < len; d++) {
    const px = x0 + ((x1 - x0) * d) / len, py = y0 + ((y1 - y0) * d) / len;
    for (const s of [-2, 2]) if (rng.next() < 0.75) rect(Math.round(px + nx * s), Math.round(py + ny * s), 1 + rng.int(2), 1, BLOOD[rng.int(4)]);
  }
  for (let f = 0; f < 4; f++) for (let d = 0; d < 4; d++) rect(Math.round(x0 - 2 + f), Math.round(y0 + d), 1, 1, BLOOD[1]);
}

export function paintGrim(m: GameMap, rect: Rect): void {
  for (const q of m.grim ?? []) {
    const rng = new Rng(q.k * 977 + Math.round(q.x * 31)), x = Math.round(OX + q.x * PX), y = Math.round(OY + q.y * PX);
    if (q.kind === 'trail') trail(rect, rng, q);
    WALL[q.kind]?.(rect, rng, x, 8, q);
    FLOOR[q.kind]?.(rect, rng, x, y, q);
  }
}
