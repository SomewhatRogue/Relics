/**
 * The grappling hook relic. Out it flies; the first thing it reaches decides what happens:
 * a light enemy is reeled in to its owner and arrives reeling; a heavy enemy, a wall or a pillar
 * pulls the owner across instead. A miss reels the hook back.
 */
import { collide } from '../shared/arena';
import { CLASS_GUARD, HERO, HOOK, HOOK_PROP, WEAPONS } from '../shared/tuning';
import { shove } from './bodies';
import type { World } from './elements';
import { isDead } from './damage';
import type { Afflict } from './javelin';
import type { Enemy, FightEvent, Hero, Hook } from './types';

let nextId = 1;

export function fireHook(h: Hero): Hook {
  return { id: nextId++, owner: h.id, x: h.x + h.fx * 0.4, y: h.y + h.fy * 0.4, dx: h.fx, dy: h.fy, state: 'fly', travelled: 0, enemy: 0, el: h.augments.hook };
}

function release(h: Hero | undefined): void {
  if (h && h.act === 'zip') Object.assign(h, { act: 'idle', actT: 0 });
}

/** Advance one hook a tick; false when it is done. */
export function stepHook(k: Hook, heroes: Hero[], enemies: Enemy[], now: number, dt: number, ev: FightEvent[], afflict: Afflict = () => {}, w?: World): boolean {
  const h = heroes.find((x) => x.id === k.owner);
  if (!h || h.act === 'down' || h.act === 'hurt' || h.act === 'stun') {
    release(h);
    const e = enemies.find((x) => x.id === k.enemy);
    if (e && e.act === 'carried') Object.assign(e, { act: 'flinch', actT: 0, actDur: 0.3 });
    return false;
  }
  const e = k.enemy ? enemies.find((x) => x.id === k.enemy) : undefined;
  if (k.state === 'fly') {
    const steps = 4, d = (HOOK.speed * dt) / steps;
    for (let s = 0; s < steps; s++) {
      const want = { x: k.x + k.dx * d, y: k.y + k.dy * d }, p = { ...want };
      collide(p, 0.05);
      k.x = p.x;
      k.y = p.y;
      k.travelled += d;
      if (Math.hypot(p.x - want.x, p.y - want.y) > 1e-4) {
        k.state = 'zip';
        Object.assign(h, { act: 'zip', actT: 0, kvx: 0, kvy: 0 });
        ev.push({ k: 'latch', x: k.x, y: k.y, dx: k.dx, dy: k.dy });
        return true;
      }
      // A barrel, a crate, a plank: yanked back at you (bowling over goblins on the way); a heavier one pulls you to it.
      const prop = w?.props.find((q) => !q.broken && !q.lifted && Math.hypot(q.x - k.x, q.y - k.y) <= q.radius + 0.15);
      if (prop && prop.weight <= HOOK_PROP.maxWeight) {
        prop.lastBy = h.id;
        shove(prop, -k.dx, -k.dy, HOOK_PROP.yank, prop.weight);
        ev.push({ k: 'hookprop', x: h.x, y: h.y, x2: prop.x, y2: prop.y });
        return false;
      }
      if (prop) {
        k.state = 'zip';
        Object.assign(h, { act: 'zip', actT: 0, kvx: 0, kvy: 0 });
        ev.push({ k: 'latch', x: k.x, y: k.y, dx: k.dx, dy: k.dy });
        return true;
      }
      for (const t of enemies) {
        if (t.act === 'dead' || t.act === 'carried' || Math.hypot(t.x - k.x, t.y - k.y) > t.radius + 0.15) continue;
        k.enemy = t.id;
        t.hp -= t.kind === 'dummy' || t.kind === 'swingDummy' ? 0 : HOOK.dmg;
        t.hitAt = now;
        ev.push({ k: 'latch', x: k.x, y: k.y, dx: k.dx, dy: k.dy });
        afflict(t, k.el, HOOK.dmg);
        if (isDead(t)) return false;
        const heavy = CLASS_GUARD[WEAPONS[h.weapon].cls] === 'full';
        if (t.weight <= (heavy ? HOOK.heavyYank : HOOK.yankWeight) && t.act !== 'pinned') {
          k.state = 'yank';
          Object.assign(t, { act: 'carried', attack: null, kvx: 0, kvy: 0 });
          ev.push({ k: 'yank', x: t.x, y: t.y, dx: -k.dx, dy: -k.dy });
        } else {
          k.state = 'zip';
          Object.assign(h, { act: 'zip', actT: 0, kvx: 0, kvy: 0 });
        }
        return true;
      }
    }
    if (k.travelled >= HOOK.range) k.state = 'back';
    return true;
  }
  if (k.state === 'back') {
    const dx = h.x - k.x, dy = h.y - k.y, d = Math.hypot(dx, dy), step = HOOK.speed * 1.3 * dt;
    if (d <= step) return false;
    k.x += (dx / d) * step;
    k.y += (dy / d) * step;
    return true;
  }
  if (k.state === 'yank') {
    if (!e || e.act !== 'carried') return false;
    const dx = h.x - e.x, dy = h.y - e.y, d = Math.hypot(dx, dy), stop = HERO.radius + e.radius + 0.25, step = HOOK.yankSpeed * dt;
    if (d - step <= stop) {
      e.x = h.x - (dx / d) * stop;
      e.y = h.y - (dy / d) * stop;
      collide(e, e.radius);
      // Small ones arrive reeling; a butcher hauled in just arrives, angry.
      if (e.kind === 'butcher') Object.assign(e, { act: 'chase', cooldown: Math.max(e.cooldown, 0.4) });
      else Object.assign(e, { act: 'stunned', actT: 0, actDur: HOOK.yankStun });
      ev.push({ k: 'land', x: e.x, y: e.y, dx: dx / d, dy: dy / d });
      return false;
    }
    e.x += (dx / d) * step;
    e.y += (dy / d) * step;
    k.x = e.x;
    k.y = e.y;
    return true;
  }
  // Zip: pull the owner to the hook (following a hooked enemy as it moves).
  if (e) {
    if (e.act === 'dead') return release(h), false;
    k.x = e.x;
    k.y = e.y;
  }
  const stopAt = e ? e.radius + HERO.radius + 0.2 : 0.45;
  const dx = k.x - h.x, dy = k.y - h.y, d = Math.hypot(dx, dy), step = HOOK.zipSpeed * dt;
  h.fx = dx / (d || 1);
  h.fy = dy / (d || 1);
  if (d - step <= stopAt || h.actT > 1.2) {
    h.x = k.x - h.fx * stopAt;
    h.y = k.y - h.fy * stopAt;
    collide(h, HERO.radius);
    release(h);
    ev.push({ k: 'land', x: h.x, y: h.y, dx: h.fx, dy: h.fy });
    return false;
  }
  h.x += h.fx * step;
  h.y += h.fy * step;
  h.actT += dt;
  collide(h, HERO.radius);
  return true;
}
