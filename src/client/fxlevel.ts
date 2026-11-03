/**
 * A level grown (sim/grow.ts): rings of light opening at the hero's feet, motes rising round them and
 * a flash, all in the class's colour. A Rogue's is darker: smoke-black wisps and a dim violet. Cosmetic.
 */
import type { HeroClass } from '../shared/tuning';
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';

interface Glow { cols: string[]; light: [number, number, number]; i: number; dark?: string[] }
/** Warrior steel and gold, Ranger green, Rogue shadow, Mage arcane blue and violet, Cleric the Lantern's gold. */
export const LEVEL_GLOW: Record<HeroClass, Glow> = {
  WARRIOR: { cols: ['#ffd27a', '#e8eef2', '#d4a537', '#bfc8d2'], light: [1, 0.85, 0.55], i: 0.9 },
  RANGER: { cols: ['#9be070', '#d8ffb0', '#5fae4a'], light: [0.55, 1, 0.45], i: 0.8 },
  ROGUE: { cols: ['#7a4aa8', '#b08ae0', '#4a2a6a'], light: [0.4, 0.22, 0.65], i: 0.4, dark: ['#120c18', '#1e1428', '#2a1838'] },
  MAGE: { cols: ['#9fb8ff', '#c9a8ff', '#e8eeff', '#6a7aff'], light: [0.6, 0.6, 1], i: 0.9 },
  HEALER: { cols: ['#ffe9a8', '#fff6d8', '#ffd27a', '#ffb84a'], light: [1, 0.9, 0.6], i: 1 },
};

const mote = (fx: Fx, x: number, y: number, col: string, glow: boolean, up: number) => {
  const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 7, life = 0.7 + Math.random() * 0.7;
  fx.parts.push({ x: x + Math.cos(a) * r, y: y - 2 + Math.sin(a) * r * 0.6, vx: Math.cos(a) * 6, vy: -(up + Math.random() * up), life, max: life, col, glow, grav: -10, stick: false });
};

/** True if it was a level up (and has been drawn). */
export function levelFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  if (ev.k !== 'levelup') return false;
  const g = LEVEL_GLOW[ev.cls] ?? LEVEL_GLOW.WARRIOR;
  for (let i = 0; i < 3; i++) fx.rings.push({ x, y, life: 0.7 + i * 0.25, max: 0.7 + i * 0.25, col: g.cols[i % g.cols.length], size: 30 + i * 6 });
  for (let i = 0; i < 44; i++) mote(fx, x, y, g.cols[i % g.cols.length], true, 25);
  // The Rogue's own: shadow coming off them like smoke, drawn into the dark.
  if (g.dark) for (let i = 0; i < 36; i++) mote(fx, x, y, g.dark[i % g.dark.length], false, 14);
  fx.flashes.push({ x, y: y - 8, r: 70, i: g.i, c: g.light, life: 0.9, max: 0.9 });
  fx.say(x, y - 40, 'LEVEL UP', g.cols[0], 1.4);
  return true;
}
