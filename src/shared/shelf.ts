/**
 * Amends pay out, and Odric's shelf (docs/design/holy-gear.md slice 7, Kyle's yes 2026-11-20).
 * - At each amends step (shared/amends.ts) Odric hands a clean hero a vowed piece for a slot they pick, already part
 *   grown: a quarter, a half, three quarters, then nine tenths, never ripe. Reached while corrupt, it waits.
 * - Odric's shelf: vowed pieces nobody is carrying, three for the hero's class (its weapon, a body, a ring), changing
 *   with the shops' window, fresh. Clean heroes only. Taken for a gift at the Lantern (client/game.ts `donate`: the
 *   gold goes in the box and the Want falls with it), the price of a strong PRE-WAR piece.
 */
import type { Item } from './loot.js';
import { Rng } from './rng.js';
import type { HeroClass } from './weapons.js';
import { raise } from './budget.js';
import { dropLevel } from './itemlevel.js';
import { priceOf } from './prices.js';
import { rollVowed, vowedFor, VOWED } from './vowed.js';
import { GROW, grownBy } from './vowgrow.js';
import { AMENDS_STEPS } from './amends.js';
import { isCorrupt } from './corrupt.js';

/** How grown the piece each amends step pays is, in order. */
export const PAYOUT = [0.25, 0.5, 0.75, 0.9];
/** The shelf's price, against a PRE-WAR piece's own: a strong one's. */
export const SHELF = { count: 3, price: 1.3 };

/** What a hero carries, as the profile keeps it. */
interface Carrier { cls: HeroClass; level: number; weapon: string; arms: Partial<Record<string, Item>>; armor: Item | null; legs?: Item | null; rings: Item[]; bag: Item[]; want?: number; penance?: number; amendsPaid?: number }

/** Amends steps reached and not yet paid. */
export const owed = (p: Carrier) => Math.max(0, AMENDS_STEPS.filter((s) => (p.penance ?? 0) >= s).length - (p.amendsPaid ?? 0));
/** Odric pays only a clean hero; the rest waits. */
export const canPay = (p: Carrier) => owed(p) > 0 && !isCorrupt(p);

/** The next payout: a vowed piece for `slot`, raised to the hero's level, part grown; into the pack. */
export function payOut(p: Carrier, slot: 'weapon' | 'armor' | 'ring', rng: Rng): Item | null {
  if (!canPay(p)) return null;
  const share = PAYOUT[Math.min(PAYOUT.length - 1, p.amendsPaid ?? 0)];
  const fresh = rollVowed(rng, p.cls, slot, p.armor?.armor);
  if (!fresh) return null;
  const piece = grownBy(raise(fresh, dropLevel(p.level)), share * GROW.span);
  p.amendsPaid = (p.amendsPaid ?? 0) + 1;
  p.bag.push(piece);
  return piece;
}

/** A seed from the hero's class and the shops' window: the same shelf on every device. */
function seed(cls: HeroClass, win: number): number {
  let h = 2166136261;
  for (const c of `shelf${cls}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h ^ Math.imul(win + 1, 2654435761)) >>> 0;
}

/** What's on the shelf for this class in window `win`, at the hero's level: its weapon, one body, one ring. */
export function shelfFor(cls: HeroClass, win: number, lv: number): Item[] {
  const rng = new Rng(seed(cls, win)), weight = rng.next() < 0.5 ? 'heavy' : 'light';
  return (['weapon', 'armor', 'ring'] as const).slice(0, SHELF.count).flatMap((slot) => {
    const it = vowedFor(cls, slot).length ? rollVowed(rng, cls, slot, weight) : null;
    return it ? [raise(it, dropLevel(lv))] : [];
  });
}

/** Its price, as a gift at the Lantern. */
export const shelfPrice = (it: Item) => Math.round((priceOf(it) * SHELF.price) / 5) * 5;

/** Which of this window's shelf the hero has already taken (`took` holds its indexes). */
export interface ShelfMark { win: number; took: number[] }
export const takenNow = (m: ShelfMark | undefined, win: number) => (m && m.win === win ? m.took : []);

/** The names on the shelf, for tests and words. */
export const shelfNames = (items: Item[]) => items.map((it) => VOWED[(it as { holy?: keyof typeof VOWED }).holy!]?.name ?? '');
