/**
 * A shield-bearer's board (numbers: VARIANTS.shield), a lighter Planker's door: a wall from the front,
 * soft behind. Anything coming at its front (within the cone) meets the board:
 * - a plain blow does a tenth of itself, a plain shot (an arrow, bolt, dart, knife or spell bolt) is
 *   stopped dead, each with BLOCKED, a thunk and a spray of sparks;
 * - a heavy blow, a counter, a full draw or a perfect (the glinted crossbow bolt, the longbow's perfect
 *   arrow) does a quarter;
 * - a full charge, a perfect or a counter also knocks the board aside: BOARD OUT, open for a moment from
 *   anywhere, for you or a friend to hit it in full.
 * From the side or behind it lands in full, and so it does on a goblin that is stunned, pinned, frozen,
 * netted or hasn't seen you. Lightning goes round the board, and bursts never meet it (sim/bolts.ts
 * blast). It turns slowly (sim/enemies.ts), so walk or dodge round it. Judged in the room, so every
 * player sees the same thing; the knock is one field set once (`boardOutAt`), so it's sent once.
 */
import { VARIANTS } from '../shared/tuning';
import { held } from './damage';
import type { Bolt, Enemy, FightEvent } from './types';
import { plankFaces } from './meaty';

export type Board = 'open' | 'through' | 'blocked';

/** Its board knocked aside just now: open, front or not. */
export const boardOut = (e: Enemy, now: number) => e.variant === 'shield' && now - (e.boardOutAt ?? -99) < VARIANTS.shield.out;

/**
 * Does a shield-bearer's board meet something coming from the direction (`dx`, `dy`) (from the goblin
 * toward where it comes from)? Not when it's down: stunned, frozen, netted, pinned, unaware, or knocked aside.
 */
export function shieldFaces(e: Enemy, dx: number, dy: number, now: number): boolean {
  if (e.variant !== 'shield' || e.alert === false || e.act === 'dead' || held(e, now) || boardOut(e, now)) return false;
  const l = Math.hypot(dx, dy) || 1;
  return (e.fx * dx + e.fy * dy) / l > VARIANTS.shield.cone;
}

/** A heavy thing into the board knocks it aside (once: while it's out, nothing knocks it again). */
export function knockAside(e: Enemy, now: number, ev: FightEvent[]): void {
  if (boardOut(e, now)) return;
  e.boardOutAt = now;
  ev.push({ k: 'boardout', x: e.x, y: e.y });
}

/** How shot `b` meets goblin `e`'s board. */
export function boardFor(e: Enemy, b: Bolt, now: number): Board {
  // A Planker's barn door stops anything at its front, a charged or perfect shot and lightning too (sim/meaty.ts).
  if (e.variant === 'planker') return plankFaces(e, -b.dx, -b.dy, now) ? 'blocked' : 'open';
  // Facing the shot: its facing points back along the shot's line.
  if (b.el === 'storm' || !shieldFaces(e, -b.dx, -b.dy, now)) return 'open';
  // (Every longbow arrow is marked to pierce, so it's the full draw or the flash that counts, not that.)
  return b.perfect || b.charged ? 'through' : 'blocked';
}

/** As boardFor, and a shot that gets through a shield-bearer's board knocks it aside. */
export function meetBoard(e: Enemy, b: Bolt, now: number, ev: FightEvent[]): Board {
  const k = boardFor(e, b, now);
  if (k === 'through' && e.variant === 'shield') knockAside(e, now, ev);
  return k;
}

/** What of a shot's damage the board lets by. */
export const boardMult = (k: Board) => (k === 'blocked' ? VARIANTS.shield.shot : k === 'through' ? VARIANTS.shield.through : 1);

/** What of a blow's damage it lets by from the front: a heavy one (or a counter) a quarter, else a tenth. */
export const blowMult = (heavy: boolean) => (heavy ? VARIANTS.shield.heavy : VARIANTS.shield.front);

/** Does this blow knock the board aside: a full charge, a perfect or a counter. */
export const knocksBoard = (h: { heavy: boolean; power: number; perfect: boolean; counter: boolean }) => (h.heavy && h.power >= 1) || h.perfect || h.counter;
