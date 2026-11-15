/**
 * Keeping a look (docs/design/gear-levels.md section 3, Kyle 2026-11-14: yes): once you've worn a unique,
 * you can keep its look on whatever you wear in that slot, at Master Cole's beside the shield painting,
 * so you never pick between looking right and being strong. Looks only: what you wear still does the
 * fighting, and a kept look is never the piece (never hungry, never traded).
 *
 * Here: the record of uniques a hero has worn (`Profile.looks`, noted whenever their kit settles,
 * client/keepkit.ts), the look kept per slot (`Profile.keep`), and `shownItem`, the one thing the
 * drawing reads: the worn piece as it should look. Drawing a unique's own look on the hero is
 * docs/design/gear-looks.md's (weapons as their own sprite, chest and legs as overlays, a ring as a glow);
 * Cole's KEEP A LOOK panel lands when those draw.
 */
import type { Item } from './loot.js';
import type { Slot } from './mods.js';

/** What a profile needs for this (the fields are optional: saves from before have none). */
export interface Looks { looks?: string[]; keep?: Partial<Record<Slot, string>>; arms: Partial<Record<string, Item>>; weapon: string; armor: Item | null; legs?: Item | null; rings: Item[] }

const slotOf = (i: Item): Slot => i.slot ?? 'weapon';

/** Note every unique worn now. True when one is new. */
export function noteLooks(p: Looks): boolean {
  const worn = [p.arms[p.weapon], p.armor, p.legs, ...p.rings].filter((i): i is Item => !!i && !!i.unique);
  const had = new Set(p.looks ?? []), fresh = worn.map((i) => i.unique!).filter((u) => !had.has(u));
  if (fresh.length) p.looks = [...(p.looks ?? []), ...new Set(fresh)];
  return fresh.length > 0;
}

/** The uniques whose look this hero could keep in `slot`: worn once, and made for that slot. `slotFor` says a unique's slot (shared/uniques.ts). */
export const lookChoices = (p: Looks, slot: Slot, slotFor: (u: string) => Slot | undefined) => (p.looks ?? []).filter((u) => slotFor(u) === slot);

/** Keep `unique`'s look in `slot` ('' wears it as is). Only a look this hero has worn, made for that slot. */
export function keepLook(p: Looks, slot: Slot, unique: string, slotFor: (u: string) => Slot | undefined): boolean {
  if (unique && !lookChoices(p, slot, slotFor).includes(unique)) return false;
  const keep = { ...(p.keep ?? {}) };
  if (unique) keep[slot] = unique;
  else delete keep[slot];
  p.keep = keep;
  return true;
}

/**
 * The worn piece as it should be drawn: the kept unique's look over it (a weapon's look only on a weapon
 * of the same kit, since the hands hold each kit their own way), or the piece itself. Drawing only.
 */
export function shownItem(it: Item | null | undefined, keep: Looks['keep'], kitFor: (u: string) => string | undefined): Item | null {
  if (!it) return null;
  const u = keep?.[slotOf(it)];
  if (!u || it.unique === u) return it;
  if (slotOf(it) === 'weapon' && kitFor(u) !== it.kit) return it;
  return { ...it, unique: u, hungry: undefined };
}
