/**
 * THE YARD: the home close under the yard's wall (shared/tollanyard.ts).
 *
 *   The last of the paddocks, and the farm's own ground: the rickyard with its stacks thatched for winter, the hay
 *   cart stood where it was being loaded, the troughs still full, the duck pond, a few old apples. Everything left
 *   mid-morning. The hungry have found the cart's sacks. Above it all the yard's wall, and bows on its lip: the
 *   stooks, the stacks and the cart are what you cross the close behind.
 */
import { block, claim, patch, round, type Kit } from './expedkit.js';
import { across, clump, markAt, sprinkle } from './tollanyardkit.js';
import { layRoad, road } from './terrkit.js';
import { FLIGHT } from './tollanyardland.js';

/** The hay cart the hungry are into, and the troughs by the pond. */
export const CART = { x: 35.6, y: 71, w: 2.6, h: 1.2 };
export const POND = { x: 66, y: 81, w: 8, h: 4.6 };

/** The paddock's hurdles along the foot of the close, the road's gate standing open in them. */
function paddock(k: Kit): void {
  across(k, 'hurdle', 94.6, 6, 44.4, 0.45, 2.2), across(k, 'hurdle', 94.6, 51.6, 90.4, 0.45, 2.2);
  // The gate leaf swung back against the hurdles; mud in the gateway; a trough in the paddock behind.
  block(k, 'hurdle', 51.8, 93.6, 2.2, 0.45), patch(k, 'mud', 43, 95, 10, 3.4);
  round(k, 'washtub', 28.4, 98.6, 0.5), markAt(k, 'puddle', 28.4, 99.8, 1.8, 0.8), markAt(k, 'mud', 27.6, 99.4, 2.6, 1.2);
  sprinkle(k, 'weeds', 6, 8, 96, 88, 102.6, 1.4, 0.8);
  for (const [x, y] of [[14, 99], [72, 99.4], [84, 97.6]] as const) clump(k, ['bush', 'rock'], x, y, 2, 1.2, [0.34, 0.5]);
}

/** The rickyard: three stacks thatched for the winter, straw round their feet, a ladder's worth of loose hay. */
function rickyard(k: Kit): void {
  patch(k, 'straw', 8, 64, 20, 16);
  block(k, 'haystack', 9.4, 65.6, 5, 3.4), block(k, 'haystack', 17.2, 67.8, 5, 3.4), block(k, 'haystack', 9.8, 73.4, 5, 3.4);
  for (const [x, y] of [[16, 74], [22.6, 73.2], [14.6, 79.2], [24, 66.4]] as const) markAt(k, 'straw', x, y, 2.4, 1.2);
  round(k, 'hay', 23.4, 76.8, 0.55), round(k, 'hay', 19.8, 79.4, 0.5);
}

/** The hay cart left half loaded across the old ruts, its sacks pulled down; stooks standing in the cut. */
function cart(k: Kit): void {
  block(k, 'cart', CART.x, CART.y, CART.w, CART.h);
  round(k, 'sacks', CART.x + 3.4, CART.y + 1.8, 0.42), round(k, 'sacks', CART.x - 0.8, CART.y + 2.4, 0.38);
  markAt(k, 'straw', CART.x + 1.3, CART.y + 2.2, 3.6, 1.3), markAt(k, 'debris', CART.x + 2.4, CART.y + 3, 1.4, 0.6);
  clump(k, ['crows'], CART.x + 3.6, CART.y + 2.8, 2, 0.6, [0.02, 0.02], 0);
  patch(k, 'furrow', 24, 80, 18, 12, true);
  for (const [x, y] of [[30, 80.4], [26, 86.6], [34.4, 88.4], [38.6, 82.4], [29.6, 66.6], [56.6, 86.4], [60.4, 71], [58.4, 67.6], [52.4, 75.8]] as const) {
    round(k, 'hay', x + k.rng.range(-0.3, 0.3), y + k.rng.range(-0.3, 0.3), 0.52);
  }
}

/** The troughs, the duck pond with its reeds, a few old apples down the east side, the path to the corner steps. */
function pond(k: Kit): void {
  const P = POND;
  patch(k, 'mud', P.x - 2, P.y - 1.6, P.w + 4, P.h + 3.2), patch(k, 'wet', P.x - 1, P.y - 0.8, P.w + 2, P.h + 1.6);
  // (An oval in bands half a tile deep inside the pond's box: one rect drew as a tank.)
  for (let i = 0, n = Math.round(P.h / 0.5); i < n; i++) {
    const dy = ((i + 0.5) / n) * 2 - 1, half = (P.w / 2) * Math.sqrt(1 - dy * dy * 0.94);
    k.water.push({ x: P.x + P.w / 2 - half, y: P.y + (i * P.h) / n, w: half * 2, h: P.h / n });
  }
  claim(k, P.x + P.w / 2, P.y + P.h / 2, 5.2);
  clump(k, ['reed'], P.x + 0.4, P.y + P.h + 0.6, 4, 1.2, [0.24, 0.3], 0), clump(k, ['reed'], P.x + P.w + 0.6, P.y + 1, 3, 1, [0.24, 0.3], 0);
  round(k, 'washtub', 55.4, 72.2, 0.5), round(k, 'washtub', 57.2, 72.9, 0.5);
  markAt(k, 'puddle', 56.4, 74, 2.6, 0.9), markAt(k, 'mud', 56.2, 73.6, 4.2, 1.8);
  for (const [x, y] of [[77.6, 71.6], [82.6, 74.8], [78, 79.6], [84.6, 87], [71.6, 91], [80.6, 92.4]] as const) round(k, 'apple', x + k.rng.range(-0.4, 0.4), y + k.rng.range(-0.4, 0.4), k.rng.range(0.85, 1.05));
  for (const [x, y] of [[74, 70], [84, 80], [76, 88]] as const) markAt(k, 'debris', x, y, 1.2, 0.5);
  layRoad(k, road(k, [{ x: 46, y: 82 }, { x: 64, y: 74 }, { x: 80, y: 67 }, { x: 87, y: 63 }, { x: 87, y: 59 }], [0.6, 0.6, 0.3, 0]), 0.55);
}

/** Along the foot of the yard's wall: woodpiles stacked against it, a dropped pot under the flight, weeds. */
function wallFoot(k: Kit): void {
  for (const x of [14, 27, 63, 74]) round(k, 'woodpile', x + k.rng.range(-0.6, 0.6), 62.2, 0.5);
  round(k, 'barrels', 36.4, 62.4, 0.45), round(k, 'crates', 58.8, 62.6, 0.5), round(k, 'chopblock', 30.4, 63.2, 0.3);
  markAt(k, 'debris', FLIGHT.x - 1.4, 63.4, 1.4, 0.6), markAt(k, 'mud', FLIGHT.x + 3, 64, 5, 1.6);
  sprinkle(k, 'weeds', 10, 8, 61, 88, 64, 1.8, 0.7);
}

export function layClose(k: Kit): void {
  paddock(k), rickyard(k), cart(k), pond(k), wallFoot(k);
  // Wheel ruts up the road, weeds and a little straw blown about the close.
  for (const [x, y] of [[46, 90], [44, 80], [46, 70]] as const) markAt(k, 'ruts', x, y, 1.6, 2.6);
  sprinkle(k, 'weeds', 12, 8, 64, 88, 93, 1.5, 0.8), sprinkle(k, 'straw', 5, 26, 64, 62, 92, 1.4, 0.8);
  for (const [x, y] of [[66, 64.6], [20, 88], [10, 86], [86, 66]] as const) clump(k, ['bush', 'bush', 'rock'], x, y, 3, 1.4, [0.34, 0.52]);
}
