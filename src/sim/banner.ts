/**
 * The banner-bearer (numbers: shared/raiders.ts BANNER). Once a tick, before anyone moves, every goblin
 * near a standing banner takes heart: harder blows, quicker to them, and it won't run. When a banner
 * falls, the goblins near it rout: they run from the nearest hero for BANNER.rout.time, striking
 * nothing, and blows on them land harder. The bearer itself hangs behind its pack, out of reach.
 */
import { BANNER, SCRAPPER } from '../shared/tuning';
import { frozen, isDead, snared } from './damage';
import { begin, walk } from './enemies';
import type { Enemy, FightEvent, Hero } from './types';

const goblin = (e: Enemy) => (e.kind === 'scrapper' && e.variant !== 'wolf') || e.kind === 'butcher';
/** A banner still held up: alive, on its feet, not running from a rout of its own, not held fast. */
const standing = (b: Enemy, now: number) => b.variant === 'banner' && !isDead(b) && b.alert !== false && b.act !== 'stunned' && !frozen(b, now) && !snared(b, now);
export const routed = (e: Enemy, now: number) => (e.routUntil ?? -9) > now;

/** Who takes heart this tick; and any banner just fallen routs the goblins near it. */
export function hearten(enemies: Enemy[], now: number, ev: FightEvent[]): void {
  const up = enemies.filter((b) => standing(b, now));
  for (const e of enemies) e.heart = goblin(e) && e.variant !== 'banner' && !isDead(e) && up.some((b) => (b.z ?? 0) === (e.z ?? 0) && Math.hypot(b.x - e.x, b.y - e.y) <= BANNER.radius) ? true : undefined;
  for (const b of enemies) {
    if (b.variant !== 'banner' || !isDead(b) || b.spent) continue;
    b.spent = true;
    ev.push({ k: 'bannerfall', x: b.x, y: b.y });
    for (const e of enemies) {
      if (e === b || isDead(e) || !goblin(e) || e.heart || e.name || Math.hypot(e.x - b.x, e.y - b.y) > BANNER.rout.radius) continue;
      Object.assign(e, { routUntil: now + BANNER.rout.time, attack: null, act: 'chase', alert: true });
      ev.push({ k: 'routed', x: e.x, y: e.y });
    }
  }
}

/** A routed goblin's turn: away from the nearest hero, a little to the side. True while it runs. */
export function stepRouted(e: Enemy, heroes: Hero[], now: number, dt: number): boolean {
  if (!routed(e, now)) return false;
  const t = heroes.filter((h) => h.act !== 'down').sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y))[0];
  if (!t) return true;
  const dx = e.x - t.x, dy = e.y - t.y, l = Math.hypot(dx, dy) || 1, side = e.id % 2 ? 0.5 : -0.5;
  (e.fx = dx / l), (e.fy = dy / l);
  walk(e, dx / l - (dy / l) * side, dy / l + (dx / l) * side, SCRAPPER.speed * BANNER.rout.pace, dt);
  return true;
}

/**
 * The bearer's turn (like a drummer's): cornered, a jab with the pole's butt; too close, it runs;
 * otherwise it keeps `behind` its pack (the goblins awake near it), the banner up.
 */
export function stepBanner(e: Enemy, t: Hero, d: number, ux: number, uy: number, facing: number, speed: number, others: Enemy[], now: number, dt: number, ev: FightEvent[]): void {
  if (d <= BANNER.poke.range! && e.cooldown <= 0 && facing > 0.75) return begin(e, 'stab', BANNER.poke, t, ev);
  if (d < BANNER.keep) {
    const side = Math.sin(now * 0.7 + e.id) > 0 ? 1 : -1;
    return walk(e, -ux - uy * side * 0.6, -uy + ux * side * 0.6, speed * BANNER.flee, dt);
  }
  let px = 0, py = 0, n = 0;
  for (const o of others) {
    if (o === e || isDead(o) || o.alert === false || !goblin(o) || o.bow || (o.z ?? 0) !== (e.z ?? 0) || Math.hypot(o.x - e.x, o.y - e.y) > BANNER.radius * 2) continue;
    (px += o.x), (py += o.y), n++;
  }
  const gx = n ? px / n - ux * BANNER.behind : t.x - ux * (BANNER.keep + 2), gy = n ? py / n - uy * BANNER.behind : t.y - uy * (BANNER.keep + 2);
  const gd = Math.hypot(gx - e.x, gy - e.y);
  if (gd > 0.8) walk(e, gx - e.x, gy - e.y, speed * Math.min(1, gd / 2), dt);
}
