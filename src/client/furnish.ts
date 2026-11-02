/**
 * The details that make furniture what it is (a bed's blanket, a shelf's pots, a loom's threads, a
 * stall's straw, a hearth's mouth), and the same furniture smashed when a house has been turned over.
 */
import type { Block } from '../shared/arena';
import { siegeBlock } from './siegedraw';

export interface Look { tall: number; roof: string; ridge: string; wall: string; windows: boolean; furniture?: boolean }
type Rect = (x: number, y: number, w: number, h: number, c: string) => void;

export function furnish(g: CanvasRenderingContext2D, b: Block, rect: Rect, w: number, roofH: number, wallY: number, l: Look): void {
  if (b.kind === 'gallows' || b.kind === 'hurdle') return siegeBlock(g, b, rect, w, roofH, l.tall);
  const smashed = b.look === 1;
  if (b.kind === 'bed') rect(1, 1, w - 2, 5, '#d8d0bc'), rect(0, 7, w, roofH - 7, smashed ? '#3e3456' : '#5a4a7a');
  if (b.kind === 'shelf') for (let y = wallY + 3; y < wallY + l.tall; y += 6) {
    rect(0, y, w, 1, '#3a2a1a');
    if (!smashed) for (let x = 2; x < w - 2; x += 4) rect(x, y - 3, 2, 3, ['#7a2a2a', '#3a5a6a', '#8a7a3a', '#5a6a3a'][(x + y) % 4]);
  }
  if (b.kind === 'altar') rect(Math.round(w / 2) - 1, wallY + 2, 2, 7, '#d4a537'), rect(Math.round(w / 2) - 3, wallY + 4, 6, 2, '#d4a537');
  if (b.kind === 'sacks') for (let x = 1; x < w - 4; x += 6) rect(x, 2, 5, roofH - 3, '#b0a06a'), rect(x + 2, 1, 1, 2, '#6a5a3a');
  if (b.kind === 'anvil') rect(2, 2, w - 4, 2, '#a8a2b0');
  if (b.kind === 'rubble') for (let i = 0; i < w * 3; i++) rect((i * 29) % w, wallY + ((i * 7) % l.tall), 3, 2, ['#45414c', '#2a2733', '#5a3d22'][i % 3]);
  if (b.kind === 'monument') {
    // The Roll of the Brave: names cut into stone, a gilt band.
    rect(1, wallY + 2, w - 2, 1, '#d4a537');
    for (let y = wallY + 5; y < wallY + l.tall - 2; y += 3) for (let x = 3; x < w - 3; x += 4) rect(x, y, 2 + ((x + y) % 2), 1, '#3a3640');
  }
  if (b.kind === 'cart') cart(b, rect, w, roofH, wallY, l);
  if (b.kind === 'rack') for (let x = 1; x < w; x += 3) rect(x, 0, 1, roofH + l.tall - 2, '#9aa3ad');
  if (b.kind === 'tower') {
    // Battlements, and a lit slit high up.
    for (let x = 0; x < w; x += 6) rect(x, 0, 3, 3, '#4a3e66');
    rect(Math.round(w / 2) - 1, wallY + 8, 2, 8, '#14121a');
  }
  if (b.kind === 'tavern') {
    // The hanging sign: a rat on a board.
    rect(w - 10, wallY + 2, 8, 6, '#5a3d22');
    rect(w - 8, wallY + 4, 4, 2, '#2a2630');
    rect(w - 4, wallY + 5, 2, 1, '#2a2630');
  }
  if (b.kind === 'pew' || b.kind === 'bench') rect(0, wallY + l.tall - 2, 2, 2, '#14121a'), rect(w - 2, wallY + l.tall - 2, 2, 2, '#14121a');
  if (b.kind === 'hearth') hearth(rect, w, roofH, wallY, l);
  if (b.kind === 'partition') {
    // Plaster between timbers, like the room's back wall.
    for (let x = 0; x < w; x += 22) rect(x, wallY, 3, l.tall, '#3e2a1a');
    rect(0, wallY, w, 2, '#3e2a1a'), rect(0, wallY + l.tall - 3, w, 3, '#3e2a1a');
  }
  if (b.kind === 'loom') loom(g, rect, w, roofH, wallY, l, smashed);
  if (b.kind === 'pen') pen(g, rect, w, roofH, wallY, l);
  if (smashed) splinters(g, rect, w, roofH + l.tall, b);
}

/** A hearth's mouth, in its painted canvas: where the fire burns when it's lit. */
export const mouth = (w: number, wallY: number, tall: number) => {
  const mw = Math.min(w - 6, 14);
  return { x: Math.round(w / 2 - mw / 2), y: wallY + 3, w: mw, h: tall - 4 };
};

/** A hearth or a forge: a dark mouth under a stone lintel, ash in it (the fire, when lit, is drawn live). */
function hearth(rect: Rect, w: number, roofH: number, wallY: number, l: Look): void {
  for (let x = 1; x < w - 1; x += 4) rect(x, 1 + (x % 3), 3, 2, '#3e3a46');
  const { x: mx, y: top, w: mw } = mouth(w, wallY, l.tall);
  rect(mx - 1, top - 1, mw + 2, 1, '#6a6470');
  rect(mx, top, mw, l.tall - 4, '#0d0b10');
  rect(mx + 1, top, mw - 2, 1, '#1a1620');
  for (let x = mx + 1; x < mx + mw - 1; x += 2) rect(x, wallY + l.tall - 3, 1, 1, x % 4 ? '#4a4652' : '#2e2a34');
  rect(mx - 2, wallY + l.tall - 1, mw + 4, 1, '#57525e');
  void roofH;
}

/** A loom: two uprights and a beam, the warp strung between, a band of cloth woven at the bottom. */
function loom(g: CanvasRenderingContext2D, rect: Rect, w: number, roofH: number, wallY: number, l: Look, smashed: boolean): void {
  g.clearRect(0, 0, w, roofH + l.tall);
  rect(0, 0, 2, roofH + l.tall, '#5a3d22'), rect(w - 2, smashed ? 6 : 0, 2, roofH + l.tall - (smashed ? 6 : 0), '#5a3d22');
  rect(0, 0, smashed ? Math.round(w * 0.6) : w, 2, '#7a5a34');
  rect(0, wallY + l.tall - 3, w, 3, '#4a3420');
  for (let x = 3; x < w - 2; x += 2) rect(x, smashed && x > w / 2 ? 8 : 2, 1, wallY + l.tall - 9, '#cfc4a4');
  if (!smashed) for (let y = wallY + l.tall - 9; y < wallY + l.tall - 3; y += 2) rect(2, y, w - 4, 1, y % 4 ? '#7a2a2a' : '#8a6a3a');
}

/** A stall: straw heaped inside its rails, a low gate of two rails across the front. */
function pen(g: CanvasRenderingContext2D, rect: Rect, w: number, roofH: number, wallY: number, l: Look): void {
  for (let i = 0; i < w * roofH * 0.25; i++) rect((i * 37) % w, (i * 13) % roofH, 2, 1, i % 3 ? '#a08a54' : '#6b5a3a');
  rect(0, 0, 2, roofH, '#6b4a2b'), rect(w - 2, 0, 2, roofH, '#6b4a2b'), rect(0, 0, w, 1, '#6b4a2b');
  g.clearRect(0, wallY, w, l.tall);
  for (let i = 0; i < w * 0.8; i++) rect((i * 23) % w, wallY + ((i * 7) % l.tall), 2, 1, '#8a7448');
  for (const y of [1, 5]) rect(0, wallY + y, w, 2, '#7a5a34');
  for (const x of [0, Math.round(w / 2) - 1, w - 2]) rect(x, wallY, 2, l.tall, '#5a3d22');
}

/** Smashed: boards split and kicked in, splinters, a dark gash where it broke. */
function splinters(g: CanvasRenderingContext2D, rect: Rect, w: number, h: number, b: Block): void {
  let seed = Math.round(b.x * 41 + b.y * 13) + 7;
  const rnd = (n: number) => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff), seed % Math.max(1, n));
  const cx = 2 + rnd(w - 4);
  g.clearRect(cx, rnd(4), 2 + rnd(3), Math.round(h * 0.4));
  for (let y = 0; y < h; y += 2) rect(cx + Math.round(Math.sin(y * 0.9) * 1.5), y, 1, 2, '#14100c');
  for (let i = 0; i < w / 3; i++) rect(rnd(w - 3), rnd(h), 2 + rnd(3), 1, i % 2 ? '#8b6a3a' : '#2a1d12');
}

function cart(b: Block, rect: Rect, w: number, roofH: number, wallY: number, l: Look): void {
  // A wagon: plank bed, the bare hoops of its cover, two spoked wheels (charred if it's burning).
  const burnt = !!b.smoulder, wood = burnt ? '#2a1e16' : '#7a5a34', dark = burnt ? '#14100c' : '#4a3420';
  rect(0, 0, w, roofH, burnt ? '#1e1814' : '#6a4a2a');
  for (let x = 0; x < w; x += 3) rect(x, 0, 1, roofH, dark);
  for (let x = 3; x < w - 2; x += Math.max(4, Math.round(w / 4))) rect(x, 0, 1, roofH + 3, burnt ? '#3a2e24' : '#9a8a5a');
  rect(0, wallY, w, l.tall, wood);
  for (let y = wallY + 2; y < wallY + l.tall; y += 3) rect(0, y, w, 1, dark);
  for (const cx of [4, w - 5]) {
    rect(cx - 3, wallY + l.tall - 6, 7, 7, '#1a1410');
    rect(cx - 2, wallY + l.tall - 5, 5, 5, burnt ? '#2a2018' : '#5a3d22');
    rect(cx, wallY + l.tall - 6, 1, 7, '#1a1410'), rect(cx - 3, wallY + l.tall - 3, 7, 1, '#1a1410');
  }
  // Laden with the dead, waiting on a burying: long shapes under grey sacking, a boot showing.
  if (b.look === 3) {
    for (let y = 1; y < roofH - 2; y += 4) rect(1, y, w - 2, 3, y % 8 ? '#6a6670' : '#5a5660'), rect(1, y + 3, w - 2, 1, '#3a3640');
    rect(w - 3, 2, 2, 2, '#2a1e14');
  }
}
