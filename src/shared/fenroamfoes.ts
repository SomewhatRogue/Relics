/**
 * The Fen's packs (docs/design/the-fen.md), Fenmere's kinds (shared/fenscenes.ts) by stretch, south to north, harder
 * than the north fields': the second land, aimed at heroes of level 5 to 8. None is a gate's keeper; nothing hostile
 * within ten tiles of the way in or nine of the staithe. Fixed spots; the seed moves no one. Pure.
 *   451 three at a drowned sheep and a lunger over them; 462 a pouncer and two at the bog's west pools (the bog edge).
 *   452 a shield line across the causeway, an archer and one more behind it; 453 a skimmer on its islet pouring oil
 *   on the causeway's edge, one with it; 454 a gaffer and a brute past the ford, one with them; 459 a netter's band on
 *   the west island, with its chest; 463 a shield and two on the winding causeway north of it (the causeways).
 *   455, 456, 465 three bands lying hidden in the reeds; 461 a band at the reeds' south edge, its archer; 466 a band
 *   on the reeds' near side under the chapel (the reed beds).
 *   457 a hexer's band on the old churchyard wall's line; 458 a spiders' nest on the dry rise; 467 a band on the bank
 *   to the sexton's isle (the drowned chapel).
 *   460 the larder: a brute at the pot, a drummer, two gaffers on the baulks, three more; 468 two gaffers, a brute and
 *   one more on the west baulks (the Peat Cuts).
 * The nooks' own (464, 469, 470) are in shared/fenroamnooks.ts.
 */
import { cast } from './encounter.js';
import type { Role } from './encounters.js';
import { claim, type Kit } from './expedkit.js';
import type { Foe } from './terrain.js';

export const FEN_PACKS = [451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 465, 466, 467, 468];
/** The larder's band: BLACK PEAT is laid on the cuts once it is dead (shared/fenroamgather.ts). */
export const LARDER_PACK = 460;

type Spot = [number, number];
export function put(k: Kit, pack: number, [x, y]: Spot, role: Role | 'skimmer' | 'gaffer', more: Partial<Foe> = {}): void {
  const f: Foe = { kind: 'scrapper', x, y, pack };
  if (role === 'skimmer' || role === 'gaffer') f.variant = role;
  else cast(f, role);
  k.foes.push(Object.assign(f, more)), claim(k, x, y, 0.6);
}
const lurk = { task: { k: 'lurk' as const } };

export function layFenFoes(k: Kit): void {
  for (const s of [[54, 129.3], [56.1, 130.5], [52.8, 131.1]] as Spot[]) put(k, 451, s, 'fodder', { feeding: true });
  put(k, 451, [57.9, 128.1], 'lunger');
  put(k, 462, [12, 126.4], 'pouncer'), put(k, 462, [14.4, 127.2], 'fodder'), put(k, 462, [10.4, 127.8], 'fodder');
  put(k, 452, [56.4, 111.6], 'shield'), put(k, 452, [56.4, 113.4], 'shield'), put(k, 452, [61.5, 112.5], 'archer'), put(k, 452, [60, 111.6], 'fodder');
  put(k, 453, [51.9, 104.4], 'skimmer', { task: { k: 'pour', x: 49.5, y: 110.7 } }), put(k, 453, [50.1, 105.9], 'fodder');
  put(k, 454, [66.9, 101.1], 'gaffer'), put(k, 454, [66.6, 99], 'heavy'), put(k, 454, [67.8, 102.3], 'fodder');
  put(k, 459, [12.6, 115.8], 'netter'), put(k, 459, [15.9, 120], 'fodder'), put(k, 459, [11.1, 120.6], 'fodder');
  put(k, 463, [18, 105.2], 'shield'), put(k, 463, [20.4, 104.8], 'fodder'), put(k, 463, [22.8, 102], 'fodder');
  put(k, 455, [21, 72.6], 'lunger', lurk), put(k, 455, [24.6, 74.1], 'netter', lurk), put(k, 455, [27.6, 71.4], 'lunger', lurk);
  put(k, 456, [72, 62.4], 'pouncer', lurk), put(k, 456, [75.9, 63.6], 'lunger', lurk), put(k, 456, [78.6, 61.8], 'netter', lurk);
  put(k, 465, [36.4, 62.4], 'lunger', lurk), put(k, 465, [39, 63.4], 'pouncer', lurk), put(k, 465, [41, 61.8], 'netter', lurk);
  put(k, 461, [57.9, 70.2], 'shield'), put(k, 461, [65.4, 69.6], 'fodder'), put(k, 461, [60.9, 71.1], 'archer');
  put(k, 466, [24, 54.4], 'shield'), put(k, 466, [27, 55.6], 'archer'), put(k, 466, [22.2, 55.8], 'fodder'), put(k, 466, [25.8, 52.6], 'fodder');
  put(k, 457, [36, 36.6], 'hexer'), put(k, 457, [39.3, 36], 'shield'), put(k, 457, [33.9, 37.6], 'fodder'), put(k, 457, [41.4, 37.8], 'fodder');
  put(k, 467, [16, 35.8], 'shield'), put(k, 467, [13.4, 36.2], 'fodder'), put(k, 467, [10.9, 39.6], 'fodder');
  k.foes.push({ kind: 'nest', x: 69.6, y: 27.9, wave: 3, pack: 458 }), claim(k, 69.6, 27.9, 1.2);
  for (const [x, y] of [[66.9, 27], [71.7, 30.6], [67.8, 30.9]]) k.foes.push({ kind: 'spider', x, y, pack: 458 }), claim(k, x, y, 0.6);
  put(k, 460, [46.5, 9.9], 'heavy'), put(k, 460, [50.4, 11.4], 'drummer'), put(k, 460, [29, 9], 'gaffer'), put(k, 460, [65.9, 9], 'gaffer');
  for (const s of [[43.5, 14.7], [49.2, 15.3], [45.6, 17.1]] as Spot[]) put(k, 460, s, 'fodder');
  put(k, 468, [19.4, 8.6], 'gaffer'), put(k, 468, [19.4, 16.4], 'gaffer'), put(k, 468, [8.4, 11], 'heavy'), put(k, 468, [9, 15.6], 'fodder');
  k.chests.push({ x: 10.8, y: 114.6 }, { x: 73.2, y: 25.5 }, { x: 53.4, y: 7.5 });
  for (const c of k.chests) claim(k, c.x, c.y, 1.2);
}
