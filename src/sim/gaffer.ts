/**
 * The gaffer (numbers: shared/staithetune.ts GAFFER): a goblin with a fishing gaff taken off the eel-catchers (a long pole, its iron hook; never a billhook). It keeps
 * a few tiles off and throws the hook down a thin red lane at you. Block it, or dodge out of the lane, and
 * nothing comes of it (Kyle, 2026-11-05: no parry, so nothing snaps the hook now); let it land
 * and you're hauled across to its brute (the nearest within GAFFER.toBrute, else its own feet), held a
 * moment for the brute's blow. A squad goblin: it works with a brute.
 */
import { GAFFER, HERO } from '../shared/tuning';
import { travelTo } from '../shared/sweep';
import { isDead } from './damage';
import { begin, walk } from './enemies';
import type { Enemy, FightEvent, Hero } from './types';

/** Its turn once it's seen you: the hook from its distance, else keep that distance. */
export function stepGaffer(e: Enemy, t: Hero, d: number, ux: number, uy: number, facing: number, speed: number, now: number, dt: number, ev: FightEvent[]): void {
  if (e.cooldown <= 0 && d <= GAFFER.reach && d > 1.4 && facing > 0.85) return begin(e, 'hook', GAFFER.hook, t, ev);
  if (d < GAFFER.keep) {
    const side = Math.sin(now * 0.7 + e.id) > 0 ? 1 : -1;
    return walk(e, -ux - uy * side * 0.6, -uy + ux * side * 0.6, speed * GAFFER.flee, dt);
  }
  if (d > GAFFER.reach * 0.85) walk(e, ux, uy, speed * Math.max(0.2, facing), dt);
}

/** The hook landed on `h`: hauled to the brute (or the gaffer), held, the brute ready to swing. */
export function hooked(e: Enemy, h: Hero, foes: Enemy[], ev: FightEvent[]): void {
  const brute = foes.filter((o) => o.variant === 'heavy' && !isDead(o) && Math.hypot(o.x - e.x, o.y - e.y) <= GAFFER.toBrute).sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y))[0];
  const to = brute ?? e, l = Math.hypot(h.x - to.x, h.y - to.y) || 1, x0 = h.x, y0 = h.y;
  travelTo(h, to.x + ((h.x - to.x) / l) * 1.1, to.y + ((h.y - to.y) / l) * 1.1, HERO.radius);
  Object.assign(h, { kvx: 0, kvy: 0, act: 'stun', actT: 0, actDur: GAFFER.pullStun });
  if (brute) Object.assign(brute, { cooldown: 0, alert: true, fx: (h.x - brute.x) / (Math.hypot(h.x - brute.x, h.y - brute.y) || 1), fy: (h.y - brute.y) / (Math.hypot(h.x - brute.x, h.y - brute.y) || 1) });
  ev.push({ k: 'hooked', x: x0, y: y0, x2: h.x, y2: h.y });
}

