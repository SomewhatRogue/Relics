/**
 * What gear costs and what it fetches. A piece's price is its tier's, moved by how well it rolled (a
 * strong roll costs a good deal more), a little more for a trait or an element, a little less for armor
 * and rings. Tobin pays a fair cut of that for anything but hungry gear (the church takes that). Hungry
 * gear is never for sale. Prices sit beside Tobin's bigger packs (400 to 3600): a TURNING piece is a pack.
 */
import { rollQuality } from './budget.js';
import type { Item, Tier } from './loot.js';

/** A middling piece's price, by tier (0: never sold). */
export const PRICE: Record<Tier, number> = { plain: 25, fine: 70, forged: 180, tolmouth: 480, touched: 1200, turning: 2600, hungry: 0 };
const SLOT_MULT = { weapon: 1, armor: 0.9, ring: 0.8 };
/** Tobin's cut of a piece's worth, plus a little for each of Halvard's levels on it. */
export const PAWN_CUT = 0.3, PER_LEVEL = 8;
/** Given to the town works instead, a piece counts for `GIVE_MULT` times what it sells for. */
export const GIVE_MULT = 1.5;

const five = (n: number) => Math.max(5, Math.round(n / 5) * 5);

/** What a vendor asks for it: the tier's price times the roll's quality squared (0.64 to 1.44), traits on top. */
export function priceOf(it: Item): number {
  const base = PRICE[it.quality];
  if (!base) return 0;
  const q = rollQuality(it), traits = 1 + 0.1 * it.traits.length;
  return five(base * q * q * traits * SLOT_MULT[it.slot ?? 'weapon']);
}
/** What Tobin pays for it (never a hungry piece). */
export const sellValue = (i: Item) => (i.quality === 'hungry' ? 0 : Math.max(1, Math.round(priceOf(i) * PAWN_CUT)) + (i.level ?? 0) * PER_LEVEL);
export const giveValue = (i: Item) => Math.round(sellValue(i) * GIVE_MULT);
