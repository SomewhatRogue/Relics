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
  /** A ranged swing looses a shot at its first active frame instead of striking an arc. A smite falls
   * from above on a spot `range` tiles away at most (the goblin you face, or where you point). */
  shot?: 'arrow' | 'bolt' | 'spark' | 'orb' | 'lance' | 'smite';
  /** Shot speed, tiles a second (the shot flies `range` tiles). */
  speed?: number;
  /** The shot passes through every body it hits. */
  pierce?: boolean;
  /** The shot bursts at the first thing it reaches, hitting everything within this radius. */
  burst?: number;
  /** Heals every standing hero within HEAL_RADIUS of the swinger. */
  heal?: number;
  /** Stuns what it hits this long (a smite). */
  stun?: number;
}

export interface Heavy extends Swing {
  /** Damage and knockback at full charge (the Swing values are at the start of the charge). */
  dmgFull: number;
  knockFull: number;
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
export const ROLL: Dodge = { kind: 'roll', distance: 2.4, time: 0.32, iFrom: 0.04, iTo: 0.26, stamina: 26, cooldown: 0.7 };

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
  /** Damage on a blow that isn't from behind (the Rogue's knives are weak head on). */
  front?: number;
  /** A tap of block this close before a hit lands is a parry. */
  parryWindow: number;
  /** Blows within this arc (degrees, centred on where you face) can be blocked or parried. */
  guardArc: number;
  /** Stamina per point of damage blocked, times GUARD.staminaPerDmg. */
  guardCost: number;
  /** Walk speed, times HERO.speed. Only the Rogue is quick on its feet. */
  speed: number;
  /** Seconds to a full draw or charge (CHARGE.full if not set). */
  draw?: number;
  /** No charging: a press looses at once (the crossbow, then a long reload). */
  noCharge?: boolean;
  dodge: Dodge;
}

type KitId = 'sword' | 'greatsword' | 'spear' | 'daggers' | 'longbow' | 'shortbow' | 'crossbow' | 'wand' | 'staff' | 'rod' | 'mace';

export const WEAPONS: Record<KitId, Weapon> = {
  sword: {
    name: 'SWORD AND SHIELD',
    cls: 'WARRIOR',
    combo: [
      { windup: 0.1, active: 0.08, recover: 0.2, dmg: 12, range: 1.45, arc: 110, lunge: 0.35, knock: 3 },
      { windup: 0.09, active: 0.08, recover: 0.2, dmg: 12, range: 1.45, arc: 110, lunge: 0.35, knock: 3 },
      { windup: 0.16, active: 0.1, recover: 0.36, dmg: 22, range: 1.6, arc: 140, lunge: 0.6, knock: 7 },
    ],
    heavy: { windup: 0.08, active: 0.12, recover: 0.42, dmg: 24, dmgFull: 45, range: 1.8, arc: 170, lunge: 0.8, knock: 6, knockFull: 13 },
    chip: 0.12, blockSpeed: 0.45, chargeSpeed: 0.4, parryWindow: 0.36, guardArc: 170, guardCost: 1, speed: 0.9,
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
    chip: 0.3, blockSpeed: 0.35, chargeSpeed: 0.25, parryWindow: 0.2, guardArc: 110, guardCost: 1.5, speed: 0.78,
    dodge: { kind: 'roll', distance: 1.9, time: 0.4, iFrom: 0.06, iTo: 0.28, stamina: 34, cooldown: 1 },
  },
  spear: {
    name: 'SPEAR',
    cls: 'WARRIOR',
    combo: [
      { windup: 0.08, active: 0.07, recover: 0.16, dmg: 9, range: 2.3, arc: 26, lunge: 0.25, knock: 2, thrust: true },
      { windup: 0.07, active: 0.07, recover: 0.16, dmg: 9, range: 2.3, arc: 26, lunge: 0.25, knock: 2, thrust: true },
      { windup: 0.08, active: 0.07, recover: 0.16, dmg: 10, range: 2.3, arc: 26, lunge: 0.25, knock: 3, thrust: true },
      { windup: 0.18, active: 0.1, recover: 0.36, dmg: 18, range: 2.7, arc: 30, lunge: 1.1, knock: 9, thrust: true },
    ],
    heavy: { windup: 0.06, active: 0.14, recover: 0.4, dmg: 22, dmgFull: 42, range: 3.0, arc: 34, lunge: 2.4, knock: 9, knockFull: 16, thrust: true },
    chip: 0.22, blockSpeed: 0.4, chargeSpeed: 0.35, parryWindow: 0.24, guardArc: 120, guardCost: 1.3, speed: 0.86,
    dodge: { kind: 'backstep', distance: 2, time: 0.26, iFrom: 0.02, iTo: 0.18, stamina: 22, cooldown: 0.7 },
  },
  /** The Rogue's kit: weak from the front, brutal from behind, and the only one quick on its feet. */
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
    chip: 0.45, blockSpeed: 0.6, chargeSpeed: 0.7, backstab: 2.5, front: 0.5, parryWindow: 0.2, guardArc: 100, guardCost: 1.8, speed: 1.22,
    dodge: { kind: 'dash', distance: 4.3, time: 0.22, iFrom: 0, iTo: 0.22, stamina: 12, cooldown: 0.22 },
  },
  /** One arrow per press. The long draw is the point: 1.4 s to a shot that pierces a whole line. */
  longbow: {
    name: 'LONGBOW',
    cls: 'RANGER',
    combo: [{ windup: 0.24, active: 0.05, recover: 0.36, dmg: 10, range: 11, arc: 0, lunge: 0, knock: 2, shot: 'arrow', speed: 24 }],
    heavy: { windup: 0.04, active: 0.05, recover: 0.45, dmg: 18, dmgFull: 55, range: 15, arc: 0, lunge: -0.3, knock: 4, knockFull: 15, shot: 'arrow', speed: 34, pierce: true },
    draw: 1.4,
    chip: 0.4, blockSpeed: 0.4, chargeSpeed: 0.3, parryWindow: 0.22, guardArc: 100, guardCost: 1.6, speed: 0.85,
    dodge: { kind: 'roll', distance: 2.2, time: 0.34, iFrom: 0.04, iTo: 0.26, stamina: 26, cooldown: 0.8 },
  },
  /** Quick draws, light arrows, and you can walk while drawing: the kiting bow. */
  shortbow: {
    name: 'SHORTBOW',
    cls: 'RANGER',
    combo: [{ windup: 0.1, active: 0.04, recover: 0.16, dmg: 7, range: 8, arc: 0, lunge: 0, knock: 1, shot: 'arrow', speed: 22 }],
    heavy: { windup: 0.03, active: 0.04, recover: 0.22, dmg: 10, dmgFull: 22, range: 9, arc: 0, lunge: 0, knock: 2, knockFull: 6, shot: 'arrow', speed: 26 },
    draw: 0.55,
    chip: 0.45, blockSpeed: 0.45, chargeSpeed: 0.7, parryWindow: 0.22, guardArc: 100, guardCost: 1.7, speed: 0.92,
    dodge: { kind: 'backstep', distance: 2.2, time: 0.24, iFrom: 0.02, iTo: 0.18, stamina: 22, cooldown: 0.65 },
  },
  /** Loosed the moment you press: one heavy bolt that hurls small goblins into walls, then a long reload. */
  crossbow: {
    name: 'CROSSBOW',
    cls: 'RANGER',
    combo: [{ windup: 0.06, active: 0.04, recover: 1.15, dmg: 34, range: 13, arc: 0, lunge: -0.2, knock: 12, shot: 'bolt', speed: 36 }],
    heavy: { windup: 0.06, active: 0.04, recover: 1.15, dmg: 34, dmgFull: 34, range: 13, arc: 0, lunge: -0.2, knock: 12, knockFull: 12, shot: 'bolt', speed: 36 },
    noCharge: true,
    chip: 0.35, blockSpeed: 0.4, chargeSpeed: 0.4, parryWindow: 0.22, guardArc: 110, guardCost: 1.5, speed: 0.82,
    dodge: { kind: 'roll', distance: 2, time: 0.36, iFrom: 0.05, iTo: 0.27, stamina: 28, cooldown: 0.9 },
  },
  /** The Mage's quick spell: a flick of sparks, or a short 0.6 s cast for a bigger one. */
  wand: {
    name: 'SPARK WAND',
    cls: 'MAGE',
    combo: [{ windup: 0.08, active: 0.04, recover: 0.16, dmg: 7, range: 8, arc: 0, lunge: 0, knock: 2, shot: 'spark', speed: 17 }],
    heavy: { windup: 0.06, active: 0.04, recover: 0.3, dmg: 10, dmgFull: 24, range: 9, arc: 0, lunge: 0, knock: 3, knockFull: 7, shot: 'spark', speed: 19, burst: 0.8 },
    draw: 0.6,
    chip: 0.5, blockSpeed: 0.4, chargeSpeed: 0.55, parryWindow: 0.2, guardArc: 100, guardCost: 2, speed: 0.86,
    dodge: { kind: 'blink', distance: 3.8, time: 0.12, iFrom: 0, iTo: 0.12, stamina: 40, cooldown: 2.6 },
  },
  /** The Mage's long spell: 1.6 s of gathering for an orb that bursts wide and throws everything. */
  staff: {
    name: 'FOCUS STAFF',
    cls: 'MAGE',
    combo: [{ windup: 0.2, active: 0.05, recover: 0.4, dmg: 9, range: 8, arc: 0, lunge: 0, knock: 3, shot: 'spark', speed: 14 }],
    heavy: { windup: 0.12, active: 0.05, recover: 0.6, dmg: 20, dmgFull: 65, range: 9, arc: 0, lunge: 0, knock: 6, knockFull: 18, shot: 'orb', speed: 9, burst: 2.2 },
    draw: 1.6,
    chip: 0.5, blockSpeed: 0.35, chargeSpeed: 0.25, parryWindow: 0.2, guardArc: 100, guardCost: 2, speed: 0.8,
    dodge: { kind: 'blink', distance: 3.8, time: 0.12, iFrom: 0, iTo: 0.12, stamina: 40, cooldown: 2.6 },
  },
  /** Between the two: a 1 s cast for a lance of force that runs through a line of goblins. */
  rod: {
    name: 'LANCE ROD',
    cls: 'MAGE',
    combo: [{ windup: 0.14, active: 0.04, recover: 0.3, dmg: 8, range: 8, arc: 0, lunge: 0, knock: 2, shot: 'spark', speed: 16 }],
    heavy: { windup: 0.08, active: 0.04, recover: 0.45, dmg: 16, dmgFull: 40, range: 12, arc: 0, lunge: 0, knock: 5, knockFull: 12, shot: 'lance', speed: 30, pierce: true },
    draw: 1,
    chip: 0.5, blockSpeed: 0.4, chargeSpeed: 0.35, parryWindow: 0.2, guardArc: 100, guardCost: 2, speed: 0.84,
    dodge: { kind: 'blink', distance: 3.8, time: 0.12, iFrom: 0, iTo: 0.12, stamina: 40, cooldown: 2.6 },
  },
  /** The Healer: every third blow heals the party; held, a holy smite falls on the goblin you face. */
  mace: {
    name: 'MACE AND CENSER',
    cls: 'HEALER',
    combo: [
      { windup: 0.12, active: 0.08, recover: 0.22, dmg: 13, range: 1.4, arc: 100, lunge: 0.3, knock: 4 },
      { windup: 0.12, active: 0.08, recover: 0.22, dmg: 13, range: 1.4, arc: 100, lunge: 0.3, knock: 4 },
      { windup: 0.2, active: 0.1, recover: 0.4, dmg: 18, range: 1.6, arc: 130, lunge: 0.5, knock: 7, heal: 8 },
    ],
    heavy: { windup: 0.15, active: 0.05, recover: 0.55, dmg: 24, dmgFull: 70, range: 6, arc: 0, lunge: 0, knock: 4, knockFull: 10, shot: 'smite', burst: 1.3, stun: 1.2 },
    draw: 1.2,
    chip: 0.18, blockSpeed: 0.45, chargeSpeed: 0.35, parryWindow: 0.3, guardArc: 150, guardCost: 1.1, speed: 0.84,
    dodge: { kind: 'roll', distance: 2, time: 0.36, iFrom: 0.05, iTo: 0.28, stamina: 28, cooldown: 0.9 },
  },
};
export type WeaponId = KitId;
export const WEAPON_ORDER: WeaponId[] = ['sword', 'greatsword', 'spear', 'longbow', 'shortbow', 'crossbow', 'daggers', 'wand', 'staff', 'rod', 'mace'];
/** The demo's class button cycles these; the weapon button swaps between a class's own kits. */
export const CLASS_ORDER: HeroClass[] = ['WARRIOR', 'RANGER', 'ROGUE', 'MAGE', 'HEALER'];
/** How each class guards: `full` holds a block and parries; `parry` can tap a parry but never holds a
 *  block; `none` can do neither (a Mage blinks out instead, and leaves an image behind: DECOY). */
export const CLASS_GUARD: Record<HeroClass, 'full' | 'parry' | 'none'> = { WARRIOR: 'full', HEALER: 'full', ROGUE: 'parry', RANGER: 'parry', MAGE: 'none' };
/** The Mage's blink leaves an image of them where they stood: goblins near it go for it instead. */
export const DECOY = { time: 2.5, lure: 5 };
export const CLASS_KITS: Record<HeroClass, WeaponId[]> = {
  WARRIOR: ['sword', 'greatsword', 'spear'],
  RANGER: ['longbow', 'shortbow', 'crossbow'],
  ROGUE: ['daggers'],
  MAGE: ['wand', 'staff', 'rod'],
  HEALER: ['mace'],
};
/** A healing blow reaches every hero this close to the healer. */
export const HEAL_RADIUS = 3;
