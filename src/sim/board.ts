/**
 * A shield-bearer's board against shots (numbers: VARIANTS.shield). An arrow, bolt, dart, knife or
 * spell bolt coming at its front meets the board: a plain one is stopped dead with a thunk and a spray
 * of sparks; a charged or perfect one (a full draw, the glinted crossbow bolt, the longbow's perfect
 * arrow) punches through for less. A plain crossbow bolt is stopped like any other. From the side or
 * behind it lands in full, and so it does on a goblin that is stunned, pinned, frozen, netted or hasn't
 * seen you. Lightning goes round the board, and bursts never meet it (sim/bolts.ts blast). Judged in the
 * room, so every player sees the same thing.
 */
import { VARIANTS } from '../shared/tuning';
import { held } from './damage';
import type { Bolt, Enemy } from './types';

export type Board = 'open' | 'through' | 'blocked';

/** How shot `b` meets goblin `e`'s board. */
export function boardFor(e: Enemy, b: Bolt, now: number): Board {
  if (e.variant !== 'shield' || b.el === 'storm' || e.alert === false || held(e, now)) return 'open';
  // Facing the shot: its facing points back along the shot's line.
  if (e.fx * -b.dx + e.fy * -b.dy <= VARIANTS.shield.cone) return 'open';
  // (Every longbow arrow is marked to pierce, so it's the full draw or the flash that counts, not that.)
  return b.perfect || b.charged ? 'through' : 'blocked';
}

/** What of a shot's damage the board lets by. */
export const boardMult = (k: Board) => (k === 'blocked' ? VARIANTS.shield.shot : k === 'through' ? VARIANTS.shield.through : 1);
