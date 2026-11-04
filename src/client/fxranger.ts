/**
 * The Ranger's weapons, seen (sim/rangershots.ts and sim/crossbow.ts decide them): a longbow's perfect
 * arrow flashes white on the goblin with BLINDED; a shortbow's perfect arrow strikes with a clean white
 * spark; a glinted bolt leaves a bright line down everything it ran through; the crossbow clicks as it's
 * wound, and a bolt wound on in one go throws a star of light. Cosmetic only, and the same overlay draws
 * in both views.
 */
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { toPx } from './world';

const WHITE = ['#ffffff', '#e8f0ff', '#cfe0ff'], STEEL = ['#cfd6dc', '#9aa3ad'], GLINT = ['#ffffff', '#fff3c0', '#bfe8ff'];

/** True if it was one of these (and has been drawn). */
export function rangerFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  switch (ev.k) {
    case 'blinded':
      fx.say(x, y - 38, 'BLINDED', '#e8f0ff');
      fx.flashes.push({ x, y: y - 12, r: 60, i: 1.4, c: [1, 1, 1], life: 0.22, max: 0.22 });
      fx.rings.push({ x, y: y - 12, life: 0.3, max: 0.3, col: '#ffffff', size: 14 });
      fx.burst(x, y - 12, 16, WHITE, 70, true);
      fx.shake = Math.max(fx.shake, 2);
      return true;
    case 'trueshot':
      fx.rings.push({ x, y: y - 8, life: 0.2, max: 0.2, col: '#ffffff', size: 9 });
      fx.flashes.push({ x, y: y - 8, r: 36, i: 1, c: [1, 1, 1], life: 0.1, max: 0.1 });
      fx.burst(x, y - 8, 9, WHITE, 60, true);
      return true;
    case 'boltline': {
      const [x2, y2] = toPx(ev.x2, ev.y2);
      fx.arcs.push({ x, y, x2, y2, life: 0.4, col: '#fff3c0', straight: true });
      fx.flashes.push({ x: x2, y: y2 - 8, r: 44, i: 1.2, c: [1, 0.95, 0.75], life: 0.14, max: 0.14 });
      fx.burst(x2, y2 - 8, 10, GLINT, 80, true);
      fx.shake = Math.max(fx.shake, 3);
      return true;
    }
    case 'wind':
      return true;
    case 'loaded':
      fx.burst(x, y - 10, 4, STEEL, 20, false);
      return true;
    case 'glint':
      fx.rings.push({ x, y: y - 10, life: 0.35, max: 0.35, col: '#fff3c0', size: 12 });
      fx.flashes.push({ x, y: y - 10, r: 40, i: 1.2, c: [1, 0.97, 0.8], life: 0.2, max: 0.2 });
      fx.burst(x, y - 10, 10, GLINT, 45, true);
      return true;
  }
  return false;
}
