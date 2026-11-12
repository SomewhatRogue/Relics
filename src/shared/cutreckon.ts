/**
 * The Open Cut, act 1: THE RECKONING HOUSE (docs/design/open-cut-arc.md). Rakehead's pay office, now the goblins'
 * counting house. A forecourt with a spilled ore cart and two at the door; inside, the pay counter, the shelves of
 * books torn and restacked, desks, and on the east wall the tally board where a chalker strokes up every digger in
 * fives; the clerk's room off it, the clerk dead at the desk, a chest; and at the back door, the three keeping it
 * (shield, shield, archer), to kill before the gate behind them opens (`RECKON_GUARDS`).
 *
 * Fixed by hand; the seed only places the clutter.
 */
import { block, mark, newKit, patch, prop, round } from './expedkit.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import type { RoomPlan } from './terrain.js';
import { areaPlan, body, pack } from './cutkit.js';

export const RECKON = { w: 22, h: 34, name: 'THE RECKONING HOUSE' };
/** The pack keeping the back door: the gate opens when it's dead (sim/stretches.ts `packs`). */
export const RECKON_GUARDS = 3;
export const RECKON_AT = { door: { x: 11, y: 27.4 }, books: { x: 6.2, y: 15.4 }, board: { x: 13.6, y: 17 }, back: { x: 11, y: 10.4 }, chest: { x: 18.6, y: 10 }, clerk: { x: 16.9, y: 13.6 } };

export function reckonPlan(job: Job): RoomPlan {
  const { w, h } = RECKON, A = RECKON_AT, k = newKit(new Rng(job.seed * 6967 + 41)), wall = (x: number, y: number, ww: number, hh: number) => block(k, 'wall', x, y, ww, hh);
  patch(k, 'earth', 0, 0, w, h, false), patch(k, 'swept', 2.4, 8.6, 17.2, 16);
  // The house: stone walls, a door at the front and at the back, the clerk's room boxed off in the north-east.
  wall(2, 8, 7.6, 0.7), wall(12.4, 8, 7.6, 0.7), wall(2, 24.2, 7.6, 0.7), wall(12.4, 24.2, 7.6, 0.7);
  wall(2, 8, 0.7, 16.9), wall(19.3, 8, 0.7, 16.9);
  block(k, 'partition', 15, 8.7, 0.5, 2.9), block(k, 'partition', 15, 13.2, 0.5, 2.4), block(k, 'partition', 15, 15.6, 4.3, 0.5);
  // The pay office: shelves of books down the west wall, the pay counter, desks, sacks of pay tins.
  for (const y of [9.6, 13.2, 16.8]) block(k, 'books', 2.8, y, 0.8, 2.6);
  block(k, 'counter', 4.8, 19.6, 4.6, 0.8), block(k, 'counter', 11.6, 19.6, 2.6, 0.8);
  block(k, 'desk', 5.6, 11.4, 1.8, 1), block(k, 'desk', 9.4, 14.2, 1.8, 1), block(k, 'sacks', 16.2, 21.4, 2.2, 1.2);
  mark(k, 'debris', 4.4, 12.6, 3.4, 4.2), mark(k, 'debris', 9, 16.2, 2.6, 2), mark(k, 'trample', 9.6, 20.4, 2.8, 3.6);
  // The clerk's room: its desk, the clerk, a chest.
  block(k, 'desk', 16.6, 9.2, 1.8, 0.9);
  body(k, A.clerk.x, A.clerk.y, 'villager');
  k.chests.push({ ...A.chest });
  // The forecourt: an ore cart tipped over, its load spilled; someone who ran.
  prop(k, 'cart', 6.2, 29.6), mark(k, 'debris', 4.2, 30.2, 3, 1.6), body(k, 15.6, 30.4, 'villager');
  for (const [x, y] of [[1.4, 32.6], [20.4, 31.2], [19.6, 26.6], [1.6, 26.2]] as [number, number][]) round(k, 'rock', x, y, 0.45 + k.rng.range(0, 0.2));
  // Light: a basket by the door, one on the counter's end, one by the back door, one in the yard behind.
  k.braziers.push({ x: 13.6, y: 26.6, r: 0.3, wild: true }, { x: 14.8, y: 20.6, r: 0.28, wild: true }, { x: 7.4, y: 9.8, r: 0.28, wild: true }, { x: 17.4, y: 4, r: 0.3, wild: true });

  // 1. Two at the door.
  pack(k, 1, A.door, ['shield', 'fodder'], 1.1);
  // 2. At the books, pulling them down.
  pack(k, 2, A.books, ['hexer', 'fodder'], 1);
  // The chalker at the tally board, every digger up in fives (sim/tasks.ts `tally`).
  k.foes.push({ kind: 'scrapper', variant: 'chalker', x: A.board.x, y: A.board.y + 0.8, pack: 4, task: { k: 'tally', x: A.board.x, y: A.board.y, n: 45 } });
  // 3. The back door kept: kill them and the gate behind opens.
  pack(k, RECKON_GUARDS, A.back, ['shield', 'shield', 'archer'], 1.2);
  return areaPlan(k, job, { name: RECKON.name, w, h, kind: 'village', torches: [4, w - 4] });
}
