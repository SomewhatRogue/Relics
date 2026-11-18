/**
 * A mini quest on screen (sim/minis.ts; docs/design/territories.md, "Mini quests"): the giver's line said over
 * them when someone talks to them, and what's said when it's done. No card, no pause: the room never stops for a
 * party. Also here: whether someone standing on the map is a giver who has gone home (so a friend's screen, whose
 * map is built from the seed, stops drawing them when the leader's room says they've left).
 */
import type { Npc } from '../shared/arena';
import { miniWords } from '../shared/miniwords';
import type { ArenaRoom } from '../sim/room';
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { sfx } from './sfx';

export function miniFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  if (ev.k !== 'mini') return false;
  const w = miniWords(ev.id), s = ev.what === 'taken' ? w.offer : ev.what === 'done' ? w.done : w.home;
  if (s) fx.say(x, y - 58, s, ev.what === 'taken' ? '#e8e4ee' : '#ffd27a', 4.5);
  if (ev.what === 'done') sfx.coal();
  return true;
}

/** Someone on the map who is a mini quest's giver and has gone home with it done. */
export function giverGone(room: ArenaRoom, n: Npc): boolean {
  if (!n.talk.startsWith('mini:')) return false;
  const id = n.talk.slice(5), m = room.map.minis?.find((q) => q.id === id);
  return !!m && !!room.minis?.find((s) => s.id === id)?.left;
}
