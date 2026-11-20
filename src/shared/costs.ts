/**
 * The three rare tiers each ask something of you (Kyle, 2026-11-05: "orange, yellow and red are really good but
 * rare and dangerous"). Red, HUNGRY, is plain steel the hunger has taken (hungry.ts): a gift, a named cost, the
 * Want, the church. Below it, clean since 2026-11-20 (Kyle: "make them clean"): SIEGE (yellow), struck fast in the
 * three winters for someone not meant to wear it long, and MARSHAL (orange), a captain's set fitted to one man.
 * Good steel made for someone else's measure: each carries one COST the fight feels, worth budget points like a
 * modifier but taken away. Neither grows the Want.
 */
import type { Rng } from './rng.js';
import type { HeroClass } from './weapons.js';
import type { Item, Tier } from './loot.js';
import { band } from './mods.js';
import { shown } from './shown.js';

export type CostId = NonNullable<Item['cost']>['id'];
/** Each cost: what one unit (1%, or 1 health) is worth in points, and its words for a value (a Mage's bar is magic). */
export const COSTS: Record<CostId, { unit: '%' | ''; per: number; text: (n: number, cls?: HeroClass) => string }> = {
  taken: { unit: '%', per: 1, text: (n) => `You take ${n}% more damage.` },
  winded: { unit: '%', per: 0.5, text: (n, cls) => `${cls === 'MAGE' ? 'Magic' : 'Stamina'} refills ${n}% slower.` },
  slow: { unit: '%', per: 1, text: (n) => `You move ${n}% slower.` },
  frail: { unit: '', per: 0.6, text: (n) => `${shown(n)} less health.` },
  dull: { unit: '%', per: 0.8, text: (n) => `Skill and relic recharge ${n}% slower.` },
};
export const COST_ORDER = Object.keys(COSTS) as CostId[];
/** Points a cost takes back at item level 1, by tier (only the two that carry one); it grows with the level as the modifiers do (itemlevel.ts). */
export const COST_POINTS: Partial<Record<Tier, number>> = { touched: 5, turning: 8 };
/** The Want a tier grows by, for every job it's worn on: none now (SIEGE and MARSHAL are clean; hungry pieces have
 *  their own, hungry.ts). Kept, empty, for callers. */
export const TIER_WANT: Partial<Record<Tier, number>> = {};

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
