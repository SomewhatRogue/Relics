/**
 * Who buys the rare three (Kyle, 2026-11-05): "Tobin can't buy anything Yellow, Orange or Red, he freaks
 * out. You can sell to a shady guy in the tavern though, but it's very hush hush. Actually, let's make it
 * so if you have a red item at all (equipped or otherwise) you can't sell ANYTHING to him unless it's in
 * the bank or donated to the church, and he panics when you talk to him."
 *
 * - Tobin won't buy TOUCHED, TURNING or HUNGRY gear, and never stocks them (vendors.ts).
 * - A hero with any HUNGRY piece on them, worn or in the pack, gets nothing from Tobin at all: he won't
 *   buy, sell, or sell back. A piece in the vault, or given up at the church, is off you.
 * - Nettle, at the back of the Drowned Rat, quietly buys TOUCHED, TURNING and HUNGRY (Kyle, 2026-11-11:
 *   "nettle can buy it"), for less than Tobin pays for anything and with no buying back. Hungry gear has no
 *   price of its own; he pays as for turning gear. Selling it to him doesn't ease the Want: only giving it
 *   up at the church does.
 * - Carrying hungry gear (Kyle, 2026-11-11), Tobin won't deal with you, so Nettle buys your ordinary gear too,
 *   at `HUNGRY_CUT`, less again: him or the forge, and nobody else.
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

/** Nettle's cut of a piece's worth: two thirds of Tobin's (prices.ts PAWN_CUT, 0.2 since the economy). */
export const FENCE_CUT = 0.13;
/** What Nettle pays a hero carrying hungry gear for the ordinary gear Tobin won't now buy. */
export const HUNGRY_CUT = 0.12;
/** The rare three Nettle always buys. */
const rare = (it: Item) => it.quality === 'touched' || it.quality === 'turning' || it.quality === 'hungry';
/** What Nettle buys off `p`: the rare three; anything at all if `p` carries hungry gear. */
export const nettleTakes = (it: Item, p?: Carrier) => rare(it) || (!!p && carriesHungry(p));
/** A piece's worth to Nettle: hungry gear has no price, so it's priced as turning gear. */
const worth = (it: Item) => priceOf(it.quality === 'hungry' ? { ...it, quality: 'turning' } : it);
/** What Nettle pays `p` for it (0: he won't take it). */
export const fenceValue = (it: Item, p?: Carrier) =>
  nettleTakes(it, p) ? Math.max(1, Math.round(worth(it) * (rare(it) ? FENCE_CUT : HUNGRY_CUT))) + (rare(it) ? (it.level ?? 0) * PER_LEVEL : 0) : 0;

/** Sell packed piece `i` to Nettle: gold now, and it's gone (no buying back). Returns what he paid. */
export function fence(p: Stores, i: number): number {
  const it = p.bag[i], price = it ? fenceValue(it, p as unknown as Carrier) : 0;
  if (!it || price <= 0) return 0;
  p.bag.splice(i, 1);
  p.gold += price;
  return price;
}
