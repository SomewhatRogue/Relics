/**
 * The chalker (a placeholder name for the lore pass; rules sim/chalker.ts, drawn client/chalkdraw.ts):
 * a squad goblin with a lump of chalk and a tally board on its back. It hangs back behind its pack and
 * chalks strokes on one hero, red, over their head, where everyone sees them: one every `every` seconds
 * while it can see them (its clock runs only while it does). At `five` the whole pack turns on that hero
 * for `turn` seconds, their blows on them `dmg` as hard; then the chalk is spent and the strokes go.
 *
 * - `hp`: fragile (a Rogue's stab or a Ranger's two arrows). `keep`: closer than this, it runs (`flee`).
 *   `behind`: how far behind its pack it stands. `sight`: how far it sees the hero it's chalking.
 * - `first`: seconds of seeing before the first stroke. `linger`: strokes left with no chalker at them
 *   (it was killed, or you went on into the next room) fade after this long.
 * - `pack`: the pack members within this of the hero turn on them (all of its pack in a room).
 * - Vanish, smoke (a smoke bomb, Vanish's, a flask's, steam) and blessed ground (SANCTUARY, walking or
 *   not) wipe the strokes, and end a turn already on.
 * - `poke`: cornered, a jab with the chalk hand.
 */
import type { EnemyAttackSpec } from './tuning.js';
import type { Debut } from './debut.js';

export const CHALKER = {
  hp: 28,
  keep: 4.2,
  flee: 1.15,
  behind: 3,
  sight: 10,
  every: 2,
  first: 1,
  five: 5,
  turn: 8,
  dmg: 1.3,
  pack: 14,
  linger: 6,
  poke: { windup: 0.6, active: 0.08, recover: 0.6, dmg: 4, knock: 2, range: 1.3, arc: 60, unblockable: false } as EnemyAttackSpec,
  /**
   * How it bleeds in (shared/debut.ts): staged first in the CRIES way's room in the Barrowfields
   * (marking the captives' tally on a board, then turning its chalk on you); rare from `rare` days
   * after its debut day `from` (weight `weight`, room 2 on, the Barrowfields only, one a job); common
   * from `common` days after it. A day is one finished job on the shared world's clock (WorldState.day,
   * the board's day): the chapter system has no week in it yet, and the chapter never moves on.
   */
  debut: { staged: 'cries', home: 'Barrowfields', from: 60, rare: 7, common: 28, weight: 0.5 } as Debut,
};
