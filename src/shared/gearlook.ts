/**
 * What a hero's gear looks like (docs/design/gear-looks.md). Drawing only: the room never reads it, so
 * every piece fights the same whatever it looks like. Slice 1 is the weapon: its tier, its element if it
 * carries one, and its name if it's a named piece (a Hungry or a unique id), through `shownItem`
 * (keptlook.ts) so a kept look shows. Your own hero and a party's are read from the weapon in hand
 * (`Hero.arms`, `Hero.keep`), so a swap mid-fight shows at once; a friend in town has no kit, so their look comes in
 * the town's `me` word (townpresence.ts), packed small, onto `Hero.gearLook`.
 */
import { ELEMENT_TRAITS, type Item, type Tier, type TraitId } from './loot.js';
import { TIER_ORDER } from './gear.js';
import { shownItem, type Looks } from './keptlook.js';
import { UNIQUES } from './uniques.js';

export type GearEl = 'fire' | 'frost' | 'storm';
/** `named`: a named piece's own look (docs/design/gear-looks.md slice 2), a Hungry id or a unique id. */
export interface WeaponLook { tier: Tier; el?: GearEl; named?: string }
/** A worn body or legs piece's look (slice 3): its weight and tier, and its name if it's a named piece. */
export interface ArmourLook { weight: 'light' | 'medium' | 'heavy'; tier: Tier; named?: string }
/** A worn ring's look (slice 4): its tier, and its name if it's a named ring. */
export interface RingLook { tier: Tier; named?: string }
/** Weapon, body (`a`), legs (`l`) and ring (`r`). */
export interface GearLook { w?: WeaponLook; a?: ArmourLook | null; l?: ArmourLook | null; r?: RingLook | null }

const EL: Partial<Record<TraitId, GearEl>> = { ember: 'fire', rime: 'frost', storm: 'storm' };

/** A weapon's look from the piece itself; no piece is a plain one (the class's own weapon). */
export function weaponLookOf(it: Item | null | undefined): WeaponLook {
  if (!it) return { tier: 'plain' };
  const t = it.traits?.find((x) => ELEMENT_TRAITS.includes(x)), el = t ? EL[t] : undefined;
  return { tier: TIER_ORDER.includes(it.quality) ? it.quality : 'plain', ...(el ? { el } : {}), ...(it.hungry || it.unique ? { named: it.hungry ?? it.unique } : {}) };
}

/** A unique's kit, for kept looks (a weapon's look is kept only on the same kit). */
const kitFor = (u: string) => (UNIQUES as Record<string, { kit?: string }>)[u]?.kit;
/** The look of what a hero holds now: what a friend's word said, else the piece in hand as shown (a kept look over it). */
export const heldLook = (h: { gearLook?: GearLook; arms?: Partial<Record<string, Item>>; weapon: string; keep?: Looks['keep'] }): WeaponLook =>
  h.gearLook?.w ?? weaponLookOf(shownItem(h.arms?.[h.weapon], h.keep, kitFor));

/** A short key for caches: "2f", "6:cleaver". */
export const lookKey = (l: WeaponLook) => TIER_ORDER.indexOf(l.tier) + (l.el ? EL_KEY[l.el] : '') + (l.named ? ':' + l.named : '');
const EL_KEY: Record<GearEl, string> = { fire: 'f', frost: 'r', storm: 's' };

/** Packed for the town's word: the same short key. */
export const packLook = lookKey;
/** A friend's packed look back, anything odd read as plain. */
export function unpackLook(s: unknown): WeaponLook {
  const m = typeof s === 'string' ? /^([0-6])([fsr])?(?::([a-z]{1,16}))?$/.exec(s) : null;
  if (!m) return { tier: 'plain' };
  const el = ({ f: 'fire', r: 'frost', s: 'storm' } as const)[m[2] as 'f' | 'r' | 's'];
  return { tier: TIER_ORDER[Number(m[1])], ...(el ? { el } : {}), ...(m[3] ? { named: m[3] } : {}) };
}

/** A body or legs piece's look; none worn, none drawn. */
export function armourLookOf(it: Item | null | undefined): ArmourLook | null {
  if (!it) return null;
  const weight = it.armor === 'heavy' || it.armor === 'medium' ? it.armor : 'light';
  return { weight, tier: TIER_ORDER.includes(it.quality) ? it.quality : 'plain', ...(it.hungry || it.unique ? { named: it.hungry ?? it.unique } : {}) };
}
type Wearer = { gearLook?: GearLook; armor?: Item | null; legs?: Item | null; rings?: Item[]; keep?: Looks['keep'] };
/** What a hero wears on the body and the legs, as shown (a kept look over it), or what a friend's word said. */
export const wornLook = (h: Wearer): ArmourLook | null => (h.gearLook && 'a' in h.gearLook ? h.gearLook.a ?? null : armourLookOf(shownItem(h.armor, h.keep, kitFor)));
export const legsLook = (h: Wearer): ArmourLook | null => (h.gearLook && 'l' in h.gearLook ? h.gearLook.l ?? null : armourLookOf(shownItem(h.legs, h.keep, kitFor)));

const WEIGHT_KEY = { light: 'l', medium: 'm', heavy: 'h' } as const;
/** An armour look packed for the town's word ("0h", "3m:apron"); none is "". */
export const packArmour = (l: ArmourLook | null) => (l ? TIER_ORDER.indexOf(l.tier) + WEIGHT_KEY[l.weight] + (l.named ? ':' + l.named : '') : '');
export function unpackArmour(s: unknown): ArmourLook | null {
  const m = typeof s === 'string' ? /^([0-6])([lmh])(?::([a-z]{1,16}))?$/.exec(s) : null;
  if (!m) return null;
  const weight = ({ l: 'light', m: 'medium', h: 'heavy' } as const)[m[2] as 'l' | 'm' | 'h'];
  return { weight, tier: TIER_ORDER[Number(m[1])], ...(m[3] ? { named: m[3] } : {}) };
}

/** The ring that shows: the best tier worn (a kept look over it), or what a friend's word said; none worn, none. */
export function ringLook(h: Wearer): RingLook | null {
  if (h.gearLook && 'r' in h.gearLook) return h.gearLook.r ?? null;
  const best = (h.rings ?? []).reduce<Item | null>((b, it) => (!b || TIER_ORDER.indexOf(it.quality) > TIER_ORDER.indexOf(b.quality) ? it : b), null);
  const it = shownItem(best, h.keep, kitFor);
  return it ? { tier: TIER_ORDER.includes(it.quality) ? it.quality : 'plain', ...(it.hungry || it.unique ? { named: it.hungry ?? it.unique } : {}) } : null;
}
export const packRing = (l: RingLook | null) => (l ? TIER_ORDER.indexOf(l.tier) + (l.named ? ':' + l.named : '') : '');
export function unpackRing(s: unknown): RingLook | null {
  const m = typeof s === 'string' ? /^([0-6])(?::([a-z]{1,16}))?$/.exec(s) : null;
  return m ? { tier: TIER_ORDER[Number(m[1])], ...(m[2] ? { named: m[2] } : {}) } : null;
}
