/**
 * THE YARD's goblins (shared/tollanyard.ts), each pack busy at something when you come up to it, made of the
 * board's roles (shared/encounters.ts, cast by shared/encounter.ts) for one level 3 hero:
 *
 * - 320, on the yard wall's lip either side of the flight: two archers covering the close (keepers).
 * - 321, down in the close: two at the hay cart, eating out of its sacks (not keepers).
 * - 322, the close: a patrol of two along the foot of the wall, a lunger with them (not keepers).
 * - 323, across the yard: three carrying the house's goods from the farmhouse to the barn's doors (keepers).
 * - 324, at the farmhouse door: two, one eating what came out of the kitchen (keepers).
 * - 325, by the well: a brute and one drinking (keepers).
 * - 326, in the cart shed: one turning it over (keeper).
 * - (328 and 329, three at MAWL's larder and MAWL, are inside the barn: shared/tollanbarn.ts.)
 *
 * Fourteen, everyone on the level under it (`z`). The seed nudges
 * where each stands and which of the haulers carries the sack. Pure.
 */
import { claim, type Kit } from './expedkit.js';
import { DOORS, type YardLand } from './tollanyardland.js';
import { CART } from './tollanyardclose.js';
import { KITCHEN, WELL } from './tollanyardhouse.js';
import { put } from './tollanyardkit.js';

export function layPacks(k: Kit, land: YardLand): void {
  // 320: two archers on the lip, three tiles off each side of the flight's head.
  put(k, land, 41.6, 58.8, 320, 'archer', {}, 0.15), put(k, land, 54.4, 58.8, 320, 'archer', {}, 0.15);
  // 321: two at the cart's sacks.
  put(k, land, CART.x + 3.4, CART.y + 3.1, 321, 'fodder', { feeding: true }), put(k, land, CART.x - 0.6, CART.y + 3.4, 321, 'fodder', { feeding: true });
  // 322: along the wall's foot and back.
  const beat: [number, number][] = [[20, 64.6], [72, 64.6]];
  put(k, land, 30, 64.8, 322, 'lunger', { task: { k: 'patrol', pts: beat, i: 1 } }, 0.1);
  put(k, land, 28.4, 65.4, 322, 'fodder', { task: { k: 'patrol', pts: beat, i: 1 } }, 0.1);
  // 323: hauling from the house to the doors, strung out across the yard; the seed says who has the sack.
  const sack = k.rng.int(3), to = (dx: number): [number, number] => [DOORS.x + DOORS.w / 2 + dx, DOORS.y + DOORS.h + 1.6];
  ([[63.4, 33.2, -1], [57, 31.2, 0], [50, 30.4, 1]] as const).forEach(([x, y, dx], i) =>
    put(k, land, x, y, 323, 'fodder', { task: { k: 'haul', to: to(dx) }, ...(i === sack ? { haul: { x: x - 0.2, y: y + 1, sack: true } } : {}) }, 0));
  // 324: at the farmhouse door, one eating on the step.
  put(k, land, KITCHEN.x - 1.4, KITCHEN.y + 1.4, 324, 'fodder', { feeding: true }, 0.2), put(k, land, KITCHEN.x + 1.6, KITCHEN.y + 1.8, 324, 'fodder', {}, 0.2);
  // 325: the brute by the well, one drinking at the bucket.
  put(k, land, WELL.x + 1.8, WELL.y + 1.4, 325, 'heavy', {}, 0.2), put(k, land, WELL.x - 1.4, WELL.y - 1.4, 325, 'fodder', { feeding: true }, 0.2);
  // 326: one turning the cart shed over.
  put(k, land, 7.4, 37.6, 326, 'fodder', {}, 0.2);
}
