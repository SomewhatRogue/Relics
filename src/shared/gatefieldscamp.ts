/**
 * The refugees' camp on THE GATE ROAD (docs/design/outside-the-gate.md): people who came up the valley sleep under their
 * carts just outside the town's gate, a rough line of carts and tents either side of the road, two fires, straw
 * underfoot, six silent people. Nobody named, nothing hostile. Fixed spots, claimed; the road and the way in stay clear.
 */
import { block, claim, patch, round, type Kit } from './expedkit.js';

/** Who is there (mute bystanders; each stands or sits by a fire or a cart). */
export const CAMP_FOLK = [
  { x: 20.6, y: 88.8, look: 'villager' }, { x: 18.2, y: 90.2, look: 'survivor' }, { x: 23.4, y: 89.2, look: 'villager' },
  { x: 33.6, y: 88.2, look: 'survivor' }, { x: 35.6, y: 89.8, look: 'villager' }, { x: 36.2, y: 86.4, look: 'villager' },
];

/** The watch: a crossbowman either side of the gate just inside the wall, one where the road leaves the camp (sim/campguard.ts). */
export const CAMP_POSTS = [{ x: 24.6, y: 92.4, r: 9 }, { x: 31.4, y: 92.4, r: 9 }, { x: 30.6, y: 82.6, r: 9 }];

export function layCamp(k: Kit): void {
  patch(k, 'straw', 13.4, 83, 11, 9, true), patch(k, 'straw', 31, 83.4, 10, 9, true);
  // West of the road: three carts drawn up in a line, two tents, a fire between.
  block(k, 'cart', 21.6, 84.4, 2.4, 1.2), block(k, 'cart', 18.6, 86.8, 2.4, 1.2), block(k, 'cart', 21.2, 90.6, 2.4, 1.2);
  block(k, 'tent', 14, 83.4, 2.6, 2.2), block(k, 'tent', 15.2, 90.2, 2.6, 2.2);
  k.braziers.push({ x: 19.6, y: 89.4, r: 0.35, wild: true });
  // East: two carts and a third, a tent either end, a fire.
  block(k, 'cart', 32.6, 85.6, 2.4, 1.2), block(k, 'cart', 36.2, 87.6, 2.4, 1.2), block(k, 'cart', 32.8, 90.6, 2.4, 1.2);
  block(k, 'tent', 38.4, 83.6, 2.6, 2.2), block(k, 'tent', 37.4, 91, 2.6, 2.2);
  k.braziers.push({ x: 34.6, y: 88.4, r: 0.35, wild: true });
  for (const [x, y] of [[20.4, 92.2], [16.6, 88.4], [31.6, 88.2], [34.8, 92.2]]) round(k, 'sacks', x, y, 0.34);
  for (const p of CAMP_POSTS) claim(k, p.x, p.y, 0.6);
  claim(k, 19.5, 88, 6.6), claim(k, 35.5, 88, 6.4);
}
