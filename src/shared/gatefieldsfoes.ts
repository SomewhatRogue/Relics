/**
 * The Gate Fields' packs (docs/design/outside-the-gate.md), by stretch of the road, south to north. None is a gate's
 * keeper: the map has no gates. Nothing is placed within 9 tiles of the barn.
 *   Nothing hostile below y 68: the Gate Road is the refugees' camp (gatefieldscamp.ts).
 *   402 the forker with two fodder, west of the road; 403 the swingle with two fodder, east; 404 a thief and an archer in the
 *   last broken crop patch (the far end of the Common Strips, y 58 to 67).
 *   401 the dead beast: two fodder feeding at the south edge of the Rough Pasture, about (20, 47).
 *   405 a wolf-keeper and four wolves in the open; 406 the den: four pouncers in the ring of bushes (the Rough Pasture).
 *   407 the nest and three spiders in the trees west of the road; 408 a snarer, a netter and two fodder east (the Wood's Edge).
 * Chests: behind the scarecrow's strip, in the den, deep in the wood's edge off the road. Pure; the seed moves no one.
 */
import { cast } from './encounter.js';
import type { Role } from './encounters.js';
import { claim, mark, type Kit } from './expedkit.js';
import type { Foe } from './terrain.js';
import { DEN } from './gatefieldsland.js';

export const GATE_PACKS = [401, 402, 403, 404, 405, 406, 407, 408];

function put(k: Kit, pack: number, x: number, y: number, role: Role, more: Partial<Foe> = {}): void {
  k.foes.push(Object.assign(cast({ kind: 'scrapper', x, y, pack }, role), more)), claim(k, x, y, 0.6);
}

export function layFoes(k: Kit): void {
  mark(k, 'blood', 18.6, 46.2, 2.2, 1), mark(k, 'drag', 19, 47.4, 2.4, 0.5);
  put(k, 401, 19.6, 46.8, 'fodder', { feeding: true }), put(k, 401, 21.4, 47.8, 'fodder', { feeding: true });
  put(k, 402, 20.5, 63.4, 'forker'), put(k, 402, 19.2, 65.4, 'fodder'), put(k, 402, 22, 65.6, 'fodder');
  put(k, 403, 36, 64.4, 'swingle'), put(k, 403, 38, 63.4, 'fodder'), put(k, 403, 34.4, 65.4, 'fodder');
  put(k, 404, 15.8, 61.6, 'thief'), put(k, 404, 8.6, 63.6, 'archer');
  put(k, 405, 35, 39, 'keeper');
  for (const [x, y] of [[31.6, 36.6], [38.4, 36.2], [36, 43.4], [31, 42]]) put(k, 405, x, y, 'wolf');
  for (const [x, y] of [[-0.9, -0.8], [0.9, -0.8], [-0.9, 0.9], [0.6, 0.9]]) put(k, 406, DEN.x + x, DEN.y + y, 'pouncer');
  k.foes.push({ kind: 'nest', x: 12, y: 15, wave: 3, pack: 407 }), claim(k, 12, 15, 1.2);
  for (const [x, y] of [[10.4, 14], [13.8, 14.4], [12, 17.2]]) k.foes.push({ kind: 'spider', x, y, pack: 407 }), claim(k, x, y, 0.6);
  mark(k, 'debris', 10.6, 16, 2.4, 0.8);
  put(k, 408, 41, 16, 'snarer'), put(k, 408, 44.4, 13.4, 'netter'), put(k, 408, 38.6, 13.4, 'fodder'), put(k, 408, 43.2, 19.2, 'fodder');
  k.chests.push({ x: 8, y: 58.6 }, { x: DEN.x - 1, y: DEN.y + 0.9 }, { x: 47, y: 8.6 });
  for (const c of k.chests) claim(k, c.x, c.y, 1.2);
}
