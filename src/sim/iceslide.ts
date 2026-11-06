/**
 * A frozen small goblin is a set-up for a heavy hit (Kyle, 2026-11-05; numbers: shared/magic.ts FLING).
 * The greatsword's blows, a mace's (the smite too), the staff's taps, any charged melee blow and a
 * Warrior's throw send it skidding away on its ice, low and fast. While it slides it's a missile: the
 * first wall, prop, goblin or hero it meets, it crashes into and shatters, hurting and chilling the
 * goblins round it and knocking down the one it ploughed into. Slid its whole length, it shatters
 * there for less. Heroes and the freed take nothing from it: where it goes is set by where it stood,
 * not aimed, so a friend in the way is never the thrower's fault. Judged here, so a guest sees the
 * same slide and crash.
 */
import { travel } from '../shared/sweep';
import { FLING, HERO, ICE, TICK, HITSTOP, type Swing, type WeaponId } from '../shared/tuning';
import { iceUnder } from './ice';
import { shove } from './bodies';
import { damage, frozen, isDead, isDummy, kill } from './damage';
import { chill, shatter, type World } from './elements';
import { blastProps } from './props';
import { daze } from './venom';
import type { Enemy, FightEvent, Hero } from './types';

/** Kits whose every melee blow sends one skidding: the greatsword, the mace, and the staff's taps. */
const SMASHERS: Partial<Record<WeaponId, true>> = { greatsword: true, mace: true, staff: true };

/** A hero's melee blow that sends a frozen small goblin skidding (quick blows from light kits only chip it). */
export const heavyHit = (h: Hero, s: Swing) => !s.shot && !s.spell && (!!SMASHERS[h.weapon] || h.heavy);
/** A charged one (held most of the way) skids it quicker and further. */
export const hardHit = (h: Hero) => h.heavy && h.power >= 0.7;

/** Can this one be sent skidding? Frozen, small, standing free (never a dummy, a named one or a nest). */
export const flingable = (e: Enemy, now: number) =>
  frozen(e, now) && e.weight <= 1 && !isDead(e) && e.act !== 'carried' && e.act !== 'pinned' && !isDummy(e) && !e.name && e.kind !== 'nest';

/** Send it skidding along (dx, dy) for `by`; false if it can't be. It stays frozen till it stops. */
export function fling(e: Enemy, by: string, dx: number, dy: number, hard: boolean, now: number, ev: FightEvent[]): boolean {
  if (!flingable(e, now)) return false;
  const d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
  const v = hard ? FLING.hardSpeed : FLING.speed, len = hard ? FLING.hardLen : FLING.len, decel = (v * v) / (2 * len);
  e.sled = { by, vx: ux * v, vy: uy * v, decel, hard };
  Object.assign(e, { kvx: 0, kvy: 0, air: 0, attack: null, lastBy: by });
  // (Frozen for the whole slide and the hitstop before it, so it never thaws mid-flight.)
  e.frozenUntil = Math.max(e.frozenUntil, now + v / decel + HITSTOP.parry + 0.2);
  ev.push({ k: 'fling', x: e.x, y: e.y, dx: ux, dy: uy, r: len, big: hard });
  return true;
}

/** Closing on `o` along the slide (not already past it), and touching. */
function meets(e: Enemy, o: { x: number; y: number }, r: number, vx: number, vy: number): boolean {
  const dx = o.x - e.x, dy = o.y - e.y;
  return Math.hypot(dx, dy) <= e.radius + r + 0.05 && dx * vx + dy * vy > 0;
}

/** Every skidding goblin, a tick: moved, slowed, and crashed into whatever it meets. */
export function stepSleds(w: World, dt = TICK): void {
  for (const e of w.enemies) {
    const s = e.sled;
    if (!s) continue;
    // Killed, picked up, or thawed (steam) on the way: it just stops.
    if (isDead(e) || e.act === 'carried' || !frozen(e, w.now)) {
      e.sled = null;
      continue;
    }
    // Held in the blow's hitstop, then away.
    if (e.hitstop > 0) continue;
    const sp = Math.hypot(s.vx, s.vy), ux = s.vx / sp, uy = s.vy / sp, z = e.z ?? 0;
    const x0 = e.x, y0 = e.y, want = sp * dt;
    travel(e, s.vx * dt, s.vy * dt, e.radius);
    if (Math.hypot(e.x - x0, e.y - y0) < want * 0.5) {
      w.ev.push({ k: 'wallhit', x: e.x, y: e.y });
      crash(w, e, ux, uy);
      continue;
    }
    const foe = w.enemies.find((o) => o !== e && !isDead(o) && o.act !== 'carried' && (o.z ?? 0) === z && meets(e, o, o.radius, ux, uy));
    const prop = !foe && w.props.some((p) => !p.broken && !p.lifted && meets(e, p, p.radius, ux, uy));
    const hero = !foe && !prop && w.heroes.some((h) => h.act !== 'down' && (h.z ?? 0) === z && meets(e, h, HERO.radius, ux, uy));
    if (foe || prop || hero) {
      crash(w, e, ux, uy, foe);
      continue;
    }
    // Ice: it slows evenly, and at the end of its run it shatters where it stops.
    // Over iced shallows it slows ICE.slip as fast, so it goes further (sim/ice.ts).
    const next = sp - s.decel * (w.fx && iceUnder(w.fx.ices, e.x, e.y, w.now) ? ICE.slip : 1) * dt;
    if (next <= 0.05) {
      burst(w, e, ux, uy, FLING.endR, FLING.endDmg, false);
      continue;
    }
    s.vx = ux * next;
    s.vy = uy * next;
  }
}

/** Into something: a big crack, and what it hit and what's round it hurt. */
function crash(w: World, e: Enemy, ux: number, uy: number, foe?: Enemy): void {
  burst(w, e, ux, uy, FLING.r, FLING.dmg, true, foe);
}

/** It shatters (dies) at (e.x, e.y): goblins within `r` take `n` and are chilled; the one it ploughed into,
 *  more, knocked down and shoved on; props in reach are hit and thrown. */
function burst(w: World, e: Enemy, ux: number, uy: number, r: number, n: number, big: boolean, foe?: Enemy): void {
  const by = e.sled?.by ?? e.lastBy, { now, ev } = w, x = e.x, y = e.y;
  e.sled = null;
  e.frozenUntil = 0;
  e.lastBy = by;
  // (Its death is this blow's: a goblin never hit before isn't taken for one dying alight.)
  e.hitAt = now;
  ev.push({ k: 'icecrash', x, y, dx: ux, dy: uy, r, big });
  ev.push({ k: 'shatter', x, y });
  kill(e, ev, 'shatter', ux, uy);
  for (const o of w.enemies) {
    if (o === e || isDead(o) || o.act === 'carried' || (o.z ?? 0) !== (e.z ?? 0) || Math.hypot(o.x - x, o.y - y) > r + o.radius) continue;
    const ice = frozen(o, now), hit = o === foe, d = Math.hypot(o.x - x, o.y - y) || 1;
    o.lastBy = by;
    if (damage(o, hit ? FLING.plough : n, now, ev, { heavy: true, how: 'burst', dx: ux, dy: uy, el: 'frost', src: 'frost' })) continue;
    // Another frozen one beside it breaks too.
    if (ice) {
      shatter(o, now, ev);
      continue;
    }
    if (hit) {
      // Knocked flat (once a while per hero: the stun cap) and shoved on along the slide.
      daze(o, o.weight <= 1 ? FLING.down : FLING.downBig, by, now, ev);
      o.hitstop = Math.max(o.hitstop, HITSTOP.heavy);
      if (o.act !== 'pinned') shove(o, ux, uy, FLING.knock, o.weight);
    } else if (o.act !== 'pinned') shove(o, (o.x - x) / d, (o.y - y) / d, FLING.knock * 0.5, o.weight);
    if (!isDead(o)) chill(w, o);
  }
  blastProps(x, y, r, big ? FLING.propDmg : Math.round(FLING.propDmg / 2), FLING.knock, w);
}
