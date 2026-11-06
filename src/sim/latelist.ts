/**
 * A blow on a friend's hero waits for their word on it (lag compensation, sim/lagcomp.ts resolves it).
 * A friend's screen shows the leader's room `lag` seconds behind, so a dodge they pressed on time by
 * their own screen gets here after the blow has landed. A blow that covers a hero with lag goes on the
 * room's list instead (plain data: who, by whom, when, and the blow as it was, with the way it shoves
 * and the way a guard must face taken at that moment) and is judged by what their screen showed.
 *
 * The list is the room's (`ArenaRoom.late`); while a room steps it's the one in use here, as the score
 * board is (sim/score.ts). Outside a room's step nothing waits: the blow is judged at once.
 */
import { LAGCOMP } from '../shared/tuning';
import { guardFrom } from './rushguard';
import { isRound, type Enemy, type EnemyAttack, type Hero, type Intent } from './types';

export interface LateBlow {
  hero: string;
  foe: number;
  /** When it landed (room time), and when it's judged at the latest. */
  at: number;
  due: number;
  a: EnemyAttack;
  /** The shove's way (the hero from the blow) and the way a guard must face, as it landed. */
  sx: number;
  sy: number;
  gx: number;
  gy: number;
}

let list: LateBlow[] | null = null;
export const useLate = (l: LateBlow[] | null): void => void (list = l);
/** Blows waiting now (the room's own, while it steps). */
export const lateCount = () => list?.length ?? 0;
/** A hero's lag, as kept on it (the leader's own: none). */
export const lagOf = (h: Hero) => Math.max(0, h.lag ?? 0);

/** Put off a blow that covers a hero with lag; false when it's judged now (no lag, or no room stepping). */
export function defer(e: Enemy, a: EnemyAttack, h: Hero, now: number): boolean {
  const lag = lagOf(h);
  if (!list || lag <= 0) return false;
  const round = isRound(a.kind), [gx, gy] = guardFrom(e, a, h);
  list.push({ hero: h.id, foe: e.id, at: now, due: now + Math.min(lag, LAGCOMP.cap), a: { ...a, hit: a.hit ? [...a.hit] : undefined }, sx: round ? h.x - a.cx : h.x - e.x, sy: round ? h.y - a.cy : h.y - e.y, gx, gy });
  return true;
}

/**
 * A friend's guard by their own screen: the `vt` it went up at and came down at. A press is sent the
 * moment it happens (client/input.ts), so the first Intent with the block held carries its moment.
 */
export function noteGuard(h: Hero, inp: Intent): void {
  if (inp.vt === undefined) return void (h.guardVt = h.guardOffVt = undefined);
  if (inp.block && (h.guardVt === undefined || h.guardOffVt !== undefined)) (h.guardVt = inp.vt), (h.guardOffVt = undefined);
  else if (!inp.block && h.guardVt !== undefined && h.guardOffVt === undefined) h.guardOffVt = inp.vt;
}
