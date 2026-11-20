/**
 * The Keeping Room (docs/design/holy-and-hungry.md section 7): the hungry path's church, kept strictly a shop and a
 * hoard, behind a bricked arch off the Sewers. Only a corrupt hero finds it; a clean one sees brick. Dorcas keeps it.
 * - **Feed a relic:** vowed pieces from the pack laid in the trough, the relic on top; it eats them and fills. The
 *   corrupt hero's only recharge. Elemental relics can't be filled. Each piece eaten grows the Want a little.
 * - **Give a vowed piece to Dorcas:** she pays a little coin for it, and it grows the Want (it's keeping, not giving).
 * Pure: the profile changes here; saving is the caller's (client/keepingui.ts). Never `Math.random`: nothing rolls.
 */
import type { Item } from './loot.js';
import { relicMax, type RelicItem } from './relicitems.js';
import { isCorrupt } from './corrupt.js';
import { isVowed } from './vowed.js';
import { grown } from './vowgrow.js';
import { priceOf } from './prices.js';

/** `charges`: what a fresh vowed piece fills, plus up to `grownMore` for a grown one. `feedWant` and `giveWant`: what
 *  the Want grows by a piece eaten, or given to Dorcas. `pay`: her coin for one, against its PRE-WAR price. */
export const KEEPING = { charges: 1, grownMore: 2, feedWant: 3, giveWant: 10, pay: 0.4 };

/** What the room holds a hero with: just these fields of a profile. */
interface Keeper { weapon: string; arms: Partial<Record<string, Item>>; armor: Item | null; legs?: Item | null; rings: Item[]; bag: Item[]; want: number; gold: number; relics: RelicItem[] }

/** Only a corrupt hero finds the room. */
export const findsRoom = (p: Keeper) => isCorrupt(p);
/** The vowed pieces in the pack, least grown first (what the trough or Dorcas would take first). */
export const packVowed = (p: Keeper) => p.bag.filter((it) => isVowed(it)).sort((a, b) => grown(a) - grown(b));
/** What a piece fills a relic by. */
export const chargesOf = (it: Item) => KEEPING.charges + Math.floor(grown(it) * KEEPING.grownMore);
/** A relic the trough can fill: not elemental, not full. */
export const canFeed = (r: RelicItem) => !r.el && r.charge < relicMax(r);

/** How many pack pieces filling relic `r` to full would take, least grown first (all of them if not enough). */
export function piecesToFill(p: Keeper, r: RelicItem): number {
  let need = relicMax(r) - r.charge, n = 0;
  for (const it of packVowed(p)) {
    if (need <= 0) break;
    (need -= chargesOf(it)), n++;
  }
  return n;
}

/** Feed relic `id` from the pack until it's full or the pieces run out. Returns the pieces eaten (0: nothing done). */
export function feedRelic(p: Keeper, id: string): number {
  const r = p.relics.find((x) => x.id === id);
  if (!r || !canFeed(r) || !findsRoom(p)) return 0;
  const eat = packVowed(p).slice(0, piecesToFill(p, r));
  for (const it of eat) {
    r.charge = Math.min(relicMax(r), r.charge + chargesOf(it));
    p.bag.splice(p.bag.indexOf(it), 1);
  }
  p.want += eat.length * KEEPING.feedWant;
  return eat.length;
}

/** Dorcas's coin for a vowed piece. */
export const dorcasPays = (it: Item) => Math.max(5, Math.round((priceOf(it) * KEEPING.pay) / 5) * 5);
/** Give a vowed piece from the pack to Dorcas: coin, and the Want grows. False if it isn't there or isn't vowed. */
export function giveToDorcas(p: Keeper, it: Item): boolean {
  const i = p.bag.indexOf(it);
  if (i < 0 || !isVowed(it) || !findsRoom(p)) return false;
  p.bag.splice(i, 1);
  p.gold += dorcasPays(it);
  p.want += KEEPING.giveWant;
  return true;
}
