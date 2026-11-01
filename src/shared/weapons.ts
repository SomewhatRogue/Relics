/**
 * Weapon kits. Until classes exist each weapon stands in for one (it carries its class's guard,
 * speed and dodge). The rules read these and the client draws from the same values.
 */
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
  /** A ranged swing looses a shot at its first active frame instead of striking an arc. */
  shot?: 'arrow' | 'spark' | 'orb';
  /** Shot speed, tiles a second (the shot flies `range` tiles). */
  speed?: number;
  /** The shot passes through every body it hits. */
  pierce?: boolean;
  /** The shot bursts at the first thing it reaches, hitting everything within this radius. */
  burst?: number;
  /** Heals every standing hero within HEAL_RADIUS of the swinger (the healer's blessing). */
  heal?: number;
}

export interface Heavy extends Swing {
  /** Damage and knockback at full charge (the Swing values are at the start of the charge). */
  dmgFull: number;
  knockFull: number;
  /** Healing at full charge. */
  healFull?: number;
}

/**
 * A dodge. 'roll' goes where you push (or where you face); 'backstep' always hops away from where you
 * face and keeps you facing; 'dash' is a fast, long, low run. Untouchable between iFrom and iTo.
 */
export interface Dodge {
  kind: 'roll' | 'backstep' | 'dash' | 'blink';
  distance: number;
  time: number;
  iFrom: number;
  iTo: number;
  stamina: number;
  /** Can't dodge again until this long after the last one started. */
  cooldown: number;
}

/** The sword and shield's roll: the baseline every other dodge is measured against. */
export const ROLL: Dodge = { kind: 'roll', distance: 3, time: 0.32, iFrom: 0.04, iTo: 0.26, stamina: 22, cooldown: 0.5 };

/**
 * A weapon kit. Until classes exist each weapon stands in for one, so it carries how its holder
 * blocks, parries, moves and dodges; these move to the class once there are classes.
 */
export type HeroClass = 'WARRIOR' | 'RANGER' | 'ROGUE' | 'MAGE' | 'HEALER';

export interface Weapon {
  name: string;
  /** The class this kit stands in for. */
  cls: HeroClass;
  combo: Swing[];
  heavy: Heavy;
  /** Damage taken through a block, as a share. */
  chip: number;
  blockSpeed: number;
  /** Move speed while charging a heavy. */
  chargeSpeed: number;
  /** Damage multiplier for blows from behind (GUARD.rearMult if not set). */
  backstab?: number;
  /** A tap of block this close before a hit lands is a parry. */
  parryWindow: number;
  /** Blows within this arc (degrees, centred on where you face) can be blocked or parried. */
  guardArc: number;
  /** Stamina per point of damage blocked, times GUARD.staminaPerDmg. */
  guardCost: number;
  /** Walk speed, times HERO.speed. */
  speed: number;
  dodge: Dodge;
}

export const WEAPONS: Record<'sword' | 'greatsword' | 'spear' | 'daggers' | 'bow' | 'staff' | 'mace', Weapon> = {
  sword: {
    name: 'SWORD AND SHIELD',
    cls: 'WARRIOR',
    combo: [
      { windup: 0.1, active: 0.08, recover: 0.2, dmg: 12, range: 1.45, arc: 110, lunge: 0.35, knock: 3 },
      { windup: 0.09, active: 0.08, recover: 0.2, dmg: 12, range: 1.45, arc: 110, lunge: 0.35, knock: 3 },
      { windup: 0.16, active: 0.1, recover: 0.36, dmg: 22, range: 1.6, arc: 140, lunge: 0.6, knock: 7 },
    ],
    heavy: { windup: 0.08, active: 0.12, recover: 0.42, dmg: 24, dmgFull: 45, range: 1.8, arc: 170, lunge: 0.8, knock: 6, knockFull: 13 },
    chip: 0.12,
    blockSpeed: 0.5,
    chargeSpeed: 0.4,
    parryWindow: 0.36,
    guardArc: 170,
    guardCost: 1,
    speed: 1,
    dodge: ROLL,
  },
  greatsword: {
    name: 'GREATSWORD',
    cls: 'WARRIOR',
    combo: [
      { windup: 0.22, active: 0.12, recover: 0.3, dmg: 24, range: 2.0, arc: 160, lunge: 0.4, knock: 6 },
      { windup: 0.24, active: 0.12, recover: 0.5, dmg: 32, range: 2.1, arc: 170, lunge: 0.55, knock: 10 },
    ],
    heavy: { windup: 0.1, active: 0.16, recover: 0.6, dmg: 38, dmgFull: 75, range: 2.3, arc: 220, lunge: 0.9, knock: 10, knockFull: 20 },
    chip: 0.3,
    blockSpeed: 0.35,
    chargeSpeed: 0.25,
    parryWindow: 0.2,
    guardArc: 110,
    guardCost: 1.5,
    speed: 0.85,
    dodge: { kind: 'roll', distance: 2.3, time: 0.4, iFrom: 0.06, iTo: 0.28, stamina: 30, cooldown: 0.8 },
  },
  spear: {
    name: 'SPEAR',
    cls: 'RANGER',
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
    parryWindow: 0.24,
    guardArc: 120,
    guardCost: 1.3,
    speed: 0.95,
    dodge: { kind: 'backstep', distance: 2.4, time: 0.24, iFrom: 0.02, iTo: 0.18, stamina: 16, cooldown: 0.45 },
  },
  /** The rogue's kit (a Ranger upgrade, Kyle's idea): weak from the front, brutal from behind. */
  daggers: {
    name: 'TWIN DAGGERS',
    cls: 'ROGUE',
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
    parryWindow: 0.2,
    guardArc: 100,
    guardCost: 1.8,
    speed: 1.15,
    dodge: { kind: 'dash', distance: 3.6, time: 0.2, iFrom: 0, iTo: 0.2, stamina: 14, cooldown: 0.3 },
  },
  /** The Ranger's bow: quick shots, and a held draw that pierces and knocks goblins into walls. */
  bow: {
    name: 'LONGBOW',
    cls: 'RANGER',
    combo: [
      { windup: 0.12, active: 0.05, recover: 0.2, dmg: 9, range: 10, arc: 0, lunge: 0, knock: 2, shot: 'arrow', speed: 24 },
      { windup: 0.11, active: 0.05, recover: 0.2, dmg: 9, range: 10, arc: 0, lunge: 0, knock: 2, shot: 'arrow', speed: 24 },
      { windup: 0.16, active: 0.05, recover: 0.3, dmg: 12, range: 11, arc: 0, lunge: 0, knock: 4, shot: 'arrow', speed: 26 },
    ],
    heavy: { windup: 0.06, active: 0.05, recover: 0.4, dmg: 16, dmgFull: 42, range: 13, arc: 0, lunge: -0.4, knock: 4, knockFull: 14, shot: 'arrow', speed: 30, pierce: true },
    chip: 0.4,
    blockSpeed: 0.5,
    chargeSpeed: 0.55,
    parryWindow: 0.22,
    guardArc: 100,
    guardCost: 1.6,
    speed: 1.05,
    dodge: { kind: 'roll', distance: 3.4, time: 0.3, iFrom: 0.03, iTo: 0.24, stamina: 18, cooldown: 0.45 },
  },
  /** The Mage's staff: sparks, and a held orb that bursts. It casts with the equipped relic's augment (the focus). */
  staff: {
    name: 'FOCUS STAFF',
    cls: 'MAGE',
    combo: [
      { windup: 0.14, active: 0.05, recover: 0.22, dmg: 10, range: 9, arc: 0, lunge: 0, knock: 3, shot: 'spark', speed: 15 },
      { windup: 0.12, active: 0.05, recover: 0.22, dmg: 10, range: 9, arc: 0, lunge: 0, knock: 3, shot: 'spark', speed: 15 },
      { windup: 0.2, active: 0.05, recover: 0.36, dmg: 14, range: 9, arc: 0, lunge: 0, knock: 5, shot: 'spark', speed: 15, burst: 1 },
    ],
    heavy: { windup: 0.1, active: 0.05, recover: 0.5, dmg: 18, dmgFull: 44, range: 9, arc: 0, lunge: 0, knock: 6, knockFull: 16, shot: 'orb', speed: 10, burst: 1.9 },
    chip: 0.5,
    blockSpeed: 0.45,
    chargeSpeed: 0.4,
    parryWindow: 0.2,
    guardArc: 100,
    guardCost: 2,
    speed: 0.95,
    dodge: { kind: 'blink', distance: 3.6, time: 0.12, iFrom: 0, iTo: 0.12, stamina: 24, cooldown: 0.9 },
  },
  /** The Healer's mace and censer (a coal from the Last Lantern): every third blow and the held blessing heal. */
  mace: {
    name: 'MACE AND CENSER',
    cls: 'HEALER',
    combo: [
      { windup: 0.12, active: 0.08, recover: 0.22, dmg: 13, range: 1.4, arc: 100, lunge: 0.3, knock: 4 },
      { windup: 0.12, active: 0.08, recover: 0.22, dmg: 13, range: 1.4, arc: 100, lunge: 0.3, knock: 4 },
      { windup: 0.2, active: 0.1, recover: 0.4, dmg: 18, range: 1.6, arc: 130, lunge: 0.5, knock: 7, heal: 6 },
    ],
    heavy: { windup: 0.08, active: 0.14, recover: 0.5, dmg: 14, dmgFull: 32, range: 2.4, arc: 360, lunge: 0, knock: 6, knockFull: 13, heal: 10, healFull: 30 },
    chip: 0.18,
    blockSpeed: 0.5,
    chargeSpeed: 0.45,
    parryWindow: 0.3,
    guardArc: 150,
    guardCost: 1.1,
    speed: 0.95,
    dodge: { kind: 'roll', distance: 2.7, time: 0.34, iFrom: 0.05, iTo: 0.27, stamina: 22, cooldown: 0.55 },
  },
};
export type WeaponId = keyof typeof WEAPONS;
export const WEAPON_ORDER: WeaponId[] = ['sword', 'greatsword', 'bow', 'spear', 'daggers', 'staff', 'mace'];
/** The demo's class button cycles these; the weapon button swaps between a class's own kits. */
export const CLASS_ORDER: HeroClass[] = ['WARRIOR', 'RANGER', 'ROGUE', 'MAGE', 'HEALER'];
export const CLASS_KITS: Record<HeroClass, WeaponId[]> = {
  WARRIOR: ['sword', 'greatsword'],
  RANGER: ['bow', 'spear'],
  ROGUE: ['daggers'],
  MAGE: ['staff'],
  HEALER: ['mace'],
};
/** A healing blow reaches every hero this close to the healer. */
export const HEAL_RADIUS = 3;
