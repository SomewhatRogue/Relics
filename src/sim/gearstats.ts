/** What a hero's worn gear adds up to (shared/gear.ts), read wherever the fight uses a number. */
import { drilled, gearStats, type GearStats } from '../shared/tuning';
import type { Hero } from './types';

const cache = new WeakMap<Hero, { key: unknown[]; s: GearStats & { crit: number } }>();
/** The hero's gear stats; recomputed only when what they wear changes. */
/** Gear and drills together: power, health, speed and wind from the trainer on top of what's worn. */
export function statsOf(h: Hero): GearStats & { crit: number } {
  const w = h.arms?.[h.weapon], rings = h.rings ?? [], c = cache.get(h), d = h.drills;
  if (c && c.key[0] === w && c.key[1] === h.armor && c.key[2] === rings[0] && c.key[3] === rings[1] && c.key[4] === d) return c.s;
  const g = gearStats(w, h.armor, rings);
  const s = { ...g, damage: g.damage + drilled(d, 'power'), health: g.health + drilled(d, 'health'), speed: g.speed * (1 + drilled(d, 'speed')), breath: g.breath + drilled(d, 'wind'), crit: drilled(d, 'crit') };
  cache.set(h, { key: [w, h.armor, rings[0], rings[1], d], s });
  return s;
}

/** Health from gear on top of the hero's own; keeps the hurt the same when it changes. */
export function refreshHealth(h: Hero): void {
  const max = h.baseHp + statsOf(h).health, lost = h.maxHp - h.hp;
  h.maxHp = max;
  h.hp = Math.max(1, Math.min(max, max - lost));
}
