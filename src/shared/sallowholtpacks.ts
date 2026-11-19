/**
 * THE WILLOW HOLT's goblins and spiders (shared/sallowholt.ts), each busy at something when you come up to it, made
 * of the board's roles (shared/encounters.ts, cast by shared/encounter.ts) for one level 4 hero:
 *
 * - 420, on the camp's hummock: two eating at their fire, a shield where the boards come ashore, an archer on the
 *   hummock's far side shooting across the water at the boards (keepers: the gate waits on them).
 * - Spiders at the bend's hummock, three on the boards; a nest and its brood mother in the web pocket over the chest.
 * - 421, on the bank's lip either side of the flight: two archers covering the boards and the towpath.
 * - 422, at the den: a brute at its mouth, a netter, one squatting at the hut's door.
 * - 423, along the bank road: three hauling kegs from the stuck cart to the hoard (the seed says who has one).
 * - 424, at the head of the east steps: a lunger watching the towpath.
 *
 * Thirteen goblins, everyone on the level under it (`z`). The seed nudges where each stands. Pure.
 */
import { claim, type Kit } from './expedkit.js';
import { CART, DEN, DOOR, HOARD } from './sallowholthouse.js';
import { put } from './sallowholtkit.js';
import { BEND, FACE, FLIGHT, POCKET, STEPS, type HoltLand } from './sallowholtland.js';
import { FIRE, WEB_CHEST } from './sallowholtholt.js';

/** The camp's hummock: four, the archer across the water from the boards. */
function camp(k: Kit, land: HoltLand): void {
  put(k, land, FIRE.x + 1.2, FIRE.y - 0.9, 420, 'fodder', { feeding: true }, 0.2), put(k, land, FIRE.x - 1.1, FIRE.y + 1, 420, 'fodder', { feeding: true }, 0.2);
  put(k, land, 38.4, 69.6, 420, 'shield', {}, 0.2), put(k, land, 29.4, 64, 420, 'archer', {}, 0.15);
}

/** The spiders: three at the bend, the nest and the brood mother over the web pocket's chest. */
function spiders(k: Kit): void {
  for (const [x, y] of [[BEND.x - 0.6, BEND.y - 0.6], [BEND.x + 1.2, BEND.y + 0.8], [53, 54.6]] as const) {
    k.foes.push({ kind: 'spider', x: x + k.rng.range(-0.2, 0.2), y: y + k.rng.range(-0.2, 0.2) }), claim(k, x, y, 0.6);
  }
  const nest = { x: POCKET.x - 0.6, y: POCKET.y + 0.6 };
  k.foes.push({ kind: 'nest', x: nest.x, y: nest.y, wave: 3 }), claim(k, nest.x, nest.y, 1.2);
  k.foes.push({ kind: 'brood', x: WEB_CHEST.x - 1.4, y: WEB_CHEST.y + 1.2, feeding: true }), claim(k, WEB_CHEST.x - 1.4, WEB_CHEST.y + 1.2, 0.8);
}

/** The bank: the elite pack, nine. */
function bank(k: Kit, land: HoltLand): void {
  // 421: two archers on the lip, three tiles off each side of the flight's head.
  put(k, land, FLIGHT.x - 2.4, FACE - 1.2, 421, 'archer', {}, 0.15), put(k, land, FLIGHT.x + FLIGHT.w + 2.4, FACE - 1.2, 421, 'archer', {}, 0.15);
  // 422: the brute at the den's mouth, the netter by it, one at the hut's door.
  put(k, land, DEN.x + 1.7, DEN.y + DEN.h + 2, 422, 'heavy', {}, 0.2), put(k, land, DEN.x - 1.6, DEN.y + DEN.h + 1.2, 422, 'netter', {}, 0.2);
  put(k, land, DOOR.x - 1.2, DOOR.y + 0.8, 422, 'fodder', { feeding: true }, 0.2);
  // 423: hauling kegs from the cart to the hoard, strung out along the bank road.
  const keg = k.rng.int(3), to: [number, number] = [HOARD.x - 1, HOARD.y + 5];
  ([[CART.x + 5, CART.y + 2.4], [36, 19.8], [50.4, 23.6]] as const).forEach(([x, y], i) =>
    put(k, land, x, y, 423, 'fodder', { task: { k: 'haul', to }, ...(i === keg ? { haul: { x: x - 0.2, y: y + 1, sack: true } } : {}) }, 0));
  // 424: the lunger at the head of the east steps.
  put(k, land, STEPS.x + STEPS.w / 2, STEPS.y - 1.4, 424, 'lunger', {}, 0.2);
}

export function layPacks(k: Kit, land: HoltLand): void {
  camp(k, land), spiders(k), bank(k, land);
}
