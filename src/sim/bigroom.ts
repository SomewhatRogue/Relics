/**
 * The big map's room, for the load test in Node and the browser (`?bigmap=1`): the map and goblins from
 * shared/bigmap.ts, and bots spread out to its four quarters. Bots can't be hurt (so the measure holds
 * steady); the goblins still fight them.
 */
import { bigPlan } from '../shared/bigmap';
import { newBot, spreadOut, type Bot } from './bots';
import { ArenaRoom } from './room';

export function bigRoom(seed: number, n: number, sleep: boolean): ArenaRoom {
  const plan = bigPlan(seed, n);
  return new ArenaRoom(seed, { map: plan.map, foes: plan.foes, sleep });
}

/** Put bots in the room (ids given; one may be a real player's hero, already in), spread to the quarters. */
export function addBots(room: ArenaRoom, ids: string[], drive: string[] = ids): Bot[] {
  const at = spreadOut(room.map.w, room.map.h);
  return ids.flatMap((id, i) => {
    const h = room.join(id);
    Object.assign(h, { x: at[i % 4].x, y: at[i % 4].y, safeT: 1e9 });
    room.prev.set('h:' + id, [h.x, h.y]);
    return drive.includes(id) ? [newBot(id, at[i % 4], 1000 + i * 17)] : [];
  });
}
