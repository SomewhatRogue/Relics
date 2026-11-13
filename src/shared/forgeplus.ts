/**
 * Halvard's pluses (Kyle, 2026-11-06: "I want to see attributes increase each plus, up to +5, but a lot
 * more expensive, and you always have to forge yourself"). Every piece but hungry gear goes from +0 to +5.
 * Each plus adds a flat share of the piece's base (not compounding), so +5 is half again what it was:
 * - `mods`: each modifier on it grows by a tenth of its base.
 * - `damage`: a weapon hits 10% harder (of the kit's base blow).
 * - `tough`: armor takes 2% less damage (of any weight, light too).
 * - `health`: a ring gives 3 more health.
 * These go on after the modifier caps (gear.ts gearStats), so a plus always shows.
 *
 * Gold for the next plus (index = the plus reached) on a FORGED piece, times the tier's share: a job pays
 * about 100 to 250 gold with its kills (jobs.ts payFor, BOUNTY), so a Forged piece to +5 (3160) is some
 * fifteen to twenty-five jobs. Steel is as it was.
 */
import type { Item, Tier } from './loot.js';
import { jobs } from './coins.js';

export const PLUS_CAP = 5;
export const PLUS = { mods: 0.1, damage: 0.1, tough: 0.02, health: 3 };
/** In jobs of copper: +1 a job, +3 five, +4 and +5 weeks of play (economy.md section 3: mostly found or forged). */
export const PLUS_GOLD = [0, jobs(1), jobs(2.5), jobs(5), jobs(30), jobs(60)];
export const PLUS_STEEL = [0, 2, 5, 10, 20, 35];
export const PLUS_TIER: Record<Tier, number> = { plain: 0.5, fine: 0.75, forged: 1, tolmouth: 1.4, touched: 1.8, turning: 2.2, hungry: 0 };

/** A piece's plus, 0 to PLUS_CAP, whatever a save says. */
export const plusOf = (i: Item) => Math.max(0, Math.min(PLUS_CAP, Math.floor(Number(i.level) || 0)));

/** Gold and steel for the next plus, or null at +5 (and never for hungry gear). */
export function plusCost(i: Item): { gold: number; steel: number } | null {
  const to = plusOf(i) + 1;
  if (i.quality === 'hungry' || i.hungry || to > PLUS_CAP) return null;
  return { gold: Math.round((PLUS_GOLD[to] * PLUS_TIER[i.quality]) / 5) * 5, steel: PLUS_STEEL[to] };
}

/** Old saves: a piece over +5 comes down to +5 (its temper stays; gear.ts temperOf reads it to the cap). */
export const fitPlus = (i: Item): Item => ((Number(i.level) || 0) > PLUS_CAP ? { ...i, level: PLUS_CAP } : i);
