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

export * from './weapons';
export * from './magic';
export * from './loot';

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
export const HURT_STAGGER = 0.25;

/** Knockback slides decay by this share per second; a slide this fast into a wall slams. */
export const KNOCK = { friction: 9, wallSpeed: 5, wallDmg: 6 };

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

export const SWING_DUMMY = {
  every: 2.6,
  reach: 2.2,
  stun: 1.8,
  swing: { windup: 0.8, active: 0.08, recover: 0.6, dmg: 8, knock: 3, range: 2.0, arc: 80, unblockable: false } as EnemyAttackSpec,
};

/** How long a light enemy flinches when hit. */
export const FLINCH = 0.3;
