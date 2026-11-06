/** What a hero's worn gear adds up to (shared/gear.ts), read wherever the fight uses a number. */
import { cutMax, drilled, gearStats, perkFx, type Fx, type GearStats } from '../shared/tuning';
import type { Hero } from './types';

type Stats = GearStats & { crit: number; fx: Fx };
const cache = new WeakMap<Hero, { key: unknown[]; s: Stats }>();
/** The hero's gear stats; recomputed only when what they wear changes. */
/** Gear and drills together: power, health, speed and wind from the trainer on top of what's worn. */
export function statsOf(h: Hero): Stats {
  const w = h.arms?.[h.weapon], rings = h.rings ?? [], c = cache.get(h), d = h.drills;
  if (c && c.key[0] === w && c.key[1] === h.armor && c.key[2] === rings[0] && c.key[3] === rings[1] && c.key[4] === d && c.key[5] === (h.perks ?? []).join()) return c.s;
  const g = gearStats(w, h.armor, rings);
  const fx = perkFx(h.perks);
  const s = { ...g, fx, damage: g.damage + drilled(d, 'power'), health: g.health + drilled(d, 'health'), speed: g.speed * (1 + drilled(d, 'speed')), breath: g.breath + drilled(d, 'wind'), crit: g.crit + drilled(d, 'crit') };
  withKnacks(s, fx);
  cache.set(h, { key: [w, h.armor, rings[0], rings[1], d, (h.perks ?? []).join()], s });
  return s;
}

/** Health from gear on top of the hero's own, less what being raised took this job (sim/raise.ts); keeps the hurt the same when it changes. */
export function refreshHealth(h: Hero): void {
  const max = cutMax(h.baseHp + statsOf(h).health, h.hpCut), lost = h.maxHp - h.hp;
  h.maxHp = max;
  h.hp = Math.max(1, Math.min(max, max - lost));
}

/** Knacks on top (shared/perks.ts): gear-named ones add as gear does; health stays in the hero's own (baseHp). */
function withKnacks(s: GearStats & { crit: number }, f: Fx): void {
  for (const k of ['damage', 'quick', 'reach', 'draw', 'knock', 'breath', 'dodge', 'focus', 'mending', 'crit'] as const) s[k] += f[k] ?? 0;
  s.speed *= 1 + (f.foot ?? 0);
  s.taken *= 1 - (f.tough ?? 0);
}

/** A hero's knacks, for those that aren't gear numbers (shared/perks.ts names where each is read). */
export const knack = (h: Hero, k: keyof Fx) => statsOf(h).fx[k] ?? 0;
