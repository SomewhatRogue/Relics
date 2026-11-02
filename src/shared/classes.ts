/**
 * The five classes, kept short: a line for the pick screen, then (tapped) a pitch, five ratings, the
 * weapon, the one skill, and what it can't do. Nobody starts with a relic. Copy checked by the lore
 * keeper (docs/lore/voice.md).
 */
import type { HeroClass } from './weapons.js';

export const STATS = ['POWER', 'GUARD', 'SPEED', 'RANGE', 'SUPPORT'] as const;
export type Stat = (typeof STATS)[number];

export interface ClassSheet {
  /** Under the class on the pick screen. */
  line: string;
  /** One sentence, in the world's voice. */
  pitch: string;
  /** Just the weapon type. */
  weapon: string;
  /** The class's one skill (the SKILL button), and what it does. */
  skill: string;
  cant: string;
  /** How it guards (blocks, parries, or neither) and dodges: plain, so nobody picks blind. */
  guard: string;
  /** Anything else only this class has (one line), under its own heading. */
  note?: string;
  noteLabel?: string;
  /** Out of 5, against the other classes (judged from tuning.ts; keep honest when it changes). */
  stats: Record<Stat, number>;
}

export const CLASSES: Record<HeroClass, ClassSheet> = {
  WARRIOR: {
    line: 'Sword and shield. Holds the line.',
    pitch: "Somebody has to stand in the door. You're the one with the shield.",
    weapon: 'Sword and shield',
    skill: 'War Cry: nearby allies catch their breath and block at half cost. Small goblins flinch. Your trainer teaches it from level 2.',
    cant: 'Nothing at range. Slow feet.',
    guard: "Can hold a block and parry, and the shield covers nearly everything in front. Can't roll: walk out of anything striped.",
    stats: { POWER: 4, GUARD: 5, SPEED: 2, RANGE: 1, SUPPORT: 3 },
  },
  RANGER: {
    line: 'Blade and bow, and a hound.',
    pitch: 'Forty paces is a long way to run with an arrow in you.',
    weapon: 'Short sword (tap) and longbow (hold to draw)',
    skill: "Hunter's Net: pins a small goblin flat, slows a big one. Your trainer teaches it from level 2.",
    cant: "Light up close. Can't lift.",
    guard: "Can't hold a block. Can parry, if the timing's right. Jumps back instead of rolling, and from level 3 your trainer can teach the jump to leave a snare behind.",
    note: "Runs at your heel and now and then goes for whatever you're hitting. It can't be killed, but a butcher swinging close by will scare it off for a while.",
    noteLabel: 'HOUND',
    stats: { POWER: 4, GUARD: 1, SPEED: 2, RANGE: 5, SUPPORT: 2 },
  },
  ROGUE: {
    line: 'Twin daggers. Fast, and from behind.',
    pitch: 'Everything with teeth has a back. Go and stand there.',
    weapon: 'Twin daggers',
    skill: "Shadowstep: you're suddenly behind the goblin you face. Your trainer teaches it from level 2.",
    cant: "Can't take a beating. Can't lift.",
    guard: "Can't block or parry. Dashes out of reach instead, further than anyone and far more often.",
    stats: { POWER: 3, GUARD: 1, SPEED: 5, RANGE: 1, SUPPORT: 1 },
  },
  MAGE: {
    line: 'Spark wand. Quick sparks at range.',
    pitch: 'The cleverest thing in the room, until something hits you.',
    weapon: 'Spark wand',
    skill: 'Elemental Channel: stand still for two seconds and your spells turn to the next element: fire, then frost, then storm, then fire again. Your trainer teaches it from level 2.',
    note: 'Fire: a firebolt (tap) or a fireball that sets goblins burning (hold). Frost: three icicles (tap) or a burst that freezes them solid (hold). Storm: every spell, tap or hold, jumps to the next goblin.',
    noteLabel: 'SPELLS',
    cant: "Short of breath. Can't lift.",
    guard: "Can't block or parry. Blinks out of reach instead, and the blink is slow to come back. From level 3 your trainer can teach the blink to leave an image behind, which draws goblins off for a couple of seconds.",
    stats: { POWER: 3, GUARD: 0, SPEED: 2, RANGE: 4, SUPPORT: 2 },
  },
  HEALER: {
    line: 'Mace and censer. Keeps you standing.',
    pitch: 'Stitch them shut, then go and hit whatever opened them.',
    weapon: 'Mace and censer',
    skill: "Sanctuary: blessed ground mends allies and burns goblins, and wards whoever's worst hurt. Your trainer teaches it from level 2.",
    cant: 'Slow, short reach.',
    guard: "Can hold a block and parry, though a mace and censer let a little more through than a shield. Can't roll: walk out of anything striped.",
    note: 'Feed the censer what butchers leave. It heals hotter, and draws teeth.',
    noteLabel: 'CENSER',
    stats: { POWER: 2, GUARD: 4, SPEED: 2, RANGE: 2, SUPPORT: 5 },
  },
};

export const NO_RELICS = 'No relics to start. Pry them out of named butchers, at the bottom of deep jobs.';
