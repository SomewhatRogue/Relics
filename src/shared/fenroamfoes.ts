/**
 * The Fen's packs (docs/design/the-fen.md), Fenmere's kinds (shared/fenscenes.ts) by stretch, south to north, harder
 * than the north fields': the second land, aimed at heroes of level 5 to 8. None is a gate's keeper; nothing hostile
 * within ten tiles of the way in or nine of the staithe. Fixed spots; the seed moves no one. Pure.
 *   451 three at a drowned sheep and a lunger over them (the bog edge's north end).
 *   452 a shield line across the causeway, an archer and one more behind it; 453 a skimmer on its islet pouring oil
 *   on the causeway's edge, one with it; 454 a gaffer and a brute past the ford, one with them; 459 a netter's band on
 *   the west island, with its chest (the causeways).
 *   455, 456 two bands lying hidden in the reeds; 461 a band at the reeds' south edge, its archer (the reed beds).
 *   457 a hexer's band on the old churchyard wall's line; 458 a spiders' nest on the dry rise (the drowned chapel).
 *   460 the larder: a brute at the pot, a drummer, two gaffers on the baulks, three more (the Peat Cuts).
 */
import { cast } from './encounter.js';
import type { Role } from './encounters.js';
import { claim, type Kit } from './expedkit.js';
import type { Foe } from './terrain.js';

export const FEN_PACKS = [451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461];
/** The larder's band: BLACK PEAT is laid on the cuts once it is dead (shared/fenroamgather.ts). */
export const LARDER_PACK = 460;

type Spot = [number, number];
function put(k: Kit, pack: number, [x, y]: Spot, role: Role | 'skimmer' | 'gaffer', more: Partial<Foe> = {}): void {
  const f: Foe = { kind: 'scrapper', x, y, pack };
  if (role === 'skimmer' || role === 'gaffer') f.variant = role;
  else cast(f, role);
  k.foes.push(Object.assign(f, more)), claim(k, x, y, 0.6);
}
const lurk = { task: { k: 'lurk' as const } };

export function layFenFoes(k: Kit): void {
  for (const s of [[36, 86.2], [37.4, 87], [35.2, 87.4]] as Spot[]) put(k, 451, s, 'fodder', { feeding: true });
  put(k, 451, [38.6, 85.4], 'lunger');
  put(k, 452, [37.6, 74.4], 'shield'), put(k, 452, [37.6, 75.6], 'shield'), put(k, 452, [41, 75], 'archer'), put(k, 452, [40, 74.4], 'fodder');
  put(k, 453, [34.6, 69.6], 'skimmer', { task: { k: 'pour', x: 33, y: 73.8 } }), put(k, 453, [33.4, 70.6], 'fodder');
  put(k, 454, [44.6, 67.4], 'gaffer'), put(k, 454, [44.4, 66], 'heavy'), put(k, 454, [45.2, 68.2], 'fodder');
  put(k, 459, [8.4, 77.2], 'netter'), put(k, 459, [10.6, 80], 'fodder'), put(k, 459, [7.4, 80.4], 'fodder');
  put(k, 455, [14, 48.4], 'lunger', lurk), put(k, 455, [16.4, 49.4], 'netter', lurk), put(k, 455, [18.4, 47.6], 'lunger', lurk);
  put(k, 456, [48, 41.6], 'pouncer', lurk), put(k, 456, [50.6, 42.4], 'lunger', lurk), put(k, 456, [52.4, 41.2], 'netter', lurk);
  put(k, 461, [38.6, 46.8], 'shield'), put(k, 461, [43.6, 46.4], 'fodder'), put(k, 461, [40.6, 47.4], 'archer');
  put(k, 457, [24, 24.4], 'hexer'), put(k, 457, [26.2, 24], 'shield'), put(k, 457, [22.6, 25.1], 'fodder'), put(k, 457, [27.6, 25.2], 'fodder');
  k.foes.push({ kind: 'nest', x: 46.4, y: 18.6, wave: 3, pack: 458 }), claim(k, 46.4, 18.6, 1.2);
  for (const [x, y] of [[44.6, 18], [47.8, 20.4], [45.2, 20.6]]) k.foes.push({ kind: 'spider', x, y, pack: 458 }), claim(k, x, y, 0.6);
  put(k, 460, [31, 6.6], 'heavy'), put(k, 460, [33.6, 7.6], 'drummer'), put(k, 460, [19.3, 6], 'gaffer'), put(k, 460, [43.9, 6], 'gaffer');
  for (const s of [[29, 9.8], [32.8, 10.2], [30.4, 11.4]] as Spot[]) put(k, 460, s, 'fodder');
  k.chests.push({ x: 7.2, y: 76.4 }, { x: 48.8, y: 17 }, { x: 35.6, y: 5 });
  for (const c of k.chests) claim(k, c.x, c.y, 1.2);
}
