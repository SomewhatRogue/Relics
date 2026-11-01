/**
 * Loot: weapons with traits. A trait is a word with one rule, and every rule pays off only when you
 * execute something well (a parry, a dodge through a blow, a perfect release, a backstab, a throw
 * into a wall, a fully charged hit). No stat sheets: at most two traits, one weapon per kit.
 */
import type { Rng } from './rng.js';
import { CLASS_KITS, WEAPONS, type HeroClass, type WeaponId } from './weapons.js';

export type TraitId = 'riposte' | 'tempo' | 'bulwark' | 'deadeye' | 'crushing' | 'brutal' | 'reaper' | 'ember' | 'rime' | 'storm';

export const TRAITS: Record<TraitId, { name: string; text: string }> = {
  riposte: { name: 'RIPOSTE', text: 'Counters after a parry hit far harder' },
  tempo: { name: 'SIDESTEP', text: 'Dodge through a blow: your next hit lands double' },
  bulwark: { name: 'BULWARK', text: 'A parry fills your stamina' },
  deadeye: { name: 'TRUE RELEASE', text: 'Release on the white flash for a far bigger shot' },
  crushing: { name: 'CRUSHING', text: 'Goblins you throw into walls take triple' },
  brutal: { name: 'BRUTAL', text: 'Hits on stunned, pinned, netted or frozen goblins hurt far more' },
  reaper: { name: 'REAPER', text: 'A backstab or counter that kills heals you' },
  ember: { name: 'EMBERFORGED', text: 'Charged hits and full draws set goblins burning' },
  rime: { name: 'RIMEFORGED', text: 'Charged hits and full draws chill (twice freezes)' },
  storm: { name: 'STORMFORGED', text: 'Charged hits and full draws arc to nearby goblins' },
};

/** How much each trait does. */
export const TRAIT = { riposte: 1.4, tempo: 2, tempoTime: 1.5, deadeye: 1.6, crushing: 3, brutal: 1.5, reaper: 10 };
/** Releasing a draw within this long after it is full is perfect; holding past `overdraw` shakes and weakens it. */
export const RELEASE = { perfect: 0.25, overdraw: 0.8, overdrawn: 0.75 };

export const ELEMENT_TRAITS: TraitId[] = ['ember', 'rime', 'storm'];
const DRAWN: WeaponId[] = ['longbow', 'shortbow', 'wand', 'staff', 'rod', 'mace'];
const MELEE: WeaponId[] = ['sword', 'greatsword', 'spear', 'daggers', 'mace'];

/** The skill traits a kit can roll (the ones that make sense for how it fights). */
export function traitsFor(kit: WeaponId): TraitId[] {
  const out: TraitId[] = ['tempo', 'bulwark', 'crushing', 'brutal'];
  if (MELEE.includes(kit)) out.push('riposte', 'reaper');
  if (DRAWN.includes(kit)) out.push('deadeye');
  return out;
}

export type Quality = 'fine' | 'forged';
export interface Item {
  kit: WeaponId;
  quality: Quality;
  traits: TraitId[];
}

export function itemName(i: Item): string {
  const el = i.traits.find((t) => ELEMENT_TRAITS.includes(t));
  return (el ? TRAITS[el].name : 'FINE') + ' ' + WEAPONS[i.kit].name;
}

/** Drop chances by who died. */
/** Drop chances by who died (weapons are rare now: gold, potions and chests take over in the loot system, docs/DECISIONS.md). */
export const DROPS = { scrapper: 0.04, butcher: 0.4, forged: { scrapper: 0.2, butcher: 0.6 }, life: 45 };

/** Roll a weapon for this class (for `kit`, the kit in hand, when given): a fine one has one skill trait; a forged one adds an element. */
export function rollItem(rng: Rng, cls: HeroClass, forgedChance: number, kit: WeaponId = rng.pick(CLASS_KITS[cls])): Item {
  const traits: TraitId[] = [rng.pick(traitsFor(kit))];
  const forged = rng.next() < forgedChance;
  if (forged) traits.push(rng.pick(ELEMENT_TRAITS));
  return { kit, quality: forged ? 'forged' : 'fine', traits };
}
