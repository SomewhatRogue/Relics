/**
 * The Open Cut, under the hill: THE SORTING FLOOR (docs/design/instance-puzzles.md), in the old adit, where the ore
 * was picked over and tipped. The tipping plates at the far end take a tub each; the gate behind opens when all three
 * have one (sim/tubs.ts): three tubs on the floor among the fallen rock, pushed square by square. The lever by the
 * way in puts them back. Two at the way in; and with two or more of you, more out of the side drift while you work.
 *
 * Fixed by hand; the seed only places the clutter. The layout's checked solvable in its least pushes, with a wrong
 * first push that strands a tub (tests/puzzles.test.ts).
 */
import { block, mark, newKit, patch, round } from './expedkit.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import type { RoomPlan } from './terrain.js';
import { areaPlan, body, pack } from './cutkit.js';
import { centre, fromRows, type TubPuzzle } from './puzzle.js';

export const SORTING = { w: 18, h: 22, name: 'THE SORTING FLOOR' };
/** `#` fallen rock, `.` a tipping plate, `$` a tub. */
export const SORTING_ROWS = [
  ' .  # .',
  ' ## $  ',
  '  $  # ',
  ' #  $ #',
  '   .   ',
];
export const SORTING_AT = { x: 4.1, y: 5.4, cell: 1.4, lever: { x: 3.8, y: 16.2 }, from: { x: 17, y: 10.9 }, door: { x: 9, y: 18.6 } };

export function sortingPuzzle(): TubPuzzle {
  const A = SORTING_AT;
  return { ...fromRows(SORTING_ROWS), x: A.x, y: A.y, cell: A.cell, lever: { ...A.lever }, from: { ...A.from } };
}

export function sortingPlan(job: Job): RoomPlan {
  const { w, h } = SORTING, A = SORTING_AT, k = newKit(new Rng(job.seed * 3191 + 97)), p = sortingPuzzle();
  patch(k, 'earth', 0, 0, w, h, false), patch(k, 'swept', A.x - 1.4, A.y - 1.4, p.cols * A.cell + 2.8, p.rows * A.cell + 2.8);
  // The adit's timbering down both sides; spoil and a broken sieve at the edges.
  for (const y of [2, 7, 12, 17]) round(k, 'support', 0.9, y, 0.3), round(k, 'support', w - 0.9, y + 1.4, 0.3);
  block(k, 'sacks', 0.6, 1, 2.4, 1.1), block(k, 'rubble', w - 3, 1, 2.2, 1.2), block(k, 'sacks', w - 2.6, 16.2, 2, 1);
  // The fallen rock on the floor: the puzzle's walls, a boulder to a square.
  for (const [c, r] of p.walls) round(k, 'rock', A.x + (c + 0.5) * A.cell, A.y + (r + 0.5) * A.cell, 0.6);
  // The tubs where they were left.
  for (const cell of p.tubs) k.props.push({ kind: 'tub', ...centre(p, cell) });
  mark(k, 'debris', 2.4, 17.4, 3, 1.4), mark(k, 'trample', 7.4, 14.2, 3.4, 3.4);
  body(k, 14.6, 15.6, 'villager');
  // Fire baskets at the grid's corners (never where you push from: you walk round them), so it reads; one by the way in.
  const gx = A.x + p.cols * A.cell, gy = A.y + p.rows * A.cell;
  k.braziers.push({ x: A.x - 0.8, y: A.y - 0.8, r: 0.3, wild: true }, { x: gx + 0.8, y: A.y - 0.8, r: 0.3, wild: true }, { x: A.x - 0.8, y: gy + 0.8, r: 0.3, wild: true }, { x: gx + 0.8, y: gy + 0.8, r: 0.3, wild: true }, { x: 4.2, y: 19.6, r: 0.28, wild: true });
  // Two at the way in.
  pack(k, 1, A.door, ['lunger', 'fodder'], 1);
  return areaPlan(k, job, { name: SORTING.name, w, h, kind: 'mine', torches: [4, w - 4] }, { puzzles: [p], adits: [{ ...A.from }] });
}
