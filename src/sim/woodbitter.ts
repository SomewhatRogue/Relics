/**
 * The Bitter in the wood (Kyle, 2026-11-12: "first thing you get hit ... hit this button to heal, and
 * then you heal up, and then he gives you another 2"). The first time you're hurt with Hew still alive,
 * the world stops on his card with one Bitter in your hand and the POTION button shown; once it's drunk he
 * hands you two more in passing, the belt full.
 */
import { LINES } from '../shared/wood';
import type { ArenaRoom } from './room';
import type { Hero } from './types';
import type { WoodState } from './wood';
import { say } from './woodkit';

/** True when it stopped the world this frame. */
export function stepBitter(w: WoodState, room: ArenaRoom, h: Hero): boolean {
  if (w.stage >= 4 || h.hp <= 0 || h.act === 'down') return false;
  if (!w.bitter && h.hp < h.maxHp - 0.5) {
    w.bitter = 'drink';
    h.belt = ['bitter'];
    w.hold = { kind: 'card', who: 'HEW', text: LINES.bitter, how: LINES.how.potion, need: 'potion', t: 0, until: 0 };
    return true;
  }
  if (w.bitter === 'drink' && !h.belt.length) {
    w.bitter = 'done';
    h.belt = ['bitter', 'bitter'];
    say(w, room, 'HEW', LINES.bitterMore, 3);
  }
  return false;
}
