/**
 * The relic javelin in flight. It hits the first enemy in its path: a light one is carried along and
 * pinned to the first wall or pillar the javelin reaches; a heavy one takes the javelin in its body.
 * A miss sticks in the wall, or drops to the floor at the end of its range. Stuck javelins stay a while.
 */
import { collide } from '../shared/arena';
import { GUARD, JAVELIN, KNOCK, type Augment } from '../shared/tuning';
import { shove } from './bodies';
import { isDead, kill } from './damage';
import type { Enemy, FightEvent, Hero, Javelin } from './types';

/** Lands the javelin's augment on what it hits. */
export type Afflict = (e: Enemy, el: Augment, n: number) => void;

let nextId = 1;

export function throwJavelin(h: Hero): Javelin {
  return {
    id: nextId++, owner: h.id, x: h.x + h.fx * 0.5, y: h.y + h.fy * 0.5, dx: h.fx, dy: h.fy,
    state: 'fly', travelled: 0, enemy: 0, ox: 0, oy: 0, hit: [], life: JAVELIN.stuckLife, el: h.augments.javelin,
  };
}

/** Advance one javelin a tick; false when it is gone. */
export function stepJavelin(j: Javelin, enemies: Enemy[], now: number, dt: number, ev: FightEvent[], afflict: Afflict = () => {}): boolean {
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
    let carried = j.enemy ? byId(j.enemy) : undefined;
    // A carried goblin that has respawned elsewhere is no longer on the javelin.
    if (carried && carried.act !== 'carried' && carried.corpse !== 'carried') (carried = undefined), (j.enemy = 0);
    if (carried) {
      carried.x = j.x - j.dx * carried.radius * 0.6;
      carried.y = j.y - j.dy * carried.radius * 0.6;
    }
    if (blocked) {
      j.state = 'wall';
      if (carried && carried.act === 'dead') {
        carried.corpse = 'pinned';
        ev.push({ k: 'pinned', x: j.x, y: j.y, dx: j.dx, dy: j.dy });
      } else if (carried) {
        carried.hp -= JAVELIN.pinDmg;
        carried.hitAt = now;
        ev.push({ k: 'pinned', x: j.x, y: j.y, dx: j.dx, dy: j.dy });
        ev.push({ k: 'hit', x: carried.x, y: carried.y, n: JAVELIN.pinDmg, heavy: true, on: 'enemy' });
        if (carried.hp <= 0) kill(carried, ev), (carried.corpse = 'pinned');
        else Object.assign(carried, { act: 'pinned', actT: 0, actDur: JAVELIN.pinTime, kvx: 0, kvy: 0 }), afflict(carried, j.el, JAVELIN.pinDmg);
      } else ev.push({ k: 'javwall', x: j.x, y: j.y, dx: j.dx, dy: j.dy });
      return true;
    }
    if (carried) continue;
    for (const e of enemies) {
      if (e.act === 'dead' || j.hit.includes(e.id)) continue;
      if (Math.hypot(e.x - j.x, e.y - j.y) > e.radius + 0.18) continue;
      j.hit.push(e.id);
      const mult = e.act === 'stunned' || e.act === 'pinned' ? GUARD.stunnedMult : 1;
      const n = Math.round(JAVELIN.dmg * mult);
      e.hp -= n;
      e.hitAt = now;
      e.hitstop = 0.06;
      ev.push({ k: 'hit', x: e.x, y: e.y, n, heavy: true, on: 'enemy' });
      if (e.kind === 'dummy' || e.kind === 'swingDummy') {
        if (e.hp <= 0) e.hp = e.maxHp;
      } else if (e.hp <= 0) {
        kill(e, ev);
        // A light body rides the javelin to the wall even when the throw killed it.
        if (e.weight <= JAVELIN.pinWeight) (j.enemy = e.id), (e.corpse = 'carried'), (e.actDur += 1);
        if (e.weight <= JAVELIN.pinWeight) break;
        continue;
      }
      afflict(e, j.el, n);
      if (isDead(e)) continue;
      if (e.weight <= JAVELIN.pinWeight) {
        j.enemy = e.id;
        Object.assign(e, { act: 'carried', attack: null, actT: 0, kvx: 0, kvy: 0 });
      } else {
        j.state = 'body';
        j.enemy = e.id;
        j.ox = j.x - e.x - j.dx * 0.2;
        j.oy = j.y - e.y - j.dy * 0.2;
        shove(e, j.dx, j.dy, JAVELIN.knock, e.weight);
        ev.push({ k: 'javstick', x: j.x, y: j.y, dx: j.dx, dy: j.dy });
        return true;
      }
      break;
    }
  }
  if (j.travelled >= JAVELIN.range) {
    const carried = j.enemy ? byId(j.enemy) : undefined;
    if (carried && carried.act === 'dead') carried.corpse = '';
    else if (carried) Object.assign(carried, { act: 'flinch', actT: 0, actDur: 0.6, kvx: j.dx * KNOCK.wallSpeed * 0.8, kvy: j.dy * KNOCK.wallSpeed * 0.8 });
    j.enemy = 0;
    j.state = 'floor';
  }
  return true;
}
