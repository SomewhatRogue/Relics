/**
 * The item ledger (docs/design/trading.md). What can change hands (unique boss drops, instance pieces,
 * cosmetics, gear put up for trade) carries a server id, `Item.ledger`, and the server keeps its owner, a
 * hero id, under `relic:item:<id>` (api/_ledger.ts). An id is minted once: a boss drop's is fixed by the run
 * and the boss (`<run>:<boss>`), so a second mint of the same drop (a reconnect, a host handover, a
 * replayed message) finds it taken. A save holding a piece the ledger gives to another hero shows it GONE
 * and drops it (client/ledger.ts). Pure: the room, the client and the server share it.
 */
import type { Item } from './loot.js';

/** A ledger id: a run's tag and a boss, or later a trade's own id. */
export const LEDGER_ID = /^[A-Za-z0-9._:-]{3,80}$/;
/** A hero's id (shared/progress.ts heroId), as the server takes it. */
export const HERO_ID = /^h[a-z0-9]{6,24}$/;
/** At most this many ids in one check or one mint. */
export const LEDGER_MAX = 120;

/** A drop's id: the room's run tag (room.ledgerRun) and what dropped it. None where the room has no tag. */
export const dropLedger = (run: string, boss: string | number): string | undefined => (run ? `${run}:${boss}` : undefined);

/** A room's run tag: the job's key (the party's room code, or a solo job's), the room's index, a few letters
 *  of its own (a run's street and its houses are rooms of one index). Kept on the room, so a handover keeps it. */
export function runTag(job: string, index: number, rand: () => number): string {
  const c = 'abcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 4; i++) s += c[Math.floor(rand() * c.length)];
  return `${job}.${index}.${s}`.replace(/[^A-Za-z0-9._-]/g, '').slice(0, 60);
}

/** Everything a hero carries or keeps: in hand, worn, packed, in the vault, at Tobin's. */
export interface Kit {
  arms?: { [kit: string]: Item | undefined };
  armor?: Item | null;
  rings?: Item[];
  bag?: Item[];
  stash?: Item[];
  buyback?: { item: Item }[];
}

/** Every ledgered piece in the kit. */
export function ledgered(k: Kit): Item[] {
  const all = [...Object.values(k.arms ?? {}), k.armor, ...(k.rings ?? []), ...(k.bag ?? []), ...(k.stash ?? []), ...(k.buyback ?? []).map((b) => b.item)];
  return all.filter((it): it is Item => !!it?.ledger);
}

/**
 * Take out every piece whose id is in `gone`, and any second copy of one id (a replayed drop); returns what
 * came out. A worn piece that goes is swapped for `plain()` (the class's plain armor); a weapon in hand just
 * leaves its slot, as a hero with none of a kind has.
 */
export function prune(k: Kit, gone: Set<string>, plain: () => Item): Item[] {
  const seen = new Set<string>(), out: Item[] = [];
  const goes = (it: Item | null | undefined): boolean => {
    if (!it?.ledger) return false;
    if (gone.has(it.ledger) || seen.has(it.ledger)) return out.push(it), true;
    seen.add(it.ledger);
    return false;
  };
  // Worn and in hand first, so the copy a hero is using is the one kept.
  if (k.armor && goes(k.armor)) k.armor = plain();
  if (k.arms) for (const [kit, it] of Object.entries(k.arms)) if (goes(it)) delete k.arms[kit];
  if (k.rings) k.rings = k.rings.filter((it) => !goes(it));
  if (k.bag) k.bag = k.bag.filter((it) => !goes(it));
  if (k.stash) k.stash = k.stash.filter((it) => !goes(it));
  if (k.buyback) k.buyback = k.buyback.filter((b) => !goes(b.item));
  return out;
}
