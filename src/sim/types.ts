/** The fight's state. Plain data: the same shape is drawn locally and (later) sent to friends. */

/** What a player's device sends: held state plus press counters, so a quick tap is never lost. */
export interface Intent {
  /** Move stick, length 0..1. */
  mx: number;
  my: number;
  /** Aim direction (laptop: toward the mouse; phone: 0,0 means "auto"). */
  ax: number;
  ay: number;
  block: boolean;
  attackSeq: number;
  blockSeq: number;
  rollSeq: number;
}

export const NO_INTENT: Intent = { mx: 0, my: 0, ax: 0, ay: 0, block: false, attackSeq: 0, blockSeq: 0, rollSeq: 0 };

export type HeroAct = 'idle' | 'attack' | 'roll' | 'hurt' | 'stun' | 'down';

export interface Hero {
  id: string;
  x: number;
  y: number;
  /** Facing, a unit vector. */
  fx: number;
  fy: number;
  moving: boolean;
  hp: number;
  stamina: number;
  staminaAt: number;
  act: HeroAct;
  actT: number;
  actDur: number;
  combo: number;
  /** This swing is a counter (started inside the counter window after a parry). */
  counter: boolean;
  hitIds: number[];
  blocking: boolean;
  parryOpenAt: number;
  lastBlockPress: number;
  rollDx: number;
  rollDy: number;
  lastRollAt: number;
  counterUntil: number;
  attackQueuedAt: number;
  rollQueuedAt: number;
  hitstop: number;
  /** Extra parry and dodge leniency for this player's ping (seconds). */
  lenience: number;
  seen: { attack: number; block: number; roll: number };
}

export type AttackKind = 'cleave' | 'slam' | 'swing';

export interface EnemyAttack {
  kind: AttackKind;
  t: number;
  windup: number;
  active: number;
  recover: number;
  dmg: number;
  unblockable: boolean;
  /** Direction, locked when the wind-up starts so the telegraph never lies. */
  dx: number;
  dy: number;
  ox: number;
  oy: number;
  range: number;
  arc: number;
  /** Slam: a circle at (cx, cy). */
  cx: number;
  cy: number;
  radius: number;
  done: boolean;
}

export type EnemyKind = 'butcher' | 'dummy' | 'swingDummy';
export type EnemyAct = 'idle' | 'chase' | 'attack' | 'stagger' | 'dead';

export interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  fx: number;
  fy: number;
  hp: number;
  maxHp: number;
  radius: number;
  act: EnemyAct;
  actT: number;
  actDur: number;
  attack: EnemyAttack | null;
  cooldown: number;
  hitstop: number;
  /** Time of the last hit taken, for the flash and the health ring. */
  hitAt: number;
  moving: boolean;
}

export type FightEvent =
  | { k: 'hit'; x: number; y: number; n: number; heavy: boolean; on: 'enemy' | 'hero'; counter?: boolean }
  | { k: 'block' | 'parry' | 'guardbreak' | 'dodge' | 'down' | 'death' | 'whiff' | 'roll' | 'swing'; x: number; y: number }
  | { k: 'windup'; x: number; y: number; kind: AttackKind };
