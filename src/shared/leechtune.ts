/**
 * THE LEECHMAN's numbers (docs/design/deep-layer-bosses.md section 2): a long goblin that lives in the fen pools,
 * the boss of floor 15 on the Fenmere layer of the Deep (shared/deeplayers.ts 'fen'), in a fen pool
 * (shared/fenarena.ts). It wades the shallows and the reed beds and never swims deep water. Read by the room
 * (sim/leechman.ts, sim/leechbook.ts, sim/leechhook.ts) and later the screen; exported through tuning.ts.
 *
 * - `walk`: its pace in tiles a second as it actually moves, whatever the ground does to a body: FAST in the
 *   shallows (`water`, where a hero is slowed to WADE), slow on dry peat (`dry`), and mud is nothing to it.
 * - `line`: THE LINE, a hook thrown down a narrow red lane at a hero. Caught, the hero is hauled to it
 *   (`pull.to` from its feet, stunned `pull.stun`), and the PUNISH follows straight away (`chainPause`).
 *   Blocking, or rolling out of the lane, saves you.
 * - `leeches`: flung at a hero, a red circle where they land. A hero caught has leeches on them: `leech.dmg`
 *   a `leech.every` s (never down to the last point of health) until they roll, each roll shaking them off.
 * - `peat`: a peat bank heaved down a striped lane (`range` long), leaving mud along it: circles `mud.r` wide
 *   every `mud.step`, for `mud.time` s, that slow a body to MUD_SLOW (shared/arena.ts wadeAt).
 * - `wade`: its blow once it has waded in.
 * - Phase 2 at `phase2` of its health: a roar, `faster` its pace and wind-ups (floors kept), `boss.flood` set
 *   (slice 2: the water rises, logs), and small ones wading in from the reeds twice as often.
 */
import type { EnemyAttackSpec } from './tuning.js';

export type LeechMove = 'line' | 'leeches' | 'wade' | 'peat' | 'punish';

export const LEECHMAN = {
  hp: 650,
  radius: 0.9,
  weight: 6,
  /** Drawn this many times a goblin's size. */
  size: 2.1,
  walk: { water: 3.6, dry: 1.1, close: 1.7 },
  phase2: 0.5,
  faster: 1.2,
  pauseBetween: 0.45,
  /** The punish is part of the line, so a seeded swap leaves it out. */
  rotation: {
    1: ['line', 'leeches', 'wade', 'peat', 'line', 'leeches'],
    2: ['line', 'leeches', 'peat', 'wade', 'line', 'peat', 'leeches', 'line'],
  } as Record<1 | 2, LeechMove[]>,
  more: 'leeches' as LeechMove,
  line: { windup: 0.9, active: 0.12, recover: 0.25, dmg: 5, knock: 0, range: 7.5, arc: 5, unblockable: false } as EnemyAttackSpec,
  pull: { to: 1.1, stun: 0.6 },
  punish: { windup: 0.5, active: 0.1, recover: 0.9, dmg: 24, knock: 9, range: 2.5, arc: 100, unblockable: false } as EnemyAttackSpec,
  leeches: { windup: 0.9, active: 0.12, recover: 0.8, dmg: 6, knock: 2, radius: 1.1, ahead: 0, unblockable: false } as EnemyAttackSpec,
  leech: { dmg: 2, every: 1, range: 8 },
  wade: { windup: 0.8, active: 0.12, recover: 1.1, dmg: 26, knock: 10, range: 2.7, arc: 110, unblockable: false } as EnemyAttackSpec,
  peat: { windup: 1.2, active: 0.15, recover: 1.0, dmg: 26, knock: 12, range: 8, arc: 12, unblockable: true } as EnemyAttackSpec,
  mud: { r: 0.9, step: 1.2, time: 7 },
  /** The line wants its hero at least this far off (closer, it wades in), and no further than the line's range. */
  lineMin: 2.2,
  /** Walks at its hero this long on one blow before passing it over. */
  skip: 7,
  chain: ['punish'] as LeechMove[],
  chainPause: 0.05,
  /** Small ones wading in from the reeds: `n` every `every` s (phase 1, phase 2), never more than `most` of them up at once. */
  adds: { n: 2, every: { 1: 24, 2: 12 } as Record<1 | 2, number>, most: 4 },
};
