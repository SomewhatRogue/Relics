/** Relics (rechargeable magic items) and the elements that can be fitted to them. */
/**
 * The Warrior's relic: a javelin thrown at range, recharging. It carries anything light enough and
 * pins it to the first wall or pillar it reaches; it sticks into anything heavier.
 */
export const JAVELIN = {
  cooldown: 6,
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
  cooldown: 4,
  windup: 0.12,
  recover: 0.15,
  speed: 20,
  range: 8,
  /** Enemies this light or lighter are yanked; anything heavier pulls you instead. */
  yankWeight: 1,
  yankSpeed: 15,
  zipSpeed: 15,
  /** A yanked enemy arrives reeling for this long. */
  yankStun: 0.9,
  dmg: 5,
};

/** A horn from an old watchtower: a cone of wind that throws goblins by their weight (into walls, ideally). */
export const HORN = { cooldown: 5, windup: 0.18, recover: 0.3, range: 4.5, arc: 80, dmg: 4, knock: 18, flinch: 0.5 };

/** The alchemist's blast flask: lobbed over heads, it bursts where it lands and throws everyone outward. */
export const FLASK = { cooldown: 5, windup: 0.2, recover: 0.25, range: 7, fallback: 5, flight: 0.6, radius: 1.8, dmg: 16, knock: 12 };

/** `range` is how far the phone's auto-aim looks for a target. */
export const RELICS = {
  javelin: { name: 'RELIC JAVELIN', short: 'JAVELIN', cooldown: JAVELIN.cooldown, windup: JAVELIN.windup, recover: JAVELIN.recover, range: JAVELIN.range * 0.8 },
  hook: { name: 'GRAPPLING HOOK', short: 'HOOK', cooldown: HOOK.cooldown, windup: HOOK.windup, recover: HOOK.recover, range: HOOK.range },
  horn: { name: 'GALE HORN', short: 'HORN', cooldown: HORN.cooldown, windup: HORN.windup, recover: HORN.recover, range: HORN.range },
  flask: { name: 'BLAST FLASK', short: 'FLASK', cooldown: FLASK.cooldown, windup: FLASK.windup, recover: FLASK.recover, range: FLASK.range },
};
export type RelicId = keyof typeof RELICS;
export const RELIC_ORDER: RelicId[] = ['javelin', 'hook', 'horn', 'flask'];
/** A hero carries at most this many relics into a run (chosen in town later). */
export const RELIC_SLOTS = 3;
/** The training room's racks: each a set of three to carry (the town's armoury picks freely later). */
export const LOADOUTS: RelicId[][] = [
  ['javelin', 'hook', 'horn'],
  ['javelin', 'hook', 'flask'],
  ['javelin', 'horn', 'flask'],
  ['hook', 'horn', 'flask'],
];

/**
 * Magic augments: an element fitted to a relic (the Mage's staff casts with its equipped relic's).
 * Each element alone: fire burns and spreads by touch; frost chills, and a second frost freezes
 * solid; storm arcs to nearby goblins and to javelins stuck in bodies. Together: fire meets frost
 * as a scalding steam burst; storm or a heavy blow shatters the frozen; storm on the burning flares.
 */
export type Element = 'fire' | 'frost' | 'storm';
export type Augment = Element | '';
export const AUGMENTS: Augment[] = ['', 'fire', 'frost', 'storm'];
export const ELEMENT_NAME: Record<Element, string> = { fire: 'FIRE', frost: 'FROST', storm: 'STORM' };

export const BURN = { time: 3, every: 0.5, dmg: 4, /** Touching distance (beyond both bodies) that spreads it. */ spread: 0.3 };
export const FROST = { chill: 3, /** Chilled goblins move and turn this much slower. */ slow: 0.5, freeze: 2.2 };
export const STORM = { reach: 3.2, chains: 2, share: 0.6, min: 6, flinch: 0.25, /** A javelin stuck in a body is a lightning rod. */ rodReach: 6, rodDmg: 10 };
export const STEAM = { radius: 1.8, dmg: 10, stun: 0.9 };
export const SHATTER = { dmg: 30 };
export const FLARE = { radius: 1.6, dmg: 12, knock: 12 };
