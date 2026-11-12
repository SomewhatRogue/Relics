/**
 * A trade's terms (docs/design/trading.md, step 3): what each hero gives, items by ledger id and gold.
 * Both players build the same terms from the offers they both see; each sends its ACCEPT with them to the
 * server (api/ledger.ts), which swaps the items' owners in one step once both have accepted the same terms,
 * or moves nothing. Pure: the client, the server and the tests share it.
 */
import { TRAITS, type Item, type TraitId } from './loot.js';
import { HERO_ID, LEDGER_ID } from './ledger.js';
import { WEAPONS } from './weapons.js';

/** At most this many items on one side of a trade, and this much gold. */
export const TRADE_ITEMS = 8, TRADE_GOLD = 1_000_000;
export const TRADE_ID = /^[a-z0-9]{8,16}$/;

export interface Side { h: string; give: string[]; gold: number }
/** `a` is the hero whose id sorts first, so both players build the same terms. */
export interface Terms { id: string; a: Side; b: Side }
export type TradeState = 'wait' | 'done' | 'bad' | 'none';

/** Terms from the two sides, in either order. */
export function terms(id: string, x: Side, y: Side): Terms {
  const [a, b] = x.h < y.h ? [x, y] : [y, x];
  const tidy = (s: Side): Side => ({ h: s.h, give: [...s.give].sort(), gold: s.gold });
  return { id, a: tidy(a), b: tidy(b) };
}

/** One string for the terms: equal only when every item and every coin is the same. */
export const termsKey = (t: Terms): string => JSON.stringify([t.a.h, t.a.give, t.a.gold, t.b.h, t.b.give, t.b.gold]);

const side = (s: unknown): s is Side => {
  const v = s as Side;
  return !!v && typeof v === 'object' && typeof v.h === 'string' && HERO_ID.test(v.h) && Array.isArray(v.give) && v.give.length <= TRADE_ITEMS
    && v.give.every((id) => typeof id === 'string' && LEDGER_ID.test(id)) && Number.isInteger(v.gold) && v.gold >= 0 && v.gold <= TRADE_GOLD;
};

/** Terms as sent, or null if anything is off: two different heroes, no item twice, something changing hands. */
export function cleanTerms(raw: unknown): Terms | null {
  const t = raw as Terms;
  if (!t || typeof t !== 'object' || typeof t.id !== 'string' || !TRADE_ID.test(t.id) || !side(t.a) || !side(t.b) || t.a.h === t.b.h) return null;
  const all = [...t.a.give, ...t.b.give];
  if (new Set(all).size !== all.length || (!all.length && !t.a.gold && !t.b.gold)) return null;
  return terms(t.id, t.a, t.b);
}

/** What can't change hands (Kyle, 2026-11-11): hungry gear, never (it goes to the church or Nettle); nor a SOULBOUND piece (2026-11-12, sim/loot.ts). */
export const tradeable = (it: Item): boolean => it.quality !== 'hungry' && !it.bound;

/** An offer as the other player sent it: their items (each ledgered, nothing hungry) and gold. */
export interface Offer { items: Item[]; gold: number; rev: number }

const TIERS = new Set(['plain', 'fine', 'forged', 'tolmouth', 'touched', 'turning']);
const fin = (v: unknown, lo: number, hi: number) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;

/** One item from another browser, rebuilt from the fields an item has; null if anything is off. */
export function cleanItem(raw: unknown): Item | null {
  const i = raw as Item;
  if (!i || typeof i !== 'object' || JSON.stringify(i).length > 1500) return null;
  const slot = i.slot ?? 'weapon';
  if (slot !== 'weapon' && slot !== 'armor' && slot !== 'ring') return null;
  if (slot === 'weapon' && !(typeof i.kit === 'string' && i.kit in WEAPONS)) return null;
  if (slot === 'armor' && i.armor !== 'light' && i.armor !== 'medium' && i.armor !== 'heavy') return null;
  if (!TIERS.has(i.quality) || i.hungry !== undefined || i.bound !== undefined || typeof i.ledger !== 'string' || !LEDGER_ID.test(i.ledger)) return null;
  if (!Array.isArray(i.traits) || i.traits.length > 6 || !i.traits.every((t) => typeof t === 'string' && t in TRAITS)) return null;
  const mods = i.mods ?? [];
  if (!Array.isArray(mods) || mods.length > 8 || !mods.every((m) => m && typeof m.id === 'string' && /^[a-z]{1,12}$/.test(m.id) && fin(m.v, -100, 1000))) return null;
  if (i.level !== undefined && !fin(i.level, 0, 5)) return null;
  if (i.temper !== undefined && !fin(i.temper, 0, 5)) return null;
  if (i.unique !== undefined && (typeof i.unique !== 'string' || !/^[a-z0-9]{1,24}$/.test(i.unique))) return null;
  if (i.cost !== undefined && !(i.cost && typeof i.cost.id === 'string' && /^[a-z]{1,10}$/.test(i.cost.id) && fin(i.cost.v, 0, 100))) return null;
  const out: Item = { slot, quality: i.quality, traits: [...i.traits] as TraitId[], mods: mods.map((m) => ({ id: m.id, v: m.v })), ledger: i.ledger };
  if (slot === 'weapon') out.kit = i.kit;
  if (slot === 'armor') out.armor = i.armor;
  for (const k of ['level', 'temper', 'unique', 'cost'] as const) if (i[k] !== undefined) (out as unknown as Record<string, unknown>)[k] = i[k];
  return out;
}

export function cleanOffer(raw: unknown): Offer | null {
  const o = raw as Offer;
  if (!o || typeof o !== 'object' || !Array.isArray(o.items) || o.items.length > TRADE_ITEMS || !Number.isInteger(o.gold) || o.gold < 0 || o.gold > TRADE_GOLD || !Number.isInteger(o.rev)) return null;
  const items = o.items.map(cleanItem);
  if (items.some((i) => !i) || new Set(items.map((i) => i!.ledger)).size !== items.length) return null;
  return { items: items as Item[], gold: o.gold, rev: o.rev };
}

/** A trade this hero accepted on the server, kept in the save until it's settled (client/tradesave.ts). */
export interface Pending { id: string; me: string; t: Terms; got: Item[] }

/** The side of the terms that is `hero`'s, and the other. */
export const sides = (t: Terms, hero: string): [Side, Side] => (t.a.h === hero ? [t.a, t.b] : [t.b, t.a]);

/**
 * A done trade into the hero's keeping: what they gave leaves the pack (or the vault), what they got comes
 * into the pack, the vault once the pack is full, and the gold goes both ways.
 */
export function settle(p: { bag: Item[]; gold: number; stash?: Item[] }, d: Pending, bagCap: number): void {
  const [mine, theirs] = sides(d.t, d.me), gave = new Set(mine.give), wanted = new Set(theirs.give);
  const kept = (it: Item) => !it.ledger || !gave.has(it.ledger);
  p.bag = p.bag.filter(kept);
  if (p.stash) p.stash = p.stash.filter(kept);
  p.gold = Math.max(0, p.gold - mine.gold) + theirs.gold;
  for (const it of d.got) if (it.ledger && wanted.has(it.ledger)) (p.bag.length < bagCap ? p.bag : (p.stash ??= [])).push(it);
}
