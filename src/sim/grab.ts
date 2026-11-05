/**
 * Grab, slam, throw. A Warrior picks up any small goblin in reach. A spellblade Mage only one it's earned (nobody else grabs goblins): stunned, netted, frozen,
 * staggered, busy (feeding, swinging at someone else, or just after a swing), or one you've got behind. Overhead, ATTACK slams it into the ground (a kill pounds its
 * head in); GRAB again throws it, and it hits whatever it flies into. It wriggles free in time.
 */
import { collide } from '../shared/arena';
import { GRAB, GUARD, HERO, WEAPONS } from '../shared/tuning';
import { slamBurst } from './techwarrior';
import { damage, frozen, isDead, snared } from './damage';
import type { Enemy, FightEvent, Hero, Intent } from './types';
import { stun } from './stuns';

/** Can this hero grab this goblin now? */
export function grabbable(h: Hero, e: Enemy, now: number): boolean {
  if (isDead(e) || e.weight > 1 || e.act === 'carried' || e.act === 'pinned' || (e.z ?? 0) !== (h.z ?? 0)) return false;
  const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy);
  if (d > GRAB.reach + e.radius) return false;
  // A Warrior just picks a small one up, front or back, whatever it's doing (Kyle, 2026-11-04).
  if (WEAPONS[h.weapon].cls === 'WARRIOR') return true;
  // Only a Warrior and a Mage with the spellblade (the battle mage) grab goblins at all (Kyle, 2026-11-04);
  // the spellblade only one it has earned. Anyone can still lift a crate or barrel (sim/lift).
  if (h.weapon !== 'spellblade') return false;
  const behind = (e.fx * -dx + e.fy * -dy) / (d || 1) < GUARD.rearCos;
  // Busy: feeding, swinging at someone else, or caught at the end of a swing that missed.
  const a = e.attack, busy = e.feeding || (!!a && (a.aimed !== h.id || a.t > a.windup + a.active));
  return e.act === 'stunned' || e.act === 'flinch' || frozen(e, now) || snared(e, now) || behind || busy;
}

/** Lift the nearest grabbable goblin overhead; false if there is none. */
export function tryGrab(h: Hero, enemies: Enemy[], now: number, ev: FightEvent[]): boolean {
  let best: Enemy | null = null, bd = Infinity;
  for (const e of enemies) {
    const d = Math.hypot(e.x - h.x, e.y - h.y);
    if (d < bd && grabbable(h, e, now)) (bd = d), (best = e);
  }
  if (!best) return false;
  Object.assign(best, { act: 'carried', attack: null, kvx: 0, kvy: 0, snareUntil: 0, lastBy: h.id });
  Object.assign(h, { act: 'carry', actT: 0, carrying: best.id, grabQueuedAt: -9 });
  ev.push({ k: 'grab', x: best.x, y: best.y });
  return true;
}

/** Put the carried goblin down (dropped, wriggled free, or the carrier was hit). */
export function release(h: Hero, enemies: Enemy[], ev?: FightEvent[]): void {
  const e = enemies.find((x) => x.id === h.carrying);
  h.carrying = 0;
  if (!e || e.act !== 'carried') return;
  e.x = h.x + h.fx * 0.7;
  e.y = h.y + h.fy * 0.7;
  collide(e, e.radius);
  Object.assign(e, { act: 'flinch', actT: 0, actDur: 0.4 });
  ev?.push({ k: 'wriggle', x: e.x, y: e.y });
}

/** A hero carrying (or slamming) a goblin, each tick. */
export function stepCarry(h: Hero, inp: Intent, enemies: Enemy[], now: number, dt: number, ev: FightEvent[], walk: (k: number) => void): void {
  const e = enemies.find((x) => x.id === h.carrying);
  if (!e || e.act !== 'carried') return void Object.assign(h, { act: 'idle', actT: 0, carrying: 0 });
  if (h.act === 'slam') {
    e.x = h.x;
    e.y = h.y;
    if (h.actT < GRAB.slamWindup) return;
    if (h.actT - dt < GRAB.slamWindup) {
      // Down it goes, face first, in front of you.
      e.x = h.x + h.fx * 0.8;
      e.y = h.y + h.fy * 0.8;
      collide(e, e.radius);
      e.act = 'flinch';
      h.carrying = 0;
      ev.push({ k: 'slam', x: e.x, y: e.y });
      if (!damage(e, GRAB.slamDmg, now, ev, { heavy: true, how: 'burst', dx: 0, dy: 1 })) stun(e, h.id, now, GRAB.slamStun, ev) || Object.assign(e, { actT: 0, actDur: 0.3 });
      // SLAM: the small ones right beside it burst (sim/techwarrior.ts).
      slamBurst(h, e, enemies, now, ev);
    }
    return;
  }
  walk(GRAB.carrySpeed);
  collide(h, HERO.radius);
  e.x = h.x;
  e.y = h.y;
  if (now - h.attackQueuedAt < 0.25) {
    Object.assign(h, { act: 'slam', actT: 0, attackQueuedAt: -9 });
    return;
  }
  if (now - h.grabQueuedAt < 0.25) {
    // Thrown along your facing: it flies, and whatever it hits gets hurt.
    h.grabQueuedAt = -9;
    h.carrying = 0;
    e.x = h.x + h.fx * 0.6;
    e.y = h.y + h.fy * 0.6;
    collide(e, e.radius);
    Object.assign(e, { act: 'flinch', actT: 0, actDur: 0.9, kvx: h.fx * GRAB.throwSpeed, kvy: h.fy * GRAB.throwSpeed, air: GRAB.air, lastBy: h.id });
    Object.assign(h, { act: 'idle', actT: 0 });
    ev.push({ k: 'hurl', x: e.x, y: e.y });
    return;
  }
  if (h.actT >= GRAB.hold) {
    release(h, enemies, ev);
    Object.assign(h, { act: 'idle', actT: 0 });
  }
}
