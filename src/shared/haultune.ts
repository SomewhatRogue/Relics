/**
 * The Haulier's numbers (docs/design/deep-bosses.md; the boss as docs/plans/bosses.md "The Haulier"):
 * the biggest of the ironhides, in plate, with an ore pick, met on every fifth floor of the Deep in an old
 * working (shared/sumparena.ts). Its plate is the ironhide's (shared/raiders.ts IRONHIDE: a fifth till a
 * charged blow, a perfect, lightning or a jolt through the sump breaks it). Read by the room
 * (sim/haulier.ts, sim/haulbook.ts) and the screen (client/hauldraw.ts) alike; exported through tuning.ts.
 *
 * - `rotation`: each phase's blows in order (the kit's one seeded swap, one `more` for a party of four).
 * - `pick`: a big red wedge, BRACED or dodge it. `overhead`: a striped circle ahead of it, the pick stuck
 *   after (`recover`, the long punish). `shove`: it puts its shoulder to the nearest cart on the rail and
 *   sends it down the rail at you (a striped lane the rail's width, then the cart). `drag`: phase 2, it
 *   swings its chain round itself (a striped ring).
 * - Phase 2 at `phase2` of its health: a roar, the plate off for good, `faster` its pace and wind-ups'
 *   floors kept, and `adds.n` small ones out of the adit every `adds.every` s.
 * - `cart`: a cart on the rail. GRAB held `grab` s at a cart standing at either stop sends it rolling to
 *   the other at `speed`; it hits whatever's in the rail's lane (`width`): a hero for `dmg`, the Haulier
 *   knocked down `down` s (its plate cracked: the payoff). It stops at the far stop.
 * - `gear`: lightning within `gear.reach` of the winding gear over the shaft falls on the gear and
 *   crackles out `gear.r`: the Haulier inside it has its plate cracked (lead it under, then call the storm).
 *
 * Threat (docs/design/boss-threat.md step 3; Kyle, 2026-11-11: "more mobility, abilities that are actually
 * threatening"):
 * - `leap`: it crouches and leaps at the hero furthest off (at least `leapFrom` away; else passed over), a
 *   striped circle where it'll land. Keeping your distance isn't safe.
 * - `wrench`: phase 2, straight after the overhead: it rips the pick out sideways, a quick red wedge (block
 *   it or be out of reach). The overhead's stuck time shrinks to `chainRecover` before it.
 * - `crank`: it hauls on the gear's chain and the wheel throws sparks: a striped circle under each hero
 *   (and `sparks.extra` either side of one alone or two), then each burns `sparks.burn` s (floor taken away).
 * - `chain`: the blow after these comes with only `chainPause` between (both phases since 2026-11-11).
 */
import type { EnemyAttackSpec } from './tuning.js';

export type HaulMove = 'pick' | 'overhead' | 'shove' | 'drag' | 'leap' | 'wrench' | 'crank';

export const HAULIER = {
  hp: 700,
  radius: 0.85,
  weight: 6,
  /** Drawn this many times an ironhide's size. */
  size: 2,
  walk: { pace: 1.7, close: 1.6 },
  phase2: 0.5,
  faster: 1.15,
  /** (Kyle, 2026-11-11: "attack more often, faster tells": 0.7 before, wind-ups a seventh shorter.) */
  pauseBetween: 0.35,
  rotation: { 1: ['pick', 'overhead', 'pick', 'leap', 'shove', 'crank'], 2: ['leap', 'pick', 'overhead', 'wrench', 'crank', 'drag', 'shove', 'pick'] } as Record<1 | 2, HaulMove[]>,
  more: 'drag' as HaulMove,
  pick: { windup: 0.85, active: 0.12, recover: 0.9, dmg: 22, knock: 8, range: 2.4, arc: 100, unblockable: false } as EnemyAttackSpec,
  overhead: { windup: 1.2, active: 0.12, recover: 2.2, dmg: 30, knock: 10, radius: 1.8, ahead: 1.6, unblockable: true } as EnemyAttackSpec,
  shove: { windup: 1.0, active: 0.2, recover: 1.0, dmg: 0, knock: 0, unblockable: true } as EnemyAttackSpec,
  drag: { windup: 1.3, active: 0.15, recover: 1.5, dmg: 18, knock: 8, radius: 2.6, ahead: 0, unblockable: true } as EnemyAttackSpec,
  leap: { windup: 0.95, active: 0.15, recover: 0.8, dmg: 26, knock: 12, radius: 1.7, ahead: 0, unblockable: true } as EnemyAttackSpec,
  leapFrom: 3.5,
  /** The last `air` s of the leap's wind-up it's in the air (drawn; it lands as the wind-up ends). */
  air: 0.45,
  wrench: { windup: 0.45, active: 0.1, recover: 1.4, dmg: 18, knock: 8, range: 2.6, arc: 150, unblockable: false } as EnemyAttackSpec,
  crank: { windup: 1.2, active: 0.1, recover: 0.8, dmg: 0, knock: 0, unblockable: true } as EnemyAttackSpec,
  sparks: { r: 1.1, dmg: 16, knock: 4, burn: 4, extra: 2, apart: 2.4, most: 4 },
  chain: ['leap', 'overhead'] as HaulMove[],
  chainPause: 0.1,
  chainRecover: 0.35,
  /** It shoves a cart only from within this of one at a stop (else the next blow). */
  shoveReach: 2.2,
  adds: { every: 15, n: 2 },
  /**
   * Carts (Kyle, 2026-11-12: "click to grab it then aim it and click again to throw it"): GRAB by a cart at rest
   * holds it in front of you, GRAB again throws it the way you face at `speed`, at most `most` tiles. It knocks
   * the Haulier down `down` s, but not again for `again` s after (no stun-locking); a goblin it hits takes `addDmg`.
   */
  cart: { grab: 0.6, speed: 9, dmg: 24, knock: 10, down: 2, width: 0.9, most: 14, again: 10, addDmg: 30, hold: 0.25 },
  gear: { reach: 1.4, r: 1.8 },
};
