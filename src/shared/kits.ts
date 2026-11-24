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
   * The chain sickle (Kyle, 2026-11-23; docs/design/chain-sickle.md), in the rapier's place, its id kept so
   * saves and loot carry over. Quick cuts up close, two or three goblins a swing. Held, the chain whirls round
   * you (sim/sickle.ts): little cuts all round, bleeding once it's fully going, and you walk slow (tuned down
   * 2026-11-23, Kyle: "way too good... better in a one v one than daggers from behind"). Let go, it flies on its chain;
   * fully spun it snags a wall (you're pulled to it), a big goblin (you're pulled round behind it) or a small
   * one (yanked to you); on the white flash the snagged goblin bleeds. Weakness: up against a wall the
   * chain catches and the spin cuts nothing.
   */
  rapier: {
    name: 'CHAIN SICKLE',
    cls: 'ROGUE',
    combo: [
      { windup: 0.09, active: 0.07, recover: 0.2, dmg: 7, range: 1.5, arc: 120, lunge: 0.3, knock: 2, hits: 2 },
      { windup: 0.09, active: 0.07, recover: 0.2, dmg: 7, range: 1.5, arc: 120, lunge: 0.3, knock: 2, hits: 2 },
      { windup: 0.14, active: 0.08, recover: 0.34, dmg: 10, range: 1.6, arc: 160, lunge: 0.4, knock: 4, hits: 3 },
    ],
    heavy: { windup: 0.05, active: 0.05, recover: 0.35, dmg: 8, dmgFull: 18, range: 6, arc: 0, lunge: 0, knock: 3, knockFull: 6, chain: true, sickle: true },
    draw: 1.5,
    blockSpeed: 0.6, chargeSpeed: 0.5, backstab: 1.75, front: 1, guardArc: 100, guardCost: 1.8, speed: 1.1,
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
    heavy: { windup: 0.05, active: 0.04, recover: 0.3, dmg: 2, dmgFull: 4, range: 9, arc: 0, lunge: -0.1, knock: 0, knockFull: 0, shot: 'dart', speed: 22, venom: true },
    draw: 0.6,
    blockSpeed: 0.6, chargeSpeed: 0.75, backstab: 1.75, front: 0.8, guardArc: 100, guardCost: 1.8, speed: 1.1,
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
    draw: 1.1, early: 'fizzle', // As the flail: the whirl goes only at full (Kyle, 2026-11-08).
    blockSpeed: 0.45, chargeSpeed: 0.35, guardArc: 165, guardCost: 1, speed: 0.74,
    dodge: CLERIC_ROLL,
  },
  /**
   * Slow, wide sweeps that shove a goblin a little (never over a shield-bearer's board); the second blow
   * heals. Held, the flail spun up while you walk at `chargeSpeed` (Kyle, 2026-11-07: "you should be able to
   * move while swinging it"), and let go it's a long sweep that doesn't carry you with it.
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
    draw: 1, early: 'fizzle', // The spin goes only at full (Kyle, 2026-11-08: "charged flail just shouldn't work without a full charge").
    blockSpeed: 0.4, chargeSpeed: 0.55, guardArc: 130, guardCost: 1.3, speed: 0.74, blunt: true, shoves: true, castWalk: 0.5,
    dodge: CLERIC_ROLL,
  },
};
