/**
 * The five classes, as the class card on the hero-making screen shows them (Kyle's words, 2026-11-04):
 * the name and its tagline, a line on how it plays, five ratings, how it guards and dodges, anything
 * only it has, and its skill. No pitch and no "can't" (Kyle cut both). The GUARD and DODGE areas are
 * worked out from the class's first kit (client/guardarea.ts); `guard` is the plain line under them.
 */
import type { HeroClass } from './weapons.js';

/** What a class is called on screen (the Healer is a Cleric; the id stays HEALER). */
export const CLASS_NAME: Record<HeroClass, string> = { WARRIOR: 'WARRIOR', RANGER: 'RANGER', ROGUE: 'ROGUE', MAGE: 'MAGE', HEALER: 'CLERIC' };

/** Under the name on the class card (Kyle). */
export const CLASS_TAG: Record<HeroClass, string> = {
  WARRIOR: 'A bulwark or a blade, strong enough to throw men.',
  RANGER: 'Sword and bow, accompanied by a lifelong friend.',
  ROGUE: 'From the shadows, fast and fragile.',
  MAGE: 'Master of elements, powerful caster.',
  HEALER: 'Holy warrior, last carriers of the sacred light. Heals friends, smites foes.',
};

export const STATS = ['STRENGTH', 'GUARD', 'SPEED', 'RANGE', 'SUPPORT'] as const;
export type Stat = (typeof STATS)[number];

/** Once, under the skill on the class card (Kyle). */
export const SKILL_NOTE = 'Train skills at your trainer. You can only have one active skill at a time.';

export interface ClassSheet {
  /** How it plays, under the tagline. */
  line: string;
  /** Just the weapon type. */
  weapon: string;
  /** The class's skill (the SKILL button): its name, then what it does. */
  skill: string;
  /** How it guards and dodges, in a line, under the GUARD and DODGE areas. */
  guard: string;
  /** Anything else only this class has (one line), under its own heading. */
  note?: string;
  noteLabel?: string;
  /** The class's own rule (the Cleric's), under its own heading. */
  perk?: string;
  perkLabel?: string;
  /** Out of 5, against the other classes (judged from tuning.ts; keep honest when it changes). */
  stats: Record<Stat, number>;
}

export const CLASSES: Record<HeroClass, ClassSheet> = {
  WARRIOR: {
    line: 'Bulwark and blade. Surprisingly effective.',
    weapon: 'Sword and shield',
    skill: 'Shield Charge: a quick charge in a straight line, stunning and displacing foes.',
    guard: 'Can hold a block in a large area and parry effectively.',
    stats: { STRENGTH: 4, GUARD: 5, SPEED: 2, RANGE: 1, SUPPORT: 3 },
  },
  RANGER: {
    line: 'Blade, bow and a lifelong friend.',
    weapon: 'Short sword (tap) and longbow (hold to draw)',
    skill: "Hunter's Net: Snares or slows.",
    guard: 'Jumps back to dodge. Perfect parry timing required.',
    note: 'Nips at their heels, smart enough to not go down.',
    noteLabel: 'HOUND',
    stats: { STRENGTH: 4, GUARD: 1, SPEED: 2, RANGE: 5, SUPPORT: 2 },
  },
  ROGUE: {
    line: 'Twin daggers. Weak head on, twice as strong from behind.',
    weapon: 'Twin daggers',
    skill: 'Shadowstep: Enter the shadows and appear behind an enemy, stunning them briefly.',
    guard: 'Fast and nimble, rapid dodges available.',
    stats: { STRENGTH: 3, GUARD: 1, SPEED: 5, RANGE: 1, SUPPORT: 1 },
  },
  MAGE: {
    line: 'Spark wand. Spells at range.',
    weapon: 'Spark wand',
    skill: 'Round Up: Drags the goblins in front of you into a bunch just ahead.',
    note: 'Your element is your spellbook: switch it with ELEMENT. Fire burns, and spreads when a burning goblin dies. Frost chills (slows) and freezes. Storm ignores shields. Wet goblins (in water, or out in the rain) take 1.5x from storm, and it jumps between them. Wand far, staff round you, spellblade up close.',
    noteLabel: 'SPELLS',
    guard: 'Blinks away to dodge.',
    stats: { STRENGTH: 3, GUARD: 0, SPEED: 2, RANGE: 4, SUPPORT: 2 },
  },
  HEALER: {
    line: 'What you lack in speed you make up for in divinity.',
    weapon: 'Mace and censer',
    skill: 'Sanctuary: Bless the ground around you to heal allies and burn foes.',
    guard: 'Heavy armor and effective blocking.',
    note: 'Fed by the coals left behind by butchers. Permanent increase to healing, but increases enemy aggression.',
    noteLabel: 'CENSER',
    perk: 'Cannot harm allies.',
    perkLabel: 'DIVINE SAVIOR',
    stats: { STRENGTH: 2, GUARD: 4, SPEED: 2, RANGE: 2, SUPPORT: 5 },
  },
};

/** Where a relic would be listed for a new hero (Kyle: "just say No Relic"). */
export const NO_RELICS = 'No relic';
