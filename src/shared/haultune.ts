/**
 * The Haulier's numbers (docs/design/deep-bosses.md; the boss as docs/plans/bosses.md "The Haulier"):
 * the biggest of the ironhides, in plate, with an ore pick, met on every fifth floor of the Deep in an old
 * working (shared/sumparena.ts). Its plate is the ironhide's (shared/raiders.ts IRONHIDE: a fifth till a
 * charged blow, a perfect, lightning or a jolt through the sump breaks it). Read by the room
 * (sim/haulier.ts, sim/haulbook.ts) and the screen (client/hauldraw.ts) alike; exported through tuning.ts.
 *
 * - `rotation`: each phase's blows in order (the kit's one seeded swap, one `more` for a party of four).
 * - `pick`: a big red wedge, BRACED or dodge it. `overhead`: a striped circle ahead of it, the pick stuck
 *   after (`recover`, the long punish). `hurl`: it walks to the nearest cart at rest, lifts it overhead and
 *   hurls it at you (a striped lane the cart's width, then the cart). `drag`: phase 2, it swings its chain
 *   round itself (a striped ring).
 * - Phase 2 at `phase2` of its health: a roar, the plate off for good, `faster` its pace and wind-ups'
 *   floors kept, and `adds.n` small ones out of the adit every `adds.every` s.
 * - `track`, `cart`: carts down the tracks across its floor, with a warning (below); a track cart, or a hurled
 *   one, knocks the Haulier down `down` s with its plate cracked (the payoff: lure it onto a track).
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

export type HaulMove = 'pick' | 'overhead' | 'hurl' | 'drag' | 'leap' | 'wrench' | 'crank';

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
  rotation: { 1: ['pick', 'overhead', 'pick', 'leap', 'hurl', 'crank'], 2: ['leap', 'pick', 'overhead', 'wrench', 'crank', 'drag', 'hurl', 'pick'] } as Record<1 | 2, HaulMove[]>,
  more: 'drag' as HaulMove,
  pick: { windup: 0.85, active: 0.12, recover: 0.9, dmg: 22, knock: 8, range: 2.4, arc: 100, unblockable: false } as EnemyAttackSpec,
  overhead: { windup: 1.2, active: 0.12, recover: 2.2, dmg: 30, knock: 10, radius: 1.8, ahead: 1.6, unblockable: true } as EnemyAttackSpec,
  hurl: { windup: 1.2, active: 0.2, recover: 1.0, dmg: 0, knock: 0, unblockable: true } as EnemyAttackSpec,
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
  /** It hurls a cart only from within this of one at rest (else it walks to one first); the cart leaves its hands this far ahead of it. */
  hurlReach: 2.2,
  hurlFrom: 1.2,
  adds: { every: 15, n: 2 },
  /**
   * Carts (Kyle, 2026-11-12, after the playtest: "tracks everywhere and you get a warning when one is coming, and
   * if you position the enemy right he gets hit instead. He can also hurl one at you"). A cart at rest (on a
   * siding, or where a hurled one stopped) is only the Haulier's to hurl. One rolling (a track's or a hurled one)
   * hits a hero in its way for `dmg`, a goblin for `addDmg`, and the Haulier: down `down` s, plate cracked, but
   * not again for `again` s after (a shrug). `width` is the lane drawn (and the cart's body); a hurled one goes
   * `speed` tiles a second, at most `most` tiles.
   */
  cart: { speed: 9, dmg: 24, knock: 10, down: 2, width: 1.2, most: 14, again: 10, addDmg: 30 },
  /**
   * The tracks (shared/sumparena.ts `map.tracks`): every `every[phase]` s one is picked (sim/trackshape.ts: the
   * room's seeded Rng, leaning to one within `near` of the Haulier by `lean` times over, and not the last one
   * twice) and its lamps light for `warn` s (a rumble); a striped lane shows along it for the last `lane` s;
   * then one cart bursts out of a mouth, rolls the track at `speed` and goes into the far mouth. Never two at once.
   * `first`: the wait after the fight begins.
   */
  track: { every: { 1: 6, 2: 4 } as Record<1 | 2, number>, warn: 1.6, lane: 1.0, speed: 12, first: 2.5, near: 4, lean: 3 },
  gear: { reach: 1.4, r: 1.8 },
};
