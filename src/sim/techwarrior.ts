/**
 * The Warrior's techniques in the room (numbers: shared/techniques.ts). SLAM: a goblin slammed into
 * the floor bursts the small ones right beside it. SHOULDER CHARGE: a second of walking one way readies
 * it, and the next blow knocks down the first goblin it hits. IRON FEET: while an attack is held,
 * blows land but don't shove or stagger (combat.ts asks `rooted`).
 */
import { OVERKILL } from '../shared/tuning';
import { SHOULDER, SLAM_BURST, knowsTech } from '../shared/techniques';
import { shove } from './bodies';
import { damage, held, isDead, small } from './damage';
import { daze } from './venom';
import type { Enemy, FightEvent, Hero } from './types';

/** SLAM: after `e` is slammed down, the small goblins right next to it burst. */
export function slamBurst(h: Hero, e: Enemy, enemies: Enemy[], now: number, ev: FightEvent[]): void {
  if (!knowsTech(h, 'slam')) return;
  let n = 0;
  for (const o of enemies) {
    if (n >= SLAM_BURST.most) break;
    if (o === e || isDead(o) || !small(o) || o.act === 'carried' || (o.z ?? 0) !== (e.z ?? 0)) continue;
    const dx = o.x - e.x, dy = o.y - e.y;
    if (Math.hypot(dx, dy) > SLAM_BURST.reach + o.radius) continue;
    o.lastBy = h.id;
    damage(o, Math.max(1, o.hp) + OVERKILL, now, ev, { heavy: true, how: 'burst', dx, dy });
    n++;
  }
  if (n) ev.push({ k: 'slamburst', x: e.x, y: e.y });
}

/** SHOULDER CHARGE: a tick of walking along (mx, my) at `m` of a full push. Ready once it's gone on
 *  long enough one way (said once, with a kick of dust). */
export function stride(h: Hero, mx: number, my: number, m: number, dt: number, now: number, ev: FightEvent[]): void {
  if (!knowsTech(h, 'shoulder')) return;
  const was = h.strideT ?? 0, same = was > 0 && now - (h.strideAt ?? -9) <= dt * 1.5 && mx * (h.strideX ?? 0) + my * (h.strideY ?? 0) >= Math.cos(SHOULDER.turn);
  if (m < SHOULDER.pace || !same) Object.assign(h, { strideT: m < SHOULDER.pace ? 0 : dt, strideX: mx, strideY: my });
  else h.strideT = was + dt;
  h.strideAt = now;
  if (was < SHOULDER.walk && h.strideT! >= SHOULDER.walk) ev.push({ k: 'shoulderready', x: h.x, y: h.y });
}

/** A swing starts: it carries the shoulder if the walk was long enough and has only just stopped. */
export function primeShoulder(h: Hero, now: number): void {
  h.shoulder = (h.strideT ?? 0) >= SHOULDER.walk && now - (h.strideAt ?? -9) <= SHOULDER.grace && knowsTech(h, 'shoulder');
  h.strideT = 0;
}

/** The swing's first hit takes the shoulder with it, whatever happens to that goblin. */
export function takeShoulder(h: Hero): boolean {
  const s = !!h.shoulder;
  h.shoulder = false;
  return s;
}

/** Knocked down by the shoulder: off its feet (a butcher half as long), shoved on. False if it shrugged it off. */
export function knockDown(h: Hero, e: Enemy, now: number, ev: FightEvent[]): boolean {
  if (isDead(e) || held(e, now)) return false;
  if (!daze(e, SHOULDER.down * (e.kind === 'butcher' ? SHOULDER.big : 1), h.id, now, ev)) return false;
  shove(e, h.fx, h.fy, SHOULDER.knock, e.weight);
  ev.push({ k: 'shoulder', x: e.x, y: e.y });
  return true;
}

/** IRON FEET: holding an attack, nothing knocks this Warrior back or staggers them. */
export const rooted = (h: Hero) => h.act === 'charge' && knowsTech(h, 'ironfeet');
