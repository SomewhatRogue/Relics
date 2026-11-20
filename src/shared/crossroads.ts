/**
 * The crossroads (docs/design/holy-and-hungry.md 5b; Kyle, 2026-11-19: "you can use it until it gets to its highest
 * strength and then you have the option to give it up for a big penance or fall"). A vowed piece at full strength is
 * ripe (shared/vowgrow.ts). On the next return to town, before anything else, its wearer chooses, one ripe piece at
 * a time (client/ripeui.ts):
 * - **give it up:** large amends, and a fresh vowed piece for that slot, where the ripe one was;
 * - **fall:** keep it, and it turns hungry, stronger than a fresh hungry piece, its bites starting at once, the
 *   Want growing faster for it. It keeps its old name and remembers it was vowed (`once`).
 * Pure: the profile changes here; saving and the hero's kit are the caller's (client/game.ts `crossroads`).
 */
import type { Item } from './loot.js';
import type { Rng } from './rng.js';
import type { HeroClass } from './weapons.js';
import { budget, slotOf } from './gear.js';
import { raise } from './budget.js';
import { dropLevel } from './itemlevel.js';
import { rollVowed, vowedOf, type VowedId } from './vowed.js';
import { ripe, type GrowItem } from './vowgrow.js';

/** `amends`: what giving a ripe piece up adds. `power`: a fallen piece against a fresh hungry one of its slot.
 *  `want`: what it adds to the Want a job (a fresh hungry piece adds 5, the Wedding Ring 15). */
export const FALL = { amends: 5, power: 1.2, want: 8 };

/** A fallen piece: hungry now, and remembers the vowed piece it was (asked of Gear's itemName: its name). */
export type FallenItem = Item & { once?: VowedId };
export const onceOf = (it: Item | null | undefined) => (it as FallenItem | null | undefined)?.once;

/** What a hero carries, as the profile keeps it. */
interface Kit { cls: HeroClass; level: number; weapon: string; arms: Partial<Record<string, Item>>; armor: Item | null; legs?: Item | null; rings: Item[]; bag: Item[]; penance?: number }

/** The first ripe piece the hero carries, worn or in the pack, or none. */
export function firstRipe(p: Kit): Item | undefined {
  return [p.arms[p.weapon], p.armor, p.legs, ...p.rings, ...p.bag].find((it): it is Item => ripe(it));
}

/** Put `next` where `was` is, wherever that is. */
function swap(p: Kit, was: Item, next: Item | null): void {
  for (const k of Object.keys(p.arms)) if (p.arms[k] === was) next ? (p.arms[k] = next) : delete p.arms[k];
  if (p.armor === was) p.armor = next;
  if (p.legs === was) p.legs = next;
  p.rings = p.rings.flatMap((r) => (r === was ? (next ? [next] : []) : [r]));
  p.bag = p.bag.flatMap((r) => (r === was ? (next ? [next] : []) : [r]));
}

/** Give a ripe piece up: large amends, and a fresh vowed piece for its slot, where it was. Returns the fresh one. */
export function giveRipe(p: Kit, it: Item, rng: Rng): Item | null {
  if (!ripe(it)) return null;
  p.penance = (p.penance ?? 0) + FALL.amends;
  const fresh = rollVowed(rng, p.cls, slotOf(it), it.armor);
  // A weapon comes back on the same kit (its class's own), so the hand isn't left empty.
  const next = fresh && raise(fresh, dropLevel(p.level));
  swap(p, it, next);
  return next;
}

/** Keep a ripe piece and fall: it turns hungry, its modifiers at `power` times a fresh hungry piece's. Returns it. */
export function fallWith(p: Kit, it: Item): Item | null {
  if (!ripe(it)) return null;
  const g = it as GrowItem, slot = slotOf(it), base = g.vowBase ?? it.mods ?? [];
  const k = (budget('hungry', slot, it.armor) * FALL.power) / Math.max(1, budget('tolmouth', slot, it.armor));
  const { holy: _h, vowBase: _b, worn: _w, ...rest } = g;
  const fallen: FallenItem = { ...rest, quality: 'hungry', once: vowedOf(it), mods: base.map((m) => ({ ...m, v: Math.round(m.v * k * 1000) / 1000 })) };
  swap(p, it, fallen);
  return fallen;
}
