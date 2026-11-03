/**
 * The Warrior's shield charge: a run shield-first along where you face. Small goblins in the way go
 * over, knocked aside and reeling (so they can be grabbed); big ones stagger; crates and barrels burst
 * as you go through them; a wall stops you.
 */
import { collide } from '../shared/arena';
import { BASH, HERO } from '../shared/tuning';
import { shove } from './bodies';
import { damage, held, isDead } from './damage';
import type { World } from './elements';
import { damageProp } from './props';
import { bashSurvivors } from './survivorhits';
import type { Enemy, FightEvent, Hero } from './types';
import { bashReach, bashStun } from './knacks';

const hitBy = new WeakMap<Hero, Set<number>>();

export function startBash(h: Hero, ev: FightEvent[]): void {
  const l = Math.hypot(h.fx, h.fy) || 1;
  Object.assign(h, { act: 'bash', actT: 0, rollDx: h.fx / l, rollDy: h.fy / l, kvx: 0, kvy: 0 });
  hitBy.set(h, new Set());
  ev.push({ k: 'bash', x: h.x, y: h.y });
}

/** One tick of the run (the hero's act clock has already moved on). */
export function stepBash(h: Hero, w: Enemy[], world: World, dt: number): void {
  const v = bashReach(h) / BASH.time, x0 = h.x, y0 = h.y;
  h.x += h.rollDx * v * dt;
  h.y += h.rollDy * v * dt;
  collide(h, HERO.radius);
  const moved = Math.hypot(h.x - x0, h.y - y0), hit = hitBy.get(h) ?? new Set<number>();
  for (const e of w) {
    if (isDead(e) || hit.has(e.id) || (e.z ?? 0) !== (h.z ?? 0)) continue;
    const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy);
    if (d > HERO.radius + e.radius + BASH.reach) continue;
    hit.add(e.id);
    e.lastBy = h.id;
    // Knocked off the line, to whichever side it stood.
    const side = h.rollDx * dy - h.rollDy * dx >= 0 ? 1 : -1;
    const ox = h.rollDx * 0.6 - h.rollDy * side, oy = h.rollDy * 0.6 + h.rollDx * side;
    if (damage(e, BASH.dmg, world.now, world.ev, { heavy: true, dx: ox, dy: oy })) continue;
    shove(e, ox, oy, BASH.knock, e.weight);
    if (held(e, world.now)) continue;
    if (e.weight <= 1) Object.assign(e, { attack: null, act: 'stunned', actT: 0, actDur: bashStun(h) }), world.ev.push({ k: 'stunned', x: e.x, y: e.y });
    else if (!e.attack?.unblockable) Object.assign(e, { attack: null, act: 'flinch', actT: 0, actDur: BASH.stagger });
  }
  for (const p of world.props) {
    if (p.lifted || p.broken || Math.hypot(p.x - h.x, p.y - h.y) > HERO.radius + p.radius + BASH.reach) continue;
    damageProp(p, BASH.propDmg, world, h.rollDx, h.rollDy);
  }
  bashSurvivors(h, world, hit);
  // Ran into a wall, or ran its length.
  const blocked = moved < v * dt * 0.3;
  if (blocked) world.ev.push({ k: 'wallhit', x: h.x, y: h.y });
  if (blocked || h.actT >= BASH.time) Object.assign(h, { act: 'idle', actT: 0 });
}
