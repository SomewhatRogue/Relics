/**
 * The five classes on one page: what each has and what it doesn't. Every class has a weapon, a guard,
 * a dodge and one skill of its own. Nobody starts with a relic: relics are pried out of the named
 * butcher at the end of a deep dive, and any class can carry one.
 */
import type { HeroClass } from './weapons.js';

export interface ClassSheet {
  /** The weapon you start with (the smith has the others). */
  weapon: string;
  guard: string;
  dodge: string;
  /** The class's one skill (the SKILL button). */
  skill: string;
  /** What only this class does. */
  edge: string;
  /** What it can't do. */
  cant: string;
}

export const CLASSES: Record<HeroClass, ClassSheet> = {
  WARRIOR: {
    weapon: 'Sword and shield. The smith has a greatsword and a spear.',
    guard: 'The best guard: blocks almost anything in front, and parries come easy.',
    dodge: 'A roll.',
    skill: 'War Cry: allies near you get their wind back and block for half the cost; small goblins flinch.',
    edge: 'Lifts barrels, tables and stunned goblins, and throws them.',
    cant: 'No ranged attack. Slow on its feet.',
  },
  RANGER: {
    weapon: 'Longbow. The smith has a shortbow and a crossbow.',
    guard: 'A light guard.',
    dodge: 'A quick step back.',
    skill: "Hunter's Net: pins small goblins flat, slows big ones.",
    edge: 'Hits hardest from range: release on the white flash.',
    cant: "Weak up close. Can't lift.",
  },
  ROGUE: {
    weapon: 'Twin daggers.',
    guard: 'A poor guard: better to be elsewhere.',
    dodge: 'A long dash, back again quickly.',
    skill: 'Shadowstep: straight behind the goblin you face.',
    edge: 'The fastest on its feet. Backstabs hit two and a half times as hard.',
    cant: "Can't take a beating. Can't lift.",
  },
  MAGE: {
    weapon: 'A spark wand. The smith has a staff and a rod.',
    guard: 'A poor guard, and a costly one.',
    dodge: 'A blink: far, but slow to come back.',
    skill: 'Lodestone: drags goblins together, then bursts.',
    edge: 'Spells by cast time: quick sparks, or held for a burst or a lance through a line.',
    cant: "Runs out of breath fast. Can't lift.",
  },
  HEALER: {
    weapon: 'Mace and censer.',
    guard: 'A good guard.',
    dodge: 'A roll.',
    skill: 'Sanctuary: blessed ground that mends allies and burns goblins, and a ward on whoever needs it most.',
    edge: 'Every third blow heals everyone near. Hold for a holy smite that stuns.',
    cant: 'Slow, short reach.',
  },
};

export const NO_RELICS = 'No relics to start. They come out of named butchers at the end of deep dives.';
