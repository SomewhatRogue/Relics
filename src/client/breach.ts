/**
 * The breach in Wickhold's north wall, painted over the back wall's stone face (world.ts) where it
 * came down: hurdles, stakes, a cart bed and rope at first; then a proper line of sharpened oak; then
 * a timber wall with a walk along the top; then stone again. The north gate in the middle of it.
 */
import type { GameMap } from '../shared/arena';
import { Rng } from '../shared/rng';
import { OX, OY, PX } from './world';

type Rect = (x: number, y: number, w: number, h: number, col: string) => void;

const TOP = 8;

export function paintBreach(m: GameMap, rect: Rect): void {
  const b = m.breach;
  if (!b) return;
  const rng = new Rng(b.x * 17 + b.stage * 101), x0 = Math.round(OX + b.x * PX), w = Math.round(b.w * PX), face = OY - TOP;
  if (b.stage < 3) {
    // Sky behind, and the broken ends of the stone either side.
    rect(x0, 0, w, OY - 3, '#100e14');
    for (const [ex, dir] of [[x0, 1], [x0 + w, -1]] as const) for (let y = TOP; y < OY - 3; y += 5) rect(ex - (dir < 0 ? 6 + rng.int(8) : 0), y, 6 + rng.int(8), 4, '#3b3746');
  }
  if (b.stage === 0) sticks(rect, rng, x0 + 8, w - 16, face);
  else if (b.stage === 1) stakes(rect, rng, x0 + 6, w - 12, face, false);
  else if (b.stage === 2) stakes(rect, rng, x0 + 6, w - 12, face, true);
  else for (let r = 0; r * 5 < face - 3; r++) for (let x = x0 - 8 + (r % 2) * 4; x < x0 + w; x += 8) rect(x + 1, TOP + r * 5, 7, 4, ['#46424f', '#4c4757', '#423e4c'][rng.int(3)]);
  gate(rect, Math.round(OX + (b.x + b.w / 2) * PX) - 12, face, b.stage);
}

/** Hurdles and lashed-up stakes, leaning, a cart bed jammed in, rope over the gaps. */
function sticks(rect: Rect, rng: Rng, x0: number, w: number, face: number): void {
  for (let x = x0; x < x0 + w;) {
    const kind = rng.int(7);
    if (kind === 0) {
      // A hurdle: woven withies between two uprights.
      const hw = 14 + rng.int(8), hh = face - 14 - rng.int(14), y = OY - 3 - hh;
      rect(x, y - 2, 2, hh + 2, '#2e2016'), rect(x + hw - 2, y - 1, 2, hh + 1, '#2e2016');
      for (let j = 1; j < hh; j += 2) for (let i = 2; i < hw - 2; i += 3) rect(x + i + ((j >> 1) % 2), y + j, 2, 1, (i + j) % 4 ? '#4a3e2a' : '#3a3022');
      x += hw + rng.int(3);
    } else if (kind === 1 && rng.next() < 0.6) {
      // A cart bed on its end, wheel still on.
      const cw = 18, ch = face - 16, y = OY - 3 - ch;
      rect(x, y, cw, ch, '#3e2a1a');
      for (let j = 2; j < ch; j += 4) rect(x, y + j, cw, 1, '#24180f');
      rect(x + 3, y + ch - 10, 9, 9, '#14100c'), rect(x + 5, y + ch - 8, 5, 5, '#3a2818'), rect(x + 7, y + ch - 10, 1, 9, '#14100c');
      x += cw + 1;
    } else {
      // Stakes of every length, some leaning.
      for (let i = 0; i < 3 + rng.int(4); i++) {
        const h = face - 18 + rng.int(16), lean = rng.int(3) - 1;
        for (let j = 0; j < h; j++) rect(x + Math.round((lean * j) / 10), OY - 3 - j, 2, 1, j > h - 2 ? '#6b5236' : ['#3a2818', '#42301e', '#34241a'][i % 3]);
        x += 3 + rng.int(3);
      }
    }
    // Rope lashing whatever's next to whatever this was, and the odd gap you can see sky through.
    if (rng.next() < 0.5) rect(x - 4, OY - 16 - rng.int(14), 8, 1, '#7a6a48');
    if (rng.next() < 0.3) x += 3;
  }
}

/** A line of sharpened oak stakes; with a walk, a timber wall: beams behind, a plank walk on top, braces. */
function stakes(rect: Rect, rng: Rng, x0: number, w: number, face: number, walk: boolean): void {
  for (let x = x0; x < x0 + w; x += 5) {
    const h = face - 4 - rng.int(3);
    rect(x, OY - 3 - h, 4, h, ['#5a3e28', '#62442c', '#553a24'][rng.int(3)]);
    rect(x + 1, OY - 5 - h, 2, 2, '#7a5a34');
    rect(x + 3, OY - 3 - h, 1, h, '#3a2818');
  }
  rect(x0, OY - 18, w, 2, '#3a2818');
  if (!walk) return;
  // The walk: planks along the top, posts and braces, and a rail.
  rect(x0 - 2, TOP + 6, w + 4, 4, '#7a5a34'), rect(x0 - 2, TOP + 10, w + 4, 1, '#3a2818');
  rect(x0 - 2, TOP + 1, w + 4, 1, '#6b4a2b');
  for (let x = x0; x < x0 + w; x += 24) rect(x, TOP + 1, 2, 9, '#4a3420'), rect(x + 2, TOP + 12, 1, 12, '#3a2818');
}

/** The north gate: oak and iron, or at first a pair of barn doors with a beam across. */
function gate(rect: Rect, x: number, face: number, stage: number): void {
  const w = 24, h = face - 8, y = OY - 3 - h;
  rect(x - 3, y - 3, w + 6, h + 3, stage === 3 ? '#57525e' : '#3a2818');
  rect(x, y, w, h, stage === 0 ? '#5a4a34' : '#4a3424');
  for (let i = 3; i < w; i += 4) rect(x + i, y, 1, h, '#2e2016');
  rect(x + w / 2, y, 1, h, '#14100c');
  for (const k of [0.25, 0.7]) rect(x, Math.round(y + h * k), w, 2, stage === 0 ? '#6b4a2b' : '#3a3640');
  if (stage === 0) rect(x - 4, y + Math.round(h * 0.5), w + 8, 3, '#7a5a34');
}
