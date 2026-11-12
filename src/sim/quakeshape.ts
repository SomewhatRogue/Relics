/**
 * An ENRAGED Doorkeeper's QUAKE (shared/bosstune.ts DOORKEEPERS.quake): both doors driven into the floor and
 * the crack running at its hero, DOORKEEPERS.quakeN striped circles DOORKEEPERS.quakeStep apart along the
 * way it faces, each landing DOORKEEPERS.quakeGap s after the one before. One source: the room judges these
 * circles (sim/doorpair.ts) and both views draw them (client/quakedraw.ts, client/three/actors3d.ts). Pure.
 */
import { DOORKEEPERS as D, HERO } from '../shared/tuning';
import type { Enemy, EnemyAttack, Hero } from './types';

const quaking = (e: Enemy) => !!e.attack && (e.attack.boss as string | undefined) === 'quake';

/** Circle `i` (from 0, nearest first): where it is and when it lands (its own wind-up, on the quake's clock). */
export function quakeAt(e: Enemy, i: number): { x: number; y: number; at: number } {
  const a = e.attack!, d = D.quakeStep * (i + 1);
  return { x: a.ox + a.dx * d, y: a.oy + a.dy * d, at: a.windup + i * D.quakeGap };
}

/** Each circle still to land, as a round striped telegraph. */
export function quakeShapes(e: Enemy): EnemyAttack[] {
  if (!quaking(e)) return [];
  const a = e.attack!, out: EnemyAttack[] = [];
  for (let i = 0; i < D.quakeN; i++) {
    const q = quakeAt(e, i);
    if (a.t >= q.at) continue;
    out.push({ kind: 'slam', t: a.t, tell: a.tell, windup: q.at, active: 0.05, recover: 0, dmg: D.quake.dmg, knock: D.quake.knock, unblockable: true,
      dx: a.dx, dy: a.dy, ox: q.x, oy: q.y, range: D.quake.radius!, arc: 360, cx: q.x, cy: q.y, radius: D.quake.radius!, done: false });
  }
  return out;
}

/** Whether a hero is caught: its edge inside the circle. */
export const inQuake = (q: { x: number; y: number }, h: Hero) => Math.hypot(h.x - q.x, h.y - q.y) <= D.quake.radius! + HERO.radius;
