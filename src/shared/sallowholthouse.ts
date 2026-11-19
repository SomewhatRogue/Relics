/**
 * THE SLUICE HOUSE: the main bank (shared/sallowholt.ts).
 *
 *   The bank that once kept the carr dry, stone-faced where the water pressed hardest. On it the hut that housed the
 *   great sluice's gear, and the sluice's frame in the bank beside it, its leaf rusted shut. Nobody's: no name, no
 *   sign. The hungry have built their biggest den against its west wall, and heaped their oil against the rest to
 *   the eaves: kegs hauled along the bank road from a cart that stuck. Below, the old towpath along the face, with
 *   what they dropped on it.
 */
import { block, claim, patch, prop, round, type Kit } from './expedkit.js';
import { across, clump, markAt, sprinkle } from './sallowholtkit.js';
import { FACE, HOLT, OUT } from './sallowholtland.js';
import { wooden } from './sitekit.js';
import { layRoad, road } from './terrkit.js';

/** The sluice house, the den against its west wall, its door, and the oil heaped on its east side. */
export const HUT = { x: 64, y: 16, w: 6, h: 4.4 };
export const DEN = { x: HUT.x - 3.4, y: HUT.y + 2.4, w: 3.4, h: 2 };
export const DOOR = { x: HUT.x + 3, y: HUT.y + HUT.h + 1.2 };
export const HOARD = { x: HUT.x + HUT.w + 1.4, y: HUT.y + 2.6 };
/** The great sluice's frame in the bank, east of the hut; the cart the kegs came on, stuck on the bank road. */
export const SLUICE = { x: 77, y: 26.6, w: 6 };
export const CART = { x: 23, y: 12.4, w: 2.6, h: 1.2 };

/** The hut, the den built against it, the kegs stacked to the eaves. */
function hut(k: Kit): void {
  k.blocks.push({ kind: 'house', ...HUT }), claim(k, HUT.x + HUT.w / 2, HUT.y + HUT.h / 2, 4);
  k.blocks.push(wooden({ kind: 'den', ...DEN })), claim(k, DEN.x + DEN.w / 2, DEN.y + DEN.h / 2, 2.4);
  claim(k, DOOR.x, DOOR.y, 1.4);
  // The hoard: kegs up the east wall and along the front, barrels behind them, the den's own keg by its door.
  for (const [x, y] of [[HUT.x + HUT.w + 0.7, HUT.y + 0.7], [HUT.x + HUT.w + 0.7, HUT.y + 2.1], [HUT.x + HUT.w + 0.7, HUT.y + 3.5], [HUT.x + HUT.w - 0.8, HUT.y + HUT.h + 0.8], [HUT.x + HUT.w + 0.8, HUT.y + HUT.h + 1.2], [DEN.x + DEN.w - 0.4, DEN.y + DEN.h + 1]] as const) {
    prop(k, 'oil', x, y);
  }
  for (const [x, y] of [[HUT.x + HUT.w + 2.1, HUT.y + 1.6], [HUT.x + HUT.w + 2.1, HUT.y + 4.4], [HUT.x + HUT.w + 2.4, HUT.y + 6.6]] as const) round(k, 'barrels', x, y, 0.45);
  markAt(k, 'scorch', HOARD.x, HUT.y + HUT.h + 1.4, 3, 1), patch(k, 'mud', HUT.x - 4, HUT.y + HUT.h - 0.6, HUT.w + 9, 3.4);
  // The den's makings: withies and hurdles stacked by it, bones at its mouth.
  round(k, 'woodpile', DEN.x - 1, DEN.y - 0.8, 0.5), across(k, 'hurdle', DEN.y - 2, DEN.x - 1.6, DEN.x + 2.8, 0.45, 2.2);
  markAt(k, 'debris', DEN.x + 1.2, DEN.y + DEN.h + 0.6, 1.6, 0.6), markAt(k, 'straw', DEN.x + 1.6, DEN.y + DEN.h + 1.4, 2.4, 1);
  round(k, 'smoke', DEN.x + 1, DEN.y - 0.6, 0.3);
}

/** The great sluice in the bank: its two posts, the leaf rusted down between them, the winding gear; the water
 *  seeping under it into the towpath below. */
function sluice(k: Kit): void {
  const S = SLUICE;
  round(k, 'post', S.x, S.y, 0.34), round(k, 'post', S.x + S.w, S.y, 0.34), round(k, 'post', S.x + S.w / 2, S.y - 1.6, 0.26);
  k.blocks.push({ kind: 'fence', x: S.x + 0.4, y: S.y - 0.3, w: S.w - 0.8, h: 0.6 });
  patch(k, 'flags', S.x - 1, S.y - 3, S.w + 2, 3.6), round(k, 'support', S.x + 1.2, S.y - 2.2, 0.3), round(k, 'support', S.x + S.w - 1.2, S.y - 2.2, 0.3);
  // The seep below: a shallow pool at the face's foot, an oval in bands half a tile deep.
  const P = { x: S.x - 0.4, y: FACE + 0.6, w: S.w + 0.8, h: 3.4 };
  for (let i = 0, n = Math.round(P.h / 0.5); i < n; i++) {
    const dy = ((i + 0.5) / n) * 2 - 1, half = (P.w / 2) * Math.sqrt(1 - dy * dy * 0.94);
    k.water.push({ x: P.x + P.w / 2 - half, y: P.y + (i * P.h) / n, w: half * 2, h: P.h / n });
  }
  clump(k, ['reed'], S.x + S.w + 0.8, FACE + 3.2, 3, 0.8, [0.24, 0.3], 0);
}

/** The bank road from the flight to the way out, the cart stuck on it, the kegs it still holds. */
function bankRoad(k: Kit): void {
  layRoad(k, road(k, [{ x: 45, y: 28.6 }, { x: 44, y: 23 }, { x: 31, y: 17 }, { x: 16, y: 9.6 }, { x: 7, y: 4 }, { x: 7, y: 0.2 }], [0, 0.7, 0.8, 0.6, 0]), 0.9);
  layRoad(k, road(k, [{ x: 44, y: 23 }, { x: 56, y: 22.4 }, { x: DOOR.x, y: DOOR.y + 0.4 }], [0.5, 0.2]), 0.7);
  block(k, 'cart', CART.x, CART.y, CART.w, CART.h);
  prop(k, 'oil', CART.x + 3.6, CART.y + 0.6), round(k, 'barrels', CART.x - 0.9, CART.y - 0.4, 0.42);
  markAt(k, 'ruts', CART.x + 1.3, CART.y + 1.8, 3.4, 0.8), markAt(k, 'mud', CART.x + 1.4, CART.y + 1.4, 4, 1.6);
  for (const [x, y] of [[32, 17.6], [40, 21], [52, 22.6]] as const) markAt(k, 'drag', x - 1.5, y, 3, 0.4);
  // At the flight's head, what was handed up from the boards and not yet carried on: cover on the bank for both sides.
  for (const [x, y, kind] of [[39.6, 25.4, 'woodpile'], [50.6, 25.2, 'barrels'], [36.6, 23, 'crates'], [53.4, 26.4, 'sacks'], [48.8, 21.6, 'barrels']] as const) round(k, kind, x, y, 0.45);
  markAt(k, 'straw', 38.4, 26.6, 2.4, 1), markAt(k, 'debris', 51.6, 24, 1.4, 0.6);
}

/** The bank's top: grass, old pollards and scrub along its back so nothing shows past it, bits along the lip. */
function top(k: Kit): void {
  for (let x = 0.6; x < HOLT.w; x += 1.1) {
    if (x > OUT.x - 0.6 && x < OUT.x + OUT.w + 0.6) continue;
    round(k, 'bush', x, 0.6 + k.rng.range(0, 0.4), 0.42);
    if (k.rng.next() < 0.4) round(k, k.rng.pick(['tree', 'tree', 'deadtree']), x + 0.3, 2.4 + k.rng.range(0, 1.2), k.rng.range(0.8, 1.1));
  }
  for (const [x, y] of [[12, 18], [20, 23], [33, 8], [52, 9], [86, 12], [90, 20], [80, 6], [27, 26]] as const) clump(k, ['tree', 'bush', 'bush'], x, y, 3, 1.6, [0.5, 0.95]);
  for (const [x, y] of [[8, 27.6], [26, 28], [58, 28], [70, 28.2], [92, 27.8]] as const) clump(k, ['rock', 'bush'], x, y, 2, 1, [0.3, 0.45]);
  sprinkle(k, 'weeds', 18, 2, 6, 94, 29, 1.6, 0.7), sprinkle(k, 'straw', 6, 56, 18, 76, 26, 1.4, 0.7);
  // Stacked withies and hurdles for the next den, on the bank west of the road.
  across(k, 'hurdle', 14, 35, 41.6, 0.45, 2.2), across(k, 'hurdle', 15, 35.4, 42, 0.45, 2.2), round(k, 'woodpile', 38, 17.4, 0.5);
}

/** The towpath at the face's foot: kegs dropped where they were handed up, mooring posts, reeds at the water. */
function towpath(k: Kit): void {
  patch(k, 'earth', 2, FACE + 0.4, 92, 6.6), patch(k, 'mud', 38, FACE + 1, 16, 6.4);
  for (const [x, y, kind] of [[36.4, 34.4, 'barrels'], [53.8, 34.2, 'barrels'], [28, 33.2, 'crates'], [63, 34.6, 'crates'], [16, 33.6, 'woodpile'], [72, 33.2, 'barrels']] as const) round(k, kind, x, y, 0.45);
  for (const x of [10, 22, 58, 68, 92]) round(k, 'post', x, 36.8, 0.2);
  markAt(k, 'debris', 41, 33, 1.6, 0.6), markAt(k, 'drag', 45.2, 30.6, 0.4, 6);
  sprinkle(k, 'weeds', 14, 3, FACE + 0.5, 93, 37, 1.4, 0.6), sprinkle(k, 'puddle', 6, 3, 33, 93, 37, 1.4, 0.6);
}

export function layBank(k: Kit): void {
  patch(k, 'grass', -1, -1, HOLT.w + 2, FACE + 1, false), patch(k, 'earth', 30, 12, 46, 14), patch(k, 'mud', 40, 22, 12, 6);
  hut(k), sluice(k), bankRoad(k), top(k), towpath(k);
}
