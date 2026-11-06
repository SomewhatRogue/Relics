/**
 * The Staithe room's banner and whether it's done with (sim/goal.ts asks here): the log first, the netted,
 * then the hold; done once the punt's made its last trip or there's nobody left to take over. The words
 * are shared/staithewords.ts.
 */
import { STAITHE_WORDS as W } from '../shared/staithewords';
import { STAITHE } from '../shared/tuning';
import { isDead } from './damage';
import type { ArenaRoom } from './room';
import { heldK, isNetted, jettyOf, logDone, logOf, onJetty, set } from './staithe';

export function staitheGoal(room: ArenaRoom): { text: string; done: boolean } | null {
  const m = room.map, j = jettyOf(m);
  if (!m.staithe || !j) return null;
  if (j.over) return { text: W.over(j.saved ?? 0, j.lost ?? 0), done: true };
  const parts: string[] = [], g = logOf(m), netted = room.survivors.filter(isNetted).length;
  if (!logDone(m, room.enemies.filter((e) => !isDead(e)))) parts.push(g?.deck ? W.laid : W.log);
  else if (room.survivors.some(onJetty)) parts.push(set(j.holdAt) || set(j.holdLeft) ? W.hold(Math.ceil(STAITHE.hold * (1 - heldK(j, room.time)))) : W.ring);
  if (netted) parts.push(W.netted(netted));
  return { text: parts.join('. '), done: false };
}
