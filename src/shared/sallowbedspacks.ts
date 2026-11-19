/**
 * THE OSIER BEDS' goblins (shared/sallowbeds.ts), each pack busy at something when you come up to it, made of the
 * board's roles (shared/encounters.ts, cast by shared/encounter.ts) for one level 4 hero:
 *
 * - 401, the pen: four weaving hurdles for it, inside and at its open side (keepers of the first sluice).
 * - 402, the cutting: one cropping the stools, two carrying bundles across the ditch to the stack (keepers).
 * - 403, the bank: a patrol of two along the ditch bank under the den (keepers).
 * - 404, the causeway: a patrol of two between its bend and the boards (not keepers).
 * - 405, the cookpot: a brute standing over two eating (keepers of the second sluice).
 * - 406, the den: an archer, a netter and one more in the den's yard (keepers).
 * - 407, the racks and the cage: one at the racks, one minding her (keepers).
 *
 * Nineteen in all, on flat ground. The seed picks which of the den's three holds the bow and which the net, and
 * nudges where each stands. Pure.
 */
import { claim, type Kit } from './expedkit.js';
import { cast } from './encounter.js';
import type { Role } from './encounters.js';
import type { Foe } from './terrain.js';
import { BANK, CUTTING, PEN, STACK } from './sallowbedsbeds.js';
import { CAGE, DEN2, POT, RACKS } from './sallowbedsholm.js';

export const BED_PACKS = [401, 402, 403], DROVE_PACKS = [404], HOLM_PACKS = [405, 406, 407];

/** One of `pack` as `role`, standing at (x, y) give or take the seed's nudge. */
function at(k: Kit, x: number, y: number, pack: number, role: Role, more: Partial<Foe> = {}, nudge = 0.25): Foe {
  const px = x + k.rng.range(-nudge, nudge), py = y + k.rng.range(-nudge, nudge);
  const f = Object.assign(cast({ kind: 'scrapper', x: px, y: py, pack }, role), more);
  delete f.z;
  k.foes.push(f), claim(k, px, py, 0.6);
  return f;
}

export function layPacks(k: Kit): void {
  // 401: at the pen, two inside working the rods in, two at the open side with the next bundle.
  for (const [x, y] of [[-1.6, 0.2], [0.6, -0.8], [2.2, 0.6], [1.4, 2.4]] as const) at(k, PEN.x + x, PEN.y + y, 401, 'fodder');
  // 402: one at the cutting; two carrying bundles along the trodden path to the stack.
  at(k, CUTTING.x + 1.2, CUTTING.y + 1.2, 402, 'fodder');
  at(k, 68.4, 81.2, 402, 'fodder', { task: { k: 'haul', to: [STACK.x + 1.8, STACK.y + 1.8] }, haul: { x: 68.8, y: 82.2, sack: true } }, 0);
  at(k, 64.6, 76.4, 402, 'fodder', { task: { k: 'haul', to: [STACK.x + 2.4, STACK.y + 0.6] }, haul: { x: 65, y: 77.4, sack: true } }, 0);
  // 403: the bank patrol.
  for (const [x, y] of [[40.4, 70.6], [41.6, 70.9]] as const) at(k, x, y, 403, 'fodder', { task: { k: 'patrol', pts: BANK.map(([a, b]) => [a, b]), i: 1 } }, 0.1);
  // 404: the causeway patrol, between the crown at the bend and the holm's landing over the boards.
  const cw: [number, number][] = [[44.2, 43.2], [40.3, 34.6]];
  for (const [x, y] of [[42.6, 42.2], [40.4, 39.6]] as const) at(k, x, y, 404, 'fodder', { task: { k: 'patrol', pts: cw.map(([a, b]) => [a, b]), i: 1 } }, 0.05);
  // 405: the brute over the pot, two eating at it.
  at(k, POT.x - 0.4, POT.y + 2.6, 405, 'heavy');
  for (const [x, y] of [[-1.4, -1.2], [1.4, -1.2]] as const) at(k, POT.x + x, POT.y + y, 405, 'fodder', { feeding: true });
  // 406: the den's yard. The seed gives one the bow and the next the net.
  const bow = k.rng.int(3), yardAt: [number, number][] = [[DEN2.x - 1.2, DEN2.y + 3.2], [DEN2.x + 3.2, DEN2.y + 4], [DEN2.x + 1.4, DEN2.y + 2.6]];
  yardAt.forEach(([x, y], i) => at(k, x, y, 406, i === bow ? 'archer' : i === (bow + 1) % 3 ? 'netter' : 'fodder'));
  // 407: one at the racks, one by the cage.
  at(k, RACKS.x + 1.6, RACKS.y + 1.4, 407, 'fodder', { feeding: true });
  at(k, CAGE.x - 1.6, CAGE.y + 1.8, 407, 'fodder');
}
