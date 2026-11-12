/**
 * The Rogue's blood and poison, seen (sim/venom.ts decides them): a skewer flashes white at the rapier's
 * tip with a spray of blood and SKEWERED; a bleed's tick drips red; a dart's poison puffs sickly green;
 * a goblin retching spews green ahead of it onto the floor, with RETCHING over it. Cosmetic only.
 */
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { shown } from '../shared/shown';

const BLOOD = ['#7a1d1d', '#9a2a2a', '#5a1414'], SICK = ['#9be040', '#6ab82a', '#c8e060'];

/** True if it was one of these (and has been drawn). */
export function venomFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  if (ev.k === 'skewer') {
    fx.say(x, y - 38, 'SKEWERED', '#ff8a7a');
    fx.flashes.push({ x, y: y - 8, r: 46, i: 1, c: [1, 1, 1], life: 0.12, max: 0.12 });
    fx.rings.push({ x, y: y - 8, life: 0.22, max: 0.22, col: '#ffffff', size: 10 });
    fx.burst(x, y - 8, 16, BLOOD, 85, false, 200, true);
    fx.shake = Math.max(fx.shake, 2.5);
    return true;
  }
  if (ev.k === 'hit' && ev.tick && ev.src === 'bleed') {
    fx.burst(x, y - 8, 4, BLOOD, 25, false, 180, true);
    fx.say(x, y - 20, String(shown(ev.n)), '#d8402a');
    return true;
  }
  if (ev.k === 'envenom') {
    fx.burst(x, y - 10, 8, SICK, 35, true);
    return true;
  }
  if (ev.k === 'puke') {
    // A gout ahead of it, falling to the floor and staying there a while.
    fx.say(x, y - 38, 'RETCHING', '#9be040');
    const l = Math.hypot(ev.dx, ev.dy) || 1, dx = ev.dx / l, dy = ev.dy / l;
    for (let i = 0; i < 26; i++) {
      const s = 40 + Math.random() * 50, j = (Math.random() - 0.5) * 0.7, life = 0.4 + Math.random() * 0.4;
      fx.parts.push({ x: x + dx * 3, y: y - 10, vx: (dx - dy * j) * s, vy: (dy + dx * j) * s * 0.6 - 25, life, max: life, col: SICK[i % 3], glow: false, grav: 220, stick: true });
    }
    fx.flashes.push({ x, y: y - 6, r: 40, i: 0.6, c: [0.55, 1, 0.3], life: 0.2, max: 0.2 });
    return true;
  }
  return false;
}
