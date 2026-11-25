/**
 * The Gate Fields' hand-placed things (docs/design/outside-the-gate.md): what each screenful has to look at, each with
 * a reason to be there, off the road and claimed so the scatter stays out. Fixed spots; the seed moves none. Pure.
 */
import { block, claim, mark, patch, round, type Kit } from './expedkit.js';
import { BARN, HUT } from './gatefieldsland.js';

/** The person at the barn's fire: a keeper you can talk to, her talk `station:fieldbarn`. */
export const KEEPER = { x: BARN.x - 1.4, y: BARN.y + 1.4 };

/** The person at the charcoal hut's fire, her talk `station:charcoalhut`. */
export const HUT_KEEPER = { x: HUT.x - 0.4, y: HUT.y + 1.7 };

/** The gate road: the way back to town, a cross and a milestone by it, a second cut strip fenced on its north side. */
function gateRoad(k: Kit): void {
  round(k, 'cross', 25.4, 88.2, 0.4), round(k, 'stone', 30.4, 82, 0.4);
  patch(k, 'crop', 6, 90.6, 3.4, 2, true), patch(k, 'crop', 10.6, 91.6, 3.8, 1.9, true), block(k, 'fence', 5, 89.5, 12, 0.35);
  for (const x of [8, 10.6, 13.2]) round(k, 'hay', x, 87.2, 0.5);
  round(k, 'sacks', 17.6, 86.2, 0.34), mark(k, 'trample', 14, 92.4, 5, 0.7);
}

/** The common strips: a whole cart by a gap in the hedge, a well at a crossing, sacks, crows on the scarecrow's strip. */
function strips(k: Kit): void {
  block(k, 'cart', 41, 77.3, 2.4, 1.2), round(k, 'well', 22, 67.6, 0.55);
  round(k, 'sacks', 19.4, 73.2, 0.34), round(k, 'sacks', 20.2, 73.8, 0.34);
  for (const [x, y] of [[11, 61.8], [13.6, 64.2], [10.2, 64.6]]) round(k, 'crows', x, y, 0.15);
}

/** The rough pasture: a broken sheepfold, the wolves' kill with crows, three standing stones, clumps of rocks. */
function pasture(k: Kit): void {
  const fx = 44, fy = 41;
  block(k, 'fence', fx, fy, 5, 0.35), block(k, 'fence', fx, fy + 4, 1.8, 0.35), block(k, 'fence', fx + 3.2, fy + 4, 1.8, 0.35);
  block(k, 'fence', fx, fy, 0.35, 1.3), block(k, 'fence', fx, fy + 2.7, 0.35, 1.65), block(k, 'fence', fx + 4.65, fy, 0.35, 4.35);
  claim(k, fx + 2.5, fy + 2, 3.4), patch(k, 'straw', fx + 0.6, fy + 0.8, 3.8, 2.4, true);
  mark(k, 'blood', 32.4, 39.8, 2.2, 0.9), mark(k, 'drag', 33, 40.8, 2.4, 0.5);
  for (const [x, y] of [[33.2, 40.1], [34.4, 40.8]]) round(k, 'crows', x, y, 0.15);
  for (const [x, y] of [[5.6, 30.8], [7.4, 31.5], [9.2, 31]]) round(k, 'stone', x, y, 0.4);
  for (const [cx, cy] of [[17, 34], [36, 31.5], [46, 47.6]]) for (let i = 0, n = 3 + k.rng.int(3); i < n; i++) round(k, 'rock', cx + Math.cos(i * 2.1) * 0.9, cy + Math.sin(i * 2.1) * 0.7, 0.4);
}

/** The wood's edge: two fallen trunks, a clearing someone was cutting, a dead pair by the nest. */
function wood(k: Kit): void {
  block(k, 'log', 14, 25.5, 3.2, 0.6), block(k, 'log', 39.5, 27.2, 3.2, 0.6);
  for (const [x, y] of [[45, 22.5], [46.6, 22], [47.8, 23.2], [45.8, 24.3], [47.2, 24.9]]) round(k, 'stump', x, y, 0.4);
  mark(k, 'debris', 45.2, 23.2, 2.2, 0.8), claim(k, 46.4, 23.6, 2.6);
  round(k, 'deadtree', 9, 16.8, 0.5), round(k, 'deadtree', 15.4, 15.8, 0.5);
}

/** The charcoal hut: a shack, a wild fire, a woodpile, and the clamp (turf over stacked wood) smoking; ring left open to the road. */
function hut(k: Kit): void {
  patch(k, 'mud', HUT.x - 4.2, HUT.y - 3.2, 8.4, 6.4, true);
  block(k, 'shack', HUT.x + 0.4, HUT.y - 3.4, 3.4, 2.2);
  k.braziers.push({ x: HUT.x - 1.8, y: HUT.y + 0.6, r: 0.35, wild: true });
  round(k, 'woodpile', HUT.x - 3, HUT.y - 1.6, 0.45), round(k, 'woodpile', HUT.x - 0.6, HUT.y - 2.2, 0.4);
  block(k, 'clamp', HUT.x + 1.6, HUT.y + 0.8, 2.6, 2.2);
  round(k, 'smoke', HUT.x + 2.9, HUT.y + 1.2, 0.15);
  mark(k, 'debris', HUT.x + 1.2, HUT.y + 3.1, 2.4, 0.6), claim(k, HUT.x, HUT.y, 6);
}

export function layDetail(k: Kit): void { gateRoad(k), strips(k), pasture(k), wood(k), hut(k); }
