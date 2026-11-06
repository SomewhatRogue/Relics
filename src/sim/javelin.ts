/**
 * The relic javelin in flight (2026-11-05, Kyle: "always skewers"). It skewers every goblin in its
 * path, whatever it weighs, and carries them all on the shaft, the first hit at the tip; at the first
 * wall or pillar it pins the lot there, and at the end of its range it comes down and pins them to the
 * ground. A goblin that can't be moved (a dummy, one up on a roof) is pinned where it stands and the
 * javelin goes on through. Nothing shrugs it off (sim/stuns.ts relicStun). Friends it passes are spared.
 * Stuck javelins stay a while. (The 'body' state is an old throw's, stuck in a heavy goblin.)
 */
import { collide } from '../shared/arena';
import { GUARD, HERO, JAVELIN, type Augment } from '../shared/tuning';
import { isDead, kill } from './damage';
import type { Enemy, FightEvent, Hero, Javelin } from './types';
import { relicStun } from './stuns';
import { dealt } from './score';

/** Lands the javelin's augment on what it hits. */
export type Afflict = (e: Enemy, el: Augment, n: number) => void;

let nextId = 1;

export function throwJavelin(h: Hero): Javelin {
  return {
    id: nextId++, owner: h.id, x: h.x + h.fx * 0.5, y: h.y + h.fy * 0.5, dx: h.fx, dy: h.fy,
    state: 'fly', travelled: 0, enemy: 0, ox: 0, oy: 0, hit: [], held: [], life: JAVELIN.stuckLife, el: h.augments.javelin,
  };
}

const isDummyKind = (e: Enemy) => e.kind === 'dummy' || e.kind === 'swingDummy';
/** Still on the shaft: carried alive, or a body riding it. */
const onShaft = (e: Enemy | undefined): e is Enemy => !!e && (e.act === 'carried' || e.corpse === 'carried');

/** The goblins on the shaft, tip first, each just behind the one before. */
function ride(j: Javelin, held: Enemy[]): void {
  let back = 0;
  held.forEach((e, i) => {
    back += i === 0 ? e.radius * 0.6 : held[i - 1].radius + e.radius * 0.9;
    e.x = j.x - j.dx * back;
    e.y = j.y - j.dy * back;
  });
}

/** Pin everything on the shaft where it's stopped (a wall, or the ground at the end of its range). */
function pinAll(j: Javelin, held: Enemy[], now: number, ev: FightEvent[], afflict: Afflict, wall: boolean): void {
  if (held.length) ev.push({ k: 'pinned', x: j.x, y: j.y, dx: j.dx, dy: j.dy });
  else if (wall) ev.push({ k: 'javwall', x: j.x, y: j.y, dx: j.dx, dy: j.dy });
  for (const e of held) {
    collide(e, e.radius);
    if (e.act === 'dead') {
      e.corpse = 'pinned';
      continue;
    }
    e.hp -= JAVELIN.pinDmg;
    e.hitAt = now;
    dealt(e, j.owner, JAVELIN.pinDmg);
    ev.push({ k: 'hit', x: e.x, y: e.y, n: JAVELIN.pinDmg, heavy: true, on: 'enemy' });
    if (e.hp <= 0) {
      kill(e, ev);
      e.corpse = 'pinned';
      continue;
    }
    relicStun(e, now, JAVELIN.pinTime, ev, 'pinned', true);
    afflict(e, j.el, JAVELIN.pinDmg);
  }
  j.enemy = held[0]?.id ?? 0;
}

/** The javelin meets `e` in flight: hurt, then carried (or, if it can't be moved, pinned where it stands). */
function skewer(j: Javelin, e: Enemy, now: number, ev: FightEvent[], afflict: Afflict): void {
  j.hit.push(e.id);
  const mult = e.act === 'stunned' || e.act === 'pinned' ? GUARD.stunnedMult : 1, n = Math.round(JAVELIN.dmg * mult);
  e.hp -= n;
  e.hitAt = now;
  e.lastBy = j.owner;
  dealt(e, j.owner, n);
  e.hitstop = 0.06;
  ev.push({ k: 'hit', x: e.x, y: e.y, n, heavy: true, on: 'enemy' });
  if (isDummyKind(e)) {
    if (e.hp <= 0) e.hp = e.maxHp;
    return;
  }
  const movable = Number.isFinite(e.weight);
  if (e.hp <= 0) {
    kill(e, ev);
    // A body rides the javelin to the wall even when the throw killed it.
    if (movable) (e.corpse = 'carried'), (e.actDur += 1), (j.held ??= []).push(e.id);
    return;
  }
  afflict(e, j.el, n);
  if (isDead(e)) return;
  if (!movable) {
    relicStun(e, now, JAVELIN.pinTime, ev, 'pinned', true);
    ev.push({ k: 'javstick', x: e.x, y: e.y, dx: j.dx, dy: j.dy });
    return;
  }
  Object.assign(e, { act: 'carried', attack: null, actT: 0, kvx: 0, kvy: 0 });
  (j.held ??= []).push(e.id);
  if (!j.enemy) j.enemy = e.id;
}

/** Advance one javelin a tick; false when it is gone. `heroes`: friends it passes are told they're spared. */
export function stepJavelin(j: Javelin, enemies: Enemy[], now: number, dt: number, ev: FightEvent[], afflict: Afflict = () => {}, heroes: Hero[] = []): boolean {
  const byId = (id: number) => enemies.find((e) => e.id === id);
  if (j.state !== 'fly') {
    j.life -= dt;
    const e = byId(j.enemy);
    if (j.state === 'body') {
      if (!e || e.act === 'dead') j.state = 'floor';
      else (j.x = e.x + j.ox), (j.y = e.y + j.oy);
    }
    return j.life > 0;
  }
  const steps = 4, d = (JAVELIN.speed * dt) / steps;
  for (let s = 0; s < steps; s++) {
    const p = { x: j.x + j.dx * d, y: j.y + j.dy * d };
    collide(p, 0.05);
    const blocked = Math.hypot(p.x - (j.x + j.dx * d), p.y - (j.y + j.dy * d)) > 1e-4;
    j.x = p.x;
    j.y = p.y;
    j.travelled += d;
    // A goblin that has respawned elsewhere (or been freed) is no longer on the shaft.
    const held = (j.held ?? []).map(byId).filter(onShaft);
    j.held = held.map((e) => e.id);
    ride(j, held);
    if (blocked) return (j.state = 'wall'), pinAll(j, held, now, ev, afflict, true), true;
    for (const e of enemies) {
      if (e.act === 'dead' || e.act === 'carried' || j.hit.includes(e.id)) continue;
      if (Math.hypot(e.x - j.x, e.y - j.y) > e.radius + 0.22) continue;
      skewer(j, e, now, ev, afflict);
    }
    for (const o of heroes) {
      if (o.id === j.owner || o.id === 'squire' || o.act === 'down' || j.hit.includes(-1 - heroes.indexOf(o))) continue;
      if (Math.hypot(o.x - j.x, o.y - j.y) > HERO.radius + 0.2) continue;
      j.hit.push(-1 - heroes.indexOf(o));
      ev.push({ k: 'spared', x: o.x, y: o.y });
    }
  }
  if (j.travelled >= JAVELIN.range) {
    j.state = 'floor';
    pinAll(j, (j.held ?? []).map(byId).filter(onShaft), now, ev, afflict, false);
  }
  return true;
}
