/**
 * The Ranger's MARK (Kyle, 2026-11-05; numbers in shared/signs.ts MARK_SIGN): a tap marks the goblin
 * nearest the aim within reach for a while. It takes more damage from everyone (sim/damage.ts), this
 * Ranger's arrows and bolts bend a little toward it in flight (`bendShot`, from sim/bolts.ts), and the
 * hound goes for it. One mark a Ranger. The mark is on the goblin itself, so every screen draws it.
 */
import { MARK_SIGN, isMarked } from '../shared/signs';
import { isDead } from './damage';
import type { Bolt, Enemy, FightEvent, Hero, Intent } from './types';

/** The goblin meant: nearest the pointer on a laptop; on a phone the one faced (nearest of those), else the nearest. */
function markFor(h: Hero, enemies: Enemy[], aim: Intent | undefined): Enemy | null {
  const near = enemies.filter((e) => !isDead(e) && e.kind !== 'nest' && e.act !== 'carried' && Math.hypot(e.x - h.x, e.y - h.y) <= MARK_SIGN.range + e.radius);
  if (!near.length) return null;
  const by = (f: (e: Enemy) => number) => near.reduce((a, b) => (f(b) < f(a) ? b : a));
  if (aim && (aim.ax || aim.ay)) return by((e) => Math.hypot(e.x - h.x - aim.ax, e.y - h.y - aim.ay));
  const ahead = near.filter((e) => {
    const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy) || 1;
    return Math.acos(Math.max(-1, Math.min(1, (dx * h.fx + dy * h.fy) / d))) <= MARK_SIGN.face;
  });
  const dist = (e: Enemy) => Math.hypot(e.x - h.x, e.y - h.y);
  return ahead.length ? ahead.reduce((a, b) => (dist(b) < dist(a) ? b : a)) : by(dist);
}

/** Mark one: false (nothing spent) when there's nothing in reach. */
export function markGoblin(h: Hero, enemies: Enemy[], aim: Intent | undefined, now: number, ev: FightEvent[]): boolean {
  const e = markFor(h, enemies, aim);
  if (!e) return ev.push({ k: 'nosign', x: h.x, y: h.y, id: h.id, why: 'mark' }), false;
  // One mark a Ranger: the old one comes off (cleared, not deleted, so a friend's screen hears of it).
  for (const o of enemies) if (o.markedBy === h.id) Object.assign(o, { markedBy: '', markedUntil: 0 });
  Object.assign(e, { markedBy: h.id, markedUntil: now + MARK_SIGN.time });
  ev.push({ k: 'hunted', x: e.x, y: e.y, id: h.id });
  // The hound, if it's out and not scared off, goes for it at once.
  const d = h.hound;
  if (d && d.state !== 'fled' && !d.down) Object.assign(d, { state: 'run', target: e.id, t: 0, bites: 0 }), ev.push({ k: 'bark', x: d.x, y: d.y });
  return true;
}

/** This Ranger's marked goblin, if it's still marked. */
export const markOf = (id: string, enemies: Enemy[], now: number) => enemies.find((e) => e.markedBy === id && isMarked(e, now) && !isDead(e));

/** An arrow or bolt in flight: turned a little toward its Ranger's mark, while the mark is near its path. */
export function bendShot(b: Bolt, enemies: Enemy[], now: number, dt: number): void {
  if (b.kind !== 'arrow' && b.kind !== 'bolt') return;
  const e = markOf(b.owner, enemies, now);
  if (!e) return;
  const tx = e.x - b.x, ty = e.y - b.y;
  if (Math.hypot(tx, ty) < 0.05) return;
  const cur = Math.atan2(b.dy, b.dx);
  let diff = Math.atan2(ty, tx) - cur;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > MARK_SIGN.cone) return;
  const a = cur + Math.sign(diff) * Math.min(Math.abs(diff), MARK_SIGN.bend * dt);
  b.dx = Math.cos(a);
  b.dy = Math.sin(a);
}
