/**
 * The staff's wall, in the room (numbers: shared/mage.ts WALL). Raised in front of the Mage across where
 * they face, in the element they're casting: fire sets what crosses it burning; frost chills what touches
 * it and holds the small goblins back, a solid face to them; storm shocks what's in it. Released on the
 * white flash it's the big wall. It lives with the skill areas in the room's zones, so a guest sees it.
 */
import { FROST, WALL, type Augment } from '../shared/tuning';
import { castElement } from './channel';
import { damage, isDead, isDummy } from './damage';
import { afflict, burning, type World } from './elements';
import type { Enemy, FightEvent, Hero, Zone } from './types';

/** Where `p` sits against the wall: along its face (u) and out from it (v, away from the caster). */
const local = (z: Zone, p: { x: number; y: number }) => {
  const dx = p.x - z.x, dy = p.y - z.y, nx = z.ax ?? 0, ny = z.ay ?? 1;
  return { u: dx * -ny + dy * nx, v: dx * nx + dy * ny };
};

/** In (or touching) the wall. */
export function inWall(z: Zone, e: { x: number; y: number }, r: number): boolean {
  const { u, v } = local(z, e);
  return Math.abs(u) <= z.r + r && Math.abs(v) <= (z.th ?? WALL.thick / 2) + r;
}

/** Raise the wall: its length by the hold, the big one on the white flash. */
export function raiseWall(h: Hero, w: World): Zone {
  const el: Augment = castElement(h), big = h.perfect;
  const len = big ? WALL.bigLen : WALL.len + (WALL.lenFull - WALL.len) * Math.min(1, h.power);
  const z: Zone = {
    kind: 'wall', x: h.x + h.fx * WALL.ahead, y: h.y + h.fy * WALL.ahead, r: len / 2, th: (big ? WALL.bigThick : WALL.thick) / 2,
    ax: h.fx, ay: h.fy, big, at: w.now, next: w.now, until: w.now + (big ? WALL.bigLife : WALL.life), owner: h.id, el,
  };
  w.ev.push({ k: 'wallup', x: z.x, y: z.y, dx: h.fx, dy: h.fy, el, len, big });
  return z;
}

/** Frost slows (a chill, never a freeze on its own): fire on the chilled is steam, as ever. */
export function chill(w: World, e: Enemy): void {
  if (burning(e, w.now)) return afflict(w, e, 'frost', 0);
  if (e.chillUntil <= w.now) w.ev.push({ k: 'chill', x: e.x, y: e.y });
  e.chillUntil = Math.max(e.chillUntil, w.now + FROST.chill);
}

/** A frost wall's face is solid to a small goblin: it's put back on the side it came from. */
function holdBack(z: Zone, e: Enemy): void {
  const { u, v } = local(z, e), nx = z.ax ?? 0, ny = z.ay ?? 1, th = (z.th ?? 0) + e.radius, s = v >= 0 ? 1 : -1;
  if (Math.abs(u) > z.r + e.radius * 0.5 || Math.abs(v) >= th) return;
  e.x += nx * (s * th - v);
  e.y += ny * (s * th - v);
  // Its push against the face is gone; along the face it keeps.
  const kn = e.kvx * nx + e.kvy * ny;
  if (kn * s < 0) (e.kvx -= kn * nx), (e.kvy -= kn * ny);
}

/** The nearest point of the wall's line to `e`, for the shock's arc. */
function nearest(z: Zone, e: Enemy): { x: number; y: number } {
  const u = Math.max(-z.r, Math.min(z.r, local(z, e).u)), tx = -(z.ay ?? 1), ty = z.ax ?? 0;
  return { x: z.x + tx * u, y: z.y + ty * u };
}

/** Each wall, each tick: frost holds the small ones back; every WALL.every s it burns, chills or shocks. */
export function stepWalls(zones: Zone[], w: World): void {
  for (const z of zones) {
    if (z.kind !== 'wall' || w.now >= z.until) continue;
    if (z.el === 'frost') for (const e of w.enemies) if (!isDead(e) && e.act !== 'carried' && e.weight <= WALL.holds && (e.z ?? 0) === 0) holdBack(z, e);
    if (w.now < z.next) continue;
    z.next += WALL.every;
    for (const e of w.enemies) {
      if (isDead(e) || e.act === 'carried' || isDummy(e) || !inWall(z, e, e.radius)) continue;
      e.lastBy = z.owner;
      if (z.el === 'fire') {
        if (damage(e, WALL.fire, w.now, w.ev, { tick: true, el: 'fire', how: 'burn' })) continue;
        if (!burning(e, w.now)) afflict(w, e, 'fire', WALL.fire);
      } else if (z.el === 'frost') chill(w, e);
      else {
        const p = nearest(z, e);
        w.ev.push({ k: 'shock', x: p.x, y: p.y, x2: e.x, y2: e.y } as FightEvent);
        damage(e, WALL.shock, w.now, w.ev, { flinch: WALL.flinch, el: 'storm', src: 'spark' });
      }
    }
  }
}
