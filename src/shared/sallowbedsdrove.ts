/**
 * THE DROWNED DROVE (shared/sallowbeds.ts): the scape between the first sluice and the holm.
 *
 *   With the sluice wound the cut beyond has drained: a hard wet bottom you walk, black water standing off both
 *   sides under the willows, the silt left in ridges and puddles, a dead pike, a lost basket. Where the bottom ends
 *   the old causeway goes on half under, broken twice: the hungry have laid boards over both breaks, a
 *   plank or two short. On a dead willow by the bottom's east edge hang the sickles and hooks they took off Lowfurrow.
 *   West, a wade out to a hummock where something was hidden. Ahead, smoke over the water from the second den.
 */
import { block, claim, patch, type Kit, type P } from './expedkit.js';
import { BOARDS, LOG, SLUICE2 } from './sallowbedsland.js';
import { markAt, put, sprinkle } from './sallowbedskit.js';

/** The dead willow with the Lowfurrow tools on it, and the ground under it you'd stand on to look; the pocket. */
export const SICKLES: P = { x: 54.2, y: 55.4 };
export const WILLOW: P = { x: 55.9, y: 54.6 };
export const POCKET: P = { x: 32.6, y: 56 };

/** The drained bottom: silt and puddles, what the water left, the sluice's far frame. No water at all. */
function bottom(k: Kit): void {
  patch(k, 'mud', 41, 49.6, 14, 13.4, false), patch(k, 'wet', 43, 52, 10, 9);
  for (let y = 52; y < 61.5; y += 2.2) markAt(k, 'ruts', 48 + k.rng.range(-3, 3), y, 2.6, 0.9);
  for (const [x, y, w] of [[45.2, 59.6, 1.6], [51.2, 57.6, 1.4], [44.6, 54, 1.2], [50.4, 52.4, 1.6], [47.6, 55.6, 1]] as const) markAt(k, 'puddle', x, y, w, w * 0.5);
  sprinkle(k, 'weeds', 6, 42.6, 50.4, 53.4, 62, 1.2, 0.5);
  // What the water left: a dead fish, a basket, a branch down, a stone or two showing.
  markAt(k, 'debris', 45.8, 57.8, 0.8, 0.3), put(k, 'washtub', 52.2, 60.6, 0.34, 0, 0.6), markAt(k, 'fallenpost', 43.8, 56.6, 1.8, 0.5);
  put(k, 'rock', 52.4, 51.6, 0.34, 0, 0.6), put(k, 'rock', 43.4, 61, 0.3, 0, 0.6), put(k, 'rock', 44, 51.2, 0.26, 0, 0.6);
  markAt(k, 'planks', 48, 62.1, 3.4, 0.5);
}

/** The causeway half under: its crown at the bend, boards over both its breaks. */
function causeway(k: Kit): void {
  block(k, 'boards', LOG.x - 0.1, LOG.y, LOG.w + 0.2, LOG.h, { deck: true });
  block(k, 'boards', BOARDS.x, BOARDS.y, BOARDS.w, BOARDS.h, { deck: true });
  patch(k, 'mud', 42.6, 42.2, 2.8, 2), markAt(k, 'debris', 44.4, 43.6, 0.9, 0.4);
  // Stakes of the old causeway's edge still showing, reeds in its shallows.
  for (const [x, y] of [[49.4, 44.6], [45.4, 41.2], [38.2, 41.6], [42.2, 36.2], [38.4, 35]] as const) put(k, 'reed', x, y, 0.26, 1, 0.3) || put(k, 'reed', x, y, 0.26, 2, 0.3);
}

/** The willow with the tools: hung on it, dropped under it, one sickle stuck in the trunk. */
function sickles(k: Kit): void {
  k.rounds.push({ kind: 'deadtree', x: WILLOW.x, y: WILLOW.y, r: 0.6 }), claim(k, WILLOW.x, WILLOW.y, 0.7);
  for (const [x, y, w] of [[54.6, 54.8, 1], [54, 56, 0.8], [55, 56.2, 0.6]] as const) markAt(k, 'debris', x, y, w, 0.3);
  markAt(k, 'arrows', 55.2, 55.4, 0.8, 0.5), markAt(k, 'drag', 52.6, 56.2, 1.6, 0.4);
  claim(k, SICKLES.x, SICKLES.y, 0.6);
}

/** The pocket: a wade west to an alder hummock, a chest under its roots. A dead end. */
function pocket(k: Kit): void {
  for (let x = 35.4; x < 42.6; x += 1.2) claim(k, x, 56.2, 0.9);
  patch(k, 'grass', POCKET.x - 3, POCKET.y - 2.2, 6, 4.4), markAt(k, 'weeds', POCKET.x + 1.4, POCKET.y + 1, 1.2, 0.6);
  k.chests.push({ x: POCKET.x - 0.6 + k.rng.range(-0.2, 0.2), y: POCKET.y + k.rng.range(-0.2, 0.2) }), claim(k, POCKET.x - 0.6, POCKET.y, 0.9);
  put(k, 'tree', POCKET.x - 1.6, POCKET.y - 1.4, 0.7, 0, 0), put(k, 'bush', POCKET.x + 1.6, POCKET.y - 1.2, 0.4, 0, 0);
}

/** The smoke from the holm, seen over the water from the bottom's head (and the last cut's mud beyond the sluice). */
function ahead(k: Kit): void {
  patch(k, 'mud', 45, 0, 6, 6.6, false), markAt(k, 'puddle', 47, 3.4, 1.4, 0.6), markAt(k, 'ruts', 48.6, 1.6, 1.4, 2);
  put(k, 'support', SLUICE2.x - 0.9, SLUICE2.y + 0.8, 0.26, 2, 0), put(k, 'support', SLUICE2.x + SLUICE2.w + 0.9, SLUICE2.y + 0.8, 0.26, 2, 0);
}

export function layDrove(k: Kit): void {
  bottom(k), causeway(k), sickles(k), pocket(k), ahead(k);
}
