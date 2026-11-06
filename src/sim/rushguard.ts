/**
 * A pack rush (sim/packrush.ts) as each goblin in it and the hero it's on see it: walking to its place
 * in the fan, the one clock every blow of it keeps (so they all land in the same instant, whatever
 * hitstop or frost does to one of them), and the hero's one guard answering every blow: judged from the
 * fan's middle, one block taking them all for one blow's stamina.
 */
import { SCRAPPER, VARIANTS, IRONHIDE } from '../shared/tuning';
import { walk } from './enemies';
import type { Enemy, EnemyAttack, Hero } from './types';

/** Where a guard must face to meet this blow: the fan's middle for a rush's, else the goblin itself. */
export function guardFrom(e: Enemy, a: EnemyAttack, h: Hero): [number, number] {
  return a.rush !== undefined && a.rcx !== undefined && a.rcy !== undefined ? [a.rcx - h.x, a.rcy - h.y] : [e.x - h.x, e.y - h.y];
}

/** Blocked another blow of this rush this instant: this one is taken by the same block, for nothing. */
export function rushBlocked(h: Hero, a: EnemyAttack, now: number): boolean {
  if (a.rush === undefined || h.rushGuard?.id !== a.rush || h.rushGuard.at !== now) return false;
  h.rushGuard.n++;
  return true;
}

/** Note a rush's blow met by this hero's guard. */
export function noteRush(h: Hero, a: EnemyAttack, now: number): void {
  if (a.rush === undefined) return;
  if (h.rushGuard?.id === a.rush && h.rushGuard.at === now) h.rushGuard.n++;
  else h.rushGuard = { id: a.rush, at: now, n: 1 };
}

/** A rush's blow keeps the room's clock: it lands at `land` exactly, alongside the rest. Else null. */
export const rushClock = (a: EnemyAttack, now: number): number | null => (a.land === undefined ? null : Math.max(0, a.windup - (a.land - now)) + 1e-6);

/** A rush's wind-up runs on through hitstop (a quick blow doesn't put it out of step with the others). */
export const rushLocked = (e: Enemy) => !!e.attack && e.attack.land !== undefined && e.attack.t < e.attack.windup;

/** Called into a rush: walk to its place in the fan, facing the hero. True while it is (nothing else this turn). */
export function gather(e: Enemy, slow: number, dt: number): boolean {
  const to = e.rushTo;
  if (!to || e.act !== 'chase') return false;
  const dx = to.x - e.x, dy = to.y - e.y, d = Math.hypot(dx, dy);
  const pace = e.variant === 'heavy' ? VARIANTS.heavy.speed : e.variant === 'ironhide' ? IRONHIDE.speed : 1;
  if (d > 0.08) walk(e, dx, dy, Math.min(SCRAPPER.speed * pace * slow, d / dt), dt);
  const hx = to.hx - e.x, hy = to.hy - e.y, hl = Math.hypot(hx, hy) || 1;
  (e.fx = hx / hl), (e.fy = hy / hl);
  return true;
}
