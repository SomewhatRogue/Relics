/**
 * Where a hero's spare gear lives: the pack (a few cells, more bought from Tobin the pawnbroker on
 * Market Row), the vault under the counting house (Keeper Edda; more shelves for gold), and Tobin's
 * buyback (what you sold him, back at the price he paid, until you come home from your next job).
 * Hungry gear can't be sold, melted or upgraded (the church takes it); since Kyle's rule of 2026-11-05 it
 * may go in the vault, which is how a hero gets it off them for Tobin's sake (fence.ts).
 * Pure rules on the saved hero; the town UI calls them and keeps the save (client/stores.ts).
 */
import { STEEL, nextLevel } from './gear.js';
import { sellValue } from './prices.js';
import { carriesHungry, tobinWont, type Carrier } from './fence.js';
import type { Item } from './loot.js';
import { jobs } from './coins.js';

/** Pack sizes in order, and the gold to reach each (index matches). */
export const BAG = { sizes: [8, 12, 16, 20, 24], gold: [0, jobs(4), jobs(8), jobs(14), jobs(24)], start: 8 }; // dear on purpose (Kyle, 2026-11-04): a bigger pack is a long-term goal
/** The vault's shelves, the same way. */
export const VAULT = { sizes: [16, 24, 32, 40], gold: [0, jobs(2), jobs(5), jobs(10)], start: 16 };
/** How many sold pieces Tobin keeps aside for you (the oldest goes first). */
export const BUYBACK = { keep: 8 };

/** One piece sold to Tobin: what he paid, and the job count it was sold at (it's his once that moves on). */
export interface Pawn { item: Item; price: number; runs: number }
/** The saved hero's side of it (a Profile has all of these). */
export interface Stores { bag: Item[]; gold: number; steel: number; runs: number; bagSize?: number; stash?: Item[]; stashSize?: number; buyback?: Pawn[] }

export const bagSize = (p: { bagSize?: number }) => p.bagSize || BAG.start;
export const vaultSize = (p: { stashSize?: number }) => p.stashSize || VAULT.start;
export const bagFull = (p: { bag: Item[]; bagSize?: number }) => p.bag.length >= bagSize(p);
const hungry = (it: Item) => it.quality === 'hungry';

/** The next size up and its price, or null when it's as big as it gets. */
function next(t: { sizes: number[]; gold: number[] }, now: number): { size: number; gold: number } | null {
  const i = t.sizes.findIndex((s) => s > now);
  return i < 0 ? null : { size: t.sizes[i], gold: t.gold[i] };
}
export const nextBag = (p: Stores) => next(BAG, bagSize(p));
export const nextVault = (p: Stores) => next(VAULT, vaultSize(p));

/** Pay for the next pack size. */
export function growBag(p: Stores): boolean {
  const n = nextBag(p);
  if (!n || p.gold < n.gold) return false;
  p.gold -= n.gold;
  p.bagSize = n.size;
  return true;
}
export function growVault(p: Stores): boolean {
  const n = nextVault(p);
  if (!n || p.gold < n.gold) return false;
  p.gold -= n.gold;
  p.stashSize = n.size;
  return true;
}

/** Pack to vault (`i` in the pack). Hungry pieces too (Kyle, 2026-11-05: "unless it's in the bank"). */
export function stow(p: Stores, i: number): boolean {
  const it = p.bag[i], stash = (p.stash ??= []);
  if (!it || stash.length >= vaultSize(p)) return false;
  p.bag.splice(i, 1);
  stash.push(it);
  return true;
}
/** Vault to pack (`i` in the vault), if the pack has room. */
export function unstow(p: Stores, i: number): boolean {
  const it = p.stash?.[i];
  if (!it || bagFull(p)) return false;
  p.stash!.splice(i, 1);
  p.bag.push(it);
  return true;
}

/** What Tobin still holds for you (what's gone past its time is his now). */
export function pawns(p: Stores): Pawn[] {
  return (p.buyback = (p.buyback ?? []).filter((x) => x.runs === p.runs));
}
/** Sell a packed piece to Tobin: gold now, and it waits in his buyback. Not the rare three, and nothing at all from a hero carrying hungry gear (fence.ts). */
export function pawn(p: Stores & Carrier, i: number): number {
  const it = p.bag[i], price = it ? sellValue(it) : 0;
  if (!it || price <= 0 || tobinWont(p, it)) return 0;
  p.bag.splice(i, 1);
  p.gold += price;
  const kept = [...pawns(p), { item: it, price, runs: p.runs }];
  p.buyback = kept.slice(-BUYBACK.keep);
  return price;
}
/** Buy one back (`k` in pawns()), at what he paid (not while you carry hungry gear: he won't trade). */
export function redeem(p: Stores & Carrier, k: number): boolean {
  const x = pawns(p)[k];
  if (!x || p.gold < x.price || bagFull(p) || carriesHungry(p)) return false;
  p.gold -= x.price;
  p.buyback!.splice(k, 1);
  p.bag.push(x.item);
  return true;
}

/** Melting a packed piece down for steel (Halvard). */
export function melt(p: Stores, i: number): number {
  const it = p.bag[i];
  if (!it || hungry(it)) return 0;
  p.bag.splice(i, 1);
  p.steel += STEEL[it.quality];
  return STEEL[it.quality];
}
/** One level up, priced by nextLevel (null for hungry gear and at a tier's cap). Returns the new piece. */
export function upgraded(p: Stores, it: Item): Item | null {
  const cost = nextLevel(it);
  if (!cost || hungry(it) || p.gold < cost.gold || p.steel < cost.steel) return null;
  p.gold -= cost.gold;
  p.steel -= cost.steel;
  return { ...it, level: (it.level ?? 0) + 1 };
}

/**
 * Older heroes: an 8-cell pack (what the pack always held), an empty vault, nothing pawned. Anything
 * over what the pack holds (there shouldn't be) gets the pack sized up to fit, as far as it goes, and
 * the rest goes into the vault, however full. Nothing is ever lost.
 */
export function fitStores(p: Stores): void {
  p.stash ??= [];
  p.buyback ??= [];
  p.stashSize = vaultSize(p);
  const fit = BAG.sizes.find((s) => s >= p.bag.length) ?? BAG.sizes[BAG.sizes.length - 1];
  p.bagSize = Math.max(bagSize(p), fit);
  if (p.bag.length > p.bagSize) p.stash.push(...p.bag.splice(p.bagSize));
}
