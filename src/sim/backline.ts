/**
 * The back of the pack in a fight (numbers in shared/backline.ts): the hexer keeps its distance and
 * calls the ground up under you; the drummer hangs behind its pack and beats a drum that rouses every
 * goblin near it. Both are fragile and run from a blade. Wind-ups, cooldowns and the end of an attack
 * are the ordinary goblin's (sim/enemies.ts); this is how they move and when they act.
 */
import { DRUMMER, FRIENDLY, HEXER } from '../shared/tuning';
import { attackCovers } from './combat';
import { damage, frozen, isDead, snared } from './damage';
import { begin, walk } from './enemies';
import type { Enemy, EnemyAttack, FightEvent, Hero } from './types';

export const isBackline = (e: { variant?: string }) => e.variant === 'hexer' || e.variant === 'drummer';

/**
 * Once a tick, before anyone moves: who is roused. A drummer drums while it is awake, on its feet and
 * not running (its own step says so); every other goblin on its level within DRUMMER.radius is roused.
 * Killed, stunned, frozen or netted, the drum stops on the next tick.
 */
export function rouse(enemies: Enemy[], now: number): void {
  let any = false;
  for (const d of enemies) if (d.drumming && (isDead(d) || d.act !== 'chase' || frozen(d, now) || snared(d, now))) d.drumming = false;
  for (const d of enemies) any ||= !!d.drumming;
  for (const e of enemies) {
    if (!any) {
      if (e.roused) e.roused = false;
      continue;
    }
    e.roused = !isDead(e) && (e.kind === 'scrapper' || e.kind === 'butcher') && enemies.some((d) => d !== e && d.drumming && (d.z ?? 0) === (e.z ?? 0) && Math.hypot(d.x - e.x, d.y - e.y) <= DRUMMER.radius);
  }
}

/**
 * A hexer's or drummer's turn, once it faces its way (`ux`, `uy` toward `t`, or toward the ramp it's
 * making for when `via`). `speed`: its pace this tick, chill and nets and drums already in it.
 */
export function stepBackline(e: Enemy, t: Hero, d: number, via: boolean, ux: number, uy: number, facing: number, speed: number, others: Enemy[], now: number, dt: number, ev: FightEvent[]): void {
  e.drumming = false;
  if (via) return walk(e, ux, uy, speed * Math.max(0.2, facing), dt);
  if (e.variant === 'hexer') {
    // Ready, in reach and facing you: the circle goes down where you stand.
    if (e.cooldown <= 0 && d <= HEXER.reach && facing > 0.85) return hexAt(e, t, ev);
    if (d < HEXER.keep) return away(e, ux, uy, speed * HEXER.flee, now, dt);
    if (d > HEXER.reach * 0.9) walk(e, ux, uy, speed * Math.max(0.2, facing), dt);
    return;
  }
  // The drummer: cornered (you're on it), a poke with the stick; too close, it runs and the drum stops.
  if (d <= DRUMMER.poke.range! && e.cooldown <= 0 && facing > 0.75) return begin(e, 'stab', DRUMMER.poke, t, ev);
  if (d < DRUMMER.keep) return away(e, ux, uy, speed * DRUMMER.flee, now, dt);
  e.drumming = true;
  // Otherwise it keeps a little behind its pack (the goblins awake near it), drumming as it goes.
  let px = 0, py = 0, n = 0;
  for (const o of others) {
    if (o === e || isDead(o) || o.alert === false || isBackline(o) || o.bow || (o.z ?? 0) !== (e.z ?? 0)) continue;
    if (Math.hypot(o.x - e.x, o.y - e.y) > DRUMMER.radius * 2) continue;
    (px += o.x), (py += o.y), n++;
  }
  const gx = n ? px / n - ux * DRUMMER.behind : t.x - ux * (DRUMMER.keep + 1.5), gy = n ? py / n - uy * DRUMMER.behind : t.y - uy * (DRUMMER.keep + 1.5);
  const gd = Math.hypot(gx - e.x, gy - e.y);
  if (gd > 0.8) walk(e, gx - e.x, gy - e.y, speed * Math.min(1, gd / 2), dt);
}

/** Away from you and a little to the side, so it doesn't back itself into a corner. */
function away(e: Enemy, ux: number, uy: number, speed: number, now: number, dt: number): void {
  const side = Math.sin(now * 0.7 + e.id) > 0 ? 1 : -1;
  walk(e, -ux - uy * side * 0.6, -uy + ux * side * 0.6, speed, dt);
}

/** The hex: the circle is put down on the hero it's aimed at, and stays there however they move. */
function hexAt(e: Enemy, t: Hero, ev: FightEvent[]): void {
  begin(e, 'hex', HEXER.hex, t, ev);
  if (e.attack) (e.attack.cx = t.x), (e.attack.cy = t.y);
}

/** The hex bursts: any small goblin in it but the hexer takes FRIENDLY.blow of it. */
export function hexFriendly(e: Enemy, a: EnemyAttack, others: Enemy[], now: number, ev: FightEvent[]): void {
  for (const o of others) {
    if (o === e || isDead(o) || o.kind !== 'scrapper' || (o.z ?? 0) !== (e.z ?? 0)) continue;
    if (attackCovers(a, o as unknown as Hero)) damage(o, Math.round(a.dmg * FRIENDLY.blow), now, ev, { heavy: true, how: 'burst', src: 'hex' });
  }
}
