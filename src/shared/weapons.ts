import { MORE_KITS, type MoreKitId } from './kits.js';
import { BLINK, SPELLBLADE } from './mage.js';

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
  shot?: 'arrow' | 'bolt' | 'knife' | 'dart' | 'spark' | 'orb' | 'lance' | 'smite';
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
  /** A melee blow strikes at most this many goblins, nearest first (a rapier's lunge runs through two). */
  hits?: number;
  /** The censer itself: sets what it strikes burning, bursts your coals it swings through, and snags on a wall (sim/censer.ts). */
  burn?: boolean;
  /** Drops burning coals along its arc (the censer's swung arc; shared/cleric.ts CENSER). */
  coals?: boolean;
  /** A Cleric's held attack: let go on the white flash, it shields friends (shared/cleric.ts HOLY_SHIELD). */
  holy?: boolean;
  /** A flail's spun release: let go on the white flash, it stuns what it hits (shared/cleric.ts FLAIL). */
  dazes?: boolean;
  /** A smite falls this long after the release (0.35 s if not set). */
  delay?: number;
  /** A poisoner's dart: poisons what it hits (shared/venom.ts). */
  venom?: boolean;
  /** A rapier's lunge: released on the white flash it skewers what it hits (a bleed and a stagger). */
  skewer?: boolean;
  /** A shield bash: stuns the goblin it strikes (shared/warrior.ts SHIELD_BASH). */
  shieldBash?: boolean;
  /** An overhead: released on the white flash it sends out a shockwave (shared/warrior.ts QUAKE). */
  quake?: boolean;
  /** A longbow's draw: released on the white flash it is a sure crit and blinds (shared/ranger.ts BLIND). */
  blinds?: boolean;
  /** A wand's held spell: let go on the white flash, it breaks off any blow it lands on (shared/mage.ts WAND).
   *  A tap's spark stops nothing (Kyle, 2026-11-08: "that shouldn't stop any attacks"). */
  interrupts?: boolean;
  /** A staff's slash: a close cut in the Mage's element. */
  slash?: boolean;
  /** A Mage's hold: the element's spell for this kit (shared/spellbook.ts, sim/holds.ts); the swing
   *  itself strikes nothing. */
  spell?: boolean;
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
  kind: 'roll' | 'backstep' | 'dash' | 'blink' | 'sprint';
  /** A sprint's pace, times your walk, for `time` after each press (no dodge-through: sim/hero.ts). */
  mult?: number;
  distance: number;
  time: number;
  iFrom: number;
  iTo: number;
  stamina: number;
  /** Can't dodge again until this long after the last one started. */
  cooldown: number;
}

/** The sword and shield's roll: the baseline every other dodge is measured against. */
/** The Ranger: a short sword on a tap (two quick cuts), the bow on a hold. */
export const RANGER_BLADE: Swing[] = [
  { windup: 0.08, active: 0.1, recover: 0.22, dmg: 8, range: 1.45, arc: 110, lunge: 0.35, knock: 3 },
  { windup: 0.08, active: 0.1, recover: 0.32, dmg: 10, range: 1.55, arc: 120, lunge: 0.45, knock: 4 },
];
/** The Ranger's dodge: a jump back, still facing (and it leaves a snare where you stood: SNARE). */
export const RANGER_JUMP: Dodge = { kind: 'backstep', distance: 2.6, time: 0.26, iFrom: 0.02, iTo: 0.2, stamina: 22, cooldown: 1.0 };
/**
 * The shortbow's SPRINT in place of the jump (Kyle's friend, 2026-11-12: "shortbow you can sprint but costs
 * stamina"): each press runs you at `mult` your walk for `time`, steered on the stick; a press while
 * running keeps it going, for its stamina again. You can't pass through a blow on it: you outrun them.
 */
export const RANGER_SPRINT: Dodge = { kind: 'sprint', distance: 0, time: 1.6, iFrom: 0, iTo: 0, stamina: 24, cooldown: 0.3, mult: 1.55 };
/** The snare a Ranger leaves when they jump back: a goblin that steps in is held (a butcher slowed). */
export const SNARE = { cooldown: 7, radius: 0.65, hold: 2.4, life: 20, max: 2 };
/** The Ranger's hound: how fast it runs, how far from you it'll go after something, how often it joins in
 *  (seconds at heel between), its bite and how many before it comes back; a butcher winding up this close
 *  scares it off for `away` seconds. It can't be hurt. */
export const HOUND = { speed: 6, reach: 7, every: 3.5, bite: 7, biteEvery: 0.55, bites: 3, scare: 2.6, away: 14 };
export const ROLL: Dodge = { kind: 'roll', distance: 2.4, time: 0.32, iFrom: 0.04, iTo: 0.26, stamina: 26, cooldown: 1.1 };

/**
 * A weapon kit. Until classes exist each weapon stands in for one, so it carries how its holder
 * blocks, moves and dodges; these move to the class once there are classes.
 */
export type HeroClass = 'WARRIOR' | 'RANGER' | 'ROGUE' | 'MAGE' | 'HEALER';

export interface Weapon {
  name: string;
  /** The class this kit stands in for. */
  cls: HeroClass;
  combo: Swing[];
  heavy: Heavy;
  blockSpeed: number;
  /** Move speed while charging a heavy. */
  chargeSpeed: number;
  /** Damage multiplier for blows from behind (GUARD.rearMult if not set). */
  backstab?: number;
  /** Damage on a blow that isn't from behind (the Rogue's knives are weak head on); such a blow doesn't
   *  knock anything off balance either. */
  front?: number;
  /** Each blow finds one goblin (the nearest in reach), never a crowd. */
  single?: boolean;
  /** Heavy enough that a charged blow knocks a goblin out of a heavy wind-up (a butcher's, a heavy's, a
   *  cleave or slam). Only the big weapons, and they pay for it with a narrow, dear block (Kyle, 2026-11-03). */
  breaker?: boolean;
  /** Blows within this arc (degrees, centred on where you face) can be blocked. */
  guardArc: number;
  /** Stamina per point of damage blocked, times GUARD.staminaPerDmg. */
  guardCost: number;
  /** Walk speed, times HERO.speed. Only the Rogue is quick on its feet. */
  speed: number;
  /** Seconds to a full draw or charge (CHARGE.full if not set). */
  draw?: number;
  /** No charging: a press looses at once (the crossbow, then a long reload). */
  noCharge?: boolean;
  /** Goblins it kills burst (a mace, a flail). */
  blunt?: boolean;
  /** Its blows shove a goblin a little, but a shield-bearer's board stops the shove (a flail). */
  shoves?: boolean;
  dodge: Dodge;
  /** Every blow lands with the heavy hitstop: a slow, weighty weapon (the greatsword). */
  ponderous?: boolean;
  /** Stops a charging or lunging goblin dead, pinned (the spear; shared/warrior.ts PIN). */
  pins?: boolean;
  /** Goblins too close take the shaft, not the point (the spear; shared/warrior.ts SHAFT). */
  shaft?: boolean;
  /**
   * What a hold let go before its full draw does (Kyle, 2026-11-08: "you start charging, then have a perfect
   * window, then can hold charged"): 'fizzle', nothing at all (a Mage's spell, the crossbow's aimed bolt, the
   * holy smite); 'full', it goes at full strength anyway (the shortbow, quick to draw). Left out, it goes
   * weaker the earlier it's let go (the longbow, the blades). Held past the flash, any kit stays at full.
   */
  early?: 'fizzle' | 'full';
  /** A bolt has to be wound on: a hold aims a loaded crossbow and winds an empty one (shared/ranger.ts XBOW). */
  reloads?: boolean;
  /** The quick attack is cast on the move, at this share of your pace (the wand; the flail, swung as you walk). */
  castWalk?: number;
  /** The spellblade (shared/mage.ts): its magic is a shield hits drain before health, and a dodge through a blow refills it. */
  spellblade?: boolean;
}

type KitId = 'sword' | 'greatsword' | 'spear' | 'daggers' | 'longbow' | 'shortbow' | 'crossbow' | 'wand' | 'staff' | 'spellblade' | 'mace' | MoreKitId;

export const WEAPONS: Record<KitId, Weapon> = {
  sword: {
    name: 'SWORD AND SHIELD',
    cls: 'WARRIOR',
    combo: [
      { windup: 0.1, active: 0.08, recover: 0.2, dmg: 12, range: 1.45, arc: 110, lunge: 0.35, knock: 3 },
      { windup: 0.09, active: 0.08, recover: 0.2, dmg: 12, range: 1.45, arc: 110, lunge: 0.35, knock: 3 },
      { windup: 0.16, active: 0.1, recover: 0.36, dmg: 22, range: 1.6, arc: 140, lunge: 0.6, knock: 7 },
    ],
    // Held: a shield bash that stuns the goblin in front (Kyle's rework): short, little damage, a solid stagger.
    heavy: { windup: 0.06, active: 0.1, recover: 0.32, dmg: 6, dmgFull: 12, range: 1.35, arc: 80, lunge: 0.5, knock: 5, knockFull: 9, hits: 1, shieldBash: true },
    blockSpeed: 0.45, chargeSpeed: 0.4, guardArc: 170, guardCost: 1, speed: 0.8,
    dodge: ROLL,
  },
  greatsword: {
    breaker: true,
    name: 'GREATSWORD',
    cls: 'WARRIOR',
    combo: [
      // Wide, slow, ponderous sweeps for a crowd (Kyle 2026-11-04: slower first swing, big heavy hits).
      // Each lands with the heavy hitstop; the pair does about 15% less a second than before.
      { windup: 0.38, active: 0.12, recover: 0.42, dmg: 26, range: 2.1, arc: 210, lunge: 0.45, knock: 8 },
      { windup: 0.34, active: 0.12, recover: 0.6, dmg: 36, range: 2.2, arc: 240, lunge: 0.6, knock: 12 },
    ],
    // Held: the overhead (it breaks heavy wind-ups); let go on the white flash and it sends out a shockwave.
    heavy: { windup: 0.1, active: 0.16, recover: 0.6, dmg: 38, dmgFull: 75, range: 2.4, arc: 110, lunge: 0.9, knock: 10, knockFull: 20, quake: true },
    // A plain block like the Warrior's other kits, but a slow one: a narrow arc, dear on stamina, a crawl while held.
    blockSpeed: 0.35, chargeSpeed: 0.25, guardArc: 110, guardCost: 1.3, speed: 0.8, ponderous: true,
    dodge: { kind: 'roll', distance: 1.9, time: 0.4, iFrom: 0.06, iTo: 0.28, stamina: 34, cooldown: 1.4 },
  },
  spear: {
    name: 'SPEAR',
    cls: 'WARRIOR',
    combo: [
      // Long thrusts with a small push, to keep goblins at the point.
      { windup: 0.08, active: 0.07, recover: 0.16, dmg: 9, range: 2.5, arc: 26, lunge: 0.25, knock: 4, thrust: true },
      { windup: 0.07, active: 0.07, recover: 0.16, dmg: 9, range: 2.5, arc: 26, lunge: 0.25, knock: 4, thrust: true },
      { windup: 0.08, active: 0.07, recover: 0.16, dmg: 10, range: 2.5, arc: 26, lunge: 0.25, knock: 5, thrust: true },
      { windup: 0.18, active: 0.1, recover: 0.36, dmg: 18, range: 2.7, arc: 30, lunge: 1.1, knock: 9, thrust: true },
    ],
    // Held: a lunge that runs through up to three in a line.
    heavy: { windup: 0.06, active: 0.14, recover: 0.4, dmg: 22, dmgFull: 42, range: 3.0, arc: 34, lunge: 2.4, knock: 9, knockFull: 16, thrust: true, hits: 3 },
    blockSpeed: 0.4, chargeSpeed: 0.35, guardArc: 120, guardCost: 1.3, speed: 0.8, pins: true, shaft: true,
    dodge: { kind: 'backstep', distance: 2, time: 0.26, iFrom: 0.02, iTo: 0.18, stamina: 22, cooldown: 1.0 },
  },
  /** The Rogue's kit: weak from the front, brutal from behind, and the only one quick on its feet. */
  daggers: {
    name: 'TWIN DAGGERS',
    cls: 'ROGUE',
    combo: [
      { windup: 0.05, active: 0.06, recover: 0.12, dmg: 7, range: 1.15, arc: 100, lunge: 0.3, knock: 1, hits: 2 },
      { windup: 0.05, active: 0.06, recover: 0.12, dmg: 7, range: 1.15, arc: 100, lunge: 0.3, knock: 1, hits: 2 },
      { windup: 0.05, active: 0.06, recover: 0.12, dmg: 8, range: 1.15, arc: 100, lunge: 0.3, knock: 1, hits: 2 },
      { windup: 0.1, active: 0.07, recover: 0.3, dmg: 14, range: 1.3, arc: 60, lunge: 0.6, knock: 3, thrust: true },
    ],
    // Held: a dagger thrown (Kyle), harder the longer it's held; it sticks where it lands.
    heavy: { windup: 0.05, active: 0.04, recover: 0.3, dmg: 14, dmgFull: 30, range: 8, arc: 0, lunge: -0.15, knock: 2, knockFull: 5, shot: 'knife', speed: 24 },
    blockSpeed: 0.6, chargeSpeed: 0.7, backstab: 2.5, front: 0.6, single: true, guardArc: 100, guardCost: 1.8, speed: 1.1,
    dodge: { kind: 'dash', distance: 4.3, time: 0.22, iFrom: 0, iTo: 0.22, stamina: 30, cooldown: 0.35 },
  },
  /** A short sword on a tap; held, the longbow draws for 1.7 s, harder the longer, and pierces a line.
   *  Let go on the white flash: a sure crit that blinds (shared/ranger.ts). Slow to walk while drawing. */
  longbow: {
    name: 'LONGBOW',
    cls: 'RANGER',
    combo: RANGER_BLADE,
    heavy: { windup: 0.04, active: 0.05, recover: 0.45, dmg: 18, dmgFull: 55, range: 15, arc: 0, lunge: -0.3, knock: 4, knockFull: 15, shot: 'arrow', speed: 34, pierce: true, blinds: true },
    draw: 1.7, // A longer draw to the flash (Kyle, 2026-11-08), but let go early it still flies, weaker.
    blockSpeed: 0.4, chargeSpeed: 0.3, guardArc: 100, guardCost: 1.6, speed: 1.1,
    dodge: RANGER_JUMP,
  },
  /** Quick draws, light arrows, and you can walk while drawing: the kiting bow. */
  shortbow: {
    name: 'SHORTBOW',
    cls: 'RANGER',
    combo: RANGER_BLADE,
    heavy: { windup: 0.03, active: 0.04, recover: 0.22, dmg: 10, dmgFull: 22, range: 9, arc: 0, lunge: 0, knock: 2, knockFull: 6, shot: 'arrow', speed: 26 },
    draw: 0.4, early: 'full', // Quick to full and to the flash; let go early it's still a full shot.
    blockSpeed: 0.45, chargeSpeed: 0.7, guardArc: 100, guardCost: 1.7, speed: 1.1,
    dodge: RANGER_SPRINT,
  },
  /** A short sword on a tap. Held with a bolt on it, the crossbow comes up to aim and lets go on release:
   *  a heavy bolt through a line that shoves. Held empty, it winds a reload instead (sim/crossbow.ts). */
  crossbow: {
    name: 'CROSSBOW',
    cls: 'RANGER',
    combo: RANGER_BLADE,
    heavy: { windup: 0.06, active: 0.04, recover: 0.35, dmg: 60, dmgFull: 60, range: 13, arc: 0, lunge: -0.2, knock: 12, knockFull: 12, shot: 'bolt', speed: 36, pierce: true },
    draw: 0.6, early: 'fizzle', // The aim has to settle: let go sooner and no bolt goes.
    blockSpeed: 0.4, chargeSpeed: 0.4, guardArc: 110, guardCost: 1.5, speed: 1.1, reloads: true,
    dodge: RANGER_JUMP,
  },
  /** The Mage at range: a quick bolt of the element cast on the move, or a short 0.6 s cast for the
   *  element's big spell (it costs magic). A tap that lands mid wind-up breaks the blow off (shared/mage.ts). */
  wand: {
    name: 'SPARK WAND',
    cls: 'MAGE',
    // Cast walking (Kyle, 2026-11-04): the left click never stops you.
    combo: [{ windup: 0.3, active: 0.04, recover: 0.2, dmg: 8, range: 8, arc: 0, lunge: 0, knock: 2, shot: 'spark', speed: 17 }],
    heavy: { windup: 0.06, active: 0.04, recover: 0.3, dmg: 10, dmgFull: 24, range: 9, arc: 0, lunge: 0, knock: 3, knockFull: 7, shot: 'spark', speed: 19, burst: 0.8, interrupts: true, spell: true },
    draw: 0.6, early: 'fizzle',
    blockSpeed: 0.4, chargeSpeed: 0.55, guardArc: 100, guardCost: 2, speed: 0.8, castWalk: 0.9,
    dodge: BLINK,
  },
  /** Close and slow: a slash in the Mage's element in front. Held, rooted, the element's spell (it costs
   *  magic): a wall of fire rolled out at a goblin, or all round you a frost nova or a charged ring (shared/spellbook.ts). */
  staff: {
    name: 'FOCUS STAFF',
    cls: 'MAGE',
    combo: [{ windup: 0.3, active: 0.1, recover: 0.42, dmg: 15, range: 1.9, arc: 150, lunge: 0.15, knock: 5, slash: true }],
    heavy: { windup: 0.12, active: 0.05, recover: 0.45, dmg: 12, dmgFull: 20, range: 0, arc: 0, lunge: 0, knock: 0, knockFull: 0, spell: true },
    draw: 1, early: 'fizzle',
    blockSpeed: 0.35, chargeSpeed: 0, guardArc: 100, guardCost: 2, speed: 0.8,
    dodge: BLINK,
  },
  /** The combat Mage: a sword in three cuts in the element, and the element's blade spell on a hold (shared/mage.ts). */
  spellblade: SPELLBLADE,
  /** The Healer: heavy, short blows, every third heals the party; held, a holy smite falls on the goblin you
   *  face, and its light mends friends in the burst. Let go on the white flash, it lands harder and shields
   *  them (shared/cleric.ts MACE). Weakness: the shortest reach of any melee kit. */
  mace: {
    name: 'MACE AND CENSER',
    cls: 'HEALER',
    combo: [
      { windup: 0.12, active: 0.08, recover: 0.22, dmg: 13, range: 1.2, arc: 100, lunge: 0.3, knock: 4 },
      { windup: 0.12, active: 0.08, recover: 0.22, dmg: 13, range: 1.2, arc: 100, lunge: 0.3, knock: 4 },
      { windup: 0.2, active: 0.1, recover: 0.4, dmg: 18, range: 1.35, arc: 130, lunge: 0.5, knock: 7, heal: 8 },
    ],
    heavy: { windup: 0.15, active: 0.05, recover: 0.55, dmg: 24, dmgFull: 70, range: 6, arc: 0, lunge: 0, knock: 4, knockFull: 10, shot: 'smite', burst: 1.3, stun: 1.2, holy: true },
    draw: 1.2, early: 'fizzle', // The holy smite falls only on a full charge.
    blockSpeed: 0.45, chargeSpeed: 0.35, guardArc: 150, guardCost: 1.1, speed: 0.8, blunt: true,
    dodge: { kind: 'roll', distance: 2, time: 0.36, iFrom: 0.05, iTo: 0.28, stamina: 28, cooldown: 1.3 },
  },
  // The Rogue's and Cleric's other kits (kits.ts).
  ...MORE_KITS,
};
export type WeaponId = KitId;
export const WEAPON_ORDER: WeaponId[] = ['sword', 'greatsword', 'spear', 'longbow', 'shortbow', 'crossbow', 'daggers', 'rapier', 'poisoner', 'wand', 'staff', 'spellblade', 'mace', 'censer', 'flail'];
/** The demo's class button cycles these; the weapon button swaps between a class's own kits. */
export const CLASS_ORDER: HeroClass[] = ['WARRIOR', 'RANGER', 'ROGUE', 'MAGE', 'HEALER'];
/**
 * Who can dodge. The Warrior and Healer stand behind a guard instead (no dodge button at all): a striped,
 * unblockable blow they step out of on their feet. The light classes dodge and can't hold a guard.
 */
/** What a class's dodge button says on a phone. */
export const dodgeName = (cls: HeroClass, w?: Weapon): string => (w?.dodge.kind === 'sprint' ? 'SPRINT' : ({ ROGUE: 'DASH', RANGER: 'JUMP', MAGE: 'BLINK' } as Partial<Record<HeroClass, string>>)[cls] ?? 'ROLL');
export const CLASS_DODGES: Record<HeroClass, boolean> = { WARRIOR: false, HEALER: false, ROGUE: true, RANGER: true, MAGE: true };
/** What the dodge button does for this kit: its own dodge, or nothing (a Warrior or Healer has none). */
export const dodgeOf = (w: Weapon): Dodge | undefined => (CLASS_DODGES[w.cls] ? w.dodge : undefined);
/**
 * How each class guards (Kyle, 2026-11-05: no parry anywhere). `full` holds a block; `none` has no guard
 * at all and dodges instead (a Mage blinks out, and leaves an image behind: DECOY). Every kit guards as
 * its class does.
 */
export type GuardKind = 'full' | 'none';
export const CLASS_GUARD: Record<HeroClass, GuardKind> = { WARRIOR: 'full', HEALER: 'full', ROGUE: 'none', RANGER: 'none', MAGE: 'none' };
/** What a kit's block button does: hold a block (a Warrior's or Healer's kit), or nothing. */
export const guardOf = (k: Weapon): GuardKind => CLASS_GUARD[k.cls];
/** The Mage's blink leaves an image of them where they stood: goblins near it go for it instead. */
export const DECOY = { time: 2.5, lure: 5 };
export const CLASS_KITS: Record<HeroClass, WeaponId[]> = {
  WARRIOR: ['sword', 'greatsword', 'spear'],
  RANGER: ['longbow', 'shortbow', 'crossbow'],
  ROGUE: ['daggers', 'rapier', 'poisoner'],
  MAGE: ['wand', 'staff', 'spellblade'],
  HEALER: ['mace', 'censer', 'flail'],
};
/** A healing blow reaches every hero this close to the healer. */
export const HEAL_RADIUS = 3;
