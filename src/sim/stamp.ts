/**
 * The Warrior's shield stamp: the rim brought down on the stone at the end of its windup (the ring is
 * drawn from the same STAMP numbers while the Warrior winds it up). Everything in the ring is hit and
 * thrown outward: small goblins off their feet, big ones staggered; crates and barrels burst.
 */
import { STAMP, type Augment } from '../shared/tuning';
import { shove } from './bodies';
import { damage, held, isDead } from './damage';
import { afflict, type World } from './elements';
import { blastProps } from './props';
import type { Hero } from './types';
import { stun } from './stuns';

export function stamp(h: Hero, w: World, el: Augment): void {
  w.ev.push({ k: 'stamp', x: h.x, y: h.y });
  for (const e of w.enemies) {
    if (isDead(e) || e.act === 'carried' || (e.z ?? 0) !== (h.z ?? 0)) continue;
    const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy);
    if (d > STAMP.radius + e.radius) continue;
    const ux = d > 0.05 ? dx / d : h.fx, uy = d > 0.05 ? dy / d : h.fy;
    e.lastBy = h.id;
    if (damage(e, STAMP.dmg, w.now, w.ev, { heavy: true, dx: ux, dy: uy })) continue;
    shove(e, ux, uy, STAMP.knock, e.weight);
    afflict(w, e, el, STAMP.dmg);
    if (held(e, w.now)) continue;
    if (e.weight <= 1) stun(e, h.id, w.now, STAMP.stun, w.ev) && w.ev.push({ k: 'stunned', x: e.x, y: e.y });
    else if (!e.attack?.unblockable) stun(e, h.id, w.now, STAMP.stagger, w.ev, 'flinch');
  }
  blastProps(h.x, h.y, STAMP.radius, STAMP.propDmg, STAMP.knock, w);
}
