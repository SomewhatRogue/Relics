/**
 * The keeper's road (sim/pack.ts GEAR.travel; docs/design/outside-the-gate.md): from one way station to another that was found.
 * The room does the moving; whether it was found is the client's to know, so it offers only those.
 */
import { inSolid } from '../shared/reach';
import { inStation } from './landrules';
import type { ArenaRoom } from './room';
import type { FightEvent, Hero } from './types';

const AROUND: [number, number][] = [[0, 1.5], [0, 1], [1.2, 1], [-1.2, 1], [0, -1.5], [1.5, 0], [-1.5, 0]];

/** Just inside a station's ring, south of its centre, off anything solid. */
export function ringSpot(room: ArenaRoom, s: { x: number; y: number }): { x: number; y: number } {
  const at = AROUND.map(([dx, dy]) => ({ x: s.x + dx, y: s.y + dy })).find((p) => !inSolid(room.map, p.x, p.y, 0));
  return at ?? { x: s.x, y: s.y + 1.5 };
}

/** Move hero `h` to station number `to`: not the one they stand in, and it must exist. */
export function travelTo(room: ArenaRoom, h: Hero, to: number, ev: FightEvent[]): void {
  const list = room.map.stations ?? [], dest = list[to];
  if (!room.roam || !dest || inStation([dest], h)) return;
  const at = ringSpot(room, dest);
  Object.assign(h, { ...at, z: 0, kvx: 0, kvy: 0 });
  room.prev.set('h:' + h.id, [h.x, h.y]);
  ev.push({ k: 'travelled', id: h.id, x: h.x, y: h.y, station: dest.name });
}
