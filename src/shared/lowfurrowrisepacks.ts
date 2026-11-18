/**
 * THE RISE's goblins (shared/lowfurrowrise.ts), each pack busy at something when you come up to it, made of the
 * board's roles (shared/encounters.ts, cast by shared/encounter.ts) at ruin 1 for a level 1 hero:
 *
 * - 120, on the west bank over the lane: two archers eating windfalls under the orchard's edge (not keepers).
 * - 121, in the lane: a patrol of two walking down from the head and back (not keepers).
 * - 122, the fold (the keepers): a brute at the gap, a drummer behind the fold, four at the hurdles and the cage
 *   (the board's "a brute with a drum behind it").
 * - 123, the shepherd's hut: three, two eating at the fire, one turning the hut out (not keepers).
 * - 124, by the sorting pens: two hauling a gleaner's sack to the hut's fire (not keepers).
 *
 * Fifteen in all, every one on the level under it (`z`). The seed picks which of a pair holds the bow and nudges
 * where each stands. Pure.
 */
import { claim, type Kit } from './expedkit.js';
import { cast } from './encounter.js';
import type { Role } from './encounters.js';
import type { RiseLand } from './lowfurrowriseland.js';
import { FIRE, FOLD } from './lowfurrowrisefold.js';
import type { Foe } from './terrain.js';

/** One of `pack` as `role`, standing at (x, y) give or take the seed's nudge, on the level there. */
function put(k: Kit, land: RiseLand, x: number, y: number, pack: number, role: Role, more: Partial<Foe> = {}, nudge = 0.3): Foe {
  const px = x + k.rng.range(-nudge, nudge), py = y + k.rng.range(-nudge, nudge);
  const f = Object.assign(cast({ kind: 'scrapper', x: px, y: py, pack }, role), more);
  const z = land.lv(px, py);
  if (z) f.z = z;
  else delete f.z;
  k.foes.push(f), claim(k, px, py, 0.6);
  return f;
}

export function layPacks(k: Kit, land: RiseLand): void {
  // 120: two archers up on the west bank, three tiles back from its face, eating windfalls.
  for (const [x, y] of [[31.4, 79.4], [30.8, 76.4]] as const) put(k, land, x, y, 120, 'archer', { feeding: true });
  // 121: a patrol of two in the lane, between the head and the bend.
  const round: [number, number][] = [[44.6, 65.4], [39.4, 80.6]];
  for (const [x, y] of [[42.4, 70.2], [41.6, 71.6]] as const) put(k, land, x, y, 121, 'fodder', { task: { k: 'patrol', pts: round, i: 1 } }, 0.15);
  // 122: the fold. A brute at the gap; the drummer behind the fold's north side; four at the hurdles and the cage.
  put(k, land, FOLD.x1 + 1.4, 34.6, 122, 'heavy');
  put(k, land, 40.4, FOLD.y0 - 1.8, 122, 'drummer');
  const at: [number, number][] = [[43.8, 36.6], [40.2, 33.4], [46.6, 33.4], [29.4, 38.4]];
  at.forEach(([x, y], i) => put(k, land, x, y, 122, 'fodder', i < 2 ? { feeding: true } : {}));
  // 123: at the hut. Two eating at the fire, one in the doorway turning it out; the seed gives one of the two a bow.
  const bow = k.rng.int(2);
  put(k, land, FIRE.x - 0.9, FIRE.y + 1, 123, bow === 0 ? 'archer' : 'fodder', { feeding: true });
  put(k, land, FIRE.x + 1, FIRE.y + 0.9, 123, bow === 1 ? 'archer' : 'fodder', { feeding: true });
  put(k, land, 66, 26.4, 123, 'fodder', {}, 0.1);
  // 124: two hauling a sack from the pens to the fire.
  put(k, land, 72.6, 46.4, 124, 'fodder', { task: { k: 'haul', to: [FIRE.x + 1.6, FIRE.y + 1.6] }, haul: { x: 72.4, y: 47.6, sack: true } }, 0);
  put(k, land, 73.6, 46.9, 124, 'fodder', { task: { k: 'haul', to: [FIRE.x + 2.4, FIRE.y + 1.2] } }, 0);
}
