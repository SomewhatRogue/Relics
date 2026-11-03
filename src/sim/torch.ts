/**
 * Burning a nest out up close (Kyle, 2026-11-03). Any hero who stands right by a nest and presses GRAB
 * crouches and sets it alight: NEST.light seconds of staying put (a hit, a swing, a dodge or a step
 * away puts it out, and it starts again from nothing). Alight, it hatches nothing (a wave swelling in
 * it is cut short), the spiders on it catch (the room's fire spreads by touch, sim/elements.ts), and
 * NEST.burn seconds later it's ash: dead and counted like any nest. Numbers: shared/spiders.ts.
 */
import { NEST } from '../shared/tuning';
import { isDead, kill } from './damage';
import type { Enemy, FightEvent, Hero } from './types';

const near = (h: Hero, n: Enemy) => (h.z ?? 0) === (n.z ?? 0) && Math.hypot(h.x - n.x, h.y - n.y) <= NEST.reach;
const unlit = (n: Enemy) => n.kind === 'nest' && !isDead(n) && !n.ashAt;

/** The nest `h` could set alight now (for the BURN button), if any. */
export const torchable = (h: Hero, enemies: Enemy[]): Enemy | undefined =>
  h.id === 'squire' || h.act !== 'idle' ? undefined : enemies.find((n) => unlit(n) && near(h, n));

/** GRAB by a nest: start setting it alight. False if there's no nest close enough. */
export function startTorch(h: Hero, enemies: Enemy[], ev: FightEvent[]): boolean {
  const n = torchable(h, enemies);
  if (!n) return false;
  h.grabQueuedAt = -9;
  // Someone else already at it: the press is spent, theirs goes on.
  if (n.lighter && n.lighter !== h.id) return true;
  if (n.lighter !== h.id) Object.assign(n, { lighter: h.id, lightT: 0 });
  ev.push({ k: 'kindling', x: n.x, y: n.y, by: h.id });
  return true;
}

/** Lighting, burning and burning out, once a tick. */
export function stepTorch(enemies: Enemy[], heroes: Hero[], now: number, dt: number, ev: FightEvent[]): void {
  for (const n of enemies) {
    if (n.kind !== 'nest') continue;
    if (n.lighter) light(n, heroes.find((h) => h.id === n.lighter), now, dt, ev);
    if (!n.ashAt || isDead(n)) continue;
    // Alight: nothing puts it out, and it burns down to nothing.
    n.burnUntil = Math.max(n.burnUntil, n.ashAt);
    n.hp = Math.min(n.hp, Math.max(1, Math.ceil((n.maxHp * (n.ashAt - now)) / NEST.burn)));
    if (now >= n.ashAt) kill(n, ev, 'burn');
  }
}

function light(n: Enemy, h: Hero | undefined, now: number, dt: number, ev: FightEvent[]): void {
  const still = !!h && unlit(n) && h.act === 'idle' && !h.moving && near(h, n);
  if (!still) {
    if (h) h.stoop = 0;
    return void Object.assign(n, { lighter: '', lightT: 0 });
  }
  h.stoop = 1;
  n.lightT = (n.lightT ?? 0) + dt;
  if (n.lightT < NEST.light) return;
  // It catches.
  h.stoop = 0;
  Object.assign(n, { lighter: '', lightT: 0, ashAt: now + NEST.burn, burnUntil: now + NEST.burn, burnNext: now + NEST.burn, lastBy: h.id, alert: true });
  ev.push({ k: 'torched', x: n.x, y: n.y, by: h.id });
}
