/**
 * VOWED gear, the holy path (docs/design/holy-gear.md, approved 2026-11-19): steel someone gave, at the step or in a
 * vow, and the church kept. Steadier than hungry and for the party: a gift that leans to friends, a small fair cost.
 * PRE-WAR's strength for now (two modifiers at its budget); it grows in a later slice. Never with hunger: while any
 * hungry piece is worn, every vowed piece is DIM (gives nothing), and none goes on over hungry gear.
 * Names from the lore keeper. The gifts and costs are wired in sim/vowed.ts. Ids are as saved.
 */
import type { Rng } from './rng.js';
import { budget, modPool, rollMods } from './gear.js';
import type { Item } from './loot.js';
import type { HeroClass, WeaponId } from './weapons.js';
import { wearsHungry } from './corrupt.js';
import { shown } from './shown.js';

/** What the gifts and costs do, in the fight's own units (sim/vowed.ts). Heals in health (shown x10). */
export const VOWED_FX = { draw: 6, tithe: 4, near: 4, ward: 0.1, wardFor: 4, breach: 0.1, raise: 2, relicUses: 1, kills: 0.9, slowSword: 0.05, slowMail: 0.08, drawLonger: 0.1, dodge: 0.1, skill: 0.1, carry: 0.5, selfHeal: 0.5, coat: 0.05 };

export type VowedId = 'widow' | 'ketterby' | 'returned' | 'apprentice' | 'infirmary' | 'breach' | 'carthand' | 'swornoff' | 'tithe';
interface Vowed { name: string; slot: 'weapon' | 'armor' | 'ring'; kit?: WeaponId; armor?: 'light' | 'heavy'; cls?: HeroClass; gift: string; cost: string }

export const VOWED: Record<VowedId, Vowed> = {
  widow: { name: "THE WIDOW'S SWORD", slot: 'weapon', kit: 'sword', cls: 'WARRIOR', gift: 'Blocking a hit gives your nearest friend some stamina.', cost: 'You move 5% slower.' },
  ketterby: { name: "KETTERBY'S BOW", slot: 'weapon', kit: 'longbow', cls: 'RANGER', gift: `A full draw that hits heals your nearest friend for ${shown(VOWED_FX.draw)}.`, cost: 'Draws take 10% longer.' },
  returned: { name: 'THE RETURNED PAIR', slot: 'weapon', kit: 'daggers', cls: 'ROGUE', gift: 'A backstab: friends near you take 10% less damage for 4 s.', cost: 'Each dodge costs 10% more stamina.' },
  apprentice: { name: "THE APPRENTICE'S STAFF", slot: 'weapon', kit: 'staff', cls: 'MAGE', gift: "Killing with a spell refills some of your nearest friend's bar.", cost: 'Your skill recharges 10% slower.' },
  infirmary: { name: 'THE INFIRMARY CENSER', slot: 'weapon', kit: 'censer', cls: 'HEALER', gift: 'Your heals also reach a second friend, at half strength.', cost: 'Heals on yourself do half.' },
  breach: { name: 'THE BREACH MAIL', slot: 'armor', armor: 'heavy', gift: 'Friends near you take 10% less damage.', cost: 'You move 8% slower.' },
  carthand: { name: "THE CART-HAND'S COAT", slot: 'armor', armor: 'light', gift: 'You raise a fallen friend twice as fast.', cost: 'You take 5% more damage.' },
  swornoff: { name: 'THE SWORN-OFF RING', slot: 'ring', gift: 'Your relic gets 1 more use.', cost: "You can't play dice at Moll's while you wear it." },
  tithe: { name: 'THE TITHE RING', slot: 'ring', gift: `Each relic use heals friends near you for ${shown(VOWED_FX.tithe)}.`, cost: 'You get 10% less coin from kills.' },
};
export const VOWED_ORDER = Object.keys(VOWED) as VowedId[];
/** The chip's word on screen (Kyle, 2026-11-19). */
export const VOWED_WORD = 'VOWED';

/** A vowed piece carries its id (to move into loot.ts's Item when the Gear chat says yes, as `hungry` is). */
export type VowedItem = Item & { holy?: VowedId };
export const vowedOf = (it: Item | null | undefined): VowedId | undefined => {
  const id = (it as VowedItem | null | undefined)?.holy;
  return id && id in VOWED ? id : undefined;
};
export const isVowed = (it: Item | null | undefined) => !!vowedOf(it);

/** Which of the nine can go in `slot` for this class: its own weapon; either body or ring. */
export const vowedFor = (cls: HeroClass, slot: 'weapon' | 'armor' | 'legs' | 'ring') =>
  VOWED_ORDER.filter((id) => VOWED[id].slot === slot && (!VOWED[id].cls || VOWED[id].cls === cls));

/** A vowed piece for this class and slot (legs: none yet), at PRE-WAR's strength. A body piece follows `weight`
 *  if one fits (the given piece's), else the class's own leaning: heavy for a Warrior, light for the rest. */
export function rollVowed(rng: Rng, cls: HeroClass, slot: 'weapon' | 'armor' | 'legs' | 'ring', weight?: 'light' | 'medium' | 'heavy'): VowedItem | null {
  const fits = vowedFor(cls, slot);
  if (!fits.length) return null;
  const want = weight === 'heavy' || (weight !== 'light' && cls === 'WARRIOR') ? 'heavy' : 'light';
  const id = slot === 'armor' ? (fits.find((x) => VOWED[x].armor === want) ?? fits[0]) : rng.pick(fits), d = VOWED[id];
  const mods = rollMods(rng, modPool(d.slot, cls, d.kit, d.armor), 2, d.slot === 'weapon' ? budget('tolmouth', 'weapon') : budget('tolmouth', d.slot, d.armor));
  return { slot: d.slot, kit: d.kit, armor: d.armor, quality: 'tolmouth', traits: [], mods, level: 0, ilvl: 1, holy: id };
}

/** Every vowed piece worn goes dim while any hungry piece is: no modifiers, no gift. */
export const dimmed = (k: Parameters<typeof wearsHungry>[0]) => wearsHungry(k);
/** A vowed piece won't go on while a hungry one is worn. */
export const blocksVowed = (k: Parameters<typeof wearsHungry>[0], it: Item) => isVowed(it) && wearsHungry(k);
