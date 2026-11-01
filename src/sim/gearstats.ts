/** What a hero's worn gear adds up to (shared/gear.ts), read wherever the fight uses a number. */
import { gearStats, type GearStats } from '../shared/tuning';
import type { Hero } from './types';

const cache = new WeakMap<Hero, { key: unknown[]; s: GearStats }>();
/** The hero's gear stats; recomputed only when what they wear changes. */
export function statsOf(h: Hero): GearStats {
  const w = h.arms?.[h.weapon], rings = h.rings ?? [], c = cache.get(h);
  if (c && c.key[0] === w && c.key[1] === h.armor && c.key[2] === rings[0] && c.key[3] === rings[1]) return c.s;
  const s = gearStats(w, h.armor, rings);
  cache.set(h, { key: [w, h.armor, rings[0], rings[1]], s });
  return s;
}

/** Health from gear on top of the hero's own; keeps the hurt the same when it changes. */
export function refreshHealth(h: Hero): void {
  const max = h.baseHp + statsOf(h).health, lost = h.maxHp - h.hp;
  h.maxHp = max;
  h.hp = Math.max(1, Math.min(max, max - lost));
}
