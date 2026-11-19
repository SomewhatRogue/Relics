/**
 * THE HEADLAND, the gleaners' camp at the foot of the field (shared/lowfurrowfields.ts).
 *
 *   They had camped by the foot hedge, three handcarts and a fire, and were gleaning the stubble when the
 *   hungry came down out of the rye. Tools lie where they were dropped, the dinner is still on the cloth, the
 *   far cart has been turned out, and a trodden way goes up to the field gate where they were roped and led.
 *   Two are squabbling over the dinner; three and a brute are going through the far cart.
 *
 * The near cart is left with clear ground behind and beside it (someone hides behind it later: FIELDS_SPOTS.giver).
 */
import { block, claim, mark, patch, prop, round, type Kit } from './expedkit.js';
import { cast } from './encounter.js';
import { grove, marks, maybe, put, type FieldsLand } from './lowfurrowfieldskit.js';

/** The three handcarts (fixed): the near one, the one by the fire, the far one being turned out. */
export const CARTS = { near: { x: 36.8, y: 91.4 }, fire: { x: 54.8, y: 97.6 }, far: { x: 69, y: 87.4 } };
/** (Crouched behind the near cart, half hidden by its bed: stood in front of it she read as a man waiting by a cart.) */
export const GIVER = { x: 37.6, y: 90.9 };

export function headland(k: Kit, land: FieldsLand): void {
  const { near, fire, far } = CARTS, j = () => k.rng.range(-0.25, 0.25);
  for (const c of [near, fire, far]) block(k, 'cart', c.x, c.y, 2.4, 1.2);
  // Under and beside the near cart, kept clear.
  claim(k, GIVER.x, GIVER.y, 1.4), claim(k, near.x - 1, near.y + 0.6, 1);
  round(k, 'sacks', near.x - 0.7, near.y - 0.2, 0.34), round(k, 'hay', near.x + 3, near.y - 0.4, 0.42);
  marks(k, 'straw', near.x + 1.2, near.y - 1.2, 3, 1.6, 0.8, 1.6, 0.7);
  // Their fire and the dinner on its cloth, fought over: the basket, the crocks, bread trodden in.
  round(k, 'cookfire', 52.8, 96.6, 0.45), round(k, 'smoke', 52.8, 96.2, 0.15);
  round(k, 'woodpile', 54.6, 95.2, 0.42), round(k, 'sacks', 48.8, 96.8 + j(), 0.34), round(k, 'pots', 51.4, 97.2, 0.26);
  round(k, 'barrels', fire.x + 2.6, fire.y + 1.6, 0.36);
  for (const [x, y] of [[58, 96.4], [58.6, 97.8], [57.6, 99.2]]) round(k, 'hay', x + j(), y + j(), 0.42);
  mark(k, 'straw', 48.4, 95, 3.4, 1.5);
  marks(k, 'debris', 50, 95.6, 5, 1.8, 1, 0.8, 0.45);
  marks(k, 'trample', 50.2, 95, 4, 2.2, 1.4, 2, 1.1);
  patch(k, 'ash', 52, 96, 1.6, 1.2);
  // Two squabbling over it (they haven't seen you).
  put(k, land, 49.2, 94, 101, { feeding: true });
  put(k, land, 51.4, 94.6, 101, { feeding: true });
  // The far cart, turned out: crates, a cask and sacks split open, straw everywhere, a little blood where someone fought.
  round(k, 'crates', far.x + 2.9, far.y - 0.6, 0.42), round(k, 'barrels', far.x - 1.2, far.y - 0.4, 0.36);
  round(k, 'sacks', far.x + 3.6, far.y + 1.8, 0.34), round(k, 'sacks', far.x + 1.2, far.y + 2.7, 0.3);
  marks(k, 'straw', far.x + 1.4, far.y + 1, 5, 2.6, 1.8, 1.6, 0.8);
  marks(k, 'debris', far.x + 1.6, far.y + 1.4, 6, 2.4, 1.6, 0.8, 0.5);
  mark(k, 'blood', far.x + 1, far.y + 2.1, 0.9, 0.4);
  // Three and a brute at it: the brute ripping at the cart, one at its wheel, one at the spilled sacks, one making off with a sack.
  const c = { x: far.x + 1.2, y: far.y + 0.6 };
  cast(put(k, land, c.x + 0.2, far.y - 1.4, 102, { task: { k: 'busy', x: c.x, y: c.y, what: 'winch' } }), 'heavy');
  put(k, land, far.x - 0.9, far.y + 2.2, 102, { task: { k: 'busy', x: c.x, y: c.y, what: 'winch' } });
  put(k, land, far.x + 4.6, far.y + 0.4, 102, { feeding: true });
  put(k, land, far.x - 2.8, far.y + 3.8, 102, { task: { k: 'haul', to: [56, 83] }, haul: { x: far.x - 2.2, y: far.y + 4.4, sack: true } });
  // Where they'd been working: tools dropped in the stubble, sickles (debris), a rake (a stave), sheaves half bound.
  for (const [x, y] of [[29, 85.4], [43.2, 87.6], [61.6, 90.4]]) prop(k, 'stave', x + j() * 4, y + j() * 2);
  for (const [x, y] of [[24, 84], [32, 88.6], [42, 84.4], [60, 86], [76, 92]]) marks(k, 'debris', x, y, 2, 1.4, 0.8, 0.7, 0.35);
  for (const [x, y] of [[20, 86], [26, 90], [63, 84], [78, 88]]) round(k, 'hay', x + j() * 3, y + j() * 2, 0.36);
  // Where they were seized and walked up to the gate: trodden, dragged.
  marks(k, 'trample', 47, 86, 9, 5, 4, 2.4, 1.2);
  marks(k, 'trample', 48.6, 82.4, 4, 1.4, 1.6, 2.2, 1.2), marks(k, 'trample', 40, 89.6, 3, 2.6, 1, 2, 1);
  mark(k, 'drag', far.x - 5.6, far.y + 3.4, 4.6, 0.4);
  // What they'd gleaned, bound in little sheaves by the carts; their water by the fire.
  for (const [x, y] of [[33.6, 90.2], [34.4, 89.2], [41.4, 92.8], [66.2, 86], [72.8, 85.8]]) maybe(k, 'hay', x + j(), y + j(), 0.34, 0.6);
  round(k, 'washtub', 55.6, 94.6, 0.34);
  // The hawthorns, a big field tree over the camp, brambles at the hedge foot, flowers and weeds along both hedges.
  round(k, 'tree', 30.4, 98.2, 0.95), patch(k, 'shade', 27.6, 96, 6, 4.4);
  for (const [x, y] of [[22.6, 96.4], [79.4, 99.6], [64.4, 82.2]]) round(k, 'tree', x, y, 0.58);
  for (const [x, y, n] of [[16, 101.8, 5], [62, 102.2, 4], [74, 81.4, 4], [27, 81.2, 3], [82, 92, 4], [14, 90, 3]]) grove(k, x, y, n, 1.6, ['bush'], [0.34, 0.46], 1.2);
  for (const [x, y] of [[20, 102.4], [36, 102.6], [58, 102.4], [70, 102.6], [22, 80.8], [38, 80.8], [60, 80.8], [80, 80.9]]) marks(k, k.rng.next() < 0.5 ? 'flowers' : 'weeds', x, y, 2, 3, 0.4, 1.8, 0.5);
  for (const [x, y] of [[16, 86], [80, 96], [34, 101]]) maybe(k, 'stump', x + j() * 4, y + j() * 2, 0.3);
}
