/**
 * Each hungry piece gets hungrier (docs/design/holy-and-hungry.md section 2b; Kyle, 2026-11-19: "the debuffs on
 * it become bigger in time up to like fifty percent and then gains another debuff"). A piece keeps its own count,
 * in job-units finished while worn (shared/jobunits.ts), and its BITE, the debuff, grows with it: 5% at first,
 * evenly to 50% at `span` units, in steps of 5%. At 50% it bites twice: a second bite grows the same way from
 * there. The count stays in the piece, worn or not, so taking it off never resets it. The fight reads the bites
 * in sim/bites.ts; the card's words are client/bitewords.ts.
 */
import type { Item } from './loot.js';
import { Rng } from './rng.js';
import { CLASS_DODGES, type HeroClass } from './weapons.js';
import { HUNGRY, type HungryId } from './hungry.js';

/** What a bite does to the wearer: health, recovery, the dodge, heals on you, how far off goblins see you, coin picked up. */
export type BiteId = 'frail' | 'winded' | 'clumsy' | 'starved' | 'noticed' | 'greedy';
export const BITE_ORDER: BiteId[] = ['frail', 'winded', 'clumsy', 'starved', 'noticed', 'greedy'];

/** The count and the bites a piece carries (to move into loot.ts's Item when the Gear chat says yes). */
export interface Fed { worn?: number; bites?: BiteId[] }
export type FedItem = Item & Fed;

/** 5% at nothing, 50% at `span` units (about twelve medium jobs), shown and felt in steps of 5%. All bites of one
 *  kind on everything worn together take at most `most` (each share counts against what the others left). */
export const HUNGER = { from: 0.05, top: 0.5, span: 12, step: 0.05, most: 0.75 };

const isHungry = (it: Item | null | undefined): it is FedItem => !!it && it.quality === 'hungry';
const wornOf = (it: FedItem) => Math.max(0, Number(it.worn) || 0);

/** A piece's own seed, from what doesn't change on it: so its bites are the same before and after they're kept. */
function seedOf(it: Item): number {
  const s = `${it.hungry ?? ''}|${it.kit ?? ''}|${it.armor ?? ''}|${(it.mods ?? []).map((m) => m.id + m.v).join(',')}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
/** The bites a piece can roll for whoever it's for: a dearer dodge only if they dodge (a Warrior or Cleric can't). */
function canBite(it: Item, cls?: HeroClass): BiteId[] {
  const who = HUNGRY[it.hungry as HungryId]?.cls ?? cls;
  return who && !CLASS_DODGES[who] ? BITE_ORDER.filter((b) => b !== 'clumsy') : BITE_ORDER;
}
/** The two bites this piece has or will have: kept ones first, else its own seed's, for the wearer's class. */
function bitesFor(it: FedItem, cls?: HeroClass): [BiteId, BiteId] {
  const kept = (it.bites ?? []).filter((b) => BITE_ORDER.includes(b)), can = canBite(it, cls);
  const rng = new Rng(seedOf(it)), first = kept[0] ?? rng.pick(can);
  const rest = can.filter((b) => b !== first);
  return [first, kept[1] && kept[1] !== first ? kept[1] : rest[new Rng(seedOf(it) ^ 0x9e3779b9).int(rest.length)]];
}

/** A bite's share at `worn` units: bite 0 from the start, bite 1 from `span` on; 0 before it comes. Stepped. */
export function biteShare(worn: number, k: 0 | 1): number {
  const start = k * HUNGER.span;
  if (worn < start) return 0;
  const raw = HUNGER.from + ((HUNGER.top - HUNGER.from) * Math.min(1, (worn - start) / HUNGER.span));
  return Math.round(Math.floor(raw / HUNGER.step + 1e-9) * HUNGER.step * 100) / 100;
}

/** Units until bite `k` next steps up (or arrives), or null at its worst. */
export function toNextStep(worn: number, k: 0 | 1): number | null {
  const now = biteShare(worn, k);
  if (now >= HUNGER.top) return null;
  const start = k * HUNGER.span, want = now ? now + HUNGER.step : HUNGER.from;
  const at = start + ((want - HUNGER.from) / (HUNGER.top - HUNGER.from)) * HUNGER.span;
  return Math.max(0, at - worn);
}

/** A hungry piece's bites as they are now (none for any other piece). */
export function bitesOf(it: Item | null | undefined, cls?: HeroClass): { id: BiteId; share: number; next: number | null }[] {
  if (!isHungry(it)) return [];
  const w = wornOf(it), [a, b] = bitesFor(it, cls);
  const out = [{ id: a, share: biteShare(w, 0), next: toNextStep(w, 0) }];
  if (w >= HUNGER.span) out.push({ id: b, share: biteShare(w, 1), next: toNextStep(w, 1) });
  return out;
}

/** All bites of kind `id` on what's worn, together, capped at `most`. */
export function biteOn(worn: (Item | null | undefined)[], id: BiteId, cls?: HeroClass): number {
  let left = 1;
  for (const it of worn) for (const b of bitesOf(it, cls)) if (b.id === id) left *= 1 - b.share;
  return Math.min(HUNGER.most, Math.round((1 - left) * 1000) / 1000);
}

/** A hungry piece `units` hungrier, as a new piece (so nothing that cached the old one reads it stale), its bites kept. */
export function fed<T extends Item>(it: T, units: number, cls?: HeroClass): T {
  if (!isHungry(it) || !(units > 0)) return it;
  const worn = Math.round((wornOf(it) + units) * 100) / 100, [a, b] = bitesFor(it, cls);
  return { ...it, worn, bites: worn >= HUNGER.span ? [a, b] : [a] };
}

/** What a hero wears, as the profile keeps it. */
interface Kit<K extends string> { cls?: HeroClass; weapon: K; arms: Partial<Record<K, Item>>; armor: Item | null; legs?: Item | null; rings: Item[] }
/** A job finished: every hungry piece worn (the weapon in hand, the body, legs, rings) counts the job's units. */
export function feedKit<K extends string>(p: Kit<K>, units: number): void {
  if (!(units > 0)) return;
  const held = p.arms[p.weapon], c = p.cls;
  if (held) p.arms[p.weapon] = fed(held, units, c);
  if (p.armor) p.armor = fed(p.armor, units, c);
  if (p.legs) p.legs = fed(p.legs, units, c);
  p.rings = p.rings.map((r) => fed(r, units, c));
}
