/**
 * The poisoner's darts (Kyle, 2026-11-23): five at most, one back every five seconds whatever the hero is doing
 * (shared/venom.ts DARTS). A dart loosed spends one; ATTACK held with none left looses nothing, and the room says
 * so (once a second). It lives on the hero, so a guest sees the count the leader's room decided.
 * `darts` undefined is a full pouch.
 */
import { DARTS, WEAPONS } from '../shared/tuning';
import type { FightEvent, Hero } from './types';

const blowpipe = (h: Hero) => !!WEAPONS[h.weapon].heavy.venom;
export const dartsOf = (h: Hero) => h.darts ?? DARTS.most;

/** A tick: one dart back every DARTS.back seconds until the pouch is full. */
export function refillDarts(h: Hero, now: number): void {
  if (h.darts === undefined || h.darts >= DARTS.most) return;
  if (now < (h.dartAt ?? 0)) return;
  h.darts += 1;
  if (h.darts >= DARTS.most) (h.darts = undefined), (h.dartAt = undefined);
  else h.dartAt = now + DARTS.back;
}

/** ATTACK held long enough to be a hold, with no dart left: nothing drawn, the press spent, the cue. True if so. */
export function noDart(h: Hero, now: number, ev: FightEvent[]): boolean {
  if (!blowpipe(h) || dartsOf(h) > 0) return false;
  h.attackQueuedAt = -9;
  if (now - h.toldAt > 1) (h.toldAt = now), ev.push({ k: 'nodart', x: h.x, y: h.y, id: h.id });
  return true;
}

/** A dart loosed: one fewer, and the clock to the next one back starts if it wasn't running. */
export function spendDart(h: Hero, now: number): void {
  if (!blowpipe(h)) return;
  const was = dartsOf(h);
  h.darts = Math.max(0, was - 1);
  if (was >= DARTS.most || h.dartAt === undefined) h.dartAt = now + DARTS.back;
}
