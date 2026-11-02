/**
 * Every number the fight runs on. The rules read these and the client draws from the same values,
 * so a wind-up you see is the wind-up that is judged. Distances are in tiles (1 tile = 16 px),
 * times in seconds, knockback in tiles per second of push (divided by the target's weight).
 */
export const TICK = 1 / 30;

export const HERO = {
  hp: 100,
  radius: 0.32,
  weight: 1,
  speed: 4.4,
  stamina: 100,
  staminaRegen: 34,
  regenDelay: 0.6,
  /** Downed heroes stand back up after this (no revive yet). */
  respawn: 3,
};

export * from './weapons.js';
export * from './magic.js';
export * from './loot.js';
export * from './props.js';
export * from './progress.js';
export * from './potions.js';
export * from './gear.js';
export * from './hungry.js';

/** Holding attack past `start` begins charging; the heavy is strongest at `full`. */
export const CHARGE = { start: 0.18, full: 0.9 };
/** A queued press is kept this long. */
export const INPUT_BUFFER = 0.25;

export const GUARD = {
  /** Stamina spent per point of damage blocked. */
  staminaPerDmg: 1.4,
  /** A re-press this soon after the last one doesn't reopen the window (no mashing). */
  parryRepress: 0.25,
  guardBreakStun: 0.9,
  /** After a parry, the next attack started within this window is a counter. */
  counterWindow: 1.6,
  counterMult: 2.5,
  /** Hits on a stunned enemy (other than the counter) do this much more. */
  stunnedMult: 1.5,
  /** Any blow from behind does this much more (daggers do more, see WEAPONS). No extra knockback. */
  rearMult: 1.25,
  /** Behind means the attacker stands where the target's facing points away (dot below this). */
  rearCos: -0.35,
};


export const HITSTOP = { light: 0.05, heavy: 0.11, parry: 0.18 };
/** Goblins hit by their own: an arrow that missed you lands on the first goblin in its line (this times
 *  its damage); a butcher's sweep, slam or charge catches small goblins under it. */
export const FRIENDLY = { shot: 1.5, blow: 0.8 };
/** Dodging: rolled clear before it landed counts (no bonus); a roll through the blow as it lands (in the
 *  roll's i-frames) staggers a close attacker for this share of a parry's stun. */
export const DODGE = { stun: 0.6 };
export const HURT_STAGGER = 0.25;

/** Knockback slides decay by this share per second; a slide this fast into a wall slams. */
export const KNOCK = { friction: 9, wallSpeed: 5, wallDmg: 6, /** A body this fast that hits another hurts both. */ bodySpeed: 6, bodyDmg: 1.5, bodyMax: 25 };

/**
 * Grabbing a small goblin: only one you've stunned, netted, frozen, staggered or got behind. Carried
 * overhead, it can be slammed into the ground (a kill pounds its head in) or thrown at its friends.
 */
export const GRAB = { reach: 1.3, carrySpeed: 0.6, hold: 3, throwSpeed: 16, /** Seconds a thrown goblin flies before it starts to skid. */ air: 0.35, slamWindup: 0.3, slamRecover: 0.3, slamDmg: 30, slamStun: 1.5 };

/** A killing blow this much bigger than the life left bursts the body. */
export const OVERKILL = 20;

export interface EnemyAttackSpec {
  windup: number;
  active: number;
  recover: number;
  dmg: number;
  knock: number;
  unblockable: boolean;
  range?: number;
  arc?: number;
  radius?: number;
  ahead?: number;
}

export interface EnemySpec {
  hp: number;
  radius: number;
  weight: number;
  speed: number;
  reach: number;
  respawn: number;
  /** Stunned this long after a parry. */
  stun: number;
  pauseBetween: number;
  /** Ordinary hits interrupt its wind-up (light enemies); heavy ones need a charged hit. */
  flinches: boolean;
  /** How fast it turns to face you (radians a second): slow turners can be got behind. */
  turn: number;
}

export const BUTCHER: EnemySpec & { cleave: EnemyAttackSpec; slam: EnemyAttackSpec; slamChance: number } = {
  hp: 260, radius: 0.62, weight: 3.5, speed: 2.1, reach: 2.2, respawn: 4, stun: 2.2, pauseBetween: 0.5, flinches: false, turn: 2.4,
  cleave: { windup: 1.0, active: 0.1, recover: 0.9, dmg: 30, knock: 8, range: 2.6, arc: 70, unblockable: false },
  slam: { windup: 1.3, active: 0.12, recover: 1.1, dmg: 40, knock: 14, radius: 1.7, ahead: 1.2, unblockable: true },
  slamChance: 0.3,
};

export const SCRAPPER: EnemySpec & { stab: EnemyAttackSpec } = {
  hp: 36, radius: 0.34, weight: 0.6, speed: 3.1, reach: 1.25, respawn: 5, stun: 1.8, pauseBetween: 0.9, flinches: true, turn: 7,
  stab: { windup: 0.55, active: 0.08, recover: 0.5, dmg: 8, knock: 3, range: 1.35, arc: 50, unblockable: false },
};

/**
 * A scrapper with a bow: keeps its distance (up on a ledge if it can), draws on you for a second with
 * a long thin telegraph, and looses. Blockable, parryable (it's stunned where it stands), rollable.
 */
export const ARCHER = {
  reach: 7.5,
  /** It runs from you when you're this close on its own level. */
  keep: 4.5,
  flee: 1.1,
  shot: { windup: 1.0, active: 0.08, recover: 0.7, dmg: 10, knock: 3, range: 8, arc: 7, unblockable: false } as EnemyAttackSpec,
};

/** Heights: shots from up on a ledge hit harder; something knocked off a ledge this fast takes a fall. */
/**
 * Goblins at rest: they mill about until they see you (this close, in front of them; half that from
 * behind), hear a fight (a goblin hit or killed this close), or are hurt; then they shout, and every
 * goblin within `shout` comes too.
 */
export const ALERT = { sight: 6.5, behind: 2.5, hear: 5, shout: 5.5, wander: 0.9, wanderSpeed: 0.8 };

/**
 * The prologue wood's goblins (shared/wood.ts), each built for one lesson: looters (slow, weak,
 * picking the dead), lungers (a striped stab from further off: dodge it), the heavy (a blow that breaks
 * a guard: parry it) and the Stoker (a one-off butcher: rake sweep, kiln drop, and the draw, a rake
 * flung along a line and hauled back).
 */
export const VARIANTS = {
  looter: { hp: 14, speed: 0.55, stab: { windup: 0.85, active: 0.08, recover: 0.7, dmg: 5, knock: 2, range: 1.3, arc: 50, unblockable: false } as EnemyAttackSpec },
  lunger: { hp: 30, reach: 2.8, stab: { windup: 0.8, active: 0.1, recover: 0.8, dmg: 10, knock: 5, range: 3.0, arc: 24, unblockable: true } as EnemyAttackSpec },
  heavy: { hp: 110, reach: 1.7, speed: 0.75, swing: { windup: 1.0, active: 0.1, recover: 0.9, dmg: 18, knock: 8, range: 1.9, arc: 100, unblockable: false } as EnemyAttackSpec },
  stoker: {
    hp: 520,
    sweep: { windup: 1.0, active: 0.1, recover: 0.9, dmg: 26, knock: 8, range: 3.0, arc: 150, unblockable: false } as EnemyAttackSpec,
    drop: { windup: 1.2, active: 0.12, recover: 1.0, dmg: 34, knock: 14, radius: 2.0, ahead: 1.0, unblockable: true } as EnemyAttackSpec,
    draw: { windup: 1.0, active: 0.1, recover: 0.6, dmg: 6, knock: 0, range: 8, arc: 8, unblockable: true } as EnemyAttackSpec,
    drawFrom: 3.2, drawEvery: 0.45, pullTo: 1.2, pullStun: 0.7,
    /** The charge: a long striped run straight at you. It can't be blocked, and no blow stops it once it's
     *  coming; get out of its line. Run into a wall or a tree and it stuns itself. */
    charge: { windup: 1.15, active: 0.55, recover: 1.0, dmg: 30, knock: 14, range: 8, arc: 0, radius: 0.95, unblockable: true } as EnemyAttackSpec,
    chargeFrom: 3.5, chargeChance: 0.3, chargeStun: 1.8,
  },
};

export const HEIGHT = { shot: 1.25, fallSpeed: 3, fallDmg: 12, fallStun: 0.8 };

export const SWING_DUMMY = {
  every: 2.6,
  reach: 2.2,
  stun: 1.8,
  swing: { windup: 0.8, active: 0.08, recover: 0.6, dmg: 8, knock: 3, range: 2.0, arc: 80, unblockable: false } as EnemyAttackSpec,
};

/** How long a light enemy flinches when hit. */
export const FLINCH = 0.3;
