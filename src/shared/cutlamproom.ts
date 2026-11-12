/**
 * The Open Cut, under the hill: THE LAMP ROOM (docs/design/open-cut-arc.md), where the miners' lamps hung and were
 * given out. Six lamps on their posts round the floor, all lit when you come in; the racks along the back wall, the
 * counter by the way in. THE LAMPMAN keeps the dark, its own doing and nothing deeper: it puts them out one by one
 * and hits harder where none lights it; light one by it again (BURN) and it's dazzled and OPEN (sim/lampman.ts).
 * No other light but a basket by the way in. Two at the door.
 *
 * Fixed by hand; the seed only places the clutter.
 */
import { block, mark, newKit, patch, round } from './expedkit.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import type { RoomPlan } from './terrain.js';
import { areaPlan, body, keeper, pack } from './cutkit.js';
import { CUT_NAMES } from './opencutwords.js';

export const LAMPROOM = { w: 20, h: 24, name: 'THE LAMP ROOM' };
export const LAMPROOM_AT = { mid: { x: 10, y: 11.6 }, ring: 5, lampman: { x: 10, y: 9.6 }, door: { x: 10, y: 20.4 } };
/** The six lamps round the floor. */
export const LAMPROOM_LAMPS = [0, 1, 2, 3, 4, 5].map((i) => {
  const a = (i / 6) * Math.PI * 2, A = LAMPROOM_AT;
  return { x: +(A.mid.x + Math.cos(a) * A.ring).toFixed(2), y: +(A.mid.y + Math.sin(a) * A.ring * 0.86).toFixed(2) };
});

export function lampRoomPlan(job: Job): RoomPlan {
  const { w, h } = LAMPROOM, A = LAMPROOM_AT, k = newKit(new Rng(job.seed * 2287 + 71));
  patch(k, 'earth', 0, 0, w, h, false), patch(k, 'swept', 3, 4, 14, 15.4);
  // The racks along the back wall where the lamps hung, empty hooks now; the counter they were given out over.
  block(k, 'shelf', 2.4, 1.2, 5.2, 0.9), block(k, 'shelf', w - 7.6, 1.2, 5.2, 0.9);
  block(k, 'counter', 1.4, 15.8, 3.6, 0.9), block(k, 'bench', w - 5.2, 16.2, 3.4, 0.8);
  // The adit's timbering; spilt oil and a lamp trodden flat; a lamp-boy who didn't get out.
  for (const y of [3, 9, 15]) round(k, 'support', 0.8, y, 0.3), round(k, 'support', w - 0.8, y + 1.5, 0.3);
  mark(k, 'scorch', 8.6, 4.4, 2.6, 1.2), mark(k, 'debris', 13.4, 18.2, 2.4, 1.2);
  body(k, 3.4, 18.6, 'villager');
  // The lamps on their posts (a post stops a body; the lamp's drawn on it: client/lampmandraw.ts).
  for (const l of LAMPROOM_LAMPS) round(k, 'support', l.x, l.y, 0.2);
  k.braziers.push({ x: 2.4, y: h - 2.2, r: 0.28, wild: true });
  // THE LAMPMAN in the middle of its lamps; two at the door.
  keeper(k, 2, A.lampman, 'heavy', CUT_NAMES.lampman, 380).lamps = true;
  pack(k, 1, A.door, ['shield', 'fodder'], 1);
  return areaPlan(k, job, { name: LAMPROOM.name, w, h, kind: 'mine' }, { lamps: LAMPROOM_LAMPS.map((l) => ({ ...l })) });
}
