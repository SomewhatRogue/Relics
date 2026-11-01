/**
 * Shots and lobs: the Ranger's arrows, the Mage's sparks and orbs, the blast flask. Arrows stop in
 * the first body (a charged one pierces them all) and stick in walls; sparks and orbs may burst;
 * a flask flies over heads and bursts where it lands.
 */
import { collide } from '../shared/arena';
import { FLASK, FLINCH, type Augment, type Swing } from '../shared/tuning';
import { shove } from './bodies';
import { damage, frozen } from './damage';
import { afflict, shatter, type World } from './elements';
import type { Bolt, Enemy, Hero } from './types';

let nextId = 1;

const base = (h: Hero, kind: Bolt['kind'], el: Augment): Bolt => ({
  id: nextId++, owner: h.id, kind, x: h.x + h.fx * 0.5, y: h.y + h.fy * 0.5, dx: h.fx, dy: h.fy, speed: 0, range: 0, travelled: 0,
  dmg: 0, knock: 0, pierce: false, burst: 0, el, hit: [], sx: h.x, sy: h.y, tx: h.x, ty: h.y, t: 0, flight: 0, state: 'fly', life: 0,
});

/** Loose the swing's shot along the hero's facing. */
export function shoot(h: Hero, s: Swing, el: Augment): Bolt {
  return { ...base(h, s.shot!, el), speed: s.speed ?? 20, range: s.range, dmg: s.dmg, knock: s.knock, pierce: !!s.pierce, burst: s.burst ?? 0 };
}

/** Lob a flask `dist` tiles ahead. */
export function lob(h: Hero, dist: number, el: Augment): Bolt {
  const t = { x: h.x + h.fx * dist, y: h.y + h.fy * dist };
  collide(t, 0.2);
  const d = Math.hypot(t.x - h.x, t.y - h.y);
  return { ...base(h, 'flask', el), x: h.x, y: h.y, tx: t.x, ty: t.y, flight: FLASK.flight * (0.6 + (0.4 * d) / FLASK.range), dmg: FLASK.dmg, knock: FLASK.knock, burst: FLASK.radius };
}

/** Everything within `r` of (x, y) is hit and thrown outward. */
function blast(w: World, b: Bolt, x: number, y: number): void {
  w.ev.push({ k: 'burst', x, y, r: b.burst, el: b.el });
  for (const e of w.enemies) {
    const d = Math.hypot(e.x - x, e.y - y);
    if (e.act === 'dead' || e.act === 'carried' || d > b.burst + e.radius) continue;
    const wasFrozen = frozen(e, w.now);
    if (damage(e, b.dmg, w.now, w.ev, { heavy: true, flinch: 0.5, mult: true })) continue;
    if (e.act !== 'pinned') shove(e, d > 0.05 ? (e.x - x) / d : b.dx, d > 0.05 ? (e.y - y) / d : b.dy, b.knock, e.weight);
    if (wasFrozen && b.knock >= 8) shatter(e, w.now, w.ev);
    else afflict(w, e, b.el, b.dmg);
  }
}

function strike(w: World, b: Bolt, e: Enemy): void {
  const wasFrozen = frozen(e, w.now);
  if (damage(e, b.dmg, w.now, w.ev, { heavy: b.knock >= 8, flinch: FLINCH, mult: true })) return;
  if (e.act !== 'pinned') shove(e, b.dx, b.dy, b.knock, e.weight);
  if (wasFrozen && b.knock >= 8) shatter(e, w.now, w.ev);
  else afflict(w, e, b.el, b.dmg);
}

/** Advance one bolt a tick; false when it is gone. */
export function stepBolt(b: Bolt, w: World, dt: number): boolean {
  if (b.state === 'stuck') return (b.life -= dt) > 0;
  if (b.kind === 'flask') {
    b.t += dt;
    const k = Math.min(1, b.t / b.flight);
    b.x = b.sx + (b.tx - b.sx) * k;
    b.y = b.sy + (b.ty - b.sy) * k;
    if (k < 1) return true;
    blast(w, b, b.x, b.y);
    return false;
  }
  const steps = 4, d = (b.speed * dt) / steps;
  for (let s = 0; s < steps; s++) {
    const want = { x: b.x + b.dx * d, y: b.y + b.dy * d }, p = { ...want };
    collide(p, 0.05);
    b.x = p.x;
    b.y = p.y;
    b.travelled += d;
    if (Math.hypot(p.x - want.x, p.y - want.y) > 1e-4) return end(b, w, true);
    for (const e of w.enemies) {
      if (e.act === 'dead' || e.act === 'carried' || b.hit.includes(e.id)) continue;
      if (Math.hypot(e.x - b.x, e.y - b.y) > e.radius + (b.kind === 'orb' ? 0.3 : 0.14)) continue;
      if (b.burst) return blast(w, b, b.x, b.y), false;
      b.hit.push(e.id);
      strike(w, b, e);
      if (!b.pierce) return false;
    }
    if (b.travelled >= b.range) return end(b, w, false);
  }
  return true;
}

/** A wall or the end of its flight: bursts burst, arrows stick, sparks fizzle. */
function end(b: Bolt, w: World, wall: boolean): boolean {
  if (b.burst) return blast(w, b, b.x, b.y), false;
  if (b.kind !== 'arrow') return false;
  b.state = 'stuck';
  b.life = wall ? 2.5 : 1.5;
  return true;
}
