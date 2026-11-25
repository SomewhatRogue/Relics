/**
 * The Gate Fields' packs (docs/design/outside-the-gate.md), by stretch of the road, south to north. None is a gate's
 * keeper: the map has no gates. Nothing is placed within 9 tiles of the barn, in the camp, or within 10 of the way in.
 *   Nothing hostile below y 112: the Gate Road is the refugees' camp (gatefieldscamp.ts), and the strips' near end is quiet.
 *   409 a swingle and two fodder at the stopped grain cart (the middle of the Common Strips, east of the road);
 *   402 the forker with two fodder, west of the road; 403 the swingle with two fodder, east; 404 a thief and an archer in the
 *   last broken crop patch (the far end of the Common Strips, y 87 to 100).
 *   401 the dead beast: two fodder feeding at the south edge of the Rough Pasture, about (30, 70.5).
 *   411 a wolf-keeper and two wolves west of the road, between the pond and the den;
 *   405 a wolf-keeper and four wolves in the open; 406 the den: four pouncers in the ring of bushes; 410 three wolves
 *   loose in the pasture's north-east (the Rough Pasture).
 *   412 three spiders in the trees at the wood's south edge, west of the road; 407 the nest and three spiders deeper in,
 *   west; 408 a snarer, a netter and two fodder east; 413 a snarer, a netter and a fodder in the north-west, near the
 *   way out (the Wood's Edge).
 * The nooks' packs (414 on) are in gatefieldsnooks.ts. The bounties count 401 to 408 (shared/bounties.ts): keep those as
 * they are. Chests: behind the scarecrow's strip, in the den, deep in the wood's edge off the road. Pure; the seed moves no one.
 */
import { cast } from './encounter.js';
import type { Role } from './encounters.js';
import { claim, mark, type Kit } from './expedkit.js';
import type { Foe } from './terrain.js';
import { DEN } from './gatefieldsland.js';

/** How far round a pack's start the scatter keeps off (1.3: the kit looks only in the cell a new thing stands in, so a
 *  claim must reach anything that could pin the foe: a rock or tree of r 0.8 against its 0.45). */
export const FOE_CLAIM = 1.3;

export const GATE_PACKS = [401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413];

export function put(k: Kit, pack: number, x: number, y: number, role: Role, more: Partial<Foe> = {}): void {
  k.foes.push(Object.assign(cast({ kind: 'scrapper', x, y, pack }, role), more)), claim(k, x, y, FOE_CLAIM);
}
const spider = (k: Kit, pack: number, x: number, y: number) => (k.foes.push({ kind: 'spider', x, y, pack }), claim(k, x, y, FOE_CLAIM));

export function layFoes(k: Kit): void {
  // The Common Strips.
  put(k, 409, 51.5, 107, 'swingle'), put(k, 409, 49.4, 108.4, 'fodder'), put(k, 409, 53.8, 108.6, 'fodder');
  put(k, 402, 30.75, 95.8, 'forker'), put(k, 402, 29.45, 97.8, 'fodder'), put(k, 402, 32.25, 98, 'fodder');
  put(k, 403, 54, 96.6, 'swingle'), put(k, 403, 56, 95.6, 'fodder'), put(k, 403, 52.4, 97.6, 'fodder');
  put(k, 404, 21.8, 92.9, 'thief'), put(k, 404, 14.6, 94.9, 'archer');
  // The Rough Pasture.
  mark(k, 'blood', 28.6, 69.7, 2.2, 1), mark(k, 'drag', 29, 70.9, 2.4, 0.5);
  put(k, 401, 29.6, 70.3, 'fodder', { feeding: true }), put(k, 401, 31.4, 71.3, 'fodder', { feeding: true });
  put(k, 411, 22, 58, 'keeper'), put(k, 411, 20, 56.2, 'wolf'), put(k, 411, 24.4, 56.6, 'wolf');
  put(k, 405, 52.5, 58.75, 'keeper');
  for (const [x, y] of [[49.1, 56.35], [55.9, 55.95], [53.5, 63.15], [48.5, 61.75]]) put(k, 405, x, y, 'wolf');
  for (const [x, y] of [[-0.9, -0.8], [0.9, -0.8], [-0.9, 0.9], [0.6, 0.9]]) put(k, 406, DEN.x + x, DEN.y + y, 'pouncer');
  for (const [x, y] of [[63, 47], [66, 45.6], [65.4, 49]]) put(k, 410, x, y, 'wolf');
  // The Wood's Edge.
  for (const [x, y] of [[24.5, 36], [27.6, 35.4], [26, 38.4]]) spider(k, 412, x, y);
  k.foes.push({ kind: 'nest', x: 18, y: 22.5, wave: 3, pack: 407 }), claim(k, 18, 22.5, 1.2);
  for (const [x, y] of [[16.4, 21.5], [19.8, 21.9], [18, 24.7]]) spider(k, 407, x, y);
  mark(k, 'debris', 16.6, 23.5, 2.4, 0.8);
  put(k, 408, 61.9, 23.75, 'snarer'), put(k, 408, 65.3, 21.15, 'netter'), put(k, 408, 59.5, 21.15, 'fodder'), put(k, 408, 64.1, 26.95, 'fodder');
  put(k, 413, 22, 11, 'snarer'), put(k, 413, 25, 9.4, 'netter'), put(k, 413, 19.4, 9.6, 'fodder');
  k.chests.push({ x: 12, y: 87.9 }, { x: DEN.x - 1, y: DEN.y + 0.9 }, { x: 70.5, y: 12.9 });
  for (const c of k.chests) claim(k, c.x, c.y, 1.2);
}
