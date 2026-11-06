/**
 * Parry left the game (Kyle, 2026-11-05: "Parry in general is getting pushback as noisy, confusing, and
 * hard to land with a lot of enemies at once and latency"). A saved piece with the old PARRY modifier
 * keeps what it was worth: the same points become BLOCK for a class that holds a block (Warrior, Healer)
 * or DODGE for one that dodges (Ranger, Rogue, Mage), added to one of that kind already on it. A weapon
 * goes by its own kit's class; armor and rings by the hero wearing or carrying them.
 */
import { MODS, modValue, type ModId } from './mods.js';
import type { Item } from './loot.js';
import { CLASS_GUARD, WEAPONS, type HeroClass } from './weapons.js';

/** What a PARRY modifier was worth a unit (0.01 s), in points, before it went. */
const PARRY_PER = 2;
type Kept = { id: string; v: number };

/** The modifier a parry becomes for `cls`. */
export const parryTo = (cls: HeroClass): ModId => (CLASS_GUARD[cls] === 'full' ? 'guard' : 'dodge');

/** One piece with its PARRY turned over (the same piece back if it had none). */
export function noParry<T extends Item | null | undefined>(it: T, cls: HeroClass): T {
  const mods = it?.mods as Kept[] | undefined;
  if (!it || !mods?.some((m) => m.id === 'parry')) return it;
  const owner = it.kit && WEAPONS[it.kit] ? WEAPONS[it.kit].cls : cls, to = parryTo(owner);
  const pts = (m: Kept) => (m.id === 'parry' ? m.v * 100 * PARRY_PER : (MODS[m.id as ModId].unit === '' ? m.v : m.v * 100) * MODS[m.id as ModId].per);
  const worth = mods.filter((m) => m.id === 'parry' || m.id === to).reduce((s, m) => s + pts(m), 0);
  const out: Kept[] = [];
  for (const m of mods) {
    if (m.id !== 'parry' && m.id !== to) out.push(m);
    else if (!out.some((o) => o.id === to)) out.push({ id: to, v: modValue(to, worth) });
  }
  return { ...it, mods: out as Item['mods'] };
}

interface Kept2 { cls: HeroClass; arms?: Partial<Record<string, Item>>; bag?: Item[]; stash?: Item[]; buyback?: { item: Item }[]; armor?: Item | null; rings?: Item[] }

/** Every piece a saved hero has, anywhere (hand, pack, vault, buyback, worn), with PARRY turned over. */
export function fitNoParry<P extends Kept2>(p: P): void {
  const f = <T extends Item | null | undefined>(it: T) => noParry(it, p.cls);
  if (p.arms) p.arms = Object.fromEntries(Object.entries(p.arms).map(([k, it]) => [k, f(it)]));
  if (p.bag) p.bag = p.bag.map(f);
  if (p.stash) p.stash = p.stash.map(f);
  if (p.buyback) p.buyback = p.buyback.map((x) => ({ ...x, item: f(x.item) }));
  if (p.armor !== undefined) p.armor = f(p.armor);
  if (p.rings) p.rings = p.rings.map(f);
}
