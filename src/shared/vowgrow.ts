/**
 * Vowed pieces grow (docs/design/holy-and-hungry.md section 5b; Kyle, 2026-11-19: "you can use it for a certain
 * amount of time until it gets to its highest strength"). The same count as hungry gear's (`worn`, job-units by
 * size, shared/jobunits.ts), but only clean jobs count: a job ended corrupt counts nothing, so growth freezes,
 * and is never lost. From PRE-WAR's strength to `top`, evenly over `span` units (about thirty medium jobs). At the
 * top a piece is ripe: the crossroads (a later slice).
 *
 * How: the piece keeps its modifiers as given (`vowBase`) and its live ones are rewritten from them after each clean
 * job, so the card, the stats and the fight all read the grown numbers with nothing else to change.
 */
import type { Item } from './loot.js';
import { budget, slotOf } from './gear.js';
import { isVowed, type VowedItem } from './vowed.js';
import { isCorrupt } from './corrupt.js';

/** `top`: the points a fully grown piece's modifiers sum to, as a share of TURNING's: halfway from TURNING (36) to
 *  hungry's 1.5 times (54), so under hungry. */
export const GROW = { span: 30, top: 1.25 };

type Mod = NonNullable<Item['mods']>[number];
/** A vowed piece's count and its modifiers as given (to move into loot.ts's Item with `holy`, when Gear says yes). */
export type GrowItem = VowedItem & { worn?: number; vowBase?: Mod[] };

const wornOf = (it: GrowItem) => Math.max(0, Number(it.worn) || 0);
/** How far grown, 0 to 1. */
export const grown = (it: Item) => Math.min(1, wornOf(it as GrowItem) / GROW.span);
/** Ripe: fully grown. */
export const ripe = (it: Item | null | undefined) => !!it && isVowed(it) && grown(it) >= 1;

/** What its modifiers are multiplied by at `share` grown: 1 at none, up to `top` of TURNING's over PRE-WAR's. */
export function growMult(it: Item, share: number): number {
  const slot = slotOf(it), from = budget('tolmouth', slot, it.armor), to = budget('turning', slot, it.armor) * GROW.top;
  return from > 0 ? 1 + (to / from - 1) * Math.max(0, Math.min(1, share)) : 1;
}

/** A vowed piece `units` further grown, as a new piece (so a cache never reads it stale). */
export function grownBy<T extends Item>(it: T, units: number): T {
  if (!isVowed(it) || !(units > 0)) return it;
  const g = it as GrowItem, base = g.vowBase ?? it.mods ?? [], worn = Math.round((wornOf(g) + units) * 100) / 100;
  const k = growMult(it, Math.min(1, worn / GROW.span));
  return { ...it, worn, vowBase: base, mods: base.map((m) => ({ ...m, v: Math.round(m.v * k * 1000) / 1000 })) };
}

/** What a hero wears, as the profile keeps it. */
interface Kit<K extends string> { weapon: K; arms: Partial<Record<K, Item>>; armor: Item | null; legs?: Item | null; rings: Item[]; want?: number; bag?: Item[] }
/** A job finished: every vowed piece worn grows by its units, unless the hero ends it corrupt (then nothing grows). */
export function growKit<K extends string>(p: Kit<K>, units: number): void {
  if (!(units > 0) || isCorrupt(p)) return;
  const held = p.arms[p.weapon];
  if (held) p.arms[p.weapon] = grownBy(held, units);
  if (p.armor) p.armor = grownBy(p.armor, units);
  if (p.legs) p.legs = grownBy(p.legs, units);
  p.rings = p.rings.map((r) => grownBy(r, units));
}
