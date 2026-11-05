/**
 * Who buys the rare three (Kyle, 2026-11-05): "Tobin can't buy anything Yellow, Orange or Red, he freaks
 * out. You can sell to a shady guy in the tavern though, but it's very hush hush. Actually, let's make it
 * so if you have a red item at all (equipped or otherwise) you can't sell ANYTHING to him unless it's in
 * the bank or donated to the church, and he panics when you talk to him."
 *
 * - Tobin won't buy TOUCHED, TURNING or HUNGRY gear, and never stocks them (vendors.ts).
 * - A hero with any HUNGRY piece on them, worn or in the pack, gets nothing from Tobin at all: he won't
 *   buy, sell, or sell back. A piece in the vault, or given up at the church, is off you.
 * - Nettle, at the back of the Drowned Rat, quietly buys TOUCHED and TURNING, for less than Tobin pays
 *   for anything and with no buying back. Never HUNGRY: that goes to the church and nowhere else.
 * Selling to either is trade: it never touches the Want.
 */
import { RARE } from './gear.js';
import { PER_LEVEL, priceOf } from './prices.js';
import type { Stores } from './bags.js';
import type { Item } from './loot.js';

/** What a hero has on them: the pack, and what's worn (a Profile has all of these). */
export interface Carrier { bag: Item[]; arms?: Partial<Record<string, Item>>; armor?: Item | null; rings?: Item[] }

/** Any hungry piece worn or packed. The vault doesn't count (it's not on you). */
export function carriesHungry(p: Carrier): boolean {
  return [...Object.values(p.arms ?? {}), p.armor, ...(p.rings ?? []), ...p.bag].some((it) => it?.quality === 'hungry');
}

/** Why Tobin won't buy `it` off `p` ('' if he will): you carry hungry gear, or it's one of the rare three. */
export function tobinWont(p: Carrier, it: Item): '' | 'panic' | 'rare' {
  if (carriesHungry(p)) return 'panic';
  return RARE.includes(it.quality) ? 'rare' : '';
}

/** Nettle's cut of a piece's worth: less than Tobin's (prices.ts PAWN_CUT, 0.3). */
export const FENCE_CUT = 0.2;
/** What Nettle buys: touched and turning gear, nothing else. */
export const nettleTakes = (it: Item) => it.quality === 'touched' || it.quality === 'turning';
/** What Nettle pays for it (0: he won't take it). */
export const fenceValue = (it: Item) => (nettleTakes(it) ? Math.max(1, Math.round(priceOf(it) * FENCE_CUT)) + (it.level ?? 0) * PER_LEVEL : 0);

/** Sell packed piece `i` to Nettle: gold now, and it's gone (no buying back). Returns what he paid. */
export function fence(p: Stores, i: number): number {
  const it = p.bag[i], price = it ? fenceValue(it) : 0;
  if (!it || price <= 0) return 0;
  p.bag.splice(i, 1);
  p.gold += price;
  return price;
}
