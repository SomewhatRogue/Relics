/**
 * Shots and thrown things. Arrows stop in the first body (a full longbow draw pierces them all) and
 * stick in walls; crossbow bolts hurl; sparks, orbs and lances are spells. A smite waits over its
 * spot, then falls. The hunter's net opens on the first goblin it reaches. The lodestone is lobbed,
 * lands, drags goblins inward for a while, then bursts.
 */
import { collide } from '../shared/arena';
import { FLINCH, LODESTONE, NET, type Augment, type Swing, type TraitId } from '../shared/tuning';
import { shove } from './bodies';
import { damage, frozen, isDead } from './damage';
import { afflict, shatter, type World } from './elements';
import { blastProps, damageProp } from './props';
import { blastBlocks } from './buildings';
import type { Bolt, Enemy, Hero } from './types';

let nextId = 1;

const base = (h: Hero, kind: Bolt['kind'], el: Augment): Bolt => ({
  id: nextId++, owner: h.id, kind, x: h.x + h.fx * 0.5, y: h.y + h.fy * 0.5, dx: h.fx, dy: h.fy, speed: 0, range: 0, travelled: 0,
  dmg: 0, knock: 0, pierce: false, burst: 0, el, hit: [], stun: 0, traits: [], sx: h.x, sy: h.y, tx: h.x, ty: h.y, t: 0, flight: 0, state: 'fly', life: 0,
});

/** Loose the swing's shot along the hero's facing; `mult` is the hero's damage (blessing, perfect release, tempo). */
export function shoot(h: Hero, s: Swing, el: Augment, mult = 1, traits: TraitId[] = []): Bolt {
  return { ...base(h, s.shot!, el), traits, speed: s.speed ?? 20, range: s.range, dmg: Math.round(s.dmg * mult), knock: s.knock, pierce: !!s.pierce, burst: s.burst ?? 0 };
}

/** A spot `dist` tiles ahead of the hero, kept inside the room. */
function spot(h: Hero, dist: number): { x: number; y: number } {
  const t = { x: h.x + h.fx * dist, y: h.y + h.fy * dist };
  collide(t, 0.2);
  return t;
}

/** A smite marked on its spot; it falls after `delay`. */
export function smite(h: Hero, s: Swing, dist: number, mult = 1, traits: TraitId[] = [], delay = 0.35): Bolt {
  const t = spot(h, dist);
  return { ...base(h, 'smite', ''), traits, x: t.x, y: t.y, tx: t.x, ty: t.y, flight: delay, dmg: Math.round(s.dmg * mult), knock: s.knock, burst: s.burst ?? 1.3, stun: s.stun ?? 1 };
}

export function throwNet(h: Hero, el: Augment): Bolt {
  return { ...base(h, 'net', el), speed: NET.speed, range: NET.range, dmg: NET.dmg, burst: NET.radius };
}

export function lobLodestone(h: Hero, dist: number, el: Augment): Bolt {
  const t = spot(h, dist);
  return { ...base(h, 'lodestone', el), x: h.x, y: h.y, tx: t.x, ty: t.y, flight: LODESTONE.flight, dmg: LODESTONE.dmg, knock: 6, burst: LODESTONE.burst };
}

/** Everything within the bolt's burst of (x, y) is hit and thrown outward (and stunned, by a smite). */
export function blast(w: World, b: Bolt, x: number, y: number): void {
  w.ev.push(b.kind === 'smite' ? { k: 'smite', x, y } : { k: 'burst', x, y, r: b.burst, el: b.el });
  blastProps(x, y, b.burst, b.dmg, b.knock, w);
  blastBlocks(x, y, b.burst, b.dmg, b.el, w.now, w.ev);
  for (const e of w.enemies) {
    const d = Math.hypot(e.x - x, e.y - y);
    if (isDead(e) || e.act === 'carried' || d > b.burst + e.radius) continue;
    const wasFrozen = frozen(e, w.now);
    e.lastBy = b.owner;
    if (damage(e, b.dmg, w.now, w.ev, { heavy: true, flinch: 0.5, mult: true, brutal: b.traits.includes('brutal'), how: 'burst', dx: e.x - x, dy: e.y - y, src: b.kind })) continue;
    if (e.act !== 'pinned') shove(e, d > 0.05 ? (e.x - x) / d : b.dx, d > 0.05 ? (e.y - y) / d : b.dy, b.knock, e.weight);
    if (b.stun && e.act !== 'pinned') Object.assign(e, { attack: null, act: 'stunned', actT: 0, actDur: b.stun });
    if (wasFrozen && b.knock >= 8) shatter(e, w.now, w.ev);
    else afflict(w, e, b.el, b.dmg);
  }
}

/** The net opens: small goblins in it are snared flat, big ones slowed. */
function openNet(w: World, b: Bolt): void {
  w.ev.push({ k: 'net', x: b.x, y: b.y });
  for (const e of w.enemies) {
    if (isDead(e) || e.act === 'carried' || Math.hypot(e.x - b.x, e.y - b.y) > b.burst + e.radius) continue;
    if (damage(e, b.dmg, w.now, w.ev, { src: b.kind })) continue;
    e.snareUntil = w.now + NET.snare;
    e.kvx = e.kvy = 0;
    if (e.act === 'attack' && e.weight <= 1) Object.assign(e, { attack: null, act: 'chase', actT: 0 });
    w.ev.push({ k: 'snared', x: e.x, y: e.y });
    afflict(w, e, b.el, b.dmg);
  }
}

function strike(w: World, b: Bolt, e: Enemy): void {
  const wasFrozen = frozen(e, w.now);
  e.lastBy = b.owner;
  if (damage(e, b.dmg, w.now, w.ev, { heavy: b.knock >= 8, flinch: FLINCH, mult: true, brutal: b.traits.includes('brutal'), dx: b.dx, dy: b.dy, src: b.kind })) return;
  if (e.act !== 'pinned') shove(e, b.dx, b.dy, b.knock, e.weight);
  if (wasFrozen && b.knock >= 8) shatter(e, w.now, w.ev);
  else afflict(w, e, b.el, b.dmg);
}

/** Advance one bolt a tick; false when it is gone. */
export function stepBolt(b: Bolt, w: World, dt: number): boolean {
  if (b.state === 'stuck') return (b.life -= dt) > 0;
  if (b.state === 'well') return pull(b, w, dt);
  if (b.kind === 'smite') {
    if ((b.t += dt) < b.flight) return true;
    blast(w, b, b.x, b.y);
    return false;
  }
  if (b.kind === 'lodestone') {
    b.t += dt;
    const k = Math.min(1, b.t / b.flight);
    b.x = b.sx + (b.tx - b.sx) * k;
    b.y = b.sy + (b.ty - b.sy) * k;
    if (k < 1) return true;
    b.state = 'well';
    b.life = LODESTONE.time;
    w.ev.push({ k: 'well', x: b.x, y: b.y });
    return true;
  }
  const steps = 4, d = (b.speed * dt) / steps;
  for (let s = 0; s < steps; s++) {
    const want = { x: b.x + b.dx * d, y: b.y + b.dy * d }, p = { ...want };
    collide(p, 0.05);
    b.x = p.x;
    b.y = p.y;
    b.travelled += d;
    if (Math.hypot(p.x - want.x, p.y - want.y) > 1e-4) return end(b, w, true);
    // Barrels and tables stop shots (and take them).
    const prop = w.props.find((q) => !q.broken && !q.lifted && Math.hypot(q.x - b.x, q.y - b.y) <= q.radius + 0.1);
    if (prop) {
      if (b.kind === 'net') return openNet(w, b), false;
      if (b.burst) return blast(w, b, b.x, b.y), false;
      shove(prop, b.dx, b.dy, b.knock, prop.weight);
      damageProp(prop, b.dmg, w, b.dx, b.dy);
      return end(b, w, true);
    }
    for (const e of w.enemies) {
      if (isDead(e) || e.act === 'carried' || b.hit.includes(e.id)) continue;
      if (Math.hypot(e.x - b.x, e.y - b.y) > e.radius + (b.kind === 'orb' || b.kind === 'net' ? 0.3 : 0.14)) continue;
      if (b.kind === 'net') return openNet(w, b), false;
      if (b.burst) return blast(w, b, b.x, b.y), false;
      b.hit.push(e.id);
      strike(w, b, e);
      if (!b.pierce) return false;
    }
    if (b.travelled >= b.range) return end(b, w, false);
  }
  return true;
}

/** The landed lodestone drags goblins toward it (the lighter, the faster), then bursts. */
function pull(b: Bolt, w: World, dt: number): boolean {
  b.life -= dt;
  for (const e of w.enemies) {
    if (isDead(e) || e.act === 'carried' || e.act === 'pinned' || !isFinite(e.weight)) continue;
    const dx = b.x - e.x, dy = b.y - e.y, d = Math.hypot(dx, dy);
    if (d > LODESTONE.radius || d < 0.35) continue;
    e.kvx += ((dx / d) * LODESTONE.pull * dt) / e.weight;
    e.kvy += ((dy / d) * LODESTONE.pull * dt) / e.weight;
  }
  if (b.life > 0) return true;
  blast(w, b, b.x, b.y);
  return false;
}

/** A wall or the end of its flight: bursts burst, nets open, arrows and bolts stick, spells fizzle. */
function end(b: Bolt, w: World, wall: boolean): boolean {
  if (b.kind === 'net') return openNet(w, b), false;
  if (b.burst) return blast(w, b, b.x, b.y), false;
  if (b.kind !== 'arrow' && b.kind !== 'bolt') return false;
  b.state = 'stuck';
  b.life = wall ? 2.5 : 1.5;
  return true;
}
