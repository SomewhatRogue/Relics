/** The fight's state. Plain data: the same shape is drawn locally and (later) sent to friends. */
import type { Augment, RelicId, WeaponId } from '../shared/tuning';

/** What a player's device sends: held state plus press counters, so a quick tap is never lost. */
export interface Intent {
  /** Move stick, length 0..1. */
  mx: number;
  my: number;
  /** Aim direction (laptop: toward the mouse; phone: 0,0 means "auto"). */
  ax: number;
  ay: number;
  attack: boolean;
  block: boolean;
  attackSeq: number;
  blockSeq: number;
  rollSeq: number;
  weaponSeq: number;
  relicSeq: number;
  relicSwapSeq: number;
  /** Equip the relic in loadout slot `relicPick` (counted by relicPickSeq). */
  relicPickSeq: number;
  relicPick: number;
  /** Cycle the equipped relic's augment (none, fire, frost, storm). */
  augmentSeq: number;
  /** Change class (the demo's class button). */
  classSeq: number;
}

export const NO_INTENT: Intent = { mx: 0, my: 0, ax: 0, ay: 0, attack: false, block: false, attackSeq: 0, blockSeq: 0, rollSeq: 0, weaponSeq: 0, relicSeq: 0, relicSwapSeq: 0, relicPickSeq: 0, relicPick: 0, augmentSeq: 0, classSeq: 0 };

export type HeroAct = 'idle' | 'charge' | 'attack' | 'throw' | 'zip' | 'roll' | 'hurt' | 'stun' | 'down';

/** Anything that can be pushed: a slide (knockback) decays each tick. */
export interface Body {
  x: number;
  y: number;
  kvx: number;
  kvy: number;
}

export interface Hero extends Body {
  id: string;
  /** Facing, a unit vector. */
  fx: number;
  fy: number;
  moving: boolean;
  hp: number;
  stamina: number;
  staminaAt: number;
  weapon: WeaponId;
  act: HeroAct;
  actT: number;
  actDur: number;
  combo: number;
  /** The swing in progress is the charged heavy, at this power (0..1). */
  heavy: boolean;
  power: number;
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
  relic: RelicId;
  /** The relics carried into this fight (at most RELIC_SLOTS). */
  relics: RelicId[];
  /** When each relic is ready again. */
  relicReady: Record<RelicId, number>;
  relicQueuedAt: number;
  /** The augment fitted to each relic. */
  augments: Record<RelicId, Augment>;
  /** Blessed by a healer until then: hits harder, takes less. */
  blessedUntil: number;
  /** Rallied by a war horn until then: stamina comes back faster, blocking costs less. */
  rallyUntil: number;
  hitstop: number;
  /** Extra parry and dodge leniency for this player's ping (seconds). */
  lenience: number;
  seen: { attack: number; block: number; roll: number; weapon: number; relic: number; relicSwap: number; relicPick: number; augment: number; cls: number };
}

export type AttackKind = 'cleave' | 'slam' | 'swing' | 'stab';

export interface EnemyAttack {
  kind: AttackKind;
  t: number;
  windup: number;
  active: number;
  recover: number;
  dmg: number;
  knock: number;
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

export type EnemyKind = 'butcher' | 'scrapper' | 'dummy' | 'swingDummy';
export type EnemyAct = 'idle' | 'chase' | 'attack' | 'stunned' | 'flinch' | 'carried' | 'pinned' | 'dead';

export interface Enemy extends Body {
  id: number;
  kind: EnemyKind;
  fx: number;
  fy: number;
  hp: number;
  maxHp: number;
  radius: number;
  weight: number;
  act: EnemyAct;
  actT: number;
  actDur: number;
  attack: EnemyAttack | null;
  cooldown: number;
  hitstop: number;
  /** Time of the last hit taken, for the flash and the health ring. */
  hitAt: number;
  moving: boolean;
  home: { x: number; y: number };
  /** A corpse carried on a javelin, or pinned to a wall by one. */
  corpse: '' | 'carried' | 'pinned';
  /** Elements: burning until, next burn tick, chilled until, frozen solid until (room time). */
  burnUntil: number;
  burnNext: number;
  chillUntil: number;
  frozenUntil: number;
  /** Caught in a hunter's net until then (small goblins can't move or act; big ones are slowed). */
  snareUntil: number;
}

export type FightEvent =
  | { k: 'hit'; x: number; y: number; n: number; heavy: boolean; on: 'enemy' | 'hero'; counter?: boolean; backstab?: boolean; tick?: boolean }
  | { k: 'block' | 'parry' | 'guardbreak' | 'dodge' | 'down' | 'death' | 'roll' | 'swing' | 'stunned' | 'wallhit' | 'charged' | 'heavy'; x: number; y: number }
  | { k: 'windup' | 'impact'; x: number; y: number; kind: AttackKind }
  | { k: 'weapon'; x: number; y: number; name: string }
  | { k: 'throw' | 'pinned' | 'javwall' | 'javstick' | 'hookfire' | 'latch' | 'yank' | 'land'; x: number; y: number; dx: number; dy: number }
  | { k: 'relic'; x: number; y: number; name: string }
  | { k: 'shoot'; x: number; y: number; dx: number; dy: number; kind: Bolt['kind']; el: Augment }
  | { k: 'burst'; x: number; y: number; r: number; el: Augment }
  | { k: 'shock' | 'beam'; x: number; y: number; x2: number; y2: number }
  | { k: 'heal'; x: number; y: number; n: number }
  | { k: 'ignite' | 'chill' | 'freeze' | 'shatter' | 'steam' | 'flare' | 'blink' | 'bless' | 'blessed' | 'rally' | 'rallied' | 'smite' | 'net' | 'snared' | 'well' | 'shadow'; x: number; y: number };

/** A grappling hook: flying out, reeling an enemy in, pulling its owner along, or coming back. */
export interface Hook {
  id: number;
  owner: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  state: 'fly' | 'yank' | 'zip' | 'back';
  travelled: number;
  /** Enemy hooked (0 for a wall). */
  enemy: number;
  el: Augment;
}

/** A thrown relic javelin: flying (maybe carrying a goblin), or stuck in a wall, the floor or a body. */
export interface Javelin {
  id: number;
  owner: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  state: 'fly' | 'wall' | 'floor' | 'body';
  travelled: number;
  /** Enemy carried (flying) or pinned / stuck in (stuck), or 0. */
  enemy: number;
  /** Offset from the enemy's centre while stuck in a body. */
  ox: number;
  oy: number;
  hit: number[];
  life: number;
  el: Augment;
}

/**
 * A shot, a smite or a thrown relic: arrows and crossbow bolts, the mage's sparks, orbs and lances, a
 * smite waiting to fall, the hunter's net, the lodestone (which lands and becomes a pulling well).
 */
export interface Bolt {
  id: number;
  owner: string;
  kind: 'arrow' | 'bolt' | 'spark' | 'orb' | 'lance' | 'smite' | 'net' | 'lodestone';
  x: number;
  y: number;
  dx: number;
  dy: number;
  speed: number;
  range: number;
  travelled: number;
  dmg: number;
  knock: number;
  pierce: boolean;
  burst: number;
  el: Augment;
  hit: number[];
  /** Stun on hit (a smite). */
  stun: number;
  /** Lobbed and dropped things go from (sx, sy) to (tx, ty) over `flight` seconds, `t` so far. */
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  t: number;
  flight: number;
  /** An arrow stays stuck in a wall or the floor a moment; a landed lodestone pulls ('well'). */
  state: 'fly' | 'stuck' | 'well';
  life: number;
}
