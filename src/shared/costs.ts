/**
 * The three rare tiers are dangerous (Kyle, 2026-11-05: "orange, yellow and red are really good but rare
 * and dangerous"). Red, HUNGRY, is plain steel the hunger has taken (hungry.ts): a gift, a named cost,
 * the Want, the church. Below it the same thing caught partway: TOUCHED (yellow) has only just begun,
 * TURNING (orange) is most of the way. Each carries one COST the fight feels, worth budget points like a
 * modifier but taken away, and each grows the Want a little for every job it's worn on.
 */
import type { Rng } from './rng.js';
import type { HeroClass } from './weapons.js';
import type { Item, Tier } from './loot.js';
import { band } from './mods.js';

export type CostId = NonNullable<Item['cost']>['id'];
/** Each cost: what one unit (1%, or 1 health) is worth in points, and its words for a value (a Mage's bar is magic). */
export const COSTS: Record<CostId, { unit: '%' | ''; per: number; text: (n: number, cls?: HeroClass) => string }> = {
  taken: { unit: '%', per: 1, text: (n) => `You take ${n}% more damage.` },
  winded: { unit: '%', per: 0.5, text: (n, cls) => `${cls === 'MAGE' ? 'Magic' : 'Stamina'} refills ${n}% slower.` },
  slow: { unit: '%', per: 1, text: (n) => `You move ${n}% slower.` },
  frail: { unit: '', per: 0.6, text: (n) => `${n} less health.` },
  dull: { unit: '%', per: 0.8, text: (n) => `Skill and relic recharge ${n}% slower.` },
};
export const COST_ORDER = Object.keys(COSTS) as CostId[];
/** Points a cost takes back, by tier (only the two that carry one). */
export const COST_POINTS: Partial<Record<Tier, number>> = { touched: 8, turning: 14 };
/** The Want each piece grows by, for every job it's worn on (hungry pieces have their own, hungry.ts). */
export const TIER_WANT: Partial<Record<Tier, number>> = { touched: 1, turning: 2 };

export const costValue = (id: CostId, pts: number) => (COSTS[id].unit === '' ? Math.max(1, Math.round(pts / COSTS[id].per)) : Math.round(pts / COSTS[id].per) / 100);
export const costPoints = (c: NonNullable<Item['cost']>) => (COSTS[c.id].unit === '' ? c.v : c.v * 100) * COSTS[c.id].per;
/** Its words on the card, for the wearer's class: "You take 8% more damage." */
export const costText = (c: NonNullable<Item['cost']>, cls?: HeroClass) => COSTS[c.id].text(COSTS[c.id].unit === '' ? c.v : Math.round(c.v * 100), cls);

/** A touched or turning piece's cost; none for any other tier. A strong roll doesn't soften it. */
export function rollCost(rng: Rng, tier: Tier): Item['cost'] {
  const pts = COST_POINTS[tier];
  if (!pts) return undefined;
  const id = rng.pick(COST_ORDER);
  return { id, v: costValue(id, pts * band(rng)) };
}
