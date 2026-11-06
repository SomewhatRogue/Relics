/**
 * The halls' own furniture, painted into each block's canvas (blocks.ts via furnish.ts): bookcases
 * and a curling stair for the tower, bunks, a map table and a dummy for the barracks, the skinning
 * bench, the dice table, the arm-wrestling table, casks and a curtained booth for the Drowned Rat, a desk of books and jars,
 * the forge's bellows and quench tub. And their two live things: a stand of candles, coloured fire.
 */
import type { Block, Round } from '../shared/arena';
import type { Ctx } from './draw';

type Rect = (x: number, y: number, w: number, h: number, c: string) => void;

/** Book spines and jars (the 2.5D view's bookcases read these too: three/hallfurn3d.ts). */
export const BOOKS = ['#6a2a2a', '#2a4a6a', '#5a5a2a', '#3a2a5a', '#2e5a3e', '#7a5a2a', '#4a2a3a'];
export const JARS = ['#3a6a5a', '#4a5a8a', '#7a6a3a'];

/** Returns true if this is one of the halls' pieces (and paints it). */
export function hallFurniture(g: CanvasRenderingContext2D, b: Block, rect: Rect, w: number, roofH: number, wallY: number, tall: number): boolean {
  let seed = Math.round(b.x * 37 + b.y * 11) + 5;
  const rnd = (n: number) => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff), seed % Math.max(1, n));
  const H = roofH + tall, bot = wallY + tall;
  switch (b.kind) {
    case 'books':
      // Shelf on shelf of books and jars, a skull on one, dust on the top.
      rect(0, 0, w, roofH, '#3a2818'), rect(0, wallY, w, tall, '#2a1d12');
      for (let y = wallY + 2; y < bot - 3; y += 7) {
        rect(1, y + 5, w - 2, 1, '#5a3d22');
        for (let x = 2; x < w - 2;) {
          const jar = rnd(6) === 0, bw = jar ? 3 : 1 + rnd(2);
          if (jar) rect(x, y + 2, 3, 3, JARS[rnd(3)]), rect(x + 1, y + 1, 1, 1, '#8a8494');
          else rect(x, y + 5 - (4 + rnd(2)), bw, 4 + rnd(2), BOOKS[rnd(BOOKS.length)]);
          x += bw + (rnd(4) === 0 ? 1 : 0);
        }
      }
      return true;
    case 'stair': {
      // Stone steps curling up and round into the dark, a rope for a rail.
      g.clearRect(0, 0, w, H);
      const n = 9;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1), sx = Math.round(2 + Math.sin(t * 2.4) * (w - 16) * 0.5 + (w - 16) * 0.5 * t), sy = Math.round(H - 8 - t * (H - 12));
        rect(sx, sy, 14, 6, '#2e2a34'), rect(sx, sy, 14, 2, '#6a6470'), rect(sx + 13, sy, 1, 6, '#1d1b24');
      }
      rect(w - 4, 0, 4, H - 10, '#1d1b24');
      for (let y = 4; y < H - 12; y += 6) rect(w - 6, y, 2, 1, '#8a7a5a');
      return true;
    }
    case 'dummy': {
      g.clearRect(0, 0, w, H);
      const cx = Math.round(w / 2);
      rect(cx - 1, 4, 2, H - 4, '#4a3420'), rect(cx - 6, 8, 12, 2, '#5a3d22');
      rect(cx - 4, 6, 8, 10, '#8a7448'), rect(cx - 2, 9, 4, 4, '#7a1d1d'), rect(cx - 1, 10, 2, 2, '#d8d0bc');
      rect(cx - 3, 0, 6, 5, '#6a6470'), rect(cx - 3, 3, 6, 1, '#4a4652');
      rect(cx - 4, H - 2, 8, 2, '#3a2818');
      return true;
    }
    case 'maptable':
      // The valley on a hide: a river, the road, pins where the dens are.
      rect(0, 0, w, roofH, '#5a3d22'), rect(2, 1, w - 4, roofH - 2, '#9a8a62');
      for (let x = 3; x < w - 3; x++) rect(x, 2 + Math.round(roofH / 2 + Math.sin(x * 0.3) * 3), 1, 1, '#3a5a7a');
      for (let i = 0; i < 6; i++) rect(4 + rnd(w - 8), 2 + rnd(roofH - 4), 1, 2, i % 2 ? '#7a1d1d' : '#2a2018');
      legs(rect, w, wallY, tall);
      return true;
    case 'dicetable':
      rect(0, 0, w, roofH, '#4a3420'), rect(2, 2, w - 4, roofH - 4, '#3a2a1a');
      rect(5, 4, 2, 2, '#e8e0c8'), rect(9, 5, 2, 2, '#e8e0c8'), rect(14, 3, 3, 3, '#5a3d22');
      for (let i = 0; i < 5; i++) rect(18 + rnd(Math.max(1, w - 24)), 3 + rnd(Math.max(1, roofH - 6)), 1, 1, '#d4a537');
      legs(rect, w, wallY, tall);
      return true;
    case 'armtable':
      // The arm-wrestling table: worn bare in two rounds where the elbows go, a mug each end, a candle stub.
      rect(0, 0, w, roofH, '#5a3d22'), rect(1, 1, w - 2, roofH - 2, '#6a4a2a');
      rect(Math.round(w * 0.3) - 2, Math.round(roofH / 2) - 1, 4, 3, '#8a6a46'), rect(Math.round(w * 0.7) - 2, Math.round(roofH / 2) - 1, 4, 3, '#8a6a46');
      rect(2, 2, 3, 3, '#7a6a5a'), rect(w - 5, roofH - 5, 3, 3, '#7a6a5a'), rect(Math.round(w / 2), 2, 1, 2, '#e8e0c8');
      legs(rect, w, wallY, tall);
      return true;
    case 'skinbench':
      // A hide stretched on the bench, a knife by it.
      rect(0, 0, w, roofH, '#5a3d22');
      rect(4, 2, w - 10, roofH - 4, '#7a5a3a'), rect(6, 3, w - 14, roofH - 6, '#8a6a46');
      rect(w - 5, 3, 1, 6, '#cfd6dc'), rect(w - 5, 9, 1, 2, '#3a2818');
      legs(rect, w, wallY, tall);
      return true;
    case 'desk':
      // Open books, jars, an inkwell, a candle stub (ledgers on a long one).
      rect(0, 0, w, roofH, '#5a3d22');
      for (let x = 3; x < w - 6; x += 9 + rnd(6)) rect(x, 2 + rnd(3), 6, 4, '#d8d0bc'), rect(x + 3, 2, 1, 6, '#8a8070');
      rect(w - 6, 2, 2, 3, '#14121a'), rect(w - 3, 3, 1, 3, '#e8e0c8');
      for (let i = 0; i < Math.round(w / 14); i++) rect(2 + rnd(w - 4), roofH - 4, 2, 3, JARS[rnd(3)]);
      legs(rect, w, wallY, tall);
      return true;
    case 'tub':
      rect(0, 0, w, roofH, '#4a3420'), rect(2, 1, w - 4, roofH - 2, '#1e2a36'), rect(4, 2, w - 10, 1, '#4a5a6a');
      rect(0, wallY, w, tall, '#5a3d22');
      for (const y of [wallY + 1, bot - 2]) rect(0, y, w, 1, '#2a2630');
      return true;
    case 'bellows':
      // A leather wedge, a nozzle to the fire.
      g.clearRect(0, 0, w, H);
      rect(1, roofH - 2, w - 4, tall + 2, '#4a3424'), rect(2, roofH, w - 6, tall - 1, '#5e4230');
      rect(w - 3, roofH + 2, 3, 2, '#6a6470'), rect(0, roofH - 3, 3, 2, '#3a2818');
      return true;
    case 'booth':
      // A curtained booth: a heavy curtain, mostly drawn, dark behind.
      rect(0, 0, w, roofH, '#2a1d12'), rect(0, wallY, w, tall, '#14100c');
      for (let x = 0; x < w * 0.7; x += 3) rect(x, wallY, 3, tall, x % 6 ? '#5a1e1e' : '#4a1818');
      rect(0, wallY, w, 2, '#3a2818');
      return true;
    case 'bunk':
      // Two beds, one over the other, the blankets the barracks colour.
      rect(0, 0, w, roofH, '#3a2a1a'), rect(1, 1, w - 2, roofH - 2, '#5a2a2a'), rect(1, 1, w - 2, 4, '#d8d0bc');
      rect(0, wallY, w, tall, '#3a2a1a');
      rect(1, wallY + 1, w - 2, 3, '#5a2a2a'), rect(1, bot - 5, w - 2, 3, '#5a2a2a');
      rect(0, wallY, 1, tall, '#24180f'), rect(w - 1, wallY, 1, tall, '#24180f');
      return true;
    case 'casks':
      rect(0, 0, w, roofH, '#3a2818');
      rect(0, wallY, w, tall, '#2a1d12');
      for (let y = wallY + 1; y < bot - 5; y += 7) for (let x = 1; x < w - 5; x += 7) rect(x, y, 6, 6, '#6b4a2b'), rect(x + 1, y + 1, 4, 4, '#5a3d22'), rect(x + 2, y + 2, 2, 2, '#3a2818');
      return true;
  }
  return false;
}

function legs(rect: Rect, w: number, wallY: number, tall: number): void {
  rect(0, wallY, w, 2, '#3a2818');
  rect(1, wallY + 2, 2, tall - 2, '#2a1d12'), rect(w - 3, wallY + 2, 2, tall - 2, '#2a1d12');
}

/** How the coloured fire is coloured now (the tower's): it drifts violet, green, blue. */
export const witchColour = (t: number): [number, number, number] => {
  const k = (Math.sin(t * 0.7) + 1) / 2, j = (Math.sin(t * 0.43 + 2) + 1) / 2;
  return [0.55 + 0.3 * k * (1 - j), 0.35 + 0.55 * j * (1 - k), 0.9 - 0.3 * j];
};
const hex = (c: [number, number, number], m = 1) => '#' + c.map((v) => Math.round(Math.min(1, v * m) * 255).toString(16).padStart(2, '0')).join('');

/** Returns true if it drew the round (candles, coloured fire). */
export function drawHallRound(c: Ctx, r: Round, x: number, y: number): boolean {
  const g = c.lit;
  if (r.kind === 'candles') {
    // An iron stand, three candles of three heights.
    g.fillStyle = '#2a2630', g.fillRect(Math.round(x), Math.round(y - 12), 1, 12), g.fillRect(Math.round(x - 4), Math.round(y - 12), 9, 1);
    for (const [dx, h] of [[-4, 5], [0, 7], [4, 4]]) {
      g.fillStyle = '#e8e0c8', g.fillRect(Math.round(x + dx), Math.round(y - 12 - h), 1, h);
      c.glow.fillStyle = Math.floor(c.now * 9 + dx) % 3 ? '#ffd27a' : '#ffb44c';
      c.glow.fillRect(Math.round(x + dx), Math.round(y - 14 - h), 1, 2);
    }
    return true;
  }
  if (r.kind === 'witchfire') {
    // An iron bowl on three legs, and a fire that isn't the colour fire should be.
    g.fillStyle = '#2a2630', g.fillRect(Math.round(x - 5), Math.round(y - 7), 11, 3), g.fillRect(Math.round(x - 4), Math.round(y - 4), 1, 4), g.fillRect(Math.round(x + 4), Math.round(y - 4), 1, 4), g.fillRect(Math.round(x), Math.round(y - 4), 1, 4);
    const col = witchColour(c.now);
    for (let i = 0; i < 7; i++) {
      const k = (c.now * 1.6 + i / 7) % 1, fx = Math.round(x - 3 + ((i * 5) % 7) + Math.sin(c.now * 6 + i) * 1.2), fy = Math.round(y - 8 - k * 9);
      c.glow.fillStyle = hex(col, 1.2 - k * 0.5);
      c.glow.fillRect(fx, fy, 1 + (k < 0.4 ? 1 : 0), 2);
    }
    return true;
  }
  return false;
}
