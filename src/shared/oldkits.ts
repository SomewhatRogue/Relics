/**
 * Kits renamed since a save was made. The hand crossbow became the poisoner's kit (Kyle, 2026-11-03),
 * and the lance rod the spellblade (2026-11-04): a hero holding one, or carrying one anywhere (the hand,
 * the pack, the vault, Tobin's buyback), now has the new kit instead, its quality, modifiers, traits and
 * level kept. The Jealous Rod is a wand now (its gift rides a charged spell, and a wand still casts one).
 */
import type { WeaponId } from './weapons.js';
import type { Item } from './loot.js';

export const OLD_KITS: Record<string, WeaponId> = { handbow: 'poisoner', rod: 'spellblade' };
export const kitNow = (k: string): WeaponId => OLD_KITS[k] ?? (k as WeaponId);
/** What an old item's kit is now: the Jealous Rod went to the wand, everything else by OLD_KITS. */
const itemKit = (it: Item): WeaponId => (it.hungry === 'jealous' && it.kit === ('rod' as WeaponId) ? 'wand' : kitNow(it.kit!));

const item = <T extends Item | undefined>(it: T): T => (it?.kit && itemKit(it) !== it.kit ? { ...it, kit: itemKit(it) } : it);

interface Kept { weapon?: string; arms?: Partial<Record<string, Item>>; bag?: Item[]; stash?: Item[]; buyback?: { item: Item }[] }

/** A saved hero with every old kit renamed (a copy; anything it doesn't have is left out). */
export function renameKits<P extends Kept>(p: P): P {
  const out: P = { ...p };
  // The hand's kit follows what's in it (a Jealous Rod in hand is a wand in hand now).
  const held = p.weapon ? p.arms?.[p.weapon] : undefined;
  if (p.weapon) out.weapon = held?.kit ? itemKit(held) : kitNow(p.weapon);
  if (p.arms) out.arms = Object.fromEntries(Object.entries(p.arms).map(([k, it]) => [it?.kit ? itemKit(it) : kitNow(k), item(it)]));
  if (p.bag) out.bag = p.bag.map(item);
  if (p.stash) out.stash = p.stash.map(item);
  if (p.buyback) out.buyback = p.buyback.map((x) => ({ ...x, item: item(x.item) }));
  return out;
}
