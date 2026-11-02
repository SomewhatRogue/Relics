/**
 * WEAK and RESIST over a foe (shared/weakness.ts): WEAK bright in the colour of what landed it, with a
 * spray of sparks; RESIST small and grey, a short dull blip. Cosmetic only.
 */
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { EL_COL } from './palette';

/** True if it was one of these (and has been drawn). */
export function weakFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  if (ev.k === 'weak') {
    const col = ev.el === 'physical' ? '#ffb040' : EL_COL[ev.el];
    fx.say(x, y - 42, 'WEAK', col);
    fx.burst(x, y - 8, 6, [col, '#fff1b0'], 55, true);
    return true;
  }
  if (ev.k === 'resist') {
    // Quieter than a weakness: it says so once, and gets out of the way.
    fx.say(x, y - 40, 'RESIST', '#8a8794', 0.45);
    return true;
  }
  return false;
}
