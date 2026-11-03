/**
 * Spiders' effects: a nest splitting as a wave comes out, or catching when it's set alight; a
 * hero poisoned (a puff of green) or cured, a glob landing, and a spider bursting into dark ichor
 * instead of blood. Cosmetic, so Math.random is fine.
 */
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';

const ICHOR = ['#1e2a12', '#2a3a16', '#3a4a1e'], VENOM = ['#9be040', '#6ab82a', '#d8ff8a'];

/** True if it was a spider's event (and has been drawn). */
export function spiderFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  switch (ev.k) {
    case 'hatch':
      fx.burst(x, y - 6, 14, ['#c8bfa8', '#e0d8c0', '#8a8494'], 60, false, 140, true);
      fx.burst(x, y - 8, 8, VENOM, 40, true);
      fx.shake = Math.max(fx.shake, 1);
      return true;
    case 'torched':
      fx.burst(x, y - 8, 22, ['#fff1b0', '#ffd27a', '#ff9a3c', '#ff6a20'], 70, true);
      fx.flashes.push({ x, y: y - 8, r: 70, i: 0.9, c: [1, 0.6, 0.25], life: 0.35, max: 0.35 });
      fx.shake = Math.max(fx.shake, 1.5);
      return true;
    // A house: its kindling catching; a goblin driven out of the door in a puff of smoke; a chest's charred leavings; someone inside choking.
    case 'houselit':
      fx.burst(x, y - 6, 18, ['#fff1b0', '#ffd27a', '#ff9a3c', '#ff6a20'], 60, true);
      fx.flashes.push({ x, y: y - 6, r: 60, i: 0.8, c: [1, 0.6, 0.25], life: 0.3, max: 0.3 });
      return true;
    case 'flushed':
      fx.burst(x, y - 10, 14, ['#3a3438', '#5a5458', '#2a2428'], 50, false, 60, true);
      fx.burst(x, y - 8, 6, ['#ffd27a', '#ff6a20'], 40, true);
      return true;
    case 'charred':
      fx.burst(x, y - 4, 10, ['#1a1410', '#3a2a20', '#ff6a20'], 40, false, 120, true);
      return true;
    case 'choke':
      fx.burst(x, y - 16, 4, ['#5a5458', '#3a3438'], 20, false, 40, true);
      return true;
    case 'poisoned':
      fx.burst(x, y - 10, 6, VENOM, 30, true);
      return true;
    case 'cured':
      fx.burst(x, y - 10, 8, ['#ffffff', '#d8ff8a'], 40, true);
      return true;
    case 'splat':
      fx.burst(x, y - 2, 16, VENOM, 70, true);
      fx.burst(x, y - 2, 10, ICHOR, 50, false, 120, true);
      fx.flashes.push({ x, y: y - 4, r: 40, i: 0.6, c: [0.55, 0.95, 0.3], life: 0.2, max: 0.2 });
      fx.shake = Math.max(fx.shake, 1.5);
      return true;
    case 'death':
      if (ev.kind !== 'spider' && ev.kind !== 'brood' && ev.kind !== 'nest') return false;
      fx.burst(x, y - 4, ev.kind === 'spider' ? 8 : 22, ICHOR, ev.kind === 'spider' ? 45 : 70, false, 160, true);
      if (ev.how === 'burn') fx.burst(x, y - 6, 6, ['#ffd27a', '#ff9a3c', '#3a3030'], 40, true);
      return true;
  }
  return false;
}
