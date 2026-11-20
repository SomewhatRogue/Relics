/**
 * Hungry pieces' bites in the fight (shared/hunger.ts): less health, slower stamina or magic, a dearer dodge
 * (all on the hero's stats, sim/gearstats.ts), and less healing on you (`healBite`, read where heals land).
 */
import type { GearStats } from '../shared/tuning';
import { biteOn } from '../shared/hunger';
import { WEAPONS } from '../shared/weapons';
import type { Hero } from './types';

const wornBy = (h: Hero) => [h.arms?.[h.weapon], h.armor, h.legs, ...(h.rings ?? [])];
const clsOf = (h: Hero) => WEAPONS[h.weapon]?.cls;

/** The stat bites, on top of everything else the hero's stats add up to. */
export function withBites(s: GearStats, h: Hero): void {
  const w = wornBy(h), c = clsOf(h), frail = biteOn(w, 'frail', c), winded = biteOn(w, 'winded', c), clumsy = biteOn(w, 'clumsy', c);
  if (frail) s.health -= frail * Math.max(0, (h.baseHp ?? 0) + s.health);
  if (winded) s.breath = (1 + s.breath) * (1 - winded) - 1;
  if (clumsy) s.dodgeCost *= 1 + clumsy;
}

/** What's left of a heal on `h`: 1 with no STARVED bite worn. */
export const healBite = (h: Hero | undefined) => (h ? 1 - biteOn(wornBy(h), 'starved', clsOf(h)) : 1);
