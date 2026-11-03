/**
 * A level grown (sim/grow.ts): rings of light opening at the hero's feet, motes rising round them and
 * a flash, all in the class's colour. A Rogue's is darker: smoke-black wisps and a dim violet. Cosmetic.
 */
import type { HeroClass } from '../shared/tuning';
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';

interface Glow { cols: string[]; core: string; text?: string; light: [number, number, number]; i: number; dark?: string[] }
/** Warrior steel and gold, Ranger green, Rogue shadow, Mage arcane blue and violet, Cleric the Lantern's gold. */
export const LEVEL_GLOW: Record<HeroClass, Glow> = {
  WARRIOR: { core: '#ffffff', cols: ['#ffd27a', '#fff1c0', '#ffb43a', '#dfe8f0'], light: [1, 0.85, 0.55], i: 0.9 },
  RANGER: { core: '#f0ffe0', cols: ['#9be070', '#d8ffb0', '#5fae4a'], light: [0.55, 1, 0.45], i: 0.8 },
  ROGUE: { core: '#2a1838', text: '#b08ae0', cols: ['#7a4aa8', '#b08ae0', '#4a2a6a'], light: [0.4, 0.22, 0.65], i: 0.4, dark: ['#120c18', '#1e1428', '#2a1838'] },
  MAGE: { core: '#ffffff', cols: ['#9fb8ff', '#c9a8ff', '#e8eeff', '#6a7aff'], light: [0.6, 0.6, 1], i: 0.9 },
  HEALER: { core: '#ffffff', cols: ['#ffe9a8', '#fff6d8', '#ffd27a', '#ffb84a'], light: [1, 0.9, 0.6], i: 1 },
};

const mote = (fx: Fx, x: number, y: number, col: string, glow: boolean, up: number) => {
  const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 7, life = 0.7 + Math.random() * 0.7;
  fx.parts.push({ x: x + Math.cos(a) * r, y: y - 2 + Math.sin(a) * r * 0.6, vx: Math.cos(a) * 6, vy: -(up + Math.random() * up), life, max: life, col, glow, grav: -10, stick: false });
};

/** True if it was a level up (and has been drawn). */
export function levelFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  if (ev.k !== 'levelup') return false;
  const g = LEVEL_GLOW[ev.cls] ?? LEVEL_GLOW.WARRIOR;
  // Rings opening at the feet and round the chest, one after another.
  for (let i = 0; i < 6; i++) fx.rings.push({ x, y: y - (i % 2) * 9, life: 0.5 + i * 0.18, max: 0.5 + i * 0.18, col: g.cols[i % g.cols.length], size: 18 + i * 7 });
  // A halo of light standing round the body for a moment, opening slowly.
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2, r = 10 + (i % 3), life = 0.6 + Math.random() * 0.5;
    fx.parts.push({ x: x + Math.cos(a) * r, y: y - 7 + Math.sin(a) * r * 0.8, vx: Math.cos(a) * 9, vy: Math.sin(a) * 7 - 4, life, max: life, col: i % 4 ? g.cols[i % g.cols.length] : g.core, glow: true, grav: 0, stick: false });
  }
  // Sparks thrown out, then motes rising round the body.
  fx.burst(x, y - 8, 40, g.cols, 90, true);
  for (let i = 0; i < 140; i++) mote(fx, x, y, g.cols[i % g.cols.length], true, 35);
  // A column of light straight up through them.
  for (let i = 0; i < 40; i++) {
    const life = 0.5 + Math.random() * 0.5;
    fx.parts.push({ x: x + (Math.random() - 0.5) * 7, y: y - Math.random() * 20, vx: 0, vy: -(60 + Math.random() * 60), life, max: life, col: g.cols[1 % g.cols.length], glow: true, grav: 0, stick: false });
  }
  // The Rogue's own: shadow coming off them like smoke, drawn into the dark.
  if (g.dark) for (let i = 0; i < 120; i++) mote(fx, x, y, g.dark[i % g.dark.length], false, 20);
  fx.flashes.push({ x, y: y - 8, r: 90, i: g.i * 1.3, c: g.light, life: 1.2, max: 1.2 });
  fx.say(x, y - 40, 'LEVEL UP', g.text ?? g.cols[0], 1.4);
  return true;
}
