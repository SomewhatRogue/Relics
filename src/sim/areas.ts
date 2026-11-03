/**
 * Skills that leave something on the floor, kept with blessed ground in the room's zones (so a
 * friend's screen gets them too): a Ranger's volley, arrows falling on a spot after a moment, and a
 * Mage's fire ring, which bursts out from them and burns on where it stood.
 */
import { FIRE_RING, VOLLEY, type Augment } from '../shared/tuning';
import { shove } from './bodies';
import { damage, held, isDead, isDummy } from './damage';
import { afflict, type World } from './elements';
import type { Enemy, Hero, Zone } from './types';

const inside = (e: Enemy, z: { x: number; y: number; r: number }) => !isDead(e) && e.act !== 'carried' && Math.hypot(e.x - z.x, e.y - z.y) <= z.r + e.radius;

/** Shoot high at a spot: the arrows come down there after VOLLEY.delay. */
export function volley(h: Hero, at: { x: number; y: number }, now: number, el: Augment, w: World): Zone {
  w.ev.push({ k: 'volleyshot', x: h.x, y: h.y });
  const start = now + VOLLEY.delay;
  return { kind: 'volley', x: at.x, y: at.y, r: VOLLEY.radius, at: start, next: start, until: start + VOLLEY.time, owner: h.id, el };
}

/** Fire bursts out around the Mage, then burns on where it stood. */
export function fireRing(h: Hero, w: World): Zone {
  w.ev.push({ k: 'firering', x: h.x, y: h.y });
  const z: Zone = { kind: 'fire', x: h.x, y: h.y, r: FIRE_RING.radius, at: w.now, next: w.now + FIRE_RING.every, until: w.now + FIRE_RING.linger, owner: h.id, el: 'fire' };
  for (const e of w.enemies) {
    if (!inside(e, z) || (e.z ?? 0) !== (h.z ?? 0)) continue;
    const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy), ux = d > 0.05 ? dx / d : h.fx, uy = d > 0.05 ? dy / d : h.fy;
    e.lastBy = h.id;
    if (damage(e, FIRE_RING.dmg, w.now, w.ev, { heavy: true, dx: ux, dy: uy, el: 'fire', how: 'burn' })) continue;
    shove(e, ux, uy, FIRE_RING.knock, e.weight);
    afflict(w, e, 'fire', FIRE_RING.dmg);
  }
  return z;
}

/** Each skill area, each tick: the volley's arrows fall, the fire ring lights whatever walks in. */
export function stepAreas(zones: Zone[], w: World): void {
  for (const z of zones) {
    if (!z.kind || w.now < z.next || w.now >= z.until) continue;
    if (z.kind === 'volley') {
      z.next += VOLLEY.every;
      w.ev.push({ k: 'arrowfall', x: z.x, y: z.y });
      for (const e of w.enemies) {
        if (!inside(e, z)) continue;
        e.lastBy = z.owner;
        if (damage(e, VOLLEY.dmg, w.now, w.ev, { src: 'arrow', dx: 0, dy: 1 })) continue;
        afflict(w, e, z.el, VOLLEY.dmg);
        if (e.weight <= 1 && !held(e, w.now) && !isDummy(e)) Object.assign(e, { attack: null, act: 'flinch', actT: 0, actDur: VOLLEY.flinch });
      }
    } else {
      z.next += FIRE_RING.every;
      for (const e of w.enemies) if (inside(e, z) && !isDummy(e) && e.burnUntil <= w.now) (e.lastBy = z.owner), afflict(w, e, 'fire', FIRE_RING.dmg);
    }
  }
}
