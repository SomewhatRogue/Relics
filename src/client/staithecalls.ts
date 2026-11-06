/**
 * The Staithe's folk calling out (shared/staithewords.ts EELFOLK_CALLS): from the jetty while the hungry
 * are at it, from the nets on the bank, and from the punt as it takes them over. One line every few
 * seconds, from whoever it is, on this screen's own clock (words only; nothing here decides).
 */
import { EELFOLK_CALLS } from '../shared/staithewords';
import type { ArenaRoom } from '../sim/room';
import { heldK, isNetted, jettyOf, onJetty } from '../sim/staithe';

let next = 0;

export function staitheCalls(room: ArenaRoom, say: (x: number, y: number, s: string) => void): void {
  const j = jettyOf(room.map), t = room.time;
  if (!j || !room.map.staithe || j.over || t < next || !room.heroes.some((h) => Math.hypot(h.x - j.x - j.w / 2, h.y - j.y - j.h / 2) < 16)) return;
  next = t + 3.2 + ((Math.floor(t * 7) % 5) * 0.4);
  const deck = room.survivors.filter(onJetty), net = room.survivors.filter(isNetted), n = Math.floor(t / 3);
  const holding = heldK(j, t) > 0 && heldK(j, t) < 1;
  if (holding && deck.length) return say(room.map.staithe.punt[0][0], room.map.staithe.punt[0][1], EELFOLK_CALLS.punt[n % EELFOLK_CALLS.punt.length]);
  const who = n % 3 === 2 && net.length ? net[n % net.length] : deck[n % Math.max(1, deck.length)];
  if (!who) return;
  const lines = who.netted ? EELFOLK_CALLS.netted : EELFOLK_CALLS.jetty;
  say(who.x, who.y, lines[n % lines.length]);
}
