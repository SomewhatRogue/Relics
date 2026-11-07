/**
 * The late-press grace on a boss's blow (docs/plans/bosses.md "Fair under lag"; numbers shared/bosstune.ts
 * GRACE, BOSS_FLAGS.grace). A guard or dodge pressed up to GRACE.window after a boss's blow lands, by the
 * hero's own screen, still counts.
 *
 * How it sits with lag compensation (sim/latelist.ts, lagcomp.ts; LAGCOMP.cap):
 * - The leader's own hero (no lag): a blow its own room would have blocked or dodged anyway is judged at
 *   once, as ever. One that would land waits GRACE.window: a roll begun or a guard raised in that time
 *   saves it (a plain dodge, or a block); otherwise it lands then.
 * - A friend with lag L: judged by their own screen (`vt`) as any blow on them is, and a press up to
 *   GRACE.window late by that screen counts too. The room holds the blow min(L + GRACE.window,
 *   max(LAGCOMP.cap, GRACE.window)) at most: the two never add up past the cap. So for L up to
 *   cap - window the whole grace is theirs; past that it shrinks to cap - L; from L = cap it's only the
 *   lag compensation (their on-time press still counts, a late one doesn't).
 * - A blow judged saved is resolved the moment it is; only a blow that's landing waits out the window.
 */
import { BOSS_FLAGS, CLASS_DODGES, GRACE, LAGCOMP, WEAPONS, guardOf } from '../shared/tuning';
import { guardArc, slipWindow } from './knacks';
import { roundGuard } from './holyguard';
import { guardFrom } from './rushguard';
import { ironHeld } from './taunt';
import { lagOf, putOff, type LateBlow } from './latelist';
import { judge } from './lagcomp';
import type { Verdict } from './combat';
import type { Enemy, EnemyAttack, Hero } from './types';

const E = 1e-6;

/** Would the room's own judgement, now, save the leader's hero from this blow? */
function savedNow(e: Enemy, a: EnemyAttack, h: Hero, now: number): boolean {
  const w = WEAPONS[h.weapon];
  if (h.wardUntil > now || (ironHeld(h, now) && !a.unblockable) || (h.act === 'bash' && h.rush?.el === 'storm')) return true;
  if (CLASS_DODGES[w.cls] && h.act === 'roll' && h.actT >= w.dodge.iFrom && h.actT <= slipWindow(h)) return true;
  // (A striped blow on a held guard is met by it too: most of it stopped, sim/blockhold.ts.)
  if (!h.blocking || guardOf(w) !== 'full' || !(h.act === 'idle' || h.act === 'attack' || h.act === 'charge')) return false;
  const [gx, gy] = guardFrom(e, a, h), gl = Math.hypot(gx, gy) || 1;
  return roundGuard(h) || (h.fx * gx + h.fy * gy) / gl > Math.cos(((guardArc(h) / 2) * Math.PI) / 180);
}

/** A boss's blow covering `h`: put off for its grace (true), or judged now as any (false). */
export function graceDefer(e: Enemy, a: EnemyAttack, h: Hero, _heroes: Hero[], now: number): boolean {
  if (!a.boss || !BOSS_FLAGS.grace) return false;
  const lag = lagOf(h), g = GRACE.window;
  if (lag <= 0 && savedNow(e, a, h, now)) return false;
  return putOff(e, a, h, now, Math.min(lag + g, Math.max(LAGCOMP.cap, g)), g);
}

/** Saved by a press inside the grace: a dodge begun, or a guard raised (and not yet down), after the blow and up to `g` late. */
function lateSave(p: LateBlow, h: Hero, rollAt: number | undefined, guardUp: number | undefined, guardDown: number | undefined): Verdict | null {
  const g = p.grace ?? 0, w = WEAPONS[h.weapon], inside = (t: number | undefined) => t !== undefined && t > p.at - E && t <= p.at + g + E;
  if (CLASS_DODGES[w.cls] && inside(rollAt)) return 'out';
  if (guardOf(w) === 'full' && h.stamina > 0 && !h.winded && inside(guardUp) && (guardDown === undefined || guardDown > guardUp!)) return 'block';
  return null;
}

/**
 * A boss's blow on the list: its verdict once it can't change, else null (wait). `vt`: the latest word
 * from their screen (a friend's), none for the leader's own hero (judged by the room's clock).
 */
export function graceVerdict(p: LateBlow, h: Hero, vt: number | undefined, now: number): Verdict | null {
  const due = now >= p.due - E;
  if (lagOf(h) > 0 && vt !== undefined) {
    const base = judge(p, h);
    if (base !== 'land') return base;
    const late = lateSave(p, h, h.rollVt, h.guardVt, h.guardOffVt);
    if (late) return late;
    return vt >= p.at + (p.grace ?? 0) - E || due ? 'land' : null;
  }
  const late = lateSave(p, h, h.act === 'roll' ? h.lastRollAt : undefined, h.blocking ? h.blockUpAt : undefined, undefined);
  return late ?? (due ? 'land' : null);
}
