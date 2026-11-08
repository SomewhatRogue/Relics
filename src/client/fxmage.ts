/**
 * The Mage's kits, seen (sim/spells.ts, staffwall.ts and spellblade.ts decide them): magic spent rises
 * off the hero in violet (-40 MAGIC); a spell with too little magic behind it fizzles in grey smoke with NOT ENOUGH MAGIC; a
 * wand's spark that breaks a blow off throws a violet star and INTERRUPTED; the staff's slash sweeps an
 * arc of its element; the spellblade's shield flashes when a hit takes magic, shatters when it runs out,
 * and a dodge through a blow gives magic back, rising off you. The held spells are
 * fxspells.ts. Cosmetic only; the one overlay draws in both views.
 */
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { EL_COL, EL_LIGHT } from './palette';
import { PX } from './world';
import { spellFx } from './fxspells';

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
  if (spellFx(fx, ev, x, y)) return true;
  switch (ev.k) {
    case 'magic':
      fx.say(x, y - 22, `-${ev.n} MAGIC`, '#c9a8ff', 0.6);
      fx.burst(x, y - 10, 6, VIOLET, 30, true);
      return true;
    case 'early':
      fx.burst(x, y - 10, 8, SMOKE, 22, false, -30);
      return true;
    case 'fizzle':
      fx.say(x, y - 30, 'NOT ENOUGH MAGIC', '#a8a0b8');
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
    // The spellblade's shield (the ward itself is blademark.ts, drawn from the hero): a hit takes magic
    // with a white flash, the ward breaking throws shards, a dodge through a blow's magic back rises off you.
    case 'manaward':
      fx.say(x, y - 22, `-${ev.n} MAGIC`, '#c9a8ff', 0.6);
      fx.burst(x, y - 10, 8, ['#ffffff', ...VIOLET], 55, true);
      fx.flashes.push({ x, y: y - 10, r: 34, i: 0.7, c: [0.85, 0.75, 1], life: 0.1, max: 0.1 });
      return true;
    case 'manabreak':
      fx.burst(x, y - 10, 18, ['#ffffff', ...VIOLET], 95, true);
      fx.rings.push({ x, y: y - 10, life: 0.25, max: 0.25, col: '#ffffff', size: 16 });
      fx.shake = Math.max(fx.shake, 2);
      return true;
    case 'manaup':
      fx.say(x, y - 30, `+${ev.n} MAGIC`, '#c9a8ff', 0.7);
      fx.rings.push({ x, y: y - 10, life: 0.3, max: 0.3, col: '#c9a8ff', size: 11 });
      fx.burst(x, y - 10, 8, VIOLET, 40, true, -30);
      return true;
  }
  return false;
}
