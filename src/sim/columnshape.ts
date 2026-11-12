/**
 * A dripstone column falling (shared/listentune.ts `column`): its lane, one shape for the room to judge
 * (sim/columns.ts) and both views to draw (client/scene.ts, client/three/actors3d.ts), striped like any floor you
 * can only step out of, filling over `fall` s. The lane runs from the column's foot the way it leans. Pure.
 */
import { LISTENER as L, HERO } from '../shared/tuning';
import type { EnemyAttack, Prop } from './types';

/** A column set falling and not yet landed. */
export const falling = (p: Prop) => p.kind === 'column' && !p.fallen && p.fallAt !== undefined && !!p.lean;

/** Where the lane runs: from the foot, along the lean, `len` long and `width` across. */
export function columnLane(p: Prop): { ox: number; oy: number; dx: number; dy: number; len: number; half: number } {
  const l = p.lean ?? { x: 0, y: 1 }, n = Math.hypot(l.x, l.y) || 1;
  return { ox: p.x, oy: p.y, dx: l.x / n, dy: l.y / n, len: L.column.len, half: L.column.width / 2 };
}

/** Is a body of radius `r` at (x, y) in the lane? */
export function inColumnLane(p: Prop, x: number, y: number, r: number): boolean {
  const a = columnLane(p), rx = x - a.ox, ry = y - a.oy, along = rx * a.dx + ry * a.dy, across = Math.abs(-rx * a.dy + ry * a.dx);
  return along >= -r && along <= a.len + r && across <= a.half + r;
}
export const heroInLane = (p: Prop, h: { x: number; y: number }) => inColumnLane(p, h.x, h.y, HERO.radius);

/** Each falling column's lane as a striped telegraph (a charge's lane), on the clock of its fall. */
export function columnShapes(props: Prop[], now: number): EnemyAttack[] {
  const out: EnemyAttack[] = [];
  for (const p of props) {
    if (!falling(p) || now >= p.fallAt!) continue;
    const a = columnLane(p);
    out.push({
      kind: 'charge', t: Math.max(0, now - (p.fallAt! - L.column.fall)), windup: L.column.fall, active: 0.2, recover: 0, dmg: L.column.dmg, knock: L.column.knock, unblockable: true,
      dx: a.dx, dy: a.dy, ox: a.ox, oy: a.oy, range: a.len, arc: 0, cx: a.ox, cy: a.oy, radius: a.half, done: false,
    });
  }
  return out;
}
