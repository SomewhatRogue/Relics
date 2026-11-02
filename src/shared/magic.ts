/** Relics (rechargeable magic items) and the elements that can be fitted to them. */
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
/** The Mage's Elemental Channel: stands still `time` seconds, then its spells turn to the next element
 *  (fire, frost, storm, round again). Fire: a firebolt, and a fireball that bursts and sets them burning.
 *  Frost: three icicles, and a burst that freezes solid. Storm: sparks and lances that jump to the next goblin. */
export const CHANNEL = { cooldown: 8, windup: 0.08, recover: 0.1, time: 2, order: ['fire', 'frost', 'storm'] as const };
export const SANCTUARY = { cooldown: 20, windup: 0.25, recover: 0.25 };

/** The war cry (the Warrior's skill): every ally in earshot is rallied: stamina back at once, then twice as fast, and blocking costs half. Small goblins near you flinch. */
export const HORN = { cooldown: 20, windup: 0.25, recover: 0.3, radius: 6, time: 6, regen: 2, guard: 0.5, scare: 2.5 };

/** `range` is how far the phone's auto-aim looks; `cls` who may carry it. */
export const RELICS = {
  javelin: { name: 'RELIC JAVELIN', short: 'JAVELIN', cooldown: JAVELIN.cooldown, windup: JAVELIN.windup, recover: JAVELIN.recover, range: JAVELIN.range * 0.8 },
  hook: { name: 'GRAPPLING HOOK', short: 'HOOK', cooldown: HOOK.cooldown, windup: HOOK.windup, recover: HOOK.recover, range: HOOK.range },
  net: { name: "HUNTER'S NET", short: 'NET', cooldown: NET.cooldown, windup: NET.windup, recover: NET.recover, range: NET.range },
  shadow: { name: 'SHADOWSTEP', short: 'SHADOW', cooldown: SHADOWSTEP.cooldown, windup: SHADOWSTEP.windup, recover: SHADOWSTEP.recover, range: SHADOWSTEP.range },
  channel: { name: 'ELEMENTAL CHANNEL', short: 'CHANNEL', cooldown: CHANNEL.cooldown, windup: CHANNEL.windup, recover: CHANNEL.recover, range: 0 },
  lodestone: { name: 'LODESTONE', short: 'LODESTONE', cooldown: LODESTONE.cooldown, windup: LODESTONE.windup, recover: LODESTONE.recover, range: LODESTONE.range },
  horn: { name: 'WAR CRY', short: 'WAR CRY', cooldown: HORN.cooldown, windup: HORN.windup, recover: HORN.recover, range: HORN.radius },
  blessing: { name: 'BLESSED GROUND', short: 'BLESS', cooldown: BLESSING.cooldown, windup: BLESSING.windup, recover: BLESSING.recover, range: BLESSING.range },
  ward: { name: 'WARD', short: 'WARD', cooldown: WARD.cooldown, windup: WARD.windup, recover: WARD.recover, range: WARD.range },
  sanctuary: { name: 'SANCTUARY', short: 'SANCTUARY', cooldown: SANCTUARY.cooldown, windup: SANCTUARY.windup, recover: SANCTUARY.recover, range: WARD.range },
};
export type RelicId = keyof typeof RELICS;
export const RELIC_ORDER: RelicId[] = ['javelin', 'hook', 'horn', 'net', 'shadow', 'lodestone', 'blessing', 'ward', 'sanctuary'];
/** Two abilities at most: the class's own skill, and one found relic carried with it. */
export const RELIC_SLOTS = 2;
/** Each class's one skill, from the start (on the SKILL button). */
export const CLASS_SKILL: Record<'WARRIOR' | 'RANGER' | 'ROGUE' | 'MAGE' | 'HEALER', RelicId> = {
  WARRIOR: 'horn',
  RANGER: 'net',
  ROGUE: 'shadow',
  MAGE: 'channel',
  HEALER: 'sanctuary',
};
/**
 * Relics are found, never given: pried out of the named butcher at the end of a deep dive, one you
 * don't have yet each time. Any class can carry one (on the RELIC button).
 */
export const FOUND_RELICS: RelicId[] = ['javelin', 'hook'];
/** A hero's abilities: their skill, then the relic they carry (if any). */
export const abilitiesOf = (cls: keyof typeof CLASS_SKILL, carried?: RelicId | '') => [CLASS_SKILL[cls], ...(carried ? [carried] : [])];

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

export const BURN = { time: 3, every: 0.5, dmg: 4, /** Touching distance (beyond both bodies) that spreads it. */ spread: 0.3 };
export const FROST = { chill: 3, /** Chilled goblins move and turn this much slower. */ slow: 0.5, freeze: 2.2 };
export const STORM = { reach: 3.2, chains: 2, share: 0.6, min: 6, flinch: 0.25, /** A javelin stuck in a body is a lightning rod. */ rodReach: 6, rodDmg: 10 };
export const STEAM = { radius: 1.8, dmg: 10, stun: 0.9 };
export const SHATTER = { dmg: 30 };
export const FLARE = { radius: 1.6, dmg: 12, knock: 12 };
