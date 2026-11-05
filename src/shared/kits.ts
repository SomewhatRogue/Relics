/**
 * The Rogue's and the Cleric's other kits (weapons.ts has the first of each). Each fights its own way
 * and keeps its class's rules: a Rogue dashes and never blocks; a Cleric guards, never dodges, heals
 * on a blow, and has the censer's coal at its belt whatever is in its hand.
 */
import type { Dodge, Weapon } from './weapons.js';

/** The Rogue's dash (the daggers' own). */
const DASH: Dodge = { kind: 'dash', distance: 4.3, time: 0.22, iFrom: 0, iTo: 0.22, stamina: 30, cooldown: 0.35 };
/** A Cleric's roll is never used (no dodge button), but every kit carries one. */
const CLERIC_ROLL: Dodge = { kind: 'roll', distance: 2, time: 0.36, iFrom: 0.05, iTo: 0.28, stamina: 28, cooldown: 1.3 };

export type MoreKitId = 'rapier' | 'poisoner' | 'censer' | 'flail';

export const MORE_KITS: Record<MoreKitId, Weapon> = {
  /**
   * Reach and honest work head on: quick single thrusts that find one goblin, fairer from the front
   * than the daggers and less brutal from behind. Held: a long lunge that runs through two in a line;
   * loosed on the white flash it skewers them on the tip, staggered and bleeding (shared/venom.ts SKEWER).
   */
  rapier: {
    name: 'RAPIER',
    cls: 'ROGUE',
    combo: [
      { windup: 0.07, active: 0.06, recover: 0.16, dmg: 9, range: 1.85, arc: 36, lunge: 0.35, knock: 1, thrust: true },
      { windup: 0.07, active: 0.06, recover: 0.16, dmg: 9, range: 1.85, arc: 36, lunge: 0.35, knock: 1, thrust: true },
      { windup: 0.12, active: 0.07, recover: 0.3, dmg: 13, range: 2, arc: 36, lunge: 0.6, knock: 3, thrust: true },
    ],
    heavy: { windup: 0.08, active: 0.1, recover: 0.42, dmg: 16, dmgFull: 36, range: 2.4, arc: 40, lunge: 2.6, knock: 3, knockFull: 7, thrust: true, hits: 2, skewer: true },
    draw: 0.7,
    chip: 0.45, blockSpeed: 0.6, chargeSpeed: 0.6, backstab: 2, front: 0.8, single: true, parryWindow: 0.2, guardArc: 100, guardCost: 1.8, speed: 1.08,
    dodge: { ...DASH, distance: 3.8, cooldown: 0.45 },
  },
  /**
   * The poisoner's kit (it replaced the hand crossbow, 2026-11-03). A short sword for the close work:
   * a little wider than the daggers and slower, catching two at once; no great damage, but none lost
   * head on either. Held: the blowpipe up to the lips, and a dart at range that poisons (shared/venom.ts).
   * Loosed on the white flash, the goblin retches first and its poison ticks harder. Weakness: the
   * poison is slow, the dart itself barely scratches, and the spiders and their nests shrug it off.
   */
  poisoner: {
    name: 'SHORT SWORD AND BLOWPIPE',
    cls: 'ROGUE',
    combo: [
      { windup: 0.09, active: 0.08, recover: 0.18, dmg: 7, range: 1.3, arc: 130, lunge: 0.3, knock: 2, hits: 2 },
      { windup: 0.09, active: 0.08, recover: 0.18, dmg: 7, range: 1.3, arc: 130, lunge: 0.3, knock: 2, hits: 2 },
      { windup: 0.14, active: 0.09, recover: 0.32, dmg: 10, range: 1.4, arc: 150, lunge: 0.45, knock: 4, hits: 3 },
    ],
    heavy: { windup: 0.05, active: 0.04, recover: 0.3, dmg: 2, dmgFull: 4, range: 9, arc: 0, lunge: -0.1, knock: 0, knockFull: 1, shot: 'dart', speed: 22, venom: true },
    draw: 0.6,
    chip: 0.45, blockSpeed: 0.6, chargeSpeed: 0.75, backstab: 2, parryWindow: 0.2, guardArc: 100, guardCost: 1.8, speed: 1.08,
    dodge: DASH,
  },
  /**
   * A sword in the hand and the censer swung on its chain: two quick cuts, then the censer comes round in
   * a wide arc, leaving burning coals on the floor and healing the party. The best guard a Cleric has.
   * Swung through your own coals, it bursts them, mending friends near them. Held: the censer
   * whirled all the way round, setting alight everything near and healing again; let go on the white
   * flash and your coals flare and friends near you are shielded (shared/cleric.ts CENSER). Weakness:
   * a wall in the swing snags the chain.
   */
  censer: {
    name: 'SWORD AND CENSER',
    cls: 'HEALER',
    combo: [
      { windup: 0.09, active: 0.08, recover: 0.2, dmg: 11, range: 1.45, arc: 110, lunge: 0.35, knock: 3 },
      { windup: 0.09, active: 0.08, recover: 0.2, dmg: 11, range: 1.45, arc: 110, lunge: 0.35, knock: 3 },
      { windup: 0.2, active: 0.12, recover: 0.4, dmg: 12, range: 1.8, arc: 170, lunge: 0.3, knock: 5, heal: 8, burn: true, coals: true },
    ],
    heavy: { windup: 0.12, active: 0.14, recover: 0.5, dmg: 16, dmgFull: 36, range: 1.9, arc: 360, lunge: 0, knock: 5, knockFull: 10, heal: 8, burn: true, holy: true },
    draw: 1.1,
    chip: 0.12, blockSpeed: 0.45, chargeSpeed: 0.35, parryWindow: 0.34, guardArc: 165, guardCost: 1, speed: 0.86,
    dodge: CLERIC_ROLL,
  },
  /**
   * Slow, wide sweeps that shove a goblin a little (never over a shield-bearer's board); the second blow
   * heals. Held, rooted: the flail spun up, and let go it's a long sweep that doesn't carry you with it.
   * Let go on the white flash and what it hits is stunned, and friends near you are shielded (shared/
   * cleric.ts FLAIL). A strong spun blow knocks a goblin out of a heavy wind-up (`breaker`).
   */
  flail: {
    breaker: true,
    name: 'FLAIL',
    cls: 'HEALER',
    combo: [
      { windup: 0.22, active: 0.12, recover: 0.3, dmg: 16, range: 1.85, arc: 200, lunge: 0.3, knock: 5.5 },
      { windup: 0.24, active: 0.12, recover: 0.45, dmg: 20, range: 1.95, arc: 220, lunge: 0.4, knock: 6.5, heal: 9 },
    ],
    heavy: { windup: 0.1, active: 0.14, recover: 0.5, dmg: 22, dmgFull: 54, range: 2.6, arc: 240, lunge: 0, knock: 8, knockFull: 14, holy: true, dazes: true },
    draw: 1,
    chip: 0.25, blockSpeed: 0.4, chargeSpeed: 0, parryWindow: 0.24, guardArc: 130, guardCost: 1.3, speed: 0.8, blunt: true, shoves: true,
    dodge: CLERIC_ROLL,
  },
};
