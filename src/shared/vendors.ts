/**
 * The stock on Wickhold's counters (Kyle, 2026-11-05): "Specific class weapons should be sold by a vendor
 * in the associated class area ... randomized in what it is and traits every ten minutes real life.
 * Chance for some really good things but priced appropriately", and the pawn "should sell random items".
 *
 * Each vendor's stock is rolled from the ten real minutes it's in and the vendor, never Math.random: every
 * player who looks in that window, alone or in a party, on any device, sees the same pieces. What you buy
 * is yours (your save, as any shop); a piece you've bought is gone from your view until the stock turns.
 */
import { Rng } from './rng.js';
import { bagFull, type Stores } from './bags.js';
import { pickTier, rollGear } from './gear.js';
import { priceOf } from './prices.js';
import type { Item, Tier } from './loot.js';
import { CLASS_KITS, CLASS_ORDER, WEAPONS, WEAPON_ORDER, type HeroClass } from './weapons.js';

/** A class's vendor (in its trainer's place) or Tobin's pawn stall. */
export type VendorId = HeroClass | 'pawn';
export const VENDOR_IDS: VendorId[] = [...CLASS_ORDER, 'pawn'];

/** The stock turns over every ten real minutes. */
export const STOCK_MS = 10 * 60 * 1000;
export const stockWindow = (now: number) => Math.floor(now / STOCK_MS);
/** Milliseconds until fresh stock. */
export const stockLeft = (now: number) => STOCK_MS - (((now % STOCK_MS) + STOCK_MS) % STOCK_MS);

/**
 * Tier odds per piece. A class vendor: mostly Fine and Forged, now and then PRE-WAR, rarely TOUCHED and
 * very rarely TURNING (about one window in seven has a rare piece, one in twenty-five a TURNING one).
 * The pawn: any class, mostly Plain to Forged, now and then PRE-WAR. Never the rare three: Tobin won't
 * touch them (Kyle, 2026-11-05), so he never has one to sell (shared/fence.ts).
 * The church's vestry: never the rare three (Oswin won't hang them up).
 * `strong`: the chance a piece rolls at the top of its band (`lean`), priced to match (prices.ts).
 */
export const STOCK: Record<'class' | 'church' | 'pawn', { count: number; odds: [Tier, number][]; strong: number; lean: number }> = {
  /** The church's vestry won't hang up anything the hunger has touched: its best is a strong PRE-WAR piece. */
  church: { count: 5, odds: [['plain', 0.08], ['fine', 0.42], ['forged', 0.35], ['tolmouth', 0.15]], strong: 0.15, lean: 0.75 },
  class: { count: 5, odds: [['plain', 0.08], ['fine', 0.42], ['forged', 0.35], ['tolmouth', 0.12], ['touched', 0.022], ['turning', 0.008]], strong: 0.12, lean: 0.75 },
  pawn: { count: 6, odds: [['plain', 0.35], ['fine', 0.4], ['forged', 0.19], ['tolmouth', 0.06]], strong: 0.08, lean: 0.75 },
};

/** A seed from a vendor and a window: the same on every device. */
export function stockSeed(v: VendorId, win: number): number {
  let h = 2166136261;
  for (const c of v) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h ^ Math.imul(win + 1, 2654435761)) >>> 0;
}

/** What `v` has on its counter in window `win`. A class vendor: three of the class's weapons, an armor, a ring. */
export function stockFor(v: VendorId, win: number): Item[] {
  const rng = new Rng(stockSeed(v, win)), s = STOCK[v === 'pawn' ? 'pawn' : v === 'HEALER' ? 'church' : 'class'], out: Item[] = [];
  for (let i = 0; i < s.count; i++) {
    const tier = pickTier(rng, s.odds), lean = rng.next() < s.strong ? s.lean : 0;
    if (v === 'pawn') {
      const r = rng.next(), slot = r < 0.5 ? 'weapon' : r < 0.75 ? 'armor' : 'ring', kit = slot === 'weapon' ? rng.pick(WEAPON_ORDER) : undefined;
      out.push(rollGear(rng, kit ? WEAPONS[kit].cls : null, tier, slot, kit, undefined, lean));
    } else {
      const slot = i < 3 ? 'weapon' : i === 3 ? 'armor' : 'ring';
      out.push(rollGear(rng, v, tier, slot, slot === 'weapon' ? rng.pick(CLASS_KITS[v]) : undefined, undefined, lean));
    }
  }
  return out;
}

/** A shopper's side of it: the save's pack and gold, the class, and what's been bought this window. */
export interface Shopper extends Stores { cls: HeroClass; bought?: string[] }
const key = (v: VendorId, win: number, i: number) => `${v}:${win}:${i}`;
export const isBought = (p: { bought?: string[] }, v: VendorId, win: number, i: number) => !!p.bought?.includes(key(v, win, i));
/** Can this hero use it: a weapon only in its own class's hands; armor and rings anyone. */
export const usable = (p: { cls: HeroClass }, it: Item) => !it.kit || (it.slot ?? 'weapon') !== 'weapon' || WEAPONS[it.kit].cls === p.cls;

/** Why piece `i` can't be bought now, as a code ('' if it can). */
export function cantBuy(p: Shopper, v: VendorId, win: number, i: number): '' | 'gone' | 'class' | 'pack' | 'gold' {
  const it = stockFor(v, win)[i];
  if (!it || isBought(p, v, win, i)) return 'gone';
  if (!usable(p, it)) return 'class';
  if (bagFull(p)) return 'pack';
  return p.gold < priceOf(it) ? 'gold' : '';
}
/** Buy piece `i` into the pack (the stock is rolled again from the window, so it's always the one shown). */
export function buyStock(p: Shopper, v: VendorId, win: number, i: number): Item | null {
  if (cantBuy(p, v, win, i)) return null;
  const it = stockFor(v, win)[i];
  p.gold -= priceOf(it);
  p.bag.push(it);
  // Only this window's purchases are kept.
  p.bought = [...(p.bought ?? []).filter((k) => k.split(':')[1] === String(win)), key(v, win, i)];
  return it;
}
