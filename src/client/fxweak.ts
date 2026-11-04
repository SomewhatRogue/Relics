/**
 * WEAK and RESIST over a foe (shared/weakness.ts): WEAK bright in the colour of what landed it, with a
 * spray of sparks; RESIST small and grey, a short dull blip. SHRUGS IT OFF, as quiet: a goblin the same
 * hero stunned too lately to stun again (sim/stuns.ts). BLOCKED with sparks off the wood: a shot stopped
 * on a shield-bearer's board (sim/board.ts). Cosmetic only.
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
  if (ev.k === 'deflect') {
    fx.say(x, y - 30, 'BLOCKED', '#c8b090');
    fx.burst(x, y - 10, 9, ['#ffffff', '#ffd27a', '#c8b090'], 65, true);
    fx.burst(x, y - 8, 4, ['#8a6a40', '#6a5030'], 35, false);
    return true;
  }
  if (ev.k === 'shrug') {
    fx.say(x, y - 40, 'SHRUGS IT OFF', '#8a8794', 0.45);
    return true;
  }
  if (ev.k === 'resist') {
    // Quieter than a weakness: it says so once, and gets out of the way.
    fx.say(x, y - 40, 'RESIST', '#8a8794', 0.45);
    return true;
  }
  return false;
}
