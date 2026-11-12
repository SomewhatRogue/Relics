/**
 * Bosses and BIG ONEs can't be locked down (shared/holdtune.ts BOSS_HOLD): one short freeze, one short stun,
 * then a while when neither takes. Asked by sim/elements.ts (freezing) and sim/stuns.ts (stuns).
 */
import { BOSS_HOLD } from '../shared/holdtune';
import type { Enemy } from './types';

/** Held to these rules: a boss or a BIG ONE. */
export const resists = (e: Enemy) => !!e.boss || !!e.big;

/** How long a freeze of `base` s holds it now (0: it can't be frozen yet), its next freeze set back. */
export function freezeFor(e: Enemy, now: number, base: number): number {
  if (!resists(e)) return base;
  if ((e.thawUntil ?? -9) > now) return 0;
  const t = Math.min(base, BOSS_HOLD.freeze);
  e.thawUntil = now + t + BOSS_HOLD.freezeAgain;
  return t;
}

/** How long a stun of `base` s holds it now (0: it shrugs it off), the next one set back. */
export function stunFor(e: Enemy, now: number, base: number): number {
  if (!resists(e)) return base;
  if ((e.holdUntil ?? -9) > now) return 0;
  const t = base * BOSS_HOLD.stunShare;
  e.holdUntil = now + t + BOSS_HOLD.stunAgain;
  return t;
}

/** It can't be frozen or stunned just now (the ring at its feet). */
export const unheld = (e: Enemy, now: number) => resists(e) && ((e.thawUntil ?? -9) > now || (e.holdUntil ?? -9) > now);
