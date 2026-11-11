/**
 * A shield-bearer's board (numbers: VARIANTS.shield). Anything coming at its front (within the cone) meets
 * the board and is stopped dead, with BLOCKED, a thunk and sparks: blows, shots, charged or perfect, every
 * element, and bursts set off in front of it (sim/bolts.ts blast). It lowers the board for `drop` seconds
 * before each of its own blows lands, open from the front then (`boardOut`). From the side or behind it
 * lands in full, and so it does on a goblin that is stunned, pinned, frozen, netted or hasn't seen you. It's
 * slow and turns slowly (sim/enemies.ts), so walk or dodge round it. Judged in the room from its attack
 * clock, so every player sees the same thing.
 */
import { VARIANTS } from '../shared/tuning';
import { held } from './damage';
import type { Bolt, Enemy, FightEvent } from './types';
import { plankFaces } from './meaty';

export type Board = 'open' | 'through' | 'blocked';

/** Its board lowered: the last `drop` seconds before its own blow lands, the blow, and `after` seconds past it. */
export const boardOut = (e: Enemy, _now?: number) => {
  const a = e.variant === 'shield' && e.act === 'attack' ? e.attack : null;
  return !!a && a.t >= a.windup - VARIANTS.shield.drop && a.t <= a.windup + a.active + VARIANTS.shield.after;
};

/**
 * Does a shield-bearer's board meet something coming from the direction (`dx`, `dy`) (from the goblin
 * toward where it comes from)? Not when it's down: stunned, frozen, netted, pinned, unaware, or knocked aside.
 */
export function shieldFaces(e: Enemy, dx: number, dy: number, now: number): boolean {
  if (e.variant !== 'shield' || e.alert === false || e.act === 'dead' || held(e, now) || boardOut(e, now)) return false;
  const l = Math.hypot(dx, dy) || 1;
  return (e.fx * dx + e.fy * dy) / l > VARIANTS.shield.cone;
}


/** How shot `b` meets goblin `e`'s board. */
export function boardFor(e: Enemy, b: Bolt, now: number): Board {
  // A Planker's barn door stops anything at its front, a charged or perfect shot and lightning too (sim/meaty.ts).
  if (e.variant === 'planker') return plankFaces(e, -b.dx, -b.dy, now) ? 'blocked' : 'open';
  // Facing the shot: its facing points back along the shot's line. Nothing gets through from the front.
  return shieldFaces(e, -b.dx, -b.dy, now) ? 'blocked' : 'open';
}

/** As boardFor (kept for the shots' path). */
export const meetBoard = (e: Enemy, b: Bolt, now: number, _ev: FightEvent[]): Board => boardFor(e, b, now);

/** What of a shot's damage the board lets by. */
export const boardMult = (k: Board) => (k === 'open' ? 1 : 0);
