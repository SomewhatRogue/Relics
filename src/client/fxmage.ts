/**
 * The Mage's kits, seen (sim/spells.ts, staffwall.ts and spellblade.ts decide them): magic spent rises
 * off the hero in violet; a spell with no stamina behind it fizzles in grey smoke with NOT ENOUGH STAMINA; a
 * wand's spark that breaks a blow off throws a violet star and INTERRUPTED; the staff's slash sweeps an
 * arc of its element; a wall going up flashes along its length (the big one with a ring at each end);
 * the blade wreathed flares, a full blade glints, a caught blow rings in violet with CAUGHT, and the last
 * wreathed swing sends a wave of the element ahead. Cosmetic only; the one overlay draws in both views.
 */
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { EL_COL, EL_LIGHT } from './palette';
import { PX } from './world';

const VIOLET = ['#c9a8ff', '#ffffff', '#9a78e0'], SMOKE = ['#6a647a', '#8a8494', '#4f4a5c'];

/** Particles along an arc ahead of (x, y) facing (dx, dy): `r` px out, `arc` degrees wide. */
function sweep(fx: Fx, x: number, y: number, dx: number, dy: number, r: number, arc: number, cols: string[], n: number, speed: number): void {
  const fa = Math.atan2(dy, dx), half = (arc / 2) * (Math.PI / 180);
  for (let i = 0; i < n; i++) {
    const a = fa - half + (2 * half * i) / Math.max(1, n - 1), d = r * (0.6 + 0.4 * Math.random()), life = 0.2 + Math.random() * 0.2;
    fx.parts.push({ x: x + Math.cos(a) * d, y: y - 8 + Math.sin(a) * d * 0.8, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed * 0.8, life, max: life, col: cols[i % cols.length], glow: true, grav: 0, stick: false });
  }
}

/** True if it was one of these (and has been drawn). */
export function mageFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  switch (ev.k) {
    case 'magic':
      fx.say(x, y - 22, '-' + ev.n, '#c9a8ff', 0.6);
      fx.burst(x, y - 10, 6, VIOLET, 30, true);
      return true;
    case 'fizzle':
      fx.say(x, y - 30, 'NOT ENOUGH STAMINA', '#a8a0b8');
      fx.burst(x, y - 10, 10, SMOKE, 25, false, -40);
      return true;
    case 'interrupt':
      fx.say(x, y - 38, 'INTERRUPTED', '#d8c0ff');
      fx.rings.push({ x, y: y - 12, life: 0.3, max: 0.3, col: '#c9a8ff', size: 14 });
      fx.flashes.push({ x, y: y - 12, r: 50, i: 1.2, c: [0.8, 0.65, 1], life: 0.16, max: 0.16 });
      fx.burst(x, y - 12, 18, VIOLET, 80, true);
      fx.shake = Math.max(fx.shake, 2);
      return true;
    case 'slash': {
      const col = EL_COL[ev.el];
      sweep(fx, x, y, ev.dx, ev.dy, 1.6 * PX, 150, [col, '#ffffff', col], 14, 40);
      fx.flashes.push({ x: x + ev.dx * 16, y: y - 8 + ev.dy * 12, r: 36, i: 0.8, c: EL_LIGHT[ev.el], life: 0.12, max: 0.12 });
      return true;
    }
    case 'bladewave': {
      const col = EL_COL[ev.el];
      for (const r of [0.8, 1.4, 2]) sweep(fx, x, y, ev.dx, ev.dy, r * PX, 100, [col, '#ffffff'], 10, 90);
      fx.flashes.push({ x: x + ev.dx * 24, y: y - 8 + ev.dy * 18, r: 60, i: 1.2, c: EL_LIGHT[ev.el], life: 0.18, max: 0.18 });
      fx.shake = Math.max(fx.shake, 2);
      return true;
    }
    case 'wallup': {
      const col = EL_COL[ev.el], tx = -ev.dy, ty = ev.dx, half = (ev.len / 2) * PX, n = Math.round(ev.len * (ev.big ? 9 : 6));
      for (let i = 0; i <= n; i++) {
        const k = -1 + (2 * i) / n;
        fx.burst(x + tx * half * k, y + ty * half * k * 0.8 - 4, 1, [col, '#ffffff'], 40, true, 60);
      }
      fx.flashes.push({ x, y: y - 8, r: half * 1.6, i: ev.big ? 1.5 : 1, c: EL_LIGHT[ev.el], life: 0.22, max: 0.22 });
      if (ev.big) for (const s of [-1, 1]) fx.rings.push({ x: x + tx * half * s, y: y + ty * half * s * 0.8 - 6, life: 0.4, max: 0.4, col: '#ffffff', size: 14 });
      fx.shake = Math.max(fx.shake, ev.big ? 4 : 2);
      return true;
    }
    case 'wreathe':
      fx.burst(x, y - 12, 18, [EL_COL[ev.el], '#ffffff'], 60, true);
      fx.rings.push({ x, y: y - 10, life: 0.3, max: 0.3, col: EL_COL[ev.el], size: 12 });
      return true;
    case 'bladefull':
      fx.rings.push({ x, y: y - 10, life: 0.3, max: 0.3, col: '#c9a8ff', size: 10 });
      fx.burst(x, y - 10, 8, VIOLET, 40, true);
      return true;
    case 'caught':
      fx.say(x, y - 36, 'CAUGHT', '#d8c0ff');
      fx.rings.push({ x, y: y - 12, life: 0.35, max: 0.35, col: '#c9a8ff', size: 16 });
      fx.flashes.push({ x, y: y - 12, r: 56, i: 1.3, c: [0.8, 0.65, 1], life: 0.18, max: 0.18 });
      fx.burst(x, y - 12, 20, ['#ffffff', '#c9a8ff', '#e8dcff'], 90, true);
      fx.shake = Math.max(fx.shake, 2);
      return true;
  }
  return false;
}
