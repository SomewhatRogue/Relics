/**
 * THE LISTENER's numbers (docs/design/deep-layer-bosses.md section 1): a huge goblin gone blind in the old
 * caves, met on the floor-10 boss floor of the Copperdeep layer (shared/deeplayers.ts 'rock'), in a cave with
 * holes in its floor (shared/cavearena.ts). It hunts by sound, never by sight. Read by the room
 * (sim/listener.ts, sim/listenbook.ts, sim/listennoise.ts) and later the screen; exported through tuning.ts.
 *
 * - `noise`: a hero's noise level, 0 up to `max`. An attack, a roll, a relic raise it to that level (`attack`,
 *   `roll`, `relic`), running at full stick holds it at `run`; it falls `fall` a second. Creeping or standing
 *   still adds nothing. Under `quiet` a hero makes no sound at all. It goes for the loudest hero up (ties: nearest).
 * - `rock`: it breaks a lump off the wall and throws it at the loudest hero: a red circle where it lands.
 * - `drop`: the pose of dropping into a hole (`reach`: how close it walks to one first). Under the floor it
 *   is gone and can't be hit for `under` s, then RISES out of the hole nearest the loudest hero: `rise`, a
 *   striped circle there, then it bursts up. `sweep` follows the rise straight away (`chain`): a quick wide
 *   red arc round it, the punish.
 * - `charge`: a striped lane at the loudest hero across the room.
 * - Phase 2 at `phase2` of its health: a roar, the torches out (`dark`), `faster` its pace and wind-ups
 *   (floors kept), drops twice as often, and `adds.n` small ones out of the holes every `adds.every` s.
 */
import type { EnemyAttackSpec } from './tuning.js';

export type ListenMove = 'rock' | 'drop' | 'rise' | 'sweep' | 'charge';

export const LISTENER = {
  hp: 700,
  radius: 1,
  weight: 6,
  /** Drawn this many times a goblin's size. */
  size: 2.2,
  walk: { pace: 1.6, close: 1.6 },
  phase2: 0.5,
  faster: 1.15,
  pauseBetween: 0.4,
  /** The rise is part of the drop, and the sweep part of the rotation straight after it (so a seeded swap leaves both alone). */
  rotation: {
    1: ['rock', 'drop', 'sweep', 'rock', 'charge', 'rock', 'drop', 'sweep'],
    2: ['drop', 'sweep', 'rock', 'drop', 'sweep', 'charge', 'drop', 'sweep', 'drop', 'sweep'],
  } as Record<1 | 2, ListenMove[]>,
  more: 'rock' as ListenMove,
  rock: { windup: 1.0, active: 0.12, recover: 0.8, dmg: 22, knock: 8, radius: 1.5, ahead: 0, unblockable: false } as EnemyAttackSpec,
  drop: { windup: 0.5, active: 0.1, recover: 0, dmg: 0, knock: 0, unblockable: true } as EnemyAttackSpec,
  rise: { windup: 1.0, active: 0.15, recover: 0.5, dmg: 28, knock: 14, radius: 2, ahead: 0, unblockable: true } as EnemyAttackSpec,
  sweep: { windup: 0.5, active: 0.12, recover: 1.4, dmg: 20, knock: 9, range: 2.9, arc: 220, unblockable: false } as EnemyAttackSpec,
  charge: { windup: 1.1, active: 0.7, recover: 1.0, dmg: 28, knock: 14, range: 9, radius: 0.9, unblockable: true } as EnemyAttackSpec,
  /** Walks to within this of a hole before it drops; it passes the drop over after SKIP s of trying. */
  reach: 0.6,
  /** Under the floor at least this long (the time it takes to get to the hole it rises from). */
  under: 1.6,
  chain: ['rise'] as ListenMove[],
  chainPause: 0.1,
  holes: { r: 0.9 },
  noise: { attack: 1, roll: 0.8, run: 0.45, relic: 1.3, fall: 0.5, quiet: 0.05, max: 1.5, wake: 0.3, hear: 11, near: 2.5 },
  adds: { every: 15, n: 2 },
};
