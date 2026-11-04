/**
 * Loot: weapons with traits. A trait is a word with one rule, and every rule pays off only when you
 * execute something well (a parry, a dodge through a blow, a perfect release, a backstab, a throw
 * into a wall, a fully charged hit). No stat sheets: at most two traits, one weapon per kit.
 */
import { CLASS_DODGES, CLASS_GUARD, WEAPONS, type HeroClass, type WeaponId } from './weapons.js';
import { barWords } from './barword.js';
import { HUNGRY, type HungryId } from './hungry.js';

export type TraitId = 'riposte' | 'tempo' | 'bulwark' | 'deadeye' | 'crushing' | 'brutal' | 'reaper' | 'ember' | 'rime' | 'storm';

export const TRAITS: Record<TraitId, { name: string; text: string }> = {
  riposte: { name: 'RIPOSTE', text: 'Counters after a parry do 40% more damage' },
  tempo: { name: 'SIDESTEP', text: 'Dodge through a blow: your next hit within 1.5 s does double damage' },
  bulwark: { name: 'STAMINA ON PARRY', text: 'Parry refills stamina' },
  deadeye: { name: 'DEADEYE', text: 'PERFECT shots do 60% more damage' },
  crushing: { name: 'CRUSHING', text: 'Goblins knocked into a wall take triple damage' },
  brutal: { name: 'BRUTAL', text: '50% more damage to stunned, pinned, netted or frozen goblins' },
  reaper: { name: 'REAPER', text: 'A backstab or counter kill heals you 10' },
  ember: { name: 'FIREFORGED', text: 'Charged hits and full draws set goblins on fire' },
  rime: { name: 'FROSTFORGED', text: 'Charged hits and full draws chill goblins. Two chills freeze' },
  storm: { name: 'STORMFORGED', text: 'Charged hits and full draws shock goblins near the target too' },
};

/** How much each trait does. */
export const TRAIT = { riposte: 1.4, tempo: 2, tempoTime: 1.5, deadeye: 1.6, crushing: 3, brutal: 1.5, reaper: 10 };
/** Releasing a draw within this long after it is full is perfect; holding past `overdraw` shakes and weakens it. */
export const RELEASE = { perfect: 0.25, overdraw: 0.8, overdrawn: 0.75 };

export const ELEMENT_TRAITS: TraitId[] = ['ember', 'rime', 'storm'];
const DRAWN: WeaponId[] = ['longbow', 'shortbow', 'wand', 'staff', 'mace', 'poisoner', 'flail'];
const MELEE: WeaponId[] = ['sword', 'greatsword', 'spear', 'daggers', 'mace', 'rapier', 'poisoner', 'censer', 'flail', 'staff', 'spellblade'];

/**
 * The skill traits a kit can roll: the ones that make sense for how it fights, and only what its class
 * can do (Kyle, 2026-11-02): RIPOSTE and BULWARK need a parry, SIDESTEP a dodge.
 */
export function traitsFor(kit: WeaponId): TraitId[] {
  const cls = WEAPONS[kit].cls, out: TraitId[] = ['crushing', 'brutal'];
  if (CLASS_DODGES[cls]) out.push('tempo');
  if (CLASS_GUARD[cls] !== 'none') out.push('bulwark');
  if (MELEE.includes(kit)) out.push('reaper');
  if (MELEE.includes(kit) && CLASS_GUARD[cls] !== 'none') out.push('riposte');
  if (DRAWN.includes(kit)) out.push('deadeye');
  return out;
}

/** A trait's words for a class: REAPER without a parry is a backstab's alone. */
export const traitText = (t: TraitId, cls?: HeroClass) => barWords(t === 'reaper' && cls && CLASS_GUARD[cls] === 'none' ? 'A backstab kill heals you 10' : TRAITS[t].text, cls);

/** Gear tiers, white to red (gear.ts). */
export type Tier = 'plain' | 'fine' | 'forged' | 'tolmouth' | 'hungry';
export type Quality = Tier;
export interface Item {
  /** Weapon (the default, for old saves), armor or ring. */
  slot?: 'weapon' | 'armor' | 'ring';
  /** A weapon's type. */
  kit?: WeaponId;
  /** Armor's weight. */
  armor?: 'light' | 'medium' | 'heavy';
  quality: Tier;
  traits: TraitId[];
  /** Modifiers on base stats (gear.ts). */
  mods?: { id: 'damage' | 'quick' | 'reach' | 'draw' | 'parry' | 'guard' | 'knock' | 'health' | 'tough' | 'breath' | 'foot' | 'dodge' | 'focus' | 'mending'; v: number }[];
  /** Halvard's upgrades, +0 to +5. */
  level?: number;
  /** A hungry piece's id (hungry.ts). */
  hungry?: string;
}

const ARMOR_NAME = { light: 'LEATHERS', medium: 'MAIL SHIRT', heavy: 'PLATE' };
/** "STORMFORGED SPEAR +2": an element if it has one, the base, its level. */
export function itemName(i: Item): string {
  const el = i.traits.find((t) => ELEMENT_TRAITS.includes(t));
  if (i.hungry) return HUNGRY[i.hungry as HungryId].name;
  const base = i.slot === 'armor' ? ARMOR_NAME[i.armor ?? 'light'] : i.slot === 'ring' ? 'RING' : WEAPONS[i.kit ?? 'sword'].name;
  return (el ? TRAITS[el].name + ' ' : '') + base + (i.level ? ' +' + i.level : '');
}

/** Drop chances by who died. */
/** Drop chances by who died (weapons are rare now: gold, potions and chests take over in the loot system, docs/DECISIONS.md). */
export const DROPS = { scrapper: 0.02, butcher: 0.15, forged: { scrapper: 0.2, butcher: 0.6 }, life: 45 };

/**
 * The treasure at the end of a job won: each player's own (rolled for their class, by their own
 * browser, so nobody fights over it). One piece always, a chance of a second, a better one for
 * worse places and deep jobs. Most gear comes from here; goblins on the way rarely drop any.
 */
export const TREASURE = { second: 0.35, slots: [['weapon', 0.6], ['armor', 0.2], ['ring', 0.2]] as const };
