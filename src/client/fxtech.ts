/**
 * The class techniques firing, seen (sim/techwarrior.ts, techrogue.ts, techranger.ts, techcleric.ts
 * decide them): small tells so a player learns a technique did something, words over only three of
 * them (IRON FEET, a slip into hiding, and STUNNED, said already by the stun itself). Cosmetic only;
 * the same overlay draws in both views.
 */
import { SLAM_BURST } from '../shared/techniques';
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { PX } from './world';

const GOLD = ['#ffd27a', '#ffe9a8', '#ffffff'], DUST = ['#8a8494', '#6a647a', '#c8c4d0'], BLOOD = ['#7a1d1d', '#9a2a2a', '#5a1414'];

/** True if it was one of these (and has been drawn). */
export function techFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  switch (ev.k) {
    case 'slamburst':
      // The ring reaches as far as the bursts did.
      fx.rings.push({ x, y, life: 0.3, max: 0.3, col: '#e0d8c8', size: SLAM_BURST.reach * PX });
      fx.debris(x, y - 2, 10);
      fx.shake = Math.max(fx.shake, 4);
      return true;
    case 'shoulderready':
      // A kick of dust at the heels: the next blow carries the shoulder.
      fx.burst(x, y, 8, DUST, 35, false, 160, true);
      fx.rings.push({ x, y: y - 8, life: 0.2, max: 0.2, col: '#e0d8c8', size: 9 });
      return true;
    case 'shoulder':
      fx.burst(x, y - 6, 14, DUST, 80, false, 220, true);
      fx.rings.push({ x, y: y - 6, life: 0.25, max: 0.25, col: '#e0d8c8', size: 14 });
      fx.shake = Math.max(fx.shake, 3.5);
      return true;
    case 'ironfeet':
      fx.say(x, y - 40, 'IRON FEET', '#c8c4d0');
      fx.burst(x, y, 10, DUST, 40, false, 200, true);
      fx.rings.push({ x, y, life: 0.25, max: 0.25, col: '#c8c4d0', size: 12 });
      return true;
    case 'cutbleed':
      fx.burst(x, y - 8, 10, BLOOD, 60, false, 200, true);
      return true;
    case 'slipaway':
      fx.say(x, y - 34, 'GONE', '#c9a8ff');
      fx.burst(x, y - 8, 16, ['#3a3346', '#5a5468', '#6a5a8a'], 40, false);
      return true;
    case 'cutpurse':
      fx.burst(x, y - 10, 10, ['#ffd27a', '#d4a537', '#ffffff'], 55, true, 220, false);
      return true;
    case 'quicknock':
      // A glint on the string: the next is on already.
      fx.rings.push({ x, y: y - 12, life: 0.18, max: 0.18, col: '#ffffff', size: 7 });
      fx.burst(x, y - 12, 5, ['#ffffff', '#e8f4ff'], 30, true);
      return true;
    case 'steady':
      fx.burst(x, y - 12, 3, ['#e8f4ff'], 18, true);
      return true;
    case 'mending':
      fx.rings.push({ x, y, life: 0.5, max: 0.5, col: '#ffe9a8', size: 16 });
      fx.burst(x, y - 6, 12, GOLD, 30, true);
      return true;
    case 'sanctstep':
      fx.burst(x, y - 4, 10, GOLD, 40, true);
      return true;
    case 'judged':
      fx.rings.push({ x, y: y - 8, life: 0.3, max: 0.3, col: '#ffe9a8', size: 16 });
      fx.flashes.push({ x, y: y - 8, r: 60, i: 1.2, c: [1, 0.92, 0.6], life: 0.16, max: 0.16 });
      fx.burst(x, y - 8, 14, GOLD, 70, true);
      return true;
  }
  return false;
}
