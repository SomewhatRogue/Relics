/**
 * The spellblade's held spells that carry the Mage (numbers: shared/spellbook.ts LUNGE, DASH): fire a
 * burning lunge, storm a lightning dash through a line of goblins (untouchable while it lasts:
 * sim/combat.ts). Both run in the hero's act 'bash' (so both views draw the run as the shield charge's),
 * swept so a wall stops them, each goblin within reach of the path struck once. Kept on the hero
 * (`rush`, `rollDx`, `rollDy`, `hitIds`), so a guest sees the same.
 */
import { DASH, HERO, LUNGE } from '../shared/tuning';
import { travel } from '../shared/sweep';
import { damage, isDead } from './damage';
import { afflict, type World } from './elements';
import { stun } from './stuns';
import type { Hero } from './types';

/** Off along where the hero faces: `len` tiles, `dmg` to each goblin on the way. */
export function startRush(h: Hero, el: 'fire' | 'storm', len: number, dmg: number, w: World): void {
  const l = Math.hypot(h.fx, h.fy) || 1;
  Object.assign(h, { act: 'bash', actT: 0, rollDx: h.fx / l, rollDy: h.fy / l, kvx: 0, kvy: 0, hitIds: [], rush: { el, len, dmg, big: h.perfect } });
  w.ev.push({ k: 'spell', x: h.x, y: h.y, dx: h.rollDx, dy: h.rollDy, el, what: el === 'fire' ? 'lunge' : 'dash', r: len, big: h.perfect });
}

/** Untouchable now: in a lightning dash. */
export const dashing = (h: Hero) => h.act === 'bash' && h.rush?.el === 'storm';

/** One tick of the run (the act clock has already moved on). */
export function stepRush(h: Hero, w: World, dt: number): void {
  const r = h.rush!, fire = r.el === 'fire', time = fire ? LUNGE.time : DASH.time, reach = fire ? LUNGE.reach : DASH.reach;
  const v = r.len / time, x0 = h.x, y0 = h.y;
  travel(h, h.rollDx * v * dt, h.rollDy * v * dt, HERO.radius);
  // Struck: anything within reach of the stretch just covered.
  for (const e of w.enemies) {
    if (isDead(e) || e.act === 'carried' || h.hitIds.includes(e.id) || (e.z ?? 0) !== (h.z ?? 0)) continue;
    const sx = h.x - x0, sy = h.y - y0, sl = sx * sx + sy * sy, k = sl > 1e-6 ? Math.max(0, Math.min(1, ((e.x - x0) * sx + (e.y - y0) * sy) / sl)) : 1;
    if (Math.hypot(e.x - (x0 + sx * k), e.y - (y0 + sy * k)) > reach + e.radius) continue;
    h.hitIds.push(e.id);
    e.lastBy = h.id;
    if (fire) {
      if (!damage(e, r.dmg, w.now, w.ev, { heavy: true, flinch: 0.3, mult: true, el: 'fire', how: 'burn', dx: h.rollDx, dy: h.rollDy })) afflict(w, e, 'fire', r.dmg);
      continue;
    }
    w.ev.push({ k: 'shock', x: h.x, y: h.y, x2: e.x, y2: e.y });
    if (damage(e, r.dmg, w.now, w.ev, { flinch: r.big ? 0 : DASH.flinch, mult: true, el: 'storm', src: 'spark', dx: h.rollDx, dy: h.rollDy })) continue;
    afflict(w, e, 'storm', r.dmg, 0);
    if (r.big && e.act !== 'pinned') stun(e, h.id, w.now, DASH.bigStun, w.ev);
  }
  const blocked = Math.hypot(h.x - x0, h.y - y0) < v * dt * 0.3;
  if (blocked) w.ev.push({ k: 'wallhit', x: h.x, y: h.y });
  if (blocked || h.actT >= time) Object.assign(h, { act: 'idle', actT: 0, rush: undefined });
}
