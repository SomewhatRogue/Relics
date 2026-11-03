/**
 * A hero grows a level (the player's own game counts it: client/game.ts) and says so in its intent.
 * The room decides what that does: full health, unless they're down, and a `levelup` event for the
 * flash in their class's colour, which every friend in the room sees.
 */
import { WEAPONS } from '../shared/tuning';
import type { FightEvent, Hero, Intent } from './types';

export function grow(h: Hero, inp: Intent, ev: FightEvent[]): void {
  const seq = inp.levelSeq ?? 0;
  if (seq === (h.seen.level ?? 0)) return;
  h.seen.level = seq;
  if (h.act !== 'down') h.hp = h.maxHp;
  ev.push({ k: 'levelup', x: h.x, y: h.y, id: h.id, cls: WEAPONS[h.weapon].cls });
}
