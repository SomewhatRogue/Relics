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
 */
import type { EnemyAttackSpec } from './tuning.js';

export type HaulMove = 'pick' | 'overhead' | 'shove' | 'drag';

export const HAULIER = {
  hp: 700,
  radius: 0.85,
  weight: 6,
  /** Drawn this many times an ironhide's size. */
  size: 1.6,
  walk: { pace: 1.7, close: 1.6 },
  phase2: 0.5,
  faster: 1.15,
  pauseBetween: 0.7,
  rotation: { 1: ['pick', 'overhead', 'pick', 'shove'], 2: ['pick', 'drag', 'overhead', 'shove', 'pick'] } as Record<1 | 2, HaulMove[]>,
  more: 'drag' as HaulMove,
  pick: { windup: 1.0, active: 0.12, recover: 0.9, dmg: 22, knock: 8, range: 2.4, arc: 100, unblockable: false } as EnemyAttackSpec,
  overhead: { windup: 1.4, active: 0.12, recover: 2.2, dmg: 30, knock: 10, radius: 1.8, ahead: 1.6, unblockable: true } as EnemyAttackSpec,
  shove: { windup: 1.2, active: 0.2, recover: 1.0, dmg: 0, knock: 0, unblockable: true } as EnemyAttackSpec,
  drag: { windup: 1.5, active: 0.15, recover: 1.5, dmg: 18, knock: 8, radius: 2.6, ahead: 0, unblockable: true } as EnemyAttackSpec,
  /** It shoves a cart only from within this of one at a stop (else the next blow). */
  shoveReach: 2.2,
  adds: { every: 15, n: 2 },
  cart: { grab: 0.6, speed: 9, dmg: 24, knock: 10, down: 2, width: 0.9 },
  gear: { reach: 1.4, r: 1.8 },
};
