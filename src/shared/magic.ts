/** Relics (rechargeable magic items) and the elements that can be fitted to them. */
import { CHAIN, FIRE_RING, KNIVES, LIGHT, SIC, STAMP, TETHER, VANISH, VOLLEY } from './skillkit.js';
import { BELL, BOMB, KNUCKLE, SENTRY } from './relickit.js';
/**
 * The Warrior's relic: a javelin thrown at range, recharging. It carries anything light enough and
 * pins it to the first wall or pillar it reaches; it sticks into anything heavier.
 */
export const JAVELIN = {
  cooldown: 10,
  windup: 0.2,
  recover: 0.28,
  speed: 16,
  range: 10,
  dmg: 20,
  knock: 9,
  /** Enemies this light or lighter are carried and pinned. */
  pinWeight: 1,
  pinTime: 2.6,
  pinDmg: 12,
  /** Javelins stay stuck in walls, floors and bodies this long. */
  stuckLife: 9,
};

/**
 * The grappling hook relic. It latches the first thing it reaches: a light enemy is yanked to you;
 * a heavy one, a wall or a pillar pulls you to it.
 */
export const HOOK = {
  cooldown: 10,
  windup: 0.12,
  recover: 0.15,
  speed: 20,
  range: 8,
  /** Enemies this light or lighter are yanked to you; anything heavier (or a wall) pulls you to it instead.
   *  Only a Warrior or a Healer is heavy enough to haul big things in (`heavyYank`): the rest pull small
   *  goblins and otherwise go flying to whatever they hooked, which makes the hook a second dodge. */
  yankWeight: 1,
  heavyYank: 4,
  yankSpeed: 15,
  zipSpeed: 15,
  /** A yanked enemy arrives reeling for this long. */
  yankStun: 0.9,
  dmg: 5,
};

/** The Ranger's hunting net: thrown, it opens on the first goblin it reaches. Small ones are snared flat; big ones are slowed. */
export const NET = { cooldown: 20, windup: 0.15, recover: 0.25, speed: 14, range: 8, radius: 1.3, snare: 2.6, slow: 0.35, dmg: 4 };

/** The Rogue's shadow relic: step out of the dark behind the goblin you face, ready to stab its back. */
export const SHADOWSTEP = { cooldown: 20, windup: 0.06, recover: 0.12, range: 6 };

/** The Mage's lodestone: lobbed, it lands and drags every goblin near it inward (light ones fast), then bursts. */
export const LODESTONE = { cooldown: 20, windup: 0.2, recover: 0.3, range: 7, fallback: 4.5, flight: 0.5, radius: 3.6, pull: 34, time: 1.8, burst: 1.4, dmg: 12 };

/**
 * The Healer's blessed ground: a circle of light at the Healer's feet (or where they point, on a
 * laptop). Allies in it mend slowly and are blessed (hit harder, take less) while they stand there;
 * goblins in it burn with holy light. Every half second (`every`), for `time` seconds.
 */
/** The Healer's coal (sim/lantern.ts): per coal, heals x(1 + heal), goblins judge you `lure` tiles nearer and notice you `notice` further off. */
export const LANTERN = { heal: 0.08, lure: 0.35, notice: 0.25, max: 12, reach: 1.1, life: 25 };

export const BLESSING = { cooldown: 12, windup: 0.25, recover: 0.25, range: 6, radius: 2.4, time: 6, every: 0.5, heal: 3, hurt: 4, linger: 0.6, dmgMult: 1.3, taken: 0.75 };

/**
 * The Healer's ward: a shell of light on an ally (the most hurt one in reach, yourself included; where
 * you point on a laptop). It takes the blows meant for them, up to `hp`, for `time`; arrows (and,
 * later, goblin spells) bounce straight back at whoever loosed them for `reflect` times the damage,
 * stunning them.
 */
export const WARD = { cooldown: 14, windup: 0.2, recover: 0.2, range: 7, hp: 50, time: 5, reflect: 1.5, stun: 1.2 };

/** The Healer's skill: blessed ground at your feet and a ward on whoever needs it most, at once. */
export const SANCTUARY = { cooldown: 20, windup: 0.25, recover: 0.25 };

/** The Mage's Elemental Channel: a tap turns its spells to the next element at once (fire, frost,
 *  storm, round again), back in `cooldown` seconds. The first spell after a turn is primed: `primed`
 *  times as hard. Each element has a job (BURN, FROST, STORM below; who is weak to what: weakness.ts). */
export const CHANNEL = { cooldown: 1, windup: 0.06, recover: 0.12, primed: 1.5, order: ['fire', 'frost', 'storm'] as const };

/** The war cry (one of the Warrior's two skills): every goblin in earshot, awake or not, comes for you
 *  and nobody else for `time` seconds; small ones right beside you flinch. */
export const HORN = { cooldown: 18, windup: 0.25, recover: 0.3, radius: 9, time: 5, scare: 2.5 };

/** The shield charge (the Warrior's other skill): a run shield-first along where you face, `distance` in
 *  `time`. Small goblins in the way are knocked flat and reeling (grab them), big ones stagger; crates and
 *  barrels burst; a wall stops it. */
export const BASH = { cooldown: 10, windup: 0.12, recover: 0.2, distance: 5, time: 0.4, reach: 0.25, dmg: 14, knock: 10, stun: 1.2, stagger: 0.45, propDmg: 40 };

/** `range` is how far the phone's auto-aim looks; `cls` who may carry it. */
export const RELICS = {
  javelin: { name: 'RELIC JAVELIN', short: 'JAVELIN', cooldown: JAVELIN.cooldown, windup: JAVELIN.windup, recover: JAVELIN.recover, range: JAVELIN.range * 0.8 },
  hook: { name: 'GRAPPLING HOOK', short: 'HOOK', cooldown: HOOK.cooldown, windup: HOOK.windup, recover: HOOK.recover, range: HOOK.range },
  net: { name: "HUNTER'S NET", short: 'NET', cooldown: NET.cooldown, windup: NET.windup, recover: NET.recover, range: NET.range },
  shadow: { name: 'SHADOWSTEP', short: 'SHADOW', cooldown: SHADOWSTEP.cooldown, windup: SHADOWSTEP.windup, recover: SHADOWSTEP.recover, range: SHADOWSTEP.range },
  channel: { name: 'ELEMENTAL CHANNEL', short: 'CHANNEL', cooldown: CHANNEL.cooldown, windup: CHANNEL.windup, recover: CHANNEL.recover, range: 0 },
  lodestone: { name: 'LODESTONE', short: 'LODESTONE', cooldown: LODESTONE.cooldown, windup: LODESTONE.windup, recover: LODESTONE.recover, range: LODESTONE.range },
  horn: { name: 'WAR CRY', short: 'WAR CRY', cooldown: HORN.cooldown, windup: HORN.windup, recover: HORN.recover, range: HORN.radius },
  bash: { name: 'SHIELD CHARGE', short: 'SHIELD', cooldown: BASH.cooldown, windup: BASH.windup, recover: BASH.recover, range: BASH.distance },
  blessing: { name: 'BLESSED GROUND', short: 'BLESS', cooldown: BLESSING.cooldown, windup: BLESSING.windup, recover: BLESSING.recover, range: BLESSING.range },
  ward: { name: 'WARD', short: 'WARD', cooldown: WARD.cooldown, windup: WARD.windup, recover: WARD.recover, range: WARD.range },
  sanctuary: { name: 'SANCTUARY', short: 'SANCTUARY', cooldown: SANCTUARY.cooldown, windup: SANCTUARY.windup, recover: SANCTUARY.recover, range: WARD.range },
  // The skills taught after the first (shared/skillkit.ts).
  stamp: { name: 'SHIELD STAMP', short: 'STAMP', cooldown: STAMP.cooldown, windup: STAMP.windup, recover: STAMP.recover, range: STAMP.radius },
  volley: { name: 'VOLLEY', short: 'VOLLEY', cooldown: VOLLEY.cooldown, windup: VOLLEY.windup, recover: VOLLEY.recover, range: VOLLEY.range },
  sic: { name: 'SEND THE HOUND', short: 'HOUND', cooldown: SIC.cooldown, windup: SIC.windup, recover: SIC.recover, range: SIC.range },
  vanish: { name: 'VANISH', short: 'VANISH', cooldown: VANISH.cooldown, windup: VANISH.windup, recover: VANISH.recover, range: 0 },
  knives: { name: 'KNIFE FAN', short: 'KNIVES', cooldown: KNIVES.cooldown, windup: KNIVES.windup, recover: KNIVES.recover, range: KNIVES.range },
  firering: { name: 'FIRE RING', short: 'RING', cooldown: FIRE_RING.cooldown, windup: FIRE_RING.windup, recover: FIRE_RING.recover, range: FIRE_RING.radius },
  tether: { name: 'STORM TETHER', short: 'TETHER', cooldown: TETHER.cooldown, windup: TETHER.windup, recover: TETHER.recover, range: TETHER.range },
  chain: { name: 'CENSER CHAIN', short: 'CHAIN', cooldown: CHAIN.cooldown, windup: CHAIN.windup, recover: CHAIN.recover, range: CHAIN.range },
  light: { name: 'CENSER LIGHT', short: 'LIGHT', cooldown: LIGHT.cooldown, windup: LIGHT.windup, recover: LIGHT.recover, range: LIGHT.radius },
  // The found relics beyond the javelin, hook and lodestone (shared/relickit.ts).
  bomb: { name: 'GALL BOMB', short: 'BOMB', cooldown: BOMB.cooldown, windup: BOMB.windup, recover: BOMB.recover, range: BOMB.range },
  sentry: { name: 'WIND-UP BOW', short: 'WIND-UP', cooldown: SENTRY.cooldown, windup: SENTRY.windup, recover: SENTRY.recover, range: 0 },
  bell: { name: 'BONE WHISTLE', short: 'WHISTLE', cooldown: BELL.cooldown, windup: BELL.windup, recover: BELL.recover, range: BELL.radius },
  knuckle: { name: "BUTCHER'S KNUCKLE", short: 'KNUCKLE', cooldown: KNUCKLE.cooldown, windup: KNUCKLE.windup, recover: KNUCKLE.recover, range: KNUCKLE.length },
};
export type RelicId = keyof typeof RELICS;
export const RELIC_ORDER: RelicId[] = ['javelin', 'hook', 'bash', 'horn', 'stamp', 'net', 'volley', 'sic', 'shadow', 'vanish', 'knives', 'lodestone', 'firering', 'tether', 'blessing', 'ward', 'sanctuary', 'chain', 'light', 'bomb', 'sentry', 'bell', 'knuckle'];
/** Two abilities at most: the class's own skill, and one found relic carried with it. */
export const RELIC_SLOTS = 2;
/** Each class's skill (on the SKILL button): the first of its choices, until the hero picks another. */
export const CLASS_SKILL: Record<'WARRIOR' | 'RANGER' | 'ROGUE' | 'MAGE' | 'HEALER', RelicId> = {
  WARRIOR: 'bash',
  RANGER: 'net',
  ROGUE: 'shadow',
  MAGE: 'channel',
  HEALER: 'sanctuary',
};
/**
 * Relics are found, never given (the javelin aside, from the wood): rarely off a named butcher, and
 * surely at the bottom of a won deep dive. Any class can carry one (on the RELIC button); each is an
 * item with its own charge (shared/relicitems.ts). None of them ever hurts a friend.
 */
export const FOUND_RELICS: RelicId[] = ['javelin', 'hook', 'lodestone', 'bomb', 'sentry', 'bell', 'knuckle'];
/** A hero's abilities: their skill, then the relic they carry (if any). */
export const abilitiesOf = (cls: keyof typeof CLASS_SKILL, carried?: RelicId | '', skill?: RelicId) => [skill && SKILL_CHOICES[cls].includes(skill) ? skill : CLASS_SKILL[cls], ...(carried ? [carried] : [])];
/** The skills a class's trainer teaches, in the order taught (levels and prices: SKILL_STEPS in
 *  drills.ts); a hero carries one at a time and changes it at the trainer. */
export const SKILL_CHOICES: Record<keyof typeof CLASS_SKILL, RelicId[]> = {
  WARRIOR: ['bash', 'horn', 'stamp'],
  RANGER: ['net', 'volley', 'sic'],
  ROGUE: ['shadow', 'vanish', 'knives'],
  MAGE: ['channel', 'firering', 'tether'],
  HEALER: ['sanctuary', 'chain', 'light'],
};

/**
 * Magic augments: an element fitted to a relic (the Mage's spells cast with the equipped relic's).
 * Each element alone: fire burns and spreads by touch; frost chills, and a second frost freezes
 * solid; storm arcs to nearby goblins and to javelins stuck in bodies. Together: fire meets frost
 * as a scalding steam burst; storm or a heavy blow shatters the frozen; storm on the burning flares.
 */
export type Element = 'fire' | 'frost' | 'storm';
export type Augment = Element | '';
export const AUGMENTS: Augment[] = ['', 'fire', 'frost', 'storm'];
export const ELEMENT_NAME: Record<Element, string> = { fire: 'FIRE', frost: 'FROST', storm: 'STORM' };

/** Fire's job, swarms: it burns on, and jumps to anything within `spread` (beyond both bodies). */
export const BURN = { time: 3, every: 0.5, dmg: 7, spread: 0.7 };
/** Frost's job, control: chilled goblins move and turn at `slow` and wind up at `windup` of their pace;
 *  a second frost freezes them solid for `freeze` (a heavy blow then shatters them: SHATTER). */
export const FROST = { chill: 3, slow: 0.5, windup: 0.6, freeze: 2.2 };
/** Storm's job, packs: it jumps to `chains` more within `reach` for `share` of the blow, and goes round
 *  a shield's board; a Mage's storm spell lands only `single` of itself on the first goblin.
 *  A javelin stuck in a body is a lightning rod. */
export const STORM = { reach: 3.8, chains: 3, share: 0.7, min: 6, single: 0.8, flinch: 0.25, rodReach: 6, rodDmg: 10 };
export const STEAM = { radius: 1.8, dmg: 10, stun: 0.9 };
export const SHATTER = { dmg: 30 };
export const FLARE = { radius: 1.6, dmg: 12, knock: 12 };
