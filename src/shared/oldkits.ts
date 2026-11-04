/**
 * Kits renamed since a save was made. The hand crossbow became the poisoner's kit (Kyle, 2026-11-03):
 * a hero holding one, or carrying one anywhere (the hand, the pack, the vault, Tobin's buyback), now
 * has the poisoner's kit instead, its quality, modifiers, traits and level kept.
 */
import type { WeaponId } from './weapons.js';
import type { Item } from './loot.js';

export const OLD_KITS: Record<string, WeaponId> = { handbow: 'poisoner' };
export const kitNow = (k: string): WeaponId => OLD_KITS[k] ?? (k as WeaponId);

const item = <T extends Item | undefined>(it: T): T => (it?.kit && OLD_KITS[it.kit] ? { ...it, kit: OLD_KITS[it.kit] } : it);

interface Kept { weapon?: string; arms?: Partial<Record<string, Item>>; bag?: Item[]; stash?: Item[]; buyback?: { item: Item }[] }

/** A saved hero with every old kit renamed (a copy; anything it doesn't have is left out). */
export function renameKits<P extends Kept>(p: P): P {
  const out: P = { ...p };
  if (p.weapon) out.weapon = kitNow(p.weapon);
  if (p.arms) out.arms = Object.fromEntries(Object.entries(p.arms).map(([k, it]) => [kitNow(k), item(it)]));
  if (p.bag) out.bag = p.bag.map(item);
  if (p.stash) out.stash = p.stash.map(item);
  if (p.buyback) out.buyback = p.buyback.map((x) => ({ ...x, item: item(x.item) }));
  return out;
}
