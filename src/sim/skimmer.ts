/**
 * The skimmer (numbers: shared/staithetune.ts SKIMMER): it stands at the water up the bank from the
 * Staithe with a pot of lamp oil from the hoard, pours it on the water and puts a light to it (a striped circle: nothing
 * to block), and the burning oil drifts down onto the jetty, its nets and whoever's at the water's edge
 * (sim/drift.ts). Back to its post if moved, off if you come close. Frost pins it: SKIMMER.pin seconds of
 * doing nothing, and what it was pouring is spilt.
 */
import { currentMap } from '../shared/arena';
import { SKIMMER } from '../shared/tuning';
import { begin, walk } from './enemies';
import type { Enemy, FightEvent, Hero } from './types';

/** Its turn once it's seen you. */
export function stepSkimmer(e: Enemy, t: Hero, d: number, ux: number, uy: number, speed: number, now: number, dt: number, ev: FightEvent[]): void {
  const at = currentMap().staithe?.pour, post = e.home, dp = Math.hypot(post.x - e.x, post.y - e.y);
  if (d < SKIMMER.keep) {
    const side = e.id % 2 ? 1 : -1;
    return walk(e, -ux - uy * side * 0.6, -uy + ux * side * 0.6, speed * SKIMMER.flee, dt);
  }
  if (dp > 1.2) return walk(e, post.x - e.x, post.y - e.y, speed * 0.8, dt);
  if (!at || e.cooldown > 0 || now - (e.pourAt ?? -99) < SKIMMER.every) return;
  const l = Math.hypot(at[0] - e.x, at[1] - e.y) || 1;
  begin(e, 'pour', SKIMMER.pour, t, ev);
  if (e.attack) Object.assign(e.attack, { cx: at[0], cy: at[1], dx: (at[0] - e.x) / l, dy: (at[1] - e.y) / l });
  (e.fx = (at[0] - e.x) / l), (e.fy = (at[1] - e.y) / l);
  e.pourAt = now;
}

/** Frost on it (a chill or a freeze): pinned where it stands, its pot spilt. */
export function pinSkimmer(e: Enemy, now: number, ev: FightEvent[]): void {
  if (e.variant !== 'skimmer' || e.act === 'dead') return;
  const fresh = (e.pinUntil ?? -9) <= now;
  e.pinUntil = now + SKIMMER.pin;
  Object.assign(e, { attack: null, act: 'stunned', actT: 0, actDur: SKIMMER.pin });
  if (fresh) ev.push({ k: 'skimpin', x: e.x, y: e.y });
}
