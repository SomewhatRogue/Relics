/**
 * THE HOME GROUND: the home orchard inside its walls (shared/tollanorchard.ts).
 *
 *   Kept by one family a long time: the trees in true rows, pruned, the cuttings stacked by the west wall, the
 *   cider barrels ready in the corner. They left it in one morning with the apples on. Now the hungry are shaking a
 *   tree bare into sacks, the hives along the east side are kicked over, and a trail of spilt apples runs from the
 *   tree to a pile of full sacks waiting by the door.
 */
import { block, claim, free, patch, round, type Kit, type P } from './expedkit.js';
import { clump, markAt, sprinkle } from './tollanorchardkit.js';
import { GATE, WALLS } from './tollanorchardland.js';

/** The tree being shaken bare (the handcart under it), the hives, the sacks by the door. */
export const SHAKE: P = { x: 20.6, y: 70.6 };
export const HIVES: P = { x: 82.6, y: 85.4 };
/** The mown ride across the orchard (y), which splits the rows into four blocks. */
export const RIDE = 76.9;
export const PILE: P = { x: 56.4, y: 60.4 };
/** The orchard's box, inside its walls. */
export const ORCHARD = { x0: WALLS.x0 + 0.6, y0: WALLS.north + 0.6, x1: WALLS.x1, y1: WALLS.south };

function shaken(k: Kit): void {
  round(k, 'apple', SHAKE.x, SHAKE.y, 0.72), claim(k, SHAKE.x, SHAKE.y + 1.6, 2.6);
  round(k, 'handcart', SHAKE.x + 1.6, SHAKE.y + 1.4, 0.5), round(k, 'sacks', SHAKE.x - 1.5, SHAKE.y + 1.5, 0.42), round(k, 'sacks', SHAKE.x - 2.1, SHAKE.y + 0.4, 0.38);
  // Windfalls everywhere under it, the grass flattened where they stood to shake it.
  for (let i = 0; i < 9; i++) markAt(k, 'debris', SHAKE.x + k.rng.range(-2.6, 2.6), SHAKE.y + k.rng.range(-0.6, 2.8), k.rng.range(0.5, 0.9), 0.4);
  patch(k, 'straw', SHAKE.x - 2.4, SHAKE.y + 0.2, 4.8, 3), markAt(k, 'weeds', SHAKE.x - 3.4, SHAKE.y + 3.4, 1.4, 0.6);
}

function hives(k: Kit): void {
  const H = HIVES;
  claim(k, H.x - 1, H.y + 0.6, 4.2);
  block(k, 'fence', H.x - 3.8, H.y - 2.4, 4.4, 0.32);
  // The bench they stood on, and the skeps along it: two still up, the rest kicked off into the grass.
  for (const [x, y, r] of [[H.x - 3.4, H.y - 1.4, 0.32], [H.x - 1.8, H.y - 1.5, 0.32], [H.x + 0.2, H.y + 0.4, 0.3], [H.x + 2.2, H.y - 0.2, 0.28], [H.x - 0.6, H.y + 1.8, 0.3]] as const) round(k, 'pots', x, y, r);
  for (const [x, y] of [[H.x + 0.8, H.y + 1.2], [H.x - 1.4, H.y + 0.6], [H.x + 2.6, H.y + 1.6], [H.x - 2.8, H.y + 0.2]] as const) markAt(k, 'straw', x, y, 1.4, 0.7), markAt(k, 'debris', x + 0.6, y + 0.3, 0.8, 0.4);
  round(k, 'crows', H.x + 3.6, H.y + 2.6, 0.02);
}

function pile(k: Kit): void {
  const P0 = PILE;
  claim(k, P0.x, P0.y + 1.6, 2.6);
  for (const [x, y, r] of [[P0.x, P0.y, 0.44], [P0.x + 0.9, P0.y - 0.4, 0.42], [P0.x + 1.6, P0.y + 0.4, 0.4], [P0.x + 0.6, P0.y + 0.6, 0.38]] as const) round(k, 'sacks', x, y, r);
  // The trail of spilt apples from the shaken tree, round the rows, to the pile.
  const trail: [number, number][] = [[22.6, 74.4], [26, 76.6], [31, 77.2], [36.4, 76.6], [41.6, 77.2], [46.4, 74], [47.4, 68.6], [49.6, 64.2], [53, 62]];
  trail.forEach(([x, y], i) => (markAt(k, 'debris', x, y, 0.8, 0.4), i % 2 ? markAt(k, 'straw', x + 0.5, y - 0.4, 1, 0.5) : 0));
}

/** The family's order: the prunings stacked by the west wall, the cider corner, the rows kept straight. */
function kept(k: Kit): void {
  round(k, 'woodpile', 8.6, 70, 0.55), round(k, 'woodpile', 8.4, 72.2, 0.5), round(k, 'chopblock', 10.2, 74, 0.3);
  round(k, 'barrels', 8.8, 59.6, 0.45), round(k, 'barrels', 10.4, 59.4, 0.45), round(k, 'crates', 12.2, 59.6, 0.5), round(k, 'washtub', 9.2, 61.6, 0.4);
  round(k, 'well', 86, 61, 0.55), round(k, 'washtub', 84.4, 61.8, 0.38);
  for (const [x, y] of [[8.6, 63], [12, 62.6], [85.6, 62.8]] as const) claim(k, x, y, 0.9);
}

/** Each block's trees: old and broad in the north-west, young and slight in the south-west, the rest in their prime. */
const AGE = (x: number, y: number): [number, number] => (y < RIDE ? (x < 48 ? [0.64, 0.75] : [0.52, 0.62]) : x < 48 ? [0.4, 0.46] : [0.5, 0.6]);

function rows(k: Kit): void {
  const O = ORCHARD;
  for (let row = 0, y = O.y0 + 2.4; y < O.y1 - 1.4; row++, y += 3.5) {
    if (Math.abs(y - RIDE) < 1) continue;
    // (Close in the row, the rows well apart: at 3.8 each way it was a grid of single trees, not rows.)
    for (let x = O.x0 + 2.4 + (row % 2) * 1.4, step = AGE(x, y)[0] > 0.6 ? 3.1 : 2.7; x < O.x1 - 1.6; x += step) {
      const [r0, r1] = AGE(x, y), px = x + k.rng.range(-0.22, 0.22), py = y + k.rng.range(-0.18, 0.18), r = k.rng.range(r0, r1);
      if (!free(k, px, py, r, 1.9)) continue;
      // One in a dozen gone (an old gap, grassed over); windfalls under most; shade under the old ones.
      if (k.rng.next() < 0.08) { markAt(k, 'weeds', px, py + 0.3, 1.6, 0.8); continue; }
      round(k, 'apple', px, py, r);
      patch(k, 'shade', px - 1.7 * r - 0.6, py - 0.9, 3.4 * r + 1.2, 2);
      if (k.rng.next() < 0.45) markAt(k, 'debris', px + k.rng.range(-0.6, 0.6), py + 1, 0.6, 0.35);
    }
  }
  // The ride, mown: a strip of shorter green with the cart's ruts along it.
  for (const x of [14, 30, 66, 80]) markAt(k, 'ruts', x, RIDE, 2.6, 1);
}

export function layOrchard(k: Kit): void {
  // The door's gathering ground stays clear of trees.
  claim(k, GATE.x + GATE.w / 2, GATE.y + 2.8, 3.2);
  k.roads.push([{ x: ORCHARD.x0, y: RIDE }, { x: ORCHARD.x1, y: RIDE }]);
  shaken(k), hives(k), pile(k), kept(k);
}

/** What the seed lays round the set pieces and the goblins: the rows themselves, crows, long grass. */
export function layRows(k: Kit): void {
  rows(k);
  clump(k, ['crows'], 34, 82, 1, 1, [0.02, 0.02], 0), clump(k, ['crows'], 62, 70, 1, 1, [0.02, 0.02], 0);
  // Nettles along the walls' feet, long grass where the scythe hasn't been this month.
  for (let y = ORCHARD.y0 + 1; y < ORCHARD.y1 - 1; y += 4.2) markAt(k, 'weeds', ORCHARD.x0 + 0.5, y, 0.9, 1.6), markAt(k, 'weeds', ORCHARD.x1 - 0.5, y + 2, 0.9, 1.6);
  sprinkle(k, 'weeds', 14, ORCHARD.x0, ORCHARD.y0, ORCHARD.x1, ORCHARD.y1, 1.6, 0.8);
}
