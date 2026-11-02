/**
 * The ground's own marks (shared/ground.ts), painted over the cobbles: flagstones, packed earth, mud,
 * ruts, trodden paths, missing cobbles, puddles, straw, weeds, a drain, spent arrows. Each paints from
 * its own seed (marks.ts), so every screen gets the same ground.
 */
import type { Mark } from '../shared/arena';
import type { Rng } from '../shared/rng';
import { PX } from './world';

type Rect = (x: number, y: number, w: number, h: number, col: string) => void;
export type Painter = (rect: Rect, rng: Rng, x: number, y: number, w: number, h: number, k: Mark) => void;

/** Inside an ellipse filling the box, a little ragged at the edge. */
const inside = (rng: Rng, i: number, j: number, w: number, h: number, rag = 0.25) => {
  const dx = (i - w / 2) / (w / 2), dy = (j - h / 2) / (h / 2), d = dx * dx + dy * dy;
  return d < 1 - rag || (d < 1 + rag && rng.next() < 0.5);
};
const EARTH = ['#3e352a', '#433a2e', '#3a3126', '#463c30'];
const MUD = ['#2a241c', '#2e271e', '#26201a', '#322a20'];

export const GROUND: Partial<Record<Mark['kind'], Painter>> = {
  flags(rect, rng, x, y, w, h) {
    // Big old slabs among the cobbles, worn smooth, the mortar dark, one here and there cracked or gone.
    for (let j = 0; j < h; j += 9) for (let i = (j / 9) % 2 ? -6 : 0; i < w; i += 13) {
      if (!inside(rng, i + 6, j + 4, w, h, 0.45) || rng.next() < 0.06) continue;
      const col = ['#4a4552', '#4e4856', '#46414e', '#524c5a', '#48434f'][rng.int(5)];
      rect(x + i, y + j, 13, 9, '#26232c');
      rect(x + i + 1, y + j + 1, 11, 7, col);
      for (let n = 0; n < 4; n++) rect(x + i + 1 + rng.int(11), y + j + 1 + rng.int(7), 1, 1, rng.next() < 0.5 ? '#3e3a46' : '#57525e');
      if (rng.next() < 0.1) for (let k = 0; k < 5; k++) rect(x + i + 3 + k, y + j + 2 + Math.round(k / 2), 1, 1, '#2e2a34');
    }
  },
  earth(rect, rng, x, y, w, h) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i += 2) if (inside(rng, i, j, w, h, 0.35)) rect(x + i, y + j, 2, 1, EARTH[rng.int(EARTH.length)]);
    for (let n = 0; n < (w * h) / 30; n++) rect(x + rng.int(w), y + rng.int(h), 1, 1, '#5a5048');
  },
  mud(rect, rng, x, y, w, h) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i += 2) if (inside(rng, i, j, w, h, 0.4)) rect(x + i, y + j, 2, 1, MUD[rng.int(MUD.length)]);
    // Wet: a few highlights, and boot prints.
    for (let n = 0; n < w / 4; n++) rect(x + rng.int(w), y + rng.int(h), 2, 1, '#4a4a4e');
    for (let n = 0; n < w / 6; n++) rect(x + 2 + rng.int(w - 4), y + 1 + rng.int(Math.max(1, h - 3)), 2, 3, '#1e1a14');
  },
  ruts(rect, rng, x, y, w, h) {
    // Two grooves the cart wheels wore, along the long way, broken where the cobbles held.
    const along = h > w, len = along ? h : w, gap = Math.min(10, (along ? w : h) - 2);
    for (let t = 0; t < len; t++) for (const o of [0, gap]) {
      if (rng.next() < 0.3) continue;
      const c = rng.next() < 0.08 ? '#2e3a46' : ['#36302a', '#3e362c', '#3a3330'][rng.int(3)];
      if (along) rect(x + 1 + o, y + t, 2, 1, c);
      else rect(x + t, y + 1 + o, 1, 2, c);
    }
  },
  path(rect, rng, x, y, w, h) {
    // A line worn from one corner to another: trodden earth through the cobbles, ragged at its edges.
    const len = Math.hypot(w, h), nx = -h / len, ny = w / len;
    for (let t = 0; t < len; t += 1) {
      const px = x + (w * t) / len, py = y + (h * t) / len, half = 4 + (rng.next() < 0.3 ? 1 : 0);
      for (let s = -half; s <= half; s++) if (Math.abs(s) < half - 1 || rng.next() < 0.5) rect(Math.round(px + nx * s), Math.round(py + ny * s), 1, 1, EARTH[rng.int(EARTH.length)]);
    }
  },
  holes(rect, rng, x, y, w, h) {
    // Cobbles gone: earth showing, a loose one or two lying beside.
    for (let n = 0; n < 3; n++) {
      const hx = x + rng.int(Math.max(1, w - 6)), hy = y + rng.int(Math.max(1, h - 4));
      rect(hx, hy, 7, 5, '#1e1a16'), rect(hx + 1, hy + 1, 5, 3, '#2e271e');
    }
    rect(x + w + 1, y + rng.int(h), 4, 3, '#57505e'), rect(x + w + 1, y + h, 4, 1, '#24212a');
  },
  puddle(rect, rng, x, y, w, h) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (inside(rng, i, j, w, h, 0.1)) rect(x + i, y + j, 1, 1, j < 2 ? '#3a4a5c' : '#25303e');
    rect(x + 3, y + 1, Math.max(2, w / 3), 1, '#6a7a8c');
  },
  straw(rect, rng, x, y, w, h) {
    for (let n = 0; n < (w * h) / 14; n++) {
      const sx = x + rng.int(w), sy = y + rng.int(h), c = ['#8a7a3a', '#a08c44', '#6b5a2e'][rng.int(3)];
      rng.next() < 0.5 ? rect(sx, sy, 3, 1, c) : rect(sx, sy, 1, 2, c);
    }
    for (let n = 0; n < (w * h) / 80; n++) rect(x + rng.int(w), y + rng.int(h), 3, 2, '#2e271e');
  },
  weeds(rect, rng, x, y, w, h) {
    // Tufts creeping out from the walls and the edges.
    for (let n = 0; n < (w * h) / 8; n++) {
      const sx = x + rng.int(w), sy = y + rng.int(h), c = ['#3a4c2c', '#46582f', '#2e3d25', '#5a6a32'][rng.int(4)];
      rect(sx, sy, 1, 2, c), rect(sx + 1, sy + 1, 1, 1, c);
      if (rng.next() < 0.3) rect(sx - 1, sy + 1, 1, 1, c);
    }
  },
  gutter(rect, rng, x, y, w, h) {
    // A stone channel set in the street, dark and damp in the bottom.
    const along = h > w;
    if (along) rect(x - 1, y, w + 2, h, '#3a3640'), rect(x, y, w, h, '#1a1820');
    else rect(x, y - 1, w, h + 2, '#3a3640'), rect(x, y, w, h, '#1a1820');
    for (let t = 0; t < (along ? h : w); t += 4) along ? rect(x - 1, y + t, 1, 1, '#4e4a58') : rect(x + t, y - 1, 1, 1, '#4e4a58');
    for (let n = 0; n < (along ? h : w) / 8; n++) along ? rect(x + 1, y + rng.int(h), 2, 2, '#25303e') : rect(x + rng.int(w), y + 1, 2, 2, '#25303e');
  },
  arrows(rect, rng, x, y, w, h) {
    // Spent arrows from the night of the breach, stuck in the ground at a slant, a few broken.
    for (let n = 0; n < (w * h) / (PX * 9); n++) {
      const ax = x + rng.int(w), ay = y + rng.int(h), lean = rng.int(3) - 1, len = rng.next() < 0.3 ? 3 : 6;
      for (let k = 0; k < len; k++) rect(ax + Math.round((lean * k) / 3), ay - k, 1, 1, '#6b4a2b');
      if (len > 3) rect(ax + Math.round((lean * len) / 3) - 1, ay - len, 3, 1, '#d8d0bc');
      rect(ax, ay + 1, 2, 1, '#1e1a16');
    }
  },
};
