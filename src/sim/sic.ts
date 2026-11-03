/**
 * SEND THE HOUND: the Ranger points and the hound goes, at once and faster than it runs on its own,
 * at the goblin they face (back from wherever it bolted to, if it had). Reaching it, it pins a small
 * one flat and hangs off a big one, slowing it, for SIC.pin; then it worries it as it always does.
 */
import { HOUND, SIC } from '../shared/tuning';
import { isDead } from './damage';
import { faced } from './facing';
import type { Enemy, FightEvent, Hero } from './types';

export function sendHound(h: Hero, enemies: Enemy[], now: number, ev: FightEvent[]): void {
  const prey = faced(h, enemies, SIC.range);
  ev.push({ k: 'sic', x: h.x, y: h.y });
  if (!prey) return;
  const d = (h.hound ??= { x: h.x - h.fx, y: h.y - h.fy + 0.6, fx: h.fx, fy: h.fy, state: 'heel', target: 0, t: 0, next: 0, back: 0, bites: 0, moving: false });
  Object.assign(d, { state: 'run', target: prey.id, t: 0, bites: 0, pin: true, down: false });
  ev.push({ k: 'bark', x: d.x, y: d.y });
}

/** Each tick, before the hound's own step: a sent hound runs faster, and pins what it reaches. */
export function stepSic(h: Hero, enemies: Enemy[], now: number, dt: number, ev: FightEvent[]): void {
  const d = h.hound;
  if (!d?.pin) return;
  const prey = enemies.find((e) => e.id === d.target && !isDead(e));
  if (!prey || d.state === 'heel' || d.state === 'fled') return void (d.pin = false);
  const dx = prey.x - d.x, dy = prey.y - d.y, l = Math.hypot(dx, dy);
  // The extra pace on top of its own run (ranger.ts moves it HOUND.speed * 1.3).
  if (d.state === 'run' && l > 0.65) {
    const k = Math.min(l - 0.6, HOUND.speed * 1.3 * (SIC.speed - 1) * dt) / (l || 1);
    (d.x += dx * k), (d.y += dy * k);
  }
  if (Math.hypot(prey.x - d.x, prey.y - d.y) > 0.7) return;
  d.pin = false;
  prey.snareUntil = Math.max(prey.snareUntil, now + SIC.pin);
  prey.lastBy = h.id;
  if (prey.weight <= 1) Object.assign(prey, { attack: null, act: 'stunned', actT: 0, actDur: SIC.pin });
  ev.push({ k: 'houndpin', x: prey.x, y: prey.y });
}
