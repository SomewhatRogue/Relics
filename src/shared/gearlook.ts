/**
 * What a hero's gear looks like (docs/design/gear-looks.md). Drawing only: the room never reads it, so
 * every piece fights the same whatever it looks like. Slice 1 is the weapon: its tier, its element if it
 * carries one, and its Hungry id. Your own hero and a party's are read from the weapon in hand
 * (`Hero.arms`), so a swap mid-fight shows at once; a friend in town has no kit, so their look comes in
 * the town's `me` word (townpresence.ts), packed small, onto `Hero.gearLook`.
 */
import { ELEMENT_TRAITS, type Item, type Tier, type TraitId } from './loot.js';
import { TIER_ORDER } from './gear.js';

export type GearEl = 'fire' | 'frost' | 'storm';
export interface WeaponLook { tier: Tier; el?: GearEl; hungry?: string }
/** Later slices add armour weight and rings beside the weapon. */
export interface GearLook { w?: WeaponLook }

const EL: Partial<Record<TraitId, GearEl>> = { ember: 'fire', rime: 'frost', storm: 'storm' };

/** A weapon's look from the piece itself; no piece is a plain one (the class's own weapon). */
export function weaponLookOf(it: Item | null | undefined): WeaponLook {
  if (!it) return { tier: 'plain' };
  const t = it.traits?.find((x) => ELEMENT_TRAITS.includes(x)), el = t ? EL[t] : undefined;
  return { tier: TIER_ORDER.includes(it.quality) ? it.quality : 'plain', ...(el ? { el } : {}), ...(it.hungry ? { hungry: it.hungry } : {}) };
}

/** The look of what a hero holds now: what a friend's word said, else the piece in hand. */
export const heldLook = (h: { gearLook?: GearLook; arms?: Partial<Record<string, Item>>; weapon: string }): WeaponLook =>
  h.gearLook?.w ?? weaponLookOf(h.arms?.[h.weapon]);

/** A short key for caches: "2f", "6:cleaver". */
export const lookKey = (l: WeaponLook) => TIER_ORDER.indexOf(l.tier) + (l.el ? EL_KEY[l.el] : '') + (l.hungry ? ':' + l.hungry : '');
const EL_KEY: Record<GearEl, string> = { fire: 'f', frost: 'r', storm: 's' };

/** Packed for the town's word: the same short key. */
export const packLook = lookKey;
/** A friend's packed look back, anything odd read as plain. */
export function unpackLook(s: unknown): WeaponLook {
  const m = typeof s === 'string' ? /^([0-6])([fsr])?(?::([a-z]{1,12}))?$/.exec(s) : null;
  if (!m) return { tier: 'plain' };
  const el = ({ f: 'fire', r: 'frost', s: 'storm' } as const)[m[2] as 'f' | 'r' | 's'];
  return { tier: TIER_ORDER[Number(m[1])], ...(el ? { el } : {}), ...(m[3] ? { hungry: m[3] } : {}) };
}
