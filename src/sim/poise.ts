/**
 * POISE and BRACED (numbers shared/bosstune.ts POISE_KIT, BRACED_KIT, BOSS_FLAGS). A boss shrugs off the
 * ordinary stuns (sim/stuns.ts asks `immune`); instead charged blows, perfects, ambushes, backstabs, a
 * last-second dodge through its blow and BRACED fill its POISE bar, and full, it's STAGGERED for
 * POISE_KIT.stagger seconds: the party's shared payoff (its door swung aside, held fast, taking the
 * stunned bonus). A relic's stun lands in full and fills half the bar. BRACED: a held block of a boss's
 * red blow rebounds it (untimed) and fills the bar; the blocker isn't shoved (by BOSS_FLAGS.braced).
 */
import { BOSS_FLAGS, BRACED_KIT, POISE_KIT } from '../shared/tuning';
import { shove } from './bodies';
import { isDead } from './damage';
import type { Enemy, EnemyAttack, FightEvent, Hero } from './types';

export type PoiseBy = keyof typeof POISE_KIT.fill | 'relic';

/** A boss can't have its turn taken by an ordinary stun. */
export const immune = (e: Enemy) => !!e.boss;

/** A boss's own stun (a charge into a stack, BRACED's rebound, the stagger): set here, never capped. */
export function bossStun(e: Enemy, time: number): void {
  Object.assign(e, { attack: null, act: 'stunned', actT: 0, actDur: time, kvx: 0, kvy: 0 });
}

/** Fill its POISE; full, STAGGERED. Nothing fills while it's staggered or roaring, nor from slipping a jab. */
export function addPoise(e: Enemy, by: PoiseBy, now: number, ev: FightEvent[]): void {
  const b = e.boss;
  if (!b || isDead(e) || b.stagUntil > now || b.roarUntil > now) return;
  // (A last-second dodge through a Doorkeeper's jab fills nothing, as a held block of one doesn't: it's the big blows that pay.)
  if (by === 'slip' && e.attack?.boss === 'jab') return;
  b.poise = Math.min(b.poiseMax, b.poise + (by === 'relic' ? Math.round(b.poiseMax * POISE_KIT.relic) : POISE_KIT.fill[by]));
  if (b.poise >= b.poiseMax) stagger(e, now, ev);
}

/** STAGGERED: held fast, its door aside, the bar empty again. */
export function stagger(e: Enemy, now: number, ev: FightEvent[]): void {
  const b = e.boss!;
  b.poise = 0;
  b.stagUntil = now + POISE_KIT.stagger;
  bossStun(e, POISE_KIT.stagger);
  ev.push({ k: 'staggered', x: e.x, y: e.y });
}

/** A hero's blade landed on it (door or not): what in it fills the bar. */
export function poiseFromBlow(e: Enemy, h: Hero, rear: boolean, ambush: boolean, now: number, ev: FightEvent[]): void {
  if (!e.boss) return;
  if (h.heavy && h.power >= 0.7) addPoise(e, 'charged', now, ev);
  if (h.perfect) addPoise(e, 'perfect', now, ev);
  if (ambush) addPoise(e, 'ambush', now, ev);
  if (rear) addPoise(e, 'backstab', now, ev);
}

/** Is a blocker braced against this blow (not shoved back)? By BOSS_FLAGS.braced. */
export const bracedFor = (a: EnemyAttack) => BOSS_FLAGS.braced === 'all' || (BOSS_FLAGS.braced === 'boss' && !!a.boss);

/**
 * BRACED: a boss's red blow met by a held block. It rebounds (its blow lost, staggered back a beat) and
 * fills its POISE. True if it did (BOSS_FLAGS.braced off: never). A Doorkeeper's jab is too quick and light to
 * rebound: it's simply blocked.
 */
export function rebound(e: Enemy, a: EnemyAttack, h: Hero, now: number, ev: FightEvent[]): boolean {
  if (!e.boss || !a.boss || a.unblockable || a.boss === 'jab' || BOSS_FLAGS.braced === 'off' || isDead(e)) return false;
  const dx = e.x - h.x, dy = e.y - h.y, l = Math.hypot(dx, dy) || 1;
  bossStun(e, BRACED_KIT.rebound);
  shove(e, dx / l, dy / l, BRACED_KIT.knock, e.weight);
  ev.push({ k: 'rebound', x: h.x, y: h.y });
  addPoise(e, 'braced', now, ev);
  return true;
}
