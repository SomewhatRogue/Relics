/**
 * The staff's rings, in the room (numbers: shared/spellbook.ts STAFF_RING, FLAME_RING, STORM_RING):
 * raised round where the Mage stands, never aimed (Kyle: "wall of fire seems hard to aim"). The ring of
 * fire is a band: anything in it is scorched and set alight, again whenever its burn has gone out, so a
 * goblin has to cross it to reach you. The charged ring is the whole round: every half second anything
 * inside is zapped and flinches (stunned, let go on the flash). They live in the room's zones, so a
 * guest sees the same ring that is judged (client/spellground.ts draws it from these numbers).
 */
import { FLAME_RING, STORM_RING, type Augment } from '../shared/tuning';
import { ringCatch } from './catching';
import { damage, isDead, isDummy } from './damage';
import { afflict, burning, type World } from './elements';
import { stun } from './stuns';
import type { Enemy, Hero, Zone } from './types';

/** In the ring of fire's band (its middle `r` round, FLAME_RING.band deep), body and all. */
export const inBand = (z: Zone, e: { x: number; y: number }, rad: number) => Math.abs(Math.hypot(e.x - z.x, e.y - z.y) - z.r) <= FLAME_RING.band / 2 + rad;
/** Inside the charged ring. */
export const inRing = (z: Zone, e: { x: number; y: number }, rad: number) => Math.hypot(e.x - z.x, e.y - z.y) <= z.r + rad;

const ring = (h: Hero, kind: 'flamering' | 'stormring', el: Augment, r: number, life: number, n: number, now: number): Zone =>
  ({ kind, x: h.x, y: h.y, r, at: now, next: now, until: now + life, owner: h.id, el, big: h.perfect, n });

/** The ring of fire, `r` round. `mult`: the hero's damage now (a primed spell's too). */
export function flameRing(h: Hero, r: number, mult: number, w: World): Zone {
  w.ev.push({ k: 'spell', x: h.x, y: h.y, dx: h.fx, dy: h.fy, el: 'fire', what: 'flamering', r, big: h.perfect });
  // (Fire on a wooden wall now and then catches: sim/catching.ts.)
  ringCatch(h.x, h.y, r, w);
  return ring(h, 'flamering', 'fire', r, h.perfect ? FLAME_RING.bigLife : FLAME_RING.life, Math.max(1, Math.round(FLAME_RING.scorch * mult)), w.now);
}

/** The charged ring, `r` round. */
export function stormRing(h: Hero, r: number, mult: number, w: World): Zone {
  w.ev.push({ k: 'spell', x: h.x, y: h.y, dx: h.fx, dy: h.fy, el: 'storm', what: 'stormring', r, big: h.perfect });
  return ring(h, 'stormring', 'storm', r, h.perfect ? STORM_RING.bigLife : STORM_RING.life, Math.max(1, Math.round(STORM_RING.zap * mult)), w.now);
}

const reached = (e: Enemy) => !isDead(e) && e.act !== 'carried' && !isDummy(e);

/** Each ring, each tick. */
export function stepRings(zones: Zone[], w: World): void {
  for (const z of zones) {
    if (w.now >= z.until) continue;
    if (z.kind === 'flamering') {
      for (const e of w.enemies) {
        if (!reached(e) || burning(e, w.now) || !inBand(z, e, e.radius)) continue;
        e.lastBy = z.owner;
        if (damage(e, z.n ?? FLAME_RING.scorch, w.now, w.ev, { el: 'fire', how: 'burn', src: 'flamering' })) continue;
        afflict(w, e, 'fire', z.n ?? FLAME_RING.scorch);
      }
    } else if (z.kind === 'stormring' && w.now >= z.next) {
      z.next += STORM_RING.every;
      for (const e of w.enemies) {
        if (!reached(e) || !inRing(z, e, e.radius)) continue;
        e.lastBy = z.owner;
        const a = Math.atan2(e.y - z.y, e.x - z.x), ex = z.x + Math.cos(a) * z.r, ey = z.y + Math.sin(a) * z.r;
        w.ev.push({ k: 'shock', x: ex, y: ey, x2: e.x, y2: e.y });
        if (damage(e, z.n ?? STORM_RING.zap, w.now, w.ev, { flinch: z.big ? 0 : STORM_RING.flinch, el: 'storm', src: 'spark' })) continue;
        // Storm on the frozen shatters it, on the burning flares (no jumping on: the ring is its own reach).
        afflict(w, e, 'storm', z.n ?? STORM_RING.zap, 0);
        if (z.big && e.act !== 'pinned') stun(e, z.owner, w.now, STORM_RING.bigStun, w.ev);
      }
    }
  }
}
