/**
 * THE YARD: the yard on its terrace (shared/tollanyard.ts).
 *
 *   A yard kept by one family for a long time: the farmhouse with its door standing open, the woodpile squared
 *   against its wall, the washing still on the line, the cart shed, the well, the midden steaming by the barn, the
 *   kitchen garden behind its wall. Left in one morning. The hungry are carrying the house out across the yard to
 *   the barn a piece at a time, and dropping some of it. The yard gate at the top stands open, as it was left for
 *   the stock.
 */
import { block, claim, mark, patch, round, scatter, type Kit, type P } from './expedkit.js';
import { across, clump, down, markAt, sprinkle } from './tollanyardkit.js';

export const HOUSE = { x: 70, y: 27, w: 10, h: 6 };
/** The farmhouse door, the well, and where the farm dog keeps to the yard wall. */
export const KITCHEN: P = { x: 75, y: 33.9 };
export const WELL: P = { x: 30, y: 44 };
export const DOG_YARD: P = { x: 82, y: 57.4 };
const SHED = { x: 3.6, y: 30, w: 7.4, h: 5 };

/** The farmhouse and its things, each where it was kept; the door open, a trail of what came out of it. */
function house(k: Kit): void {
  block(k, 'house', HOUSE.x, HOUSE.y, HOUSE.w, HOUSE.h, { door: undefined });
  claim(k, KITCHEN.x, KITCHEN.y + 0.6, 1.6);
  round(k, 'woodpile', HOUSE.x - 0.9, HOUSE.y + 1.6, 0.5), round(k, 'chopblock', HOUSE.x - 1.6, HOUSE.y + 4.4, 0.3);
  round(k, 'pots', KITCHEN.x - 2.6, HOUSE.y + HOUSE.h + 0.6, 0.3), round(k, 'barrels', HOUSE.x + HOUSE.w + 0.7, HOUSE.y + 0.8, 0.42);
  round(k, 'washline', 85.4, 37.4, 0.4), round(k, 'washtub', 83.2, 39.6, 0.5), round(k, 'coop', 86.6, 30.4, 0.55);
  markAt(k, 'planks', KITCHEN.x + 0.2, KITCHEN.y + 1.2, 1.2, 1), markAt(k, 'straw', 84.6, 32, 2.4, 1.2);
  // What came out of the door, dragged and dropped along the way to the barn's doors.
  for (const [x, y] of [[71, 35.2], [64.6, 33.4], [57.6, 30.6], [50.4, 28.8], [43.6, 27.6]] as const) markAt(k, 'ruts', x, y, 3.4, 0.8);
  for (const [x, y] of [[68.6, 35.4], [60.4, 32.6], [46.4, 29.2]] as const) markAt(k, 'debris', x, y, 1.3, 0.6);
  round(k, 'crates', 66.4, 34.8, 0.45), round(k, 'pots', 55.6, 31.6, 0.3), round(k, 'sacks', 41.4, 29.4, 0.4);
}

/** The cart shed on the west side, the farm cart in it and the handcart by it; the well; the midden by the barn. */
function yard(k: Kit): void {
  block(k, 'shack', SHED.x, SHED.y, SHED.w, SHED.h);
  block(k, 'cart', SHED.x + 0.6, SHED.y + SHED.h + 1, 2.6, 1.2), round(k, 'handcart', SHED.x + 6.2, SHED.y + SHED.h + 1.6, 0.5);
  round(k, 'woodpile', SHED.x + SHED.w + 0.8, SHED.y + 1, 0.5), round(k, 'barrels', SHED.x + SHED.w + 0.7, SHED.y + 3.4, 0.42);
  patch(k, 'flags', WELL.x - 2, WELL.y - 1.6, 4, 3.2), round(k, 'well', WELL.x, WELL.y, 0.6), round(k, 'washtub', WELL.x + 1.4, WELL.y - 1.2, 0.42);
  markAt(k, 'puddle', WELL.x - 0.6, WELL.y + 1.4, 1.6, 0.6);
  // The midden: straw and muck heaped by the barn's east end, crows at it.
  patch(k, 'straw', 48, 27.6, 7, 4), patch(k, 'mud', 49, 28.4, 5, 2.4);
  markAt(k, 'mud', 51.4, 29.4, 2.6, 1.3), clump(k, ['crows'], 51.4, 29.2, 3, 1, [0.02, 0.02], 0);
  // On the lip of the yard's wall: a few things set by it, the dog's spot kept clear.
  claim(k, DOG_YARD.x, DOG_YARD.y, 1.2);
  for (const [x, y, kind] of [[12, 57, 'barrels'], [22.4, 57.6, 'crates'], [67, 57.2, 'barrels'], [76, 57.6, 'sacks']] as const) round(k, kind, x, y, 0.42);
  // Stooks and a hay rack by the shed; weeds where the yard's earth meets the wall; straw blown about.
  round(k, 'hay', 14.6, 33.6, 0.5), round(k, 'hay', 16.6, 40.6, 0.5), round(k, 'hay', 23.4, 52.4, 0.5);
  sprinkle(k, 'straw', 8, 6, 36, 90, 56, 1.4, 0.8), sprinkle(k, 'weeds', 6, 4, 54, 92, 57.6, 1.6, 0.7);
}

/** The yard gate at the top, left open for the stock (it leads nowhere you need: the way on is in at the barn's doors); the kitchen garden behind its wall; old trees behind the barn. */
function back(k: Kit): void {
  across(k, 'rockwall', 2.4, 58, 60, 0.6, 2), across(k, 'rockwall', 2.4, 64.4, 66.6, 0.6, 2.2);
  round(k, 'post', 60.3, 2.7, 0.22), round(k, 'post', 64.1, 2.7, 0.22), block(k, 'fence', 64.6, 3.4, 0.4, 2.6);
  markAt(k, 'mud', 62.2, 4.6, 3.6, 2), markAt(k, 'ruts', 62.2, 9, 1.4, 4);
  // The kitchen garden: walled, beds in rows, a scarecrow, apples along the wall; in by a gap round the house's east end.
  down(k, 'rockwall', 66, 3, 25.4, 0.6), across(k, 'rockwall', 25, 66.6, 86, 0.6, 3), across(k, 'rockwall', 25, 89, 95.6, 0.6, 3.3);
  patch(k, 'furrow', 69, 8, 12, 12, false), patch(k, 'crop', 83, 9, 10, 10, false), patch(k, 'earth', 67, 21, 28, 3.6, false);
  round(k, 'scarecrow', 80, 15, 0.4), round(k, 'washtub', 70, 22.4, 0.45), round(k, 'barrels', 93, 22.4, 0.42);
  for (const [x, y] of [[70, 4], [77.4, 4.6], [84.6, 3.8], [91.6, 5.4], [93, 13.6]] as const) round(k, 'apple', x, y, k.rng.range(0.85, 1.05));
  k.chests.push({ x: 90, y: 20.6 }), claim(k, 90, 20.6, 0.8);
  sprinkle(k, 'weeds', 5, 68, 6, 94, 20, 1.4, 0.7);
  // Behind the barn's west end: the old trees of the first orchard, nettles, a stack of hurdles.
  scatter(k, 7, ['apple', 'tree', 'bush'], 1.2, 1.2, 11, 22, [0.6, 0.95]);
  across(k, 'hurdle', 24.2, 2, 6.4, 0.45, 2.2), across(k, 'hurdle', 25, 2.4, 6.8, 0.45, 2.2);
  mark(k, 'weeds', 2, 14, 3, 1.2);
}

/** The rest of the steading round the yard: the granary on its staddles, the byre, the pig sties, the wagon, the old ash. */
function steading(k: Kit): void {
  block(k, 'granary', 16, 27, 5, 4), round(k, 'sacks', 21.8, 30.4, 0.38);
  patch(k, 'straw', 3, 51, 12, 4), block(k, 'shack', 4, 45, 8, 5.4), round(k, 'washtub', 13.4, 47, 0.5), round(k, 'hay', 13.6, 52.6, 0.5);
  patch(k, 'mud', 63, 44.6, 10, 6.4), block(k, 'pen', 64, 45.4, 3.2, 3), block(k, 'pen', 67.6, 45.4, 3.2, 3), across(k, 'hurdle', 49.4, 63.6, 71.4, 0.45, 2.6);
  round(k, 'washtub', 72.6, 47, 0.42), markAt(k, 'puddle', 66, 49, 2.4, 0.8);
  block(k, 'cart', 22.4, 38.4, 2.6, 1.2), round(k, 'woodpile', 26.6, 38.8, 0.5);
  patch(k, 'shade', 54.6, 47, 7, 6), round(k, 'tree', 58, 50, 1.3), round(k, 'chopblock', 56, 52.4, 0.3);
}

/** Things kept along the walls where they belong, a dung barrow at the midden, the yard's hens' straw. */
function kept(k: Kit): void {
  for (const [x, y] of [[26, 26.2], [46.6, 26], [55.4, 26.4], [68.4, 37.4], [81.6, 34.6], [12.4, 30.6], [3.6, 41.8], [16.6, 50.4], [73.6, 51.4], [87.6, 43]] as const) {
    clump(k, ['barrels', 'crates', 'sacks', 'woodpile', 'pots'], x, y, 2, 1, [0.36, 0.48]);
  }
  round(k, 'handcart', 54.2, 32.6, 0.5), round(k, 'washtub', 33.4, 45.6, 0.45), markAt(k, 'mud', 33, 46.6, 2.4, 1);
  sprinkle(k, 'straw', 10, 20, 26, 92, 56, 1.2, 0.7), sprinkle(k, 'weeds', 8, 2, 24.6, 94, 27, 1.4, 0.6), sprinkle(k, 'debris', 4, 40, 28, 70, 36, 1, 0.5);
}

export function layYard(k: Kit): void {
  house(k), yard(k), back(k), steading(k), kept(k);
  // The earth of the yard bare where feet and wheels go; old trees in the yard's corners.
  for (const [x, y] of [[90.6, 46], [91.6, 52.4], [4.4, 40.6], [80, 50.6]] as const) clump(k, ['tree', 'bush'], x, y, 2, 1, [0.6, 0.9]);
}
