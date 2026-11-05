/**
 * The Ranger's perfect shots, in the room (numbers: shared/ranger.ts). A longbow arrow loosed on the
 * white flash is a sure crit and blinds what it strikes: the goblin drops its blow, can't pick out a
 * hero, and blunders about until it can see again. A shortbow's perfect arrow strikes clean (it shows).
 * A crossbow bolt runs through a few goblins and shoves them; a glinted one hits harder, shoves harder
 * and runs through the whole line. All judged here, so a guest's goblins go blind as the leader's do.
 */
import { collide, wadeAt } from '../shared/arena';
import { BLIND, XBOW, type Swing } from '../shared/tuning';
import { isDead } from './damage';
import type { Bolt, Enemy, FightEvent, Hero } from './types';
import { mayStun } from './stuns';

/** Mark a loosed arrow or bolt with what its kit and the release make of it. */
export function markShot(h: Hero, s: Swing, b: Bolt): void {
  const perfect = h.heavy && h.perfect;
  if (perfect && (s.shot === 'arrow' || s.shot === 'bolt')) b.perfect = true;
  if (perfect && s.blinds) b.blind = true;
  if (s.shot !== 'bolt' || !s.pierce) return;
  if (!perfect) return void (b.pierceLeft = XBOW.pierce);
  b.dmg = Math.round(b.dmg * XBOW.glint);
  b.knock *= XBOW.shove;
}

/** Has this bolt run through all it may? */
export const spent = (b: Bolt) => !b.pierce || (b.pierceLeft !== undefined && b.hit.length >= b.pierceLeft);

/** After a perfect shot strikes `e` (still standing or not): blind it, show the line or the clean hit. */
export function perfectStrike(b: Bolt, e: Enemy, now: number, ev: FightEvent[]): void {
  if (!b.perfect) return;
  if (b.kind === 'bolt') return void ev.push({ k: 'boltline', x: b.sx, y: b.sy, x2: e.x, y2: e.y });
  if (b.blind && e.variant !== 'blind') return blind(e, b.owner, now, ev);
  ev.push({ k: 'trueshot', x: e.x, y: e.y });
}

export const blinded = (e: Enemy, now: number) => (e.blindUntil ?? -9) > now;

/** Blinded by hero `by`: it drops whatever blow it had going and can't see a hero for a while (not twice
 *  running from the same hero: sim/stuns.ts). */
export function blind(e: Enemy, by: string, now: number, ev: FightEvent[]): void {
  if (isDead(e) || e.kind === 'nest' || e.act === 'carried' || !mayStun(e, by, now, ev)) return;
  e.blindUntil = now + BLIND.time * (e.kind === 'butcher' ? BLIND.big : 1);
  e.attack = null;
  if (e.act === 'attack') Object.assign(e, { act: 'chase', actT: 0 });
  ev.push({ k: 'blinded', x: e.x, y: e.y });
}

/** A blinded goblin's tick: it gropes about, turning this way and that, and goes for nobody. */
export function stumble(e: Enemy, speed: number, now: number, dt: number): void {
  const k = Math.floor(now / BLIND.turn), a = Math.sin(k * 2.3 + e.id * 1.7) * Math.PI, v = speed * BLIND.pace * wadeAt(e.x, e.y) * dt;
  e.fx = Math.cos(a);
  e.fy = Math.sin(a);
  e.x += e.fx * v;
  e.y += e.fy * v;
  e.moving = true;
  collide(e, e.radius);
}
