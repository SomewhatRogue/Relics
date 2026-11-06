/**
 * A pack rush and the ironhide, as effects (sim/packrush.ts, sim/ironhide.ts): the rest of a rush met by
 * one block throw sparks without saying BLOCK or STUNNED again; an ironhide's guard
 * breaking says ARMOR BROKEN, with iron flying off and a gold flash; a blow on its plates still whole
 * throws grey sparks (the hit's own number says how little got through). Cosmetic only.
 */
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';

/** True if it was one of these (and has been drawn). A plated hit is drawn here and by the hit's own case. */
export function rushFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  if (ev.k === 'cracked') {
    fx.say(x, y - 34, 'ARMOR BROKEN', '#ffd040', 1.1);
    fx.burst(x, y - 10, 14, ['#ffffff', '#ffd040', '#fff1b0'], 80, true);
    fx.burst(x, y - 10, 8, ['#5e5a58', '#9a968f', '#34302f'], 70, false, 220, true);
    fx.flashes.push({ x, y: y - 10, r: 50, i: 1.2, c: [1, 0.85, 0.4], life: 0.2, max: 0.2 });
    fx.shake = Math.max(fx.shake, 2.5);
    return true;
  }
  // The rest of a rush met by the one guard: sparks and stars, the words once (BLOCK, STUNNED).
  if ((ev.k === 'block' || ev.k === 'stunned') && ev.more) {
    fx.burst(x, y - 8, 6, ev.k === 'block' ? ['#ffd27a', '#ff9a40', '#ffffff'] : ['#ffffff', '#cfe8ff', '#9fd0ff'], 80, true);
    return true;
  }
  if (ev.k === 'hit' && ev.plated) fx.burst(x, y - 10, 6, ['#d8d4cc', '#9a968f', '#ffffff'], 60, true);
  return false;
}
