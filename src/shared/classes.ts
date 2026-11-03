/**
 * The five classes, kept short: a line for the pick screen, then (tapped) a pitch, five ratings, the
 * weapon, the one skill, and what it can't do. Nobody starts with a relic. Copy checked by the lore
 * keeper (docs/lore/voice.md).
 */
import type { HeroClass } from './weapons.js';
import { SKILL_STEPS, TEACHES } from './drills.js';

const SKILL_AT = TEACHES.skill.level, LEAVE_AT = TEACHES.leave.level, [, SECOND, THIRD] = SKILL_STEPS.map((x) => x.level);
/** The two skills taught later, and that you carry one. */
const later = (a: string, b: string) => ` The same trainer teaches ${a} at level ${SECOND} and ${b} at level ${THIRD}. You carry one skill at a time, and changing it there costs nothing.`;

/** What a class is called on screen (the Healer is a Cleric; the id stays HEALER). */
export const CLASS_NAME: Record<HeroClass, string> = { WARRIOR: 'WARRIOR', RANGER: 'RANGER', ROGUE: 'ROGUE', MAGE: 'MAGE', HEALER: 'CLERIC' };

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
    skill: `Shield Charge: run shield first the way you face, knocking small goblins flat, staggering big ones and bursting crates, until a wall stops you. Your trainer teaches it from level ${SKILL_AT}.${later('the War Cry', 'the Shield Stamp')}`,
    cant: 'Nothing at range. Slow feet.',
    guard: "Can hold a block and parry, and the shield covers nearly everything in front. Can't roll: walk out of anything striped.",
    stats: { POWER: 4, GUARD: 5, SPEED: 2, RANGE: 1, SUPPORT: 3 },
  },
  RANGER: {
    line: 'Blade and bow, and a hound.',
    pitch: 'Forty paces is a long way to run with an arrow in you.',
    weapon: 'Short sword (tap) and longbow (hold to draw)',
    skill: `Hunter's Net: pins a small goblin flat, slows a big one. Your trainer teaches it from level ${SKILL_AT}.${later('the Volley', 'Send the Hound')}`,
    cant: "Light up close. Can't lift.",
    guard: `Can't hold a block. Can parry, if the timing's right. Jumps back instead of rolling, and from level ${LEAVE_AT} your trainer can teach the jump to leave a snare behind.`,
    note: "Runs at your heel and now and then goes for whatever you're hitting. It can't be killed, but a butcher swinging close by will scare it off for a while.",
    noteLabel: 'HOUND',
    stats: { POWER: 4, GUARD: 1, SPEED: 2, RANGE: 5, SUPPORT: 2 },
  },
  ROGUE: {
    line: 'Twin daggers. Fast, and from behind.',
    pitch: 'Everything with teeth has a back. Go and stand there.',
    weapon: 'Twin daggers',
    skill: `Shadowstep: you're suddenly behind the goblin you face. Your trainer teaches it from level ${SKILL_AT}.${later('Vanish', 'the Knife Fan')}`,
    cant: "Can't take a beating. Can't lift.",
    guard: "Can't block or parry. Dashes out of reach instead, further than anyone and far more often.",
    stats: { POWER: 3, GUARD: 1, SPEED: 5, RANGE: 1, SUPPORT: 1 },
  },
  MAGE: {
    line: 'Spark wand. Quick sparks at range.',
    pitch: 'The cleverest thing in the room, until something hits you.',
    weapon: 'Spark wand',
    skill: `Elemental Channel: tap it and your spells turn to the next element (fire, frost, storm, and round again). The first spell after a change hits harder. Your trainer teaches it from level ${SKILL_AT}.${later('the Fire Ring', 'the Storm Tether')}`,
    note: "Fire: a firebolt (tap) or a fireball (hold). It burns and spreads, so it's best on a crowd. Frost: three icicles (tap) or a wide burst (hold). It slows goblins, and a second hit freezes them solid, so it's best on the big ones. Storm: every spell jumps to the next goblin and goes round a shield. Some goblins take more from one element and less from another, and spiders burn, so watch for WEAK and RESIST.",
    noteLabel: 'SPELLS',
    cant: "Short of breath. Can't lift.",
    guard: `Can't block or parry. Blinks out of reach instead, and the blink is slow to come back. From level ${LEAVE_AT} your trainer can teach the blink to leave an image behind, which draws goblins off for a couple of seconds.`,
    stats: { POWER: 3, GUARD: 0, SPEED: 2, RANGE: 4, SUPPORT: 2 },
  },
  HEALER: {
    line: 'Mace and censer. Keeps you standing.',
    pitch: 'Stitch them shut, then go and hit whatever opened them.',
    weapon: 'Mace and censer',
    skill: `Sanctuary: blessed ground mends allies and burns goblins, and wards whoever's worst hurt. Your trainer teaches it from level ${SKILL_AT}.${later('the Censer Chain', 'the Censer Light')}`,
    cant: 'Slow, short reach.',
    guard: "Can hold a block and parry, though a mace and censer let a little more through than a shield. Can't roll: walk out of anything striped.",
    note: 'Feed the censer what butchers leave. It heals hotter, and draws teeth.',
    noteLabel: 'CENSER',
    stats: { POWER: 2, GUARD: 4, SPEED: 2, RANGE: 2, SUPPORT: 5 },
  },
};

export const NO_RELICS = 'No relics to start. Pry them out of named butchers, at the bottom of deep jobs.';
