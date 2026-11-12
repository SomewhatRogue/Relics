/**
 * The square's two posting places (Kyle, 2026-11-12: the job board "kind of weird" as a market stall). The
 * job board: a roofed notice board on two posts, notices pinned to it (a WANTED with a goblin's face, a red
 * seal, one curling), a lantern off the eave, a paste pot at its foot, JOBS on the fascia. Public Works: a
 * builder's sign hung from scaffold poles, a painted hammer and the plans pinned beside it, planks stacked
 * and a mortar tub, WORKS on the top board. Drawn on the stalls' own footprints (shared/town.ts), so the
 * room is the same; sized to the tall heroes.
 */
import type { Block } from '../shared/arena';
import { blit, type Ctx } from './draw';
import { drawText, textWidth } from './pixfont';
import { makeSprite, type Sprite } from './sprites';
import { PX } from './world';

const W = '#7a5a36', Wd = '#5e4428', Wk = '#4a3420', P = '#e6dcc0', P2 = '#d8cca8', INK = '#8a7a5a', POST = '#5a3d22', PD = '#3e2a18', PIN = '#c0c0c8';

const BOARD = makeSprite(40, 48, [
  // Two posts on stones, a crossbeam under the board.
  ['r', 3, 12, 3, 34, POST], ['r', 34, 12, 3, 34, POST], ['r', 5, 12, 1, 34, PD], ['r', 36, 12, 1, 34, PD],
  ['r', 1, 45, 8, 3, '#57525e'], ['r', 31, 45, 8, 3, '#57525e'], ['r', 3, 39, 34, 2, POST], ['r', 3, 40, 34, 1, PD],
  // The board: planks in a frame.
  ['r', 6, 14, 28, 24, W], ['r', 11, 14, 1, 24, Wd], ['r', 17, 14, 1, 24, Wd], ['r', 23, 14, 1, 24, Wd], ['r', 29, 14, 1, 24, Wd],
  ['r', 6, 14, 28, 1, Wk], ['r', 6, 37, 28, 1, Wk], ['r', 6, 14, 1, 24, Wk], ['r', 33, 14, 1, 24, Wk], ['r', 6, 15, 28, 1, PD],
  // A shingle roof, and the fascia board under it that carries the word.
  ['r', 8, 0, 24, 1, '#3a2c2c'], ['r', 4, 1, 32, 2, '#5a4848'], ['r', 1, 3, 38, 3, '#4e3e3e'], ['r', 4, 2, 32, 1, '#3a2c2c'],
  ['p', 10, 1, '#7a6868'], ['p', 22, 4, '#7a6868'], ['p', 31, 1, '#7a6868'],
  ['r', 0, 6, 40, 7, POST], ['r', 0, 6, 40, 1, '#7a5a34'], ['r', 0, 12, 40, 1, '#2a2020'], ['r', 0, 13, 40, 1, PD],
  // Notices: pinned, written on, a red seal, a WANTED with a goblin's face, one curling at its corner.
  ['r', 8, 17, 7, 9, P], ['r', 9, 19, 5, 1, INK], ['r', 9, 21, 4, 1, INK], ['r', 9, 23, 5, 1, INK], ['p', 13, 25, '#9a2020'], ['p', 11, 17, PIN],
  ['r', 17, 16, 8, 11, P2], ['r', 18, 17, 6, 1, '#7a1d1d'], ['r', 19, 19, 4, 3, '#5a7a3a'], ['p', 19, 20, '#ffd040'], ['p', 22, 20, '#ffd040'],
  ['r', 18, 23, 6, 1, INK], ['r', 18, 25, 5, 1, INK], ['p', 21, 16, PIN],
  ['r', 27, 18, 5, 8, P], ['r', 28, 20, 3, 1, INK], ['r', 28, 22, 3, 1, INK], ['p', 31, 18, '#b8ac88'], ['p', 29, 18, PIN],
  ['r', 9, 28, 9, 7, P2], ['r', 10, 30, 7, 1, INK], ['r', 10, 32, 5, 1, INK], ['p', 13, 28, PIN],
  ['r', 21, 29, 10, 6, P], ['r', 22, 31, 7, 1, INK], ['r', 22, 33, 6, 1, INK], ['p', 30, 29, '#b8ac88'], ['p', 25, 29, PIN],
  // A lantern hung off the eave (its flame is on the glow), a paste pot and brush at the foot.
  ['r', 37, 13, 1, 2, '#3a3640'], ['r', 36, 15, 3, 4, '#3a3640'],
  ['r', 9, 42, 5, 4, '#6a5a48'], ['r', 9, 42, 5, 1, '#d8d0bc'], ['r', 12, 39, 1, 3, '#8a6a3a'],
]);

const WORKS = makeSprite(44, 46, [
  // Scaffold poles lashed with rope; the top board carries the word, a second board lower down.
  ['r', 2, 0, 2, 46, '#8a6a3a'], ['r', 40, 0, 2, 46, '#8a6a3a'], ['r', 3, 0, 1, 46, '#6a4a2a'], ['r', 41, 0, 1, 46, '#6a4a2a'],
  ['r', 2, 2, 40, 7, '#7a5a32'], ['r', 2, 2, 40, 1, '#9a7a4a'], ['r', 2, 8, 40, 1, '#4a3420'], ['r', 2, 27, 40, 2, '#7a5a32'],
  ['p', 3, 3, '#c8b88a'], ['p', 40, 3, '#c8b88a'], ['p', 3, 28, '#c8b88a'], ['p', 40, 28, '#c8b88a'],
  // The sign on ropes: a painted hammer, the plans pinned beside it.
  ['r', 12, 9, 1, 4, '#c8b88a'], ['r', 31, 9, 1, 4, '#c8b88a'], ['r', 9, 13, 26, 11, '#9a7a4a'], ['r', 9, 13, 26, 1, '#6a4a2a'], ['r', 9, 23, 26, 1, '#6a4a2a'],
  ['r', 13, 18, 9, 1, '#5a3d22'], ['r', 20, 16, 4, 4, '#8a8f9a'], ['r', 26, 15, 6, 7, '#d8d0bc'], ['r', 27, 17, 4, 1, '#5a7a9a'], ['r', 27, 19, 3, 1, '#5a7a9a'], ['p', 28, 15, PIN],
  // A stack of planks, a mortar tub with a trowel in it.
  ['r', 6, 37, 20, 2, '#9a7a4a'], ['r', 7, 39, 20, 2, '#7a5a32'], ['r', 5, 41, 22, 3, '#9a7a4a'], ['r', 5, 43, 22, 1, '#6a4a2a'],
  ['r', 30, 38, 8, 7, '#6a6a70'], ['r', 31, 38, 6, 1, '#b8b0a0'], ['r', 35, 35, 1, 3, '#9aa3ad'],
]);

/** The posting places this draws, by their stall's label, and where their word sits (from the sprite's top). */
const POSTS: Record<string, { s: Sprite; word: string; y: number }> = {
  JOBS: { s: BOARD, word: 'JOBS', y: 7 },
  'PUBLIC WORKS': { s: WORKS, word: 'WORKS', y: 3 },
};

export { isPost } from './postkind';

/** (x, y) is the footprint's top-left on screen; the post stands on its middle, feet on its front edge. */
export function drawPost(c: Ctx, b: Block, x: number, y: number): void {
  const p = POSTS[b.label!], cx = Math.round(x + (b.w * PX) / 2), foot = Math.round(y + b.h * PX);
  blit(c, p.s, cx, foot, false, 0);
  // (The sprite's map starts a pixel in, inside its outline: sprites.ts.)
  const left = Math.round(cx - p.s.w / 2) + 1, top = foot - p.s.h + 1;
  drawText(c.lit, p.word, Math.round(cx - textWidth(p.word) / 2), top + p.y, '#f0e0b0');
  // The board's lantern: a flame that gutters now and then.
  if (p.s === BOARD) (c.glow.fillStyle = Math.floor(c.now * 5 + b.x) % 7 ? '#ffd27a' : '#ff9a3c'), c.glow.fillRect(left + 37, top + 16, 1, 2);
}
