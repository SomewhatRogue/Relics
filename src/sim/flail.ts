/**
 * The flail's perfect, in the room (numbers: shared/cleric.ts FLAIL). The spin let go on the white flash
 * stuns every goblin it lands on (a butcher for less); the friends near the Cleric are shielded once, at
 * the release (sim/room.ts loose). Its quick blows' shove, and a shield-bearer's board stopping it, are
 * in sim/combat.ts (`shoves`). Judged here, so a guest's goblins reel the way the leader's do.
 */
import { FLAIL, type Swing } from '../shared/tuning';
import { isDead } from './damage';
import { daze } from './venom';
import type { Enemy, FightEvent, Hero } from './types';

/** After a Cleric's blow has hurt a goblin that still stands: true if it took over from the usual flinch
 *  (a goblin mid striped blow or charge can't be dazed: the breaker's flinch still has its go at it). */
export function clericHit(h: Hero, s: Swing, e: Enemy, ev: FightEvent[]): boolean {
  if (!s.dazes || !h.heavy || !h.perfect || isDead(e) || !daze(e, FLAIL.stun * (e.kind === 'butcher' ? FLAIL.big : 1), ev)) return false;
  ev.push({ k: 'flailstun', x: e.x, y: e.y });
  return true;
}
