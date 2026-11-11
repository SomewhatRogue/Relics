/**
 * The ironhide (numbers: shared/raiders.ts IRONHIDE): a goblin in scraps of iron. Until its guard is
 * broken anything that lands on it does IRONHIDE.armour of itself. A charged blow or a perfect (or any
 * heavy hit: a burst, a crit) breaks it, and for IRONHIDE.broken seconds it takes
 * full damage, its plates knocked askew (both views draw `cracked`). It walks at a middling pace and
 * swings one heavy, readable blow to block or dodge.
 */
import { IRONHIDE } from '../shared/tuning';
import { begin, walk } from './enemies';
import type { Enemy, FightEvent, Hero } from './types';
import { hasAffix } from './elite';

/** In plates: an ironhide, or a Plated elite (shared/elites.ts: the ironhide rule). */
/** (The Haulier's plate comes off for good in phase 2: boss.bare, sim/haulbook.ts.) */
export const armoured = (e: Enemy) => !e.boss?.bare && (e.variant === 'ironhide' || hasAffix(e, 'plated'));
const iron = armoured;
export const broken = (e: Enemy, now: number) => (e.crackUntil ?? -9) > now;

/** Its guard breaks (or the window starts over). */
export function crack(e: Enemy, now: number, ev: FightEvent[]): void {
  if (!iron(e) || e.act === 'dead') return;
  if (!broken(e, now)) ev.push({ k: 'cracked', x: e.x, y: e.y });
  Object.assign(e, { crackUntil: now + IRONHIDE.broken, crackAt: now, cracked: true });
}

/**
 * What a blow of `n` does to it: all of it once the guard is broken (and a blow that `breaks` breaks
 * it, landing in full), else IRONHIDE.armour of it. Anything that isn't an ironhide takes `n`.
 */
export function plated(e: Enemy, n: number, now: number, breaks: boolean, ev: FightEvent[]): number {
  if (!iron(e) || n <= 0 || broken(e, now)) return n;
  if (breaks) return crack(e, now, ev), n;
  return Math.max(1, Math.round(n * IRONHIDE.armour));
}

/** Still plated: the hit the room reports says so (grey sparks, a clank). */
export const clanks = (e: Enemy, now: number) => iron(e) && !broken(e, now);

/** Once a tick, before the goblins move: a broken guard closes again when its time is up. */
export function crackWatch(enemies: Enemy[], now: number): void {
  for (const e of enemies) if (e.cracked && !broken(e, now)) e.cracked = false;
}

/** Its turn: walk in and swing. */
export function stepIronhide(e: Enemy, t: Hero, d: number, level: boolean, ux: number, uy: number, facing: number, speed: number, dt: number, ev: FightEvent[]): void {
  if (level && d <= IRONHIDE.reach && e.cooldown <= 0 && facing > 0.75) {
    begin(e, 'cleave', IRONHIDE.swing, t, ev);
    return;
  }
  if (d > IRONHIDE.reach * 0.8) walk(e, ux, uy, speed * IRONHIDE.speed * Math.max(0.2, facing), dt);
}
