/**
 * The Haulier's sparks (shared/haultune.ts `crank`, `sparks`): one shape for each place they'll fall, the
 * circle the room judges (sim/haulbook.ts) and the telegraph both views draw (client/scene.ts,
 * client/three/actors3d.ts), the same as the crank's own wind-up. Pure.
 */
import { HAULIER as H, HERO } from '../shared/tuning';
import { currentMap } from '../shared/arena';
import type { Enemy, EnemyAttack, Hero } from './types';

/** Where the sparks will fall: under each hero standing, and for one or two, `extra` more either side across. */
export function sparkSpots(e: Enemy, heroes: Hero[]): { x: number; y: number }[] {
  const m = currentMap(), up = heroes.filter((h) => h.act !== 'down' && !h.out && h.id !== 'squire'), out: { x: number; y: number }[] = [];
  const keep = (x: number, y: number) => out.length < H.sparks.most && out.push({ x: Math.max(1.2, Math.min(m.w - 1.2, x)), y: Math.max(1.2, Math.min(m.h - 1.2, y)) });
  for (const h of up) keep(h.x, h.y);
  if (up.length && up.length <= 2) {
    const h = up[0], dx = h.x - e.x, dy = h.y - e.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    for (const s of [1, -1].slice(0, H.sparks.extra)) keep(h.x + nx * s * H.sparks.apart, h.y + ny * s * H.sparks.apart);
  }
  return out;
}

/** Each spot as a round, striped telegraph while the crank winds up (after the pose's tell); none otherwise. */
export function sparkShapes(e: Enemy): EnemyAttack[] {
  const a = e.attack, spots = e.boss?.sparks;
  if (!a || (a.boss as string | undefined) !== 'crank' || !spots?.length || a.t >= a.windup) return [];
  return spots.map((p) => ({
    kind: 'slam', t: a.t, tell: a.tell, windup: a.windup, active: 0.05, recover: 0, dmg: H.sparks.dmg, knock: H.sparks.knock, unblockable: true,
    dx: 0, dy: 1, ox: p.x, oy: p.y, range: H.sparks.r, arc: 360, cx: p.x, cy: p.y, radius: H.sparks.r, done: false,
  }));
}

/** Whether a hero is caught in one: its edge inside the circle. */
export const inSparks = (p: { x: number; y: number }, h: Hero) => Math.hypot(h.x - p.x, h.y - p.y) <= H.sparks.r + HERO.radius;
