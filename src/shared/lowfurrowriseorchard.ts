/**
 * THE RISE: the west shoulder, an old orchard gone wild (shared/lowfurrowrise.ts).
 *
 *   Nobody has pruned it since the walls went up: apples in rows you can still just see, brambles between, long
 *   grass and windfalls. When the hungry came up the lane a man ran up the sheep track and into it and up the one
 *   tree that stands apart; they shot at him and gave it up. His footprints, his sickle and their arrows are under it.
 */
import { block, claim, free, patch, round, type Kit, type P } from './expedkit.js';
import { clump, markAt, sprinkle } from './lowfurrowrisekit.js';

/** The tree that stands apart (someone is up it later: a mini quest's giver), and where its giver stands under it. */
export const GIVER_TREE: P = { x: 22, y: 71.4 };
export const GIVER: P = { x: 22, y: 72.8 };
/** The orchard's box. */
const O = { x0: 12, y0: 62, x1: 32, y1: 84 };

export function layOrchard(k: Kit): void {
  // The tree apart, the clear ground under it, what was left there.
  round(k, 'tree', GIVER_TREE.x, GIVER_TREE.y, 0.6), claim(k, GIVER.x, GIVER.y, 2.6), claim(k, GIVER_TREE.x, GIVER_TREE.y, 2.8);
  markAt(k, 'arrows', 21.2, 73.2, 1.4, 0.8), markAt(k, 'arrows', 23.4, 72.6, 1, 0.6), markAt(k, 'debris', 22.8, 73.8, 1, 0.5);
  for (let i = 0; i < 5; i++) markAt(k, 'mud', 33 - i * 2.1, 74.4 - i * 0.45 + k.rng.range(-0.2, 0.2), 0.9, 0.5);
  // The old boundary: a run of hurdles along the south side, most fallen; a dead tree or two; a trunk down.
  for (const x of [13.2, 15.4, 20.6, 25.4]) block(k, 'hurdle', x, 84.4, 2.2, 0.45);
  for (const [x, y] of [[16.6, 77.4], [18.4, 77.8]] as const) markAt(k, 'debris', x, y, 1.6, 0.7);
  for (const [x, y] of [[13.6, 63.6], [29.4, 66.4]] as const) round(k, 'deadtree', x, y, 0.5);
  // The pocket: a chest in the far corner under the dead tree.
  const c = { x: 14.8 + k.rng.range(-0.3, 0.5), y: 64.6 + k.rng.range(-0.3, 0.4) };
  k.chests.push(c), claim(k, c.x, c.y, 0.8);
  // The apples, in rows gone loose: some gone, some leaning out of line; long grass and windfalls under them.
  for (let row = 0, y = O.y0 + 1.4; y < O.y1 - 0.8; row++, y += 2.9) {
    for (let x = O.x0 + 0.8 + (row % 2) * 1.5; x < O.x1 - 0.4; x += 3.1) {
      const px = x + k.rng.range(-0.55, 0.55), py = y + k.rng.range(-0.45, 0.45), r = k.rng.range(0.46, 0.6);
      if (k.rng.next() < 0.16 || !free(k, px, py, r, 1.2)) continue;
      round(k, 'apple', px, py, r);
      if (k.rng.next() < 0.3) markAt(k, 'weeds', px, py + 0.9, 1.4, 0.6);
    }
  }
  clump(k, ['crows'], 18.6, 67.8, 1, 0.8, [0.02, 0.02], 0), clump(k, ['crows'], 26.2, 80.2, 1, 0.8, [0.02, 0.02], 0);
  // Brambles come in where the rows thinned, and along the hedge.
  for (const [x, y] of [[17.6, 70.6], [27.4, 75.2], [14.6, 80.4], [24.6, 64.6], [9.6, 66], [9.2, 75.8], [9.8, 83], [30.6, 82.6]] as const) clump(k, ['bush', 'bush', 'bush'], x, y, 3, 1.4, [0.34, 0.5], 1.2);
  sprinkle(k, 'weeds', 16, O.x0, O.y0, O.x1, O.y1, 2, 1.1);
  // Dappled shade over the thickest of it.
  for (const [x, y, w, h] of [[13, 64, 8, 6], [23, 76, 8, 7], [14, 77, 6, 5], [25, 64, 6, 5]] as const) patch(k, 'shade', x, y, w, h);
}
