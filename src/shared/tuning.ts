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

export interface Swing {
  windup: number;
  active: number;
  recover: number;
  dmg: number;
  range: number;
  /** Degrees. A thrust is a narrow line; a slash sweeps the arc. */
  arc: number;
  lunge: number;
  knock: number;
  thrust?: boolean;
}

export interface Heavy extends Swing {
  /** Damage and knockback at full charge (the Swing values are at the start of the charge). */
  dmgFull: number;
  knockFull: number;
}

export interface Weapon {
  name: string;
  combo: Swing[];
  heavy: Heavy;
  /** Damage taken through a block, as a share. */
  chip: number;
  blockSpeed: number;
  /** Move speed while charging a heavy. */
  chargeSpeed: number;
  /** Damage multiplier for blows from behind (GUARD.rearMult if not set). */
  backstab?: number;
}

export const WEAPONS: Record<'sword' | 'greatsword' | 'spear' | 'daggers', Weapon> = {
  sword: {
    name: 'SWORD AND SHIELD',
    combo: [
      { windup: 0.1, active: 0.08, recover: 0.2, dmg: 12, range: 1.45, arc: 110, lunge: 0.35, knock: 3 },
      { windup: 0.09, active: 0.08, recover: 0.2, dmg: 12, range: 1.45, arc: 110, lunge: 0.35, knock: 3 },
      { windup: 0.16, active: 0.1, recover: 0.36, dmg: 22, range: 1.6, arc: 140, lunge: 0.6, knock: 7 },
    ],
    heavy: { windup: 0.08, active: 0.12, recover: 0.42, dmg: 24, dmgFull: 45, range: 1.8, arc: 170, lunge: 0.8, knock: 6, knockFull: 13 },
    chip: 0.12,
    blockSpeed: 0.5,
    chargeSpeed: 0.4,
  },
  greatsword: {
    name: 'GREATSWORD',
    combo: [
      { windup: 0.22, active: 0.12, recover: 0.3, dmg: 24, range: 2.0, arc: 160, lunge: 0.4, knock: 6 },
      { windup: 0.24, active: 0.12, recover: 0.5, dmg: 32, range: 2.1, arc: 170, lunge: 0.55, knock: 10 },
    ],
    heavy: { windup: 0.1, active: 0.16, recover: 0.6, dmg: 38, dmgFull: 75, range: 2.3, arc: 220, lunge: 0.9, knock: 10, knockFull: 20 },
    chip: 0.3,
    blockSpeed: 0.35,
    chargeSpeed: 0.25,
  },
  spear: {
    name: 'SPEAR',
    combo: [
      { windup: 0.08, active: 0.07, recover: 0.16, dmg: 9, range: 2.3, arc: 26, lunge: 0.25, knock: 2, thrust: true },
      { windup: 0.07, active: 0.07, recover: 0.16, dmg: 9, range: 2.3, arc: 26, lunge: 0.25, knock: 2, thrust: true },
      { windup: 0.08, active: 0.07, recover: 0.16, dmg: 10, range: 2.3, arc: 26, lunge: 0.25, knock: 3, thrust: true },
      { windup: 0.18, active: 0.1, recover: 0.36, dmg: 18, range: 2.7, arc: 30, lunge: 1.1, knock: 9, thrust: true },
    ],
    heavy: { windup: 0.06, active: 0.14, recover: 0.4, dmg: 22, dmgFull: 42, range: 3.0, arc: 34, lunge: 2.4, knock: 9, knockFull: 16, thrust: true },
    chip: 0.22,
    blockSpeed: 0.45,
    chargeSpeed: 0.35,
  },
  /** The rogue's kit (a Ranger upgrade, Kyle's idea): weak from the front, brutal from behind. */
  daggers: {
    name: 'TWIN DAGGERS',
    combo: [
      { windup: 0.05, active: 0.06, recover: 0.12, dmg: 7, range: 1.15, arc: 100, lunge: 0.3, knock: 1 },
      { windup: 0.05, active: 0.06, recover: 0.12, dmg: 7, range: 1.15, arc: 100, lunge: 0.3, knock: 1 },
      { windup: 0.05, active: 0.06, recover: 0.12, dmg: 8, range: 1.15, arc: 100, lunge: 0.3, knock: 1 },
      { windup: 0.1, active: 0.07, recover: 0.3, dmg: 14, range: 1.3, arc: 60, lunge: 0.6, knock: 3, thrust: true },
    ],
    heavy: { windup: 0.05, active: 0.1, recover: 0.35, dmg: 18, dmgFull: 34, range: 1.8, arc: 40, lunge: 1.6, knock: 3, knockFull: 5, thrust: true },
    chip: 0.45,
    blockSpeed: 0.6,
    chargeSpeed: 0.7,
    backstab: 2.5,
  },
};
export type WeaponId = keyof typeof WEAPONS;
export const WEAPON_ORDER: WeaponId[] = ['sword', 'greatsword', 'spear', 'daggers'];

/** Holding attack past `start` begins charging; the heavy is strongest at `full`. */
export const CHARGE = { start: 0.18, full: 0.9 };
/** A queued press is kept this long. */
export const INPUT_BUFFER = 0.25;

export const GUARD = {
  /** Stamina spent per point of damage blocked. */
  staminaPerDmg: 1.4,
  /** A tap of block this close before a hit lands is a parry. Online, the guest's ping widens it. */
  parryWindow: 0.3,
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

export const ROLL = { distance: 3, time: 0.32, iFrom: 0.04, iTo: 0.26, stamina: 22, cooldown: 0.5 };

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

export const RELICS = {
  javelin: { name: 'RELIC JAVELIN', cooldown: JAVELIN.cooldown, windup: JAVELIN.windup, recover: JAVELIN.recover },
  hook: { name: 'GRAPPLING HOOK', cooldown: HOOK.cooldown, windup: HOOK.windup, recover: HOOK.recover },
};
export type RelicId = keyof typeof RELICS;
export const RELIC_ORDER: RelicId[] = ['javelin', 'hook'];
