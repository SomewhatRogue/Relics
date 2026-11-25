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

/** The gate road: the way back to town, a cross and a milestone by it, a second cut strip fenced on its north side
 *  (the camp's ground, by the gate: 14 east and 48 south of where it lay on the first, smaller map). */
function gateRoad(k: Kit): void {
  round(k, 'cross', 39.4, 136.2, 0.4), round(k, 'stone', 44.4, 130, 0.4);
  patch(k, 'crop', 20, 138.6, 3.4, 2, true), patch(k, 'crop', 24.6, 139.6, 3.8, 1.9, true), block(k, 'fence', 19, 137.5, 12, 0.35);
  for (const x of [22, 24.6, 27.2]) round(k, 'hay', x, 135.2, 0.5);
  round(k, 'sacks', 31.6, 134.2, 0.34), mark(k, 'trample', 28, 140.4, 5, 0.7);
  // A second milestone where the road leaves the camp's ground for the strips.
  round(k, 'stone', 38.6, 118.4, 0.4);
}

/** The common strips: a whole cart by a gap in the hedge, a well at a crossing, sacks, crows on the scarecrow's strip. */
function strips(k: Kit): void {
  block(k, 'cart', 61.5, 116, 2.4, 1.2), round(k, 'well', 33.5, 101.6, 0.55);
  round(k, 'sacks', 29.1, 109.8, 0.34), round(k, 'sacks', 30.3, 110.7, 0.34);
  for (const [x, y] of [[16.5, 92.7], [20.4, 96.3], [15.3, 96.9]]) round(k, 'crows', x, y, 0.15);
}

/** The rough pasture: a broken sheepfold, the wolves' kill with crows, three standing stones, clumps of rocks. */
function pasture(k: Kit): void {
  const fx = 66, fy = 61.5;
  block(k, 'fence', fx, fy, 5, 0.35), block(k, 'fence', fx, fy + 4, 1.8, 0.35), block(k, 'fence', fx + 3.2, fy + 4, 1.8, 0.35);
  block(k, 'fence', fx, fy, 0.35, 1.3), block(k, 'fence', fx, fy + 2.7, 0.35, 1.65), block(k, 'fence', fx + 4.65, fy, 0.35, 4.35);
  claim(k, fx + 2.5, fy + 2, 3.4), patch(k, 'straw', fx + 0.6, fy + 0.8, 3.8, 2.4, true);
  mark(k, 'blood', 49.9, 59.55, 2.2, 0.9), mark(k, 'drag', 50.5, 60.55, 2.4, 0.5);
  for (const [x, y] of [[50.7, 59.85], [51.9, 60.55]]) round(k, 'crows', x, y, 0.15);
  for (const [x, y] of [[8.4, 46.2], [11.1, 47.25], [13.8, 46.5]]) round(k, 'stone', x, y, 0.4);
  for (const [cx, cy] of [[25.5, 51], [54, 47.25], [69, 71.4], [30, 63], [60, 68]]) for (let i = 0, n = 3 + k.rng.int(3); i < n; i++) round(k, 'rock', cx + Math.cos(i * 2.1) * 0.9, cy + Math.sin(i * 2.1) * 0.7, 0.4);
}

/** The wood's edge: fallen trunks, a clearing someone was cutting, a dead pair by the nest. */
function wood(k: Kit): void {
  block(k, 'log', 21, 38.25, 3.2, 0.6), block(k, 'log', 59.25, 40.8, 3.2, 0.6), block(k, 'log', 12, 18, 3.2, 0.6);
  for (const [x, y] of [[68.2, 34.3], [69.8, 33.8], [71, 35], [69, 36.1], [70.4, 36.7]]) round(k, 'stump', x, y, 0.4);
  mark(k, 'debris', 68.4, 35, 2.2, 0.8), claim(k, 69.6, 35.4, 2.6);
  round(k, 'deadtree', 15, 24.3, 0.5), round(k, 'deadtree', 21.4, 23.3, 0.5);
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
