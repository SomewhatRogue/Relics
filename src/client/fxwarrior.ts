/**
 * The Warrior's weapons, seen (sim/warrior.ts decides them): a shield bash
 * rings dull and grey; the greatsword's
 * shockwave rolls out as wide as it reaches with stone thrown up; the spear's pin flashes steel with
 * PINNED. Cosmetic only, and the same overlay draws in both views.
 */
import { QUAKE } from '../shared/tuning';
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { PX } from './world';

const STONE = ['#8a8494', '#6a647a', '#c8c4d0'];

/** True if it was one of these (and has been drawn). */
export function warriorFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  switch (ev.k) {
    case 'shieldbash':
      fx.rings.push({ x, y: y - 8, life: 0.2, max: 0.2, col: '#c8c4d0', size: 12 });
      fx.burst(x, y - 8, 8, ['#c8c4d0', '#ffffff'], 55, true);
      fx.shake = Math.max(fx.shake, 2.5);
      return true;
    case 'quake': {
      // The ring grows out to the shockwave's real reach.
      const r = QUAKE.radius * PX;
      fx.rings.push({ x, y, life: 0.55, max: 0.55, col: '#ffe9a8', size: r }, { x, y, life: 0.45, max: 0.45, col: '#ffd27a', size: r * 0.75 }, { x, y, life: 0.35, max: 0.35, col: '#ffffff', size: r * 0.5 });
      fx.flashes.push({ x, y: y - 6, r: r * 2, i: 1.2, c: [1, 0.9, 0.6], life: 0.2, max: 0.2 });
      fx.crack(x, y, 14);
      fx.debris(x, y, 18);
      fx.burst(x, y, 22, STONE, 120, false, 260);
      fx.shake = Math.max(fx.shake, 7);
      return true;
    }
    case 'pin':
      fx.say(x, y - 38, 'PINNED', '#bfe4ff');
      fx.rings.push({ x, y: y - 6, life: 0.25, max: 0.25, col: '#e8f4ff', size: 12 });
      fx.flashes.push({ x, y: y - 6, r: 50, i: 1, c: [0.85, 0.92, 1], life: 0.14, max: 0.14 });
      fx.burst(x, y - 6, 12, ['#ffffff', '#bfe4ff', '#7a1d1d'], 80, true);
      fx.shake = Math.max(fx.shake, 3);
      return true;
  }
  return false;
}
