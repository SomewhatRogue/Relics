/**
 * Poison puddles: where the brood mother's glob lands (its impact this tick, at the very spot its
 * telegraph showed), a green pool lies PUDDLE.life seconds. Every PUDDLE.every seconds of the room's
 * clock, each hero standing in one (on the ground, not mid-dodge) takes a stack of poison.
 */
import { HERO, PUDDLE } from '../shared/tuning';
import { poison } from './poison';
import type { FightEvent, Hero, Puddle } from './types';

let nextId = 1;

/** New puddles from this tick's landed globs, poison for whoever stands in one; the dried ones go. */
export function stepPuddles(puddles: Puddle[], heroes: Hero[], now: number, dt: number, ev: FightEvent[]): Puddle[] {
  for (const e of [...ev]) if (e.k === 'impact' && e.kind === 'spit') {
    puddles.push({ id: nextId++, x: e.x, y: e.y, r: PUDDLE.radius, until: now + PUDDLE.life });
    ev.push({ k: 'splat', x: e.x, y: e.y });
  }
  const live = puddles.filter((p) => p.until > now);
  if (!live.length || Math.floor(now / PUDDLE.every) === Math.floor((now - dt) / PUDDLE.every)) return live;
  for (const h of heroes) {
    if (h.act === 'roll' || (h.z ?? 0) > 0) continue;
    if (live.some((p) => Math.hypot(h.x - p.x, h.y - p.y) <= p.r + HERO.radius * 0.5)) poison(h, now, ev);
  }
  return live;
}
