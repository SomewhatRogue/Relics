/**
 * The log-carriers (numbers: shared/raiders.ts LOGS): one slow, heavy body. From a few tiles off they
 * run the striped lane they've shown you (the charge in sim/enemies.ts), knocking down anyone on it and
 * smashing barrels, crates, fences and carts in the way. After a run they stand and turn slowly; close
 * in, a shove with the log's end.
 */
import { LOGS, SCRAPPER } from '../shared/tuning';
import { currentMap } from '../shared/arena';
import type { Rng } from '../shared/rng';
import { blastProps } from './props';
import { hurtBlock, wood } from './buildings';
import { nearest } from './catching';
import { isDead } from './damage';
import { begin, walk } from './enemies';
import type { World } from './elements';
import type { Enemy, FightEvent, Hero } from './types';

/** Light cover the log goes straight through. */
const COVER = new Set(['fence', 'cart', 'tent', 'stall', 'hurdle', 'den']);

/** Shape a new log-carriers body (a small goblin's otherwise). */
export function shapeLogs(e: Enemy): void {
  Object.assign(e, { radius: LOGS.radius, weight: LOGS.weight });
}

/** Their turn: the run if they're lined up and far enough, the shove up close, else plod in. */
export function stepLogs(e: Enemy, t: Hero, d: number, level: boolean, ux: number, uy: number, facing: number, rng: Rng, dt: number, ev: FightEvent[]): void {
  if (level && e.cooldown <= 0 && facing > 0.94 && d > LOGS.from && d < LOGS.charge.range! - 1 && rng.next() < LOGS.every) return begin(e, 'charge', LOGS.charge, t, ev);
  if (level && e.cooldown <= 0 && d <= LOGS.shove.range! && facing > 0.75) return begin(e, 'swing', LOGS.shove, t, ev);
  if (d > LOGS.shove.range! * 0.8) walk(e, ux, uy, SCRAPPER.speed * LOGS.speed * Math.max(0.15, facing), dt);
}

/** Once a tick: a running log smashes what's in front of it. */
export function stepRams(w: World): void {
  for (const e of w.enemies) {
    const a = e.attack;
    if (e.variant !== 'log' || isDead(e) || !a || a.kind !== 'charge' || a.t < a.windup || a.t > a.windup + a.active) continue;
    const fx = e.x + a.dx * (e.radius + 0.3), fy = e.y + a.dy * (e.radius + 0.3);
    blastProps(fx, fy, e.radius + 0.2, LOGS.smash, 8, w);
    for (const b of currentMap().blocks) if (COVER.has(b.kind) && wood(b) && !b.ruined && nearest(b, fx, fy)[2] <= e.radius) hurtBlock(b, LOGS.smash * 10, w.ev);
  }
}

/** Knocked down by the log: on the floor a moment. */
export function knockDown(h: Hero): void {
  Object.assign(h, { act: 'stun', actT: 0, actDur: LOGS.down });
}
