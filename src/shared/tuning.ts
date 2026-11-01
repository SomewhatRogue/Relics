/**
 * Every number the fight runs on. The rules read these and the client draws from the same values,
 * so a wind-up you see is the wind-up that is judged. Distances are in tiles (1 tile = 16 px),
 * times in seconds.
 */
export const TICK = 1 / 30;

export const HERO = {
  hp: 100,
  radius: 0.32,
  speed: 4.4,
  blockSpeed: 0.45,
  stamina: 100,
  staminaRegen: 34,
  regenDelay: 0.6,
  /** Downed heroes stand back up after this (slice 2 has no revive yet). */
  respawn: 3,
};

/** The Warrior's 3-hit combo. Pressing attack during a swing queues the next one. */
export const COMBO = [
  { windup: 0.1, active: 0.08, recover: 0.2, dmg: 12, range: 1.45, arc: 110, lunge: 0.35 },
  { windup: 0.09, active: 0.08, recover: 0.2, dmg: 12, range: 1.45, arc: 110, lunge: 0.35 },
  { windup: 0.16, active: 0.1, recover: 0.36, dmg: 22, range: 1.6, arc: 140, lunge: 0.6 },
] as const;
/** A queued press is kept this long. */
export const INPUT_BUFFER = 0.25;

export const GUARD = {
  /** Damage taken through a block, as a share. */
  chip: 0.15,
  /** Stamina spent per point of damage blocked. */
  staminaPerDmg: 1.4,
  /** A tap of block this close before a hit lands is a parry. Online, the guest's ping widens it. */
  parryWindow: 0.18,
  /** A re-press this soon after the last one doesn't reopen the window (no mashing). */
  parryRepress: 0.35,
  guardBreakStun: 0.9,
  /** After a parry, the next attack started within this window is a counter. */
  counterWindow: 1.1,
  counterMult: 2.5,
};

export const ROLL = {
  distance: 3,
  time: 0.32,
  /** Untouchable between these times into the roll. */
  iFrom: 0.04,
  iTo: 0.26,
  stamina: 22,
  /** Can't roll again until this long after the last roll started. */
  cooldown: 0.5,
};

export const HITSTOP = { light: 0.05, heavy: 0.11, parry: 0.16 };
export const HURT_STAGGER = 0.25;

export const BUTCHER = {
  hp: 260,
  radius: 0.62,
  speed: 2.1,
  reach: 2.2,
  respawn: 4,
  cleave: { windup: 1.0, active: 0.1, recover: 0.9, dmg: 30, range: 2.6, arc: 70, unblockable: false },
  slam: { windup: 1.3, active: 0.12, recover: 1.1, dmg: 40, radius: 1.7, ahead: 1.2, unblockable: true },
  /** Share of attacks that are the unblockable slam. */
  slamChance: 0.3,
  parryStagger: 1.4,
  pauseBetween: 0.5,
};

export const SWING_DUMMY = {
  every: 2.6,
  reach: 2.2,
  swing: { windup: 0.8, active: 0.08, recover: 0.6, dmg: 8, range: 2.0, arc: 80, unblockable: false },
  parryStagger: 1.2,
};
