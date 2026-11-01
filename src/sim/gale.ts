/** The gale horn: one blast of wind in a cone, throwing every goblin in it by its weight. */
import { HORN, type Augment } from '../shared/tuning';
import { shove } from './bodies';
import { inArc } from './combat';
import { damage } from './damage';
import { afflict, type World } from './elements';
import type { Hero } from './types';

export function blowHorn(h: Hero, w: World, el: Augment): void {
  w.ev.push({ k: 'gust', x: h.x, y: h.y, dx: h.fx, dy: h.fy, el });
  for (const e of w.enemies) {
    if (e.act === 'dead' || e.act === 'carried' || e.act === 'pinned') continue;
    if (!inArc(h.x, h.y, h.fx, h.fy, e.x, e.y, HORN.range, HORN.arc, e.radius)) continue;
    if (damage(e, HORN.dmg, w.now, w.ev, { flinch: HORN.flinch })) continue;
    const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy) || 1;
    // Mostly along the blast, a little outward from the horn.
    const px = h.fx * 0.7 + (dx / d) * 0.3, py = h.fy * 0.7 + (dy / d) * 0.3, pl = Math.hypot(px, py);
    shove(e, px / pl, py / pl, HORN.knock, e.weight);
    afflict(w, e, el, HORN.dmg);
  }
}
