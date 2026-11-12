/**
 * The Open Cut, over the top: THE INCLINE (docs/design/open-cut-arc.md). A slope of three rail lanes up to the brake
 * at the top, its banks rock either side; THE BRAKESMAN at the brake lets carts go down the lane you're in (sim/brake.ts).
 * At the foot, a spent cart and two carters; halfway up, a shield and an archer between the lanes. You climb it
 * between the lanes, stepping out of a striped one, and GRAB the spent carts at the foot to send them back up at it.
 *
 * Fixed by hand; the seed only places the clutter.
 */
import { block, newKit, patch, round } from './expedkit.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import type { RoomPlan } from './terrain.js';
import { areaPlan, keeper, pack } from './cutkit.js';
import { CUT_NAMES } from './opencutwords.js';

export const INCLINE = { w: 18, h: 50, name: 'THE INCLINE' };
export const INCLINE_AT = { lanes: [5.4, 9, 12.6], y0: 6.6, y1: 44, brakesman: { x: 9, y: 4.8 }, mid: { x: 7.2, y: 26 }, foot: { x: 14.2, y: 42 } };

export function inclinePlan(job: Job): RoomPlan {
  const { w, h } = INCLINE, A = INCLINE_AT, k = newKit(new Rng(job.seed * 3557 + 61));
  patch(k, 'earth', 0, 0, w, h, false);
  // The banks: rock either side of the slope, the yard at the top and the foot left open.
  block(k, 'rockwall', 0, 6, 2.4, 40), block(k, 'rockwall', w - 2.4, 6, 2.4, 40);
  // The brake hut at the top; spoil and old sleepers on the banks' edges.
  block(k, 'shack', 2.6, 0.9, 3.6, 2.4);
  for (const [x, y] of [[3, 14], [15, 18], [3.2, 33], [14.8, 38], [15.2, 8.6]] as [number, number][]) round(k, 'rock', x, y, 0.4 + k.rng.range(0, 0.2));
  k.braziers.push({ x: 3.4, y: 20, r: 0.28, wild: true }, { x: 14.6, y: 30, r: 0.28, wild: true }, { x: 14.6, y: 3.6, r: 0.3, wild: true }, { x: 3.4, y: 42, r: 0.28, wild: true });
  // A spent cart at the foot of the middle lane.
  k.props.push({ kind: 'cart', x: A.lanes[1], y: A.y1 });
  // Two carters at the foot; a shield and an archer halfway up, between the lanes.
  pack(k, 1, A.foot, ['lunger', 'fodder'], 0.9);
  pack(k, 2, A.mid, ['shield', 'archer'], 0.8);
  // THE BRAKESMAN at its brake, one of its own by the hut.
  keeper(k, 3, A.brakesman, 'heavy', CUT_NAMES.brakesman, 380).brakes = true;
  pack(k, 3, { x: 5, y: 4.2 }, ['lunger'], 0);
  return areaPlan(k, job, { name: INCLINE.name, w, h, kind: 'mine', torches: [4, w - 4] }, { incline: { lanes: [...A.lanes], y0: A.y0, y1: A.y1 } });
}
