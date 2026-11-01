/**
 * The relics that act at once rather than flying: the Rogue's shadowstep, the Healer's blessing,
 * the war horn.
 * (Javelin, hook, net and lodestone fly; see their own files.)
 */
import { collide } from '../shared/arena';
import { BLESSING, HERO, HORN, SHADOWSTEP } from '../shared/tuning';
import { held, isDead, isDummy } from './damage';
import type { Enemy, FightEvent, Hero, Intent } from './types';

/** Step behind the goblin you face (or the nearest one in reach), facing its back. */
export function shadowstep(h: Hero, enemies: Enemy[], ev: FightEvent[]): void {
  let best: Enemy | null = null, bd = Infinity;
  for (const e of enemies) {
    if (isDead(e) || e.act === 'carried') continue;
    const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy);
    if (d > SHADOWSTEP.range) continue;
    // Goblins you face first; dummies last (they have no back).
    const score = d - ((dx * h.fx + dy * h.fy) / (d || 1)) * 2 + (isDummy(e) ? 6 : 0);
    if (score < bd) (bd = score), (best = e);
  }
  ev.push({ k: 'blink', x: h.x, y: h.y });
  if (best) {
    const back = best.radius + HERO.radius + 0.25;
    h.x = best.x - best.fx * back;
    h.y = best.y - best.fy * back;
    collide(h, HERO.radius);
    const dx = best.x - h.x, dy = best.y - h.y, d = Math.hypot(dx, dy) || 1;
    h.fx = dx / d;
    h.fy = dy / d;
  } else {
    h.x += h.fx * 3;
    h.y += h.fy * 3;
    collide(h, HERO.radius);
  }
  h.kvx = h.kvy = 0;
  ev.push({ k: 'shadow', x: h.x, y: h.y });
}

/**
 * Bless an ally: the one nearest where you point (a laptop), else the most hurt one in reach
 * (others before yourself on a tie). Heals, and for a while they hit harder and take less.
 */
export function bless(h: Hero, heroes: Hero[], aim: Intent | undefined, now: number, ev: FightEvent[]): void {
  const near = heroes.filter((o) => o.act !== 'down' && Math.hypot(o.x - h.x, o.y - h.y) <= BLESSING.range);
  let target = h;
  if (aim && (aim.ax || aim.ay)) {
    const px = h.x + aim.ax, py = h.y + aim.ay;
    let bd = Infinity;
    for (const o of near) {
      const d = Math.hypot(o.x - px, o.y - py);
      if (d < bd) (bd = d), (target = o);
    }
  } else {
    let low = Infinity;
    for (const o of near) {
      const share = o.hp / HERO.hp - (o === h ? 0 : 0.001);
      if (share < low) (low = share), (target = o);
    }
  }
  const n = Math.min(HERO.hp - target.hp, BLESSING.heal);
  target.hp += n;
  target.blessedUntil = now + BLESSING.time;
  if (target !== h) ev.push({ k: 'beam', x: h.x, y: h.y, x2: target.x, y2: target.y });
  ev.push({ k: 'blessed', x: target.x, y: target.y });
  if (n > 0) ev.push({ k: 'heal', x: target.x, y: target.y, n });
}

/** Sound the war horn: every ally in earshot is rallied; small goblins close by flinch. */
export function rally(h: Hero, heroes: Hero[], enemies: Enemy[], now: number, ev: FightEvent[]): void {
  ev.push({ k: 'rally', x: h.x, y: h.y });
  for (const o of heroes) {
    if (o.act === 'down' || Math.hypot(o.x - h.x, o.y - h.y) > HORN.radius) continue;
    o.stamina = HERO.stamina;
    o.rallyUntil = now + HORN.time;
    ev.push({ k: 'rallied', x: o.x, y: o.y });
  }
  for (const e of enemies) {
    if (isDead(e) || e.weight > 1 || held(e, now) || Math.hypot(e.x - h.x, e.y - h.y) > HORN.scare) continue;
    Object.assign(e, { attack: null, act: 'flinch', actT: 0, actDur: 0.5 });
  }
}
