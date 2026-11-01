/** Bodies in the room: knockback slides, wall slams, and nobody standing inside anybody else. */
import { collide } from '../shared/arena';
import { HERO, KNOCK } from '../shared/tuning';
import type { Body, Enemy, Hero, Prop } from './types';

/** Shove a body along (dx, dy) (a unit vector) by `impulse`, lightened or deadened by its weight. */
export function shove(b: Body, dx: number, dy: number, impulse: number, weight: number): void {
  if (!isFinite(weight)) return;
  b.kvx += (dx * impulse) / weight;
  b.kvy += (dy * impulse) / weight;
}

/** Move a sliding body; returns its speed if it was slammed into a wall or pillar. */
export function slide(b: Body, r: number, dt: number): number {
  const speed = Math.hypot(b.kvx, b.kvy);
  if (speed < 0.05) {
    b.kvx = b.kvy = 0;
    return 0;
  }
  const x0 = b.x, y0 = b.y, want = speed * dt;
  b.x += b.kvx * dt;
  b.y += b.kvy * dt;
  collide(b, r);
  const moved = Math.hypot(b.x - x0, b.y - y0);
  if (moved < want * 0.5 && speed >= KNOCK.wallSpeed) {
    b.kvx = b.kvy = 0;
    return speed;
  }
  // Thrown bodies barely slow until they land.
  const airborne = (b.air ?? 0) > 0;
  if (airborne) b.air! -= dt;
  const f = Math.max(0, 1 - (airborne ? 1.2 : KNOCK.friction) * dt);
  b.kvx *= f;
  b.kvy *= f;
  return 0;
}

/** Push overlapping bodies apart, the lighter one moving more. Rolling heroes pass through. */
export function separate(heroes: Hero[], enemies: Enemy[], props: Prop[] = []): void {
  const list: { b: Body; r: number; inv: number }[] = [];
  for (const h of heroes) if (h.act !== 'roll' && h.act !== 'down') list.push({ b: h, r: HERO.radius, inv: 1 / HERO.weight });
  for (const e of enemies) {
    if (e.act === 'dead' || e.act === 'carried') continue;
    list.push({ b: e, r: e.radius, inv: isFinite(e.weight) && e.act !== 'pinned' ? 1 / e.weight : 0 });
  }
  for (const p of props) if (!p.broken && !p.lifted) list.push({ b: p, r: p.radius, inv: 1 / p.weight });
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const p = list[i], q = list[j], sum = p.inv + q.inv;
    if (!sum) continue;
    const dx = q.b.x - p.b.x, dy = q.b.y - p.b.y, d = Math.hypot(dx, dy), min = p.r + q.r;
    if (d >= min) continue;
    const nx = d > 1e-6 ? dx / d : 1, ny = d > 1e-6 ? dy / d : 0, over = min - d;
    p.b.x -= nx * over * (p.inv / sum);
    p.b.y -= ny * over * (p.inv / sum);
    q.b.x += nx * over * (q.inv / sum);
    q.b.y += ny * over * (q.inv / sum);
  }
  for (const it of list) collide(it.b, it.r);
}
