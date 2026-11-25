/**
 * The refugees' camp on THE GATE ROAD (docs/design/outside-the-gate.md): people who came up the valley sleep under their
 * carts just outside the town's gate, a rough line of carts and tents either side of the road, two fires, straw
 * underfoot, six silent people. Nobody named, nothing hostile. Fixed spots, claimed; the road and the way in stay clear.
 */
import { block, claim, patch, round, type Kit } from './expedkit.js';

/** Who is there (mute bystanders; each stands or sits by a fire or a cart). */
export const CAMP_FOLK = [
  { x: 34.6, y: 136.8, look: 'villager' }, { x: 32.2, y: 138.2, look: 'survivor' }, { x: 37.4, y: 137.2, look: 'villager' },
  { x: 47.6, y: 136.2, look: 'survivor' }, { x: 49.6, y: 137.8, look: 'villager' }, { x: 50.2, y: 134.4, look: 'villager' },
];

/** The watch: a crossbowman either side of the gate just inside the wall, one where the road leaves the camp (sim/campguard.ts). */
export const CAMP_POSTS = [{ x: 38.6, y: 140.4, r: 9 }, { x: 45.4, y: 140.4, r: 9 }, { x: 44.6, y: 130.6, r: 9 }];

export function layCamp(k: Kit): void {
  patch(k, 'straw', 27.4, 131, 11, 9, true), patch(k, 'straw', 45, 131.4, 10, 9, true);
  // West of the road: three carts drawn up in a line, two tents, a fire between.
  block(k, 'cart', 35.6, 132.4, 2.4, 1.2), block(k, 'cart', 32.6, 134.8, 2.4, 1.2), block(k, 'cart', 35.2, 138.6, 2.4, 1.2);
  block(k, 'tent', 28, 131.4, 2.6, 2.2), block(k, 'tent', 29.2, 138.2, 2.6, 2.2);
  k.braziers.push({ x: 33.6, y: 137.4, r: 0.35, wild: true });
  // East: two carts and a third, a tent either end, a fire.
  block(k, 'cart', 46.6, 133.6, 2.4, 1.2), block(k, 'cart', 50.2, 135.6, 2.4, 1.2), block(k, 'cart', 46.8, 138.6, 2.4, 1.2);
  block(k, 'tent', 52.4, 131.6, 2.6, 2.2), block(k, 'tent', 51.4, 139, 2.6, 2.2);
  k.braziers.push({ x: 48.6, y: 136.4, r: 0.35, wild: true });
  for (const [x, y] of [[34.4, 140.2], [30.6, 136.4], [45.6, 136.2], [48.8, 140.2]]) round(k, 'sacks', x, y, 0.34);
  for (const p of CAMP_POSTS) claim(k, p.x, p.y, 0.6);
  claim(k, 33.5, 136, 6.6), claim(k, 49.5, 136, 6.4);
}
