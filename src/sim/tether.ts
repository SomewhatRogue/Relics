/**
 * The Mage's storm tether: lightning ties the Mage to the goblin they face and strikes it every
 * TETHER.every for TETHER.time. It's storm, so each strike jumps on to the goblins near it. Past
 * TETHER.snap it snaps; when its goblin dies it takes the nearest other in reach.
 */
import { TETHER } from '../shared/tuning';
import { damage, isDead, isDummy } from './damage';
import { afflict, type World } from './elements';
import { faced } from './facing';
import type { Enemy, FightEvent, Hero } from './types';

export function startTether(h: Hero, enemies: Enemy[], now: number, ev: FightEvent[]): void {
  const e = faced(h, enemies, TETHER.range);
  if (!e) return;
  h.tether = { id: e.id, until: now + TETHER.time, next: now };
}

const nearest = (h: Hero, enemies: Enemy[]) =>
  enemies.filter((e) => !isDead(e) && !isDummy(e) && Math.hypot(e.x - h.x, e.y - h.y) <= TETHER.range).sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))[0];

/** Every tether in the room, a tick. */
export function stepTethers(w: World): void {
  for (const h of w.heroes) {
    const t = h.tether;
    if (!t) continue;
    if (w.now >= t.until || h.act === 'down') {
      h.tether = undefined;
      continue;
    }
    let e = w.enemies.find((o) => o.id === t.id && !isDead(o));
    if (!e) e = nearest(h, w.enemies);
    if (!e || Math.hypot(e.x - h.x, e.y - h.y) > TETHER.snap) {
      h.tether = undefined;
      continue;
    }
    t.id = e.id;
    if (w.now < t.next) continue;
    t.next += TETHER.every;
    w.ev.push({ k: 'tetherzap', x: h.x, y: h.y, x2: e.x, y2: e.y });
    e.lastBy = h.id;
    if (!damage(e, TETHER.dmg, w.now, w.ev, { flinch: 0.2, el: 'storm', src: 'spark' })) afflict(w, e, 'storm', TETHER.dmg);
  }
}
