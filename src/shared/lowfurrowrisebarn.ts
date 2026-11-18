/**
 * THE RISE: the east shoulder, the great barn in its yard (shared/lowfurrowrise.ts).
 *
 *   Somebody's old trouble, not today's: the Doorkeepers took the barn's doors off long ago and dragged carts across
 *   the doorway, and it has stood shut in on itself since. Weeds through the cart wheels, the doors lying where they
 *   were thrown, the yard wall tumbled in one place, the dung heap gone to grass. Nothing here to fight now.
 */
import { block, claim, patch, round, type Kit, type P } from './expedkit.js';
import { clump, markAt, sprinkle } from './lowfurrowrisekit.js';

/** The barn, the carts across its doorway, and the yard by them (a mini quest wakes three there later). */
export const BARN = { x: 62, y: 64, w: 10, h: 7 };
export const CARTS = [{ x: 62.4, y: 71.2, w: 2.4, h: 1.1 }, { x: 65.1, y: 71.6, w: 2.6, h: 1.1 }, { x: 68.3, y: 71.3, w: 2.4, h: 1.1 }];
export const BARN_GROUND: P & { r: number } = { x: 66, y: 76, r: 5 };
/** The yard wall's box; its gap is on the west side, toward the lane's sheep track. */
const Y = { x0: 56.4, y0: 60.4, x1: 80.6, y1: 81.6, gap: [72, 77] };

function yardWall(k: Kit): void {
  const t = 0.6;
  const across = (y: number, x0: number, x1: number) => { for (let x = x0; x < x1 - 0.01; x += 3) block(k, 'rockwall', x, y, Math.min(3, x1 - x), t); };
  const down = (x: number, y0: number, y1: number) => { for (let y = y0; y < y1 - 0.01; y += 3) block(k, 'rockwall', x, y, t, Math.min(3, y1 - y)); };
  across(Y.y0, Y.x0, Y.x1);
  // The south wall tumbled in one place.
  across(Y.y1 - t, Y.x0, 69.4), block(k, 'rubble', 69.4, Y.y1 - t, 3.2, t), across(Y.y1 - t, 72.6, Y.x1);
  down(Y.x1 - t, Y.y0 + t, Y.y1 - t);
  // The west wall, open where the cart track came in.
  down(Y.x0, Y.y0 + t, Y.gap[0]), down(Y.x0, Y.gap[1], Y.y1 - t);
}

export function layBarn(k: Kit): void {
  patch(k, 'earth', Y.x0 + 0.4, Y.y0 + 0.4, Y.x1 - Y.x0 - 0.8, Y.y1 - Y.y0 - 0.8);
  patch(k, 'straw', 58, 62, 6, 5), patch(k, 'mud', 55, 72, 6, 5), patch(k, 'straw', 73, 64, 6, 6);
  block(k, 'barn', BARN.x, BARN.y, BARN.w, BARN.h, { door: undefined });
  for (const c of CARTS) block(k, 'cart', c.x, c.y, c.w, c.h);
  // Nothing set down on the yard by the carts.
  claim(k, BARN_GROUND.x, BARN_GROUND.y, BARN_GROUND.r - 0.6);
  yardWall(k);
  // The doors, lying where they were thrown; weeds through the cart wheels; the old cart track in through the gap.
  markAt(k, 'planks', 62.4, 75.2, 2.8, 1.3), markAt(k, 'planks', 71.6, 76.4, 1.3, 2.8);
  for (const c of CARTS) markAt(k, 'weeds', c.x + c.w / 2, c.y + c.h + 0.3, c.w + 0.6, 0.9);
  for (const [x, y] of [[50, 75.6], [53.4, 75], [57.2, 74.6], [60.6, 73.8]] as const) markAt(k, 'ruts', x, y, 2.6, 1.2), markAt(k, 'weeds', x + 0.6, y - 0.2, 1.4, 0.8);
  markAt(k, 'debris', 66.6, 73.4, 1.6, 0.6), markAt(k, 'straw', 64, 78, 2.2, 1.2), markAt(k, 'straw', 69, 79.4, 1.8, 0.9);
  // Along the barn's walls the weeds stand high: nobody has walked here in years.
  for (let x = BARN.x - 0.4; x < BARN.x + BARN.w; x += 1.8) markAt(k, 'weeds', x + 0.6, BARN.y - 0.4, 1.6, 0.8);
  for (let y = BARN.y; y < BARN.y + BARN.h; y += 1.8) markAt(k, 'weeds', BARN.x - 0.5, y + 0.6, 0.9, 1.5), markAt(k, 'weeds', BARN.x + BARN.w + 0.5, y + 0.6, 0.9, 1.5);
  // The yard's things: its well, the dung heap gone to grass (crows on it), a woodpile, old hay, barrels and crates.
  round(k, 'well', 59.4, 63.6, 0.55);
  patch(k, 'straw', 74.4, 65.6, 3.8, 2.6), markAt(k, 'mud', 76.2, 67, 2.6, 1.4), markAt(k, 'weeds', 76.6, 68.4, 2.6, 0.9), clump(k, ['crows'], 76.2, 66.8, 1, 0.5, [0.02, 0.02], 0);
  round(k, 'woodpile', 73.4, 69.2, 0.5), round(k, 'hay', 60.6, 66.8, 0.55), round(k, 'hay', 60.3, 68.9, 0.5);
  round(k, 'barrels', 78.6, 62.8, 0.45), round(k, 'crates', 78.8, 79.4, 0.5), round(k, 'handcart', 58.4, 79.6, 0.5);
  sprinkle(k, 'weeds', 8, Y.x0 + 1, Y.y0 + 1, Y.x1 - 1, Y.y1 - 1, 1.6, 0.9);
  // Outside the wall: elms toward the hedge, brambles, the long grass of the bank.
  for (const [x, y] of [[84.6, 63], [85.4, 71.6], [84, 79.4], [62, 84.2]] as const) clump(k, ['tree'], x, y, 1, 1, [0.9, 1.15], 1.6);
  for (const [x, y] of [[83, 67], [86.6, 76], [74, 84], [56, 84.6], [82.6, 84.4], [53.6, 59.6]] as const) clump(k, ['bush', 'bush', 'rock'], x, y, 3, 1.6, [0.34, 0.52]);
  sprinkle(k, 'weeds', 6, 48, 76, 88, 86, 1.3, 0.8);
  sprinkle(k, 'weeds', 6, 81, 60, 89, 86, 1.8, 1);
}
