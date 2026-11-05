/**
 * The staff's charged ring, in the room (numbers: shared/spellbook.ts STAFF_RING, STORM_RING): raised
 * round where the Mage stands, never aimed. It's the whole round: every half second anything inside is
 * zapped and flinches (stunned, let go on the flash); a wet one zapped jumps it to the wet ones near,
 * once a pulse. It lives in the room's zones, so a guest sees the same ring that is judged
 * (client/spellground.ts draws it from these numbers). The staff's fire hold is a pit dropped on a
 * goblin now (sim/firepit.ts; Kyle, 2026-11-05).
 */
import { STORM_RING } from '../shared/tuning';
import { damage, isDead, isDummy } from './damage';
import { afflict, newCast, type World } from './elements';
import { stun } from './stuns';
import type { Enemy, Hero, Zone } from './types';

/** Inside the charged ring. */
export const inRing = (z: Zone, e: { x: number; y: number }, rad: number) => Math.hypot(e.x - z.x, e.y - z.y) <= z.r + rad;

/** The charged ring, `r` round. `mult`: the hero's damage now (a primed spell's too). */
export function stormRing(h: Hero, r: number, mult: number, w: World): Zone {
  w.ev.push({ k: 'spell', x: h.x, y: h.y, dx: h.fx, dy: h.fy, el: 'storm', what: 'stormring', r, big: h.perfect });
  const now = w.now, life = h.perfect ? STORM_RING.bigLife : STORM_RING.life;
  return { kind: 'stormring', x: h.x, y: h.y, r, at: now, next: now, until: now + life, owner: h.id, el: 'storm', big: h.perfect, n: Math.max(1, Math.round(STORM_RING.zap * mult)) };
}

const reached = (e: Enemy) => !isDead(e) && e.act !== 'carried' && !isDummy(e);

/** Each charged ring, each tick. */
export function stepRings(zones: Zone[], w: World): void {
  for (const z of zones) {
    if (w.now >= z.until) continue;
    if (z.kind === 'stormring' && w.now >= z.next) {
      z.next += STORM_RING.every;
      const cast = newCast();
      for (const e of w.enemies) {
        if (!reached(e) || !inRing(z, e, e.radius)) continue;
        e.lastBy = z.owner;
        const a = Math.atan2(e.y - z.y, e.x - z.x), ex = z.x + Math.cos(a) * z.r, ey = z.y + Math.sin(a) * z.r;
        w.ev.push({ k: 'shock', x: ex, y: ey, x2: e.x, y2: e.y });
        if (damage(e, z.n ?? STORM_RING.zap, w.now, w.ev, { flinch: z.big ? 0 : STORM_RING.flinch, el: 'storm', src: 'spark' })) continue;
        // Storm on the frozen shatters it, on the burning flares; wet, it jumps (each wet one once a pulse).
        if (e.jolted !== cast) afflict(w, e, 'storm', z.n ?? STORM_RING.zap, { cast });
        if (z.big && e.act !== 'pinned') stun(e, z.owner, w.now, STORM_RING.bigStun, w.ev);
      }
    }
  }
}
