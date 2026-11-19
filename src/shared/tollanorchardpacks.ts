/**
 * THE HOME GROUND's goblins (shared/tollanorchard.ts), each pack busy at something when you come up to it, made of
 * the board's roles (shared/encounters.ts, cast by shared/encounter.ts) for one level 3 hero:
 *
 * - 301, the shaken tree: four eating windfalls under it with the sacks they filled (keepers).
 * - 302, the hives: a lunger and two kicking through the skeps for the comb (keepers).
 * - 303, the door: a brute minding the pile of full sacks, two hauling another sack up to it (keepers).
 * - 304, the orchard road: a patrol of two between the gateway and the door (keepers).
 * - 305, the field shelter: an archer and three at their fire by the cage (not keepers).
 * - 306, the hurdle lane: a patrol of two up and down it (not keepers).
 *
 * Eighteen in all, on flat ground. The seed picks which of the shelter's three holds the bow and nudges where each
 * stands. Pure.
 */
import { claim, type Kit } from './expedkit.js';
import { cast } from './encounter.js';
import type { Role } from './encounters.js';
import type { Foe } from './terrain.js';
import { FIRE, SHELTER } from './tollanorchardpaddocks.js';
import { HIVES, PILE, RIDE, SHAKE } from './tollanorchardtrees.js';

/** One of `pack` as `role`, standing at (x, y) give or take the seed's nudge. */
function put(k: Kit, x: number, y: number, pack: number, role: Role, more: Partial<Foe> = {}, nudge = 0.25): Foe {
  const px = x + k.rng.range(-nudge, nudge), py = y + k.rng.range(-nudge, nudge);
  const f = Object.assign(cast({ kind: 'scrapper', x: px, y: py, pack }, role), more);
  delete f.z;
  k.foes.push(f), claim(k, px, py, 0.6);
  return f;
}

export function layPacks(k: Kit): void {
  // 301: round the shaken tree, eating what fell.
  for (const [x, y] of [[-0.8, 2.8], [2.2, 3], [3.6, -0.4], [-2.2, -1.4]] as const) put(k, SHAKE.x + x, SHAKE.y + y, 301, 'fodder', { feeding: true });
  // 302: at the hives; the lunger stands off the bench, watching the rows.
  put(k, HIVES.x - 4.8, HIVES.y + 1.6, 302, 'lunger');
  for (const [x, y] of [[-2, 2.8], [0.8, 2.6]] as const) put(k, HIVES.x + x, HIVES.y + y, 302, 'fodder', { feeding: true });
  // 303: the brute by the sacks at the door; two hauling one more along the trail of spilt apples.
  put(k, PILE.x + 0.6, PILE.y + 2.6, 303, 'heavy');
  put(k, 36.6, RIDE - 0.2, 303, 'fodder', { task: { k: 'haul', to: [PILE.x - 1, PILE.y + 1] }, haul: { x: 36.2, y: RIDE + 0.8, sack: true } }, 0);
  put(k, 37.8, RIDE + 0.4, 303, 'fodder', { task: { k: 'haul', to: [PILE.x - 0.4, PILE.y + 1.8] } }, 0);
  // 304: the patrol on the orchard road.
  const road: [number, number][] = [[48, 87], [48, 62.6]];
  for (const [x, y] of [[47.6, 79.4], [48.6, 80.8]] as const) put(k, x, y, 304, 'fodder', { task: { k: 'patrol', pts: road, i: 1 } }, 0.1);
  // 305: at the shelter. Two eating at the fire, one by the cage, one at the shelter's corner; the seed gives one a bow.
  const bow = k.rng.int(3), at: [number, number, boolean][] = [[FIRE.x - 1.2, FIRE.y + 1.2, true], [FIRE.x + 1.2, FIRE.y + 1.2, true], [SHELTER.x + 1.4, SHELTER.y + 1.6, false]];
  at.forEach(([x, y, eat], i) => put(k, x, y, 305, i === bow ? 'archer' : 'fodder', eat ? { feeding: true } : {}));
  put(k, 9.4, 36.4, 305, 'fodder', {}, 0.1);
  // 306: the patrol in the hurdle lane.
  const lane: [number, number][] = [[48, 47.4], [48.4, 12]];
  for (const [x, y] of [[48.2, 29.4], [47.4, 30.8]] as const) put(k, x, y, 306, 'fodder', { task: { k: 'patrol', pts: lane, i: 1 } }, 0.1);
}
