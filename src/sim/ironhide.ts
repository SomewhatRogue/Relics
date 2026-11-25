/**
 * The ironhide (numbers: shared/raiders.ts IRONHIDE) and every plated goblin's plate (shared/plate.ts). Plate
 * wears down and, at none, comes off for good (Kyle, 2026-11-24: was a 3 s crack that closed again). While on,
 * an ordinary blow does a fifth to health; a heavy one lands in full and strips double; crits, bleed, poison,
 * crossbow bolts, anything holy and lightning go straight through (lightning strips it too). Both views draw
 * `cracked` once it's off. It walks at a middling pace and swings one heavy, readable blow to block or dodge.
 */
import { IRONHIDE } from '../shared/tuning';
import { PLATE, PLATE_WEAR } from '../shared/plate';
import { begin, walk } from './enemies';
import type { Enemy, FightEvent, Hero } from './types';
import { hasAffix } from './elite';

/** In plates: an ironhide, or a Plated elite (shared/elites.ts: the ironhide rule). */
/** (The Haulier's plate comes off for good in phase 2: boss.bare, sim/haulbook.ts.) */
/** (And a hunt's named boss in a fury wears some: PLATE_WEAR.boss, Kyle 2026-11-24.) */
export const armoured = (e: Enemy) => !e.boss?.bare && (e.variant === 'ironhide' || hasAffix(e, 'plated') || !!e.fury);
const iron = armoured;
/** Its plate when full: a share of its health, as it is when first struck (after its level and party). */
const fullPlate = (e: Enemy) => Math.round(e.maxHp * (e.fury ? PLATE_WEAR.boss : PLATE.share));
/** What's left of its plate (filled the first time it's asked). */
export const plateOf = (e: Enemy) => e.plate ?? (e.plate = fullPlate(e));
/** Its plates are off, for good (`now` kept for the callers' sake). */
export const broken = (e: Enemy, _now?: number) => iron(e) && plateOf(e) <= 0;

/** `k` off its plate; at none, they're off for good. */
function strip(e: Enemy, k: number, now: number, ev: FightEvent[]): void {
  if (broken(e)) return;
  e.plate = Math.max(0, plateOf(e) - Math.round(k));
  e.crackAt = now;
  if (e.plate === 0) (e.cracked = true), ev.push({ k: 'cracked', x: e.x, y: e.y });
}

/** A rod's strike, a column, a cart: a big piece of its plate off at once. */
export function crack(e: Enemy, now: number, ev: FightEvent[]): void {
  if (!iron(e) || e.act === 'dead') return;
  strip(e, Math.max(1, fullPlate(e) * PLATE.crack), now, ev);
}

/** How a blow meets the plate: '' an ordinary one, 'through' straight past it, 'storm' past it and stripping it. */
export type PlateHow = '' | 'through' | 'storm';

/**
 * What a blow of `n` does to its health, wearing the plate as it goes: all of it once the plates are off, or
 * through them; a heavy one (`breaks`) all of it, stripping double; else a fifth. Anything unplated takes `n`.
 */
export function plated(e: Enemy, n: number, now: number, breaks: boolean, ev: FightEvent[], how: PlateHow = ''): number {
  if (!iron(e) || n <= 0 || broken(e)) return n;
  if (how === 'through') return n;
  if (how === 'storm') return strip(e, n * PLATE.storm, now, ev), n;
  if (breaks) return strip(e, n * PLATE.heavy, now, ev), n;
  strip(e, n, now, ev);
  return Math.max(1, Math.round(n * PLATE.through));
}

/** What's left of its plate as a share of full, for drawing (null: no plate, or off for good). Reads, never fills. */
export function plateShare(e: Enemy): number | null {
  if (!iron(e) || (e.plate ?? 1) <= 0) return null;
  return e.plate === undefined ? 1 : e.plate / Math.max(1, fullPlate(e));
}

/** Still plated: the hit the room reports says so (grey sparks, a clank). */
export const clanks = (e: Enemy, now: number) => iron(e) && !broken(e, now);

/** Its turn: walk in and swing. */
export function stepIronhide(e: Enemy, t: Hero, d: number, level: boolean, ux: number, uy: number, facing: number, speed: number, dt: number, ev: FightEvent[]): void {
  if (level && d <= IRONHIDE.reach && e.cooldown <= 0 && facing > 0.75) {
    begin(e, 'cleave', IRONHIDE.swing, t, ev);
    return;
  }
  if (d > IRONHIDE.reach * 0.8) walk(e, ux, uy, speed * IRONHIDE.speed * Math.max(0.2, facing), dt);
}
