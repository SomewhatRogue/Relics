/**
 * The High Wood's packs (docs/design/the-high-wood.md, slice 2), harder than the fen's: the third land, aimed at heroes
 * of level 8 to 11. None is a gate's keeper; nothing hostile within ten tiles of the way in or nine of the lodge. Fixed
 * spots; the seed moves no one. A body on a bank, the ridge or the rise stands at that height (z 1). Pure.
 *   THE SUNK LANES: 471, 472, 473 a snarer and two across the west, east and far east lanes; 474 two archers on the
 *   middle bank over the cross lane (a blind), two below; 475 a keeper and two wolves in the west lane's dead end.
 *   THE STRUCK OAKS: 476 three ironhides, two torch bearers and one more at the clearing; 477 an ironhide, a torch, two
 *   more on the ridge's west.
 *   THE OLD TREES: 478 a spiders' nest in the roots; 479, 480 two bands lying hidden in the bracken; 481 a hexer's
 *   band west of the ravine.
 *   THE COIN OAK: 482 the den under the oak; 483 a butcher's band east of it; 484 a shield, an archer and two below.
 * The nooks' own (485 to 487) are in shared/highwoodnooks.ts.
 */
import { cast } from './encounter.js';
import type { Role } from './encounters.js';
import { claim, type Kit } from './expedkit.js';
import { highUp } from './highwoodground.js';
import type { Foe } from './terrain.js';

export const WOOD_PACKS = [471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482, 483, 484];
/** The ironhides' band: THUNDERSTONE is laid on the ridge once it is dead (shared/highwoodgather.ts); the bounty's first. */
export const IRONHIDES_PACK = 476;
/** The den under the Coin Oak: a heavy, a drummer, a butcher's band. */
export const COIN_OAK_PACK = 482;
/** The three snarers' lines, the ironhides' two bands, the Coin Oak's three: the bounties' (shared/bounties.ts). */
export const SNARER_PACKS = [471, 472, 473];
export const IRONHIDE_PACKS = [476, 477];
export const COIN_PACKS = [482, 483, 484];

type Spot = [number, number];
/** One body of `pack` at (x, y), up on whatever height is under it. */
export function put(k: Kit, pack: number, [x, y]: Spot, role: Role, more: Partial<Foe> = {}): void {
  const f: Foe = cast({ kind: 'scrapper', x, y, pack }, role);
  if (highUp(x, y)) f.z = 1;
  k.foes.push(Object.assign(f, more)), claim(k, x, y, 0.6);
}
const lurk = { task: { k: 'lurk' as const } };

export function layWoodFoes(k: Kit): void {
  // The sunk lanes.
  put(k, 471, [23, 133.5], 'snarer'), put(k, 471, [22, 131], 'fodder'), put(k, 471, [24.5, 135.5], 'fodder');
  put(k, 472, [63, 132], 'snarer'), put(k, 472, [62, 130.5], 'fodder'), put(k, 472, [64.5, 134], 'lunger');
  put(k, 473, [86, 128], 'snarer'), put(k, 473, [84, 125], 'fodder'), put(k, 473, [88, 131], 'fodder');
  put(k, 474, [40.5, 118.5], 'archer'), put(k, 474, [40.5, 121.5], 'archer'), put(k, 474, [44.5, 120], 'fodder'), put(k, 474, [46, 117.5], 'shield');
  put(k, 475, [23, 118], 'keeper'), put(k, 475, [21.8, 115.2], 'wolf'), put(k, 475, [24.4, 116.6], 'wolf');
  // The struck oaks.
  for (const s of [[59, 83], [62.5, 87.5], [56.5, 82.5]] as Spot[]) put(k, 476, s, 'ironhide');
  put(k, 476, [60.5, 85.2], 'torch'), put(k, 476, [57.5, 89], 'torch'), put(k, 476, [61, 90.5], 'fodder');
  put(k, 477, [30, 82], 'ironhide'), put(k, 477, [28.5, 80.8], 'torch'), put(k, 477, [31, 83.5], 'fodder'), put(k, 477, [35.5, 84], 'lunger');
  // The old trees.
  k.foes.push({ kind: 'nest', x: 68, y: 66, wave: 3, pack: 478 }), claim(k, 68, 66, 1.2);
  for (const [x, y] of [[65, 67], [70, 68], [66.5, 64]]) k.foes.push({ kind: 'spider', x, y, pack: 478 }), claim(k, x, y, 0.6);
  put(k, 479, [56, 62], 'pouncer', lurk), put(k, 479, [59, 64], 'lunger', lurk), put(k, 479, [53, 64.5], 'lunger', lurk), put(k, 479, [58, 59], 'pouncer', lurk);
  put(k, 480, [62, 37], 'pouncer', lurk), put(k, 480, [65, 38.6], 'lunger', lurk), put(k, 480, [59, 36.8], 'lunger', lurk);
  put(k, 481, [18, 66], 'hexer'), put(k, 481, [21, 67.5], 'shield'), put(k, 481, [17, 68.6], 'fodder'), put(k, 481, [15, 65.5], 'fodder');
  // The Coin Oak.
  put(k, 482, [45, 13], 'heavy'), put(k, 482, [52.5, 11], 'drummer'), put(k, 482, [54, 16.5], 'butcher'), put(k, 482, [44, 17], 'butcher');
  put(k, 482, [51, 17.5], 'fodder'), put(k, 482, [46.5, 18.5], 'fodder');
  put(k, 483, [70, 26], 'butcher'), put(k, 483, [73, 24], 'heavy'), put(k, 483, [66, 27], 'fodder'), put(k, 483, [71, 28], 'fodder');
  put(k, 484, [45, 28], 'shield'), put(k, 484, [53.5, 27.5], 'archer'), put(k, 484, [44, 31.5], 'fodder'), put(k, 484, [53, 32], 'fodder');
  k.chests.push({ x: 74, y: 106 }, { x: 22.4, y: 70.4 }, { x: 70, y: 47.4 });
  for (const c of k.chests) claim(k, c.x, c.y, 1.2);
}
