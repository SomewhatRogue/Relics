/**
 * Hungry pieces' bites in the fight (shared/hunger.ts): less health, slower stamina or magic, a dearer dodge
 * (all on the hero's stats, sim/gearstats.ts), less healing on you (`healBite`, where heals land), seen from
 * further off (`seenBy`, sim/enemies.ts), coin eaten (`goldKeep`, sim/pickups.ts). And the Want's bands
 * (shared/corrupt.ts): hungry pieces give more the higher it is, goblins see you sooner, others' heals do less.
 */
import type { GearStats } from '../shared/tuning';
import { biteOn } from '../shared/hunger';
import { CORRUPT, bandOf, isCorrupt } from '../shared/corrupt';
import { WEAPONS } from '../shared/weapons';
import { VOWED_FX } from '../shared/vowed';
import { vowedOn } from './vowed';
import type { Hero } from './types';

const wornBy = (h: Hero) => [h.arms?.[h.weapon], h.armor, h.legs, ...(h.rings ?? [])];
const clsOf = (h: Hero) => WEAPONS[h.weapon]?.cls;

/** The stat bites, on top of everything else the hero's stats add up to. */
export function withBites(s: GearStats, h: Hero): void {
  const w = wornBy(h), c = clsOf(h), frail = biteOn(w, 'frail', c), winded = biteOn(w, 'winded', c), clumsy = biteOn(w, 'clumsy', c);
  if (frail) s.health -= frail * Math.max(0, (h.baseHp ?? 0) + s.health);
  if (winded) s.breath = (1 + s.breath) * (1 - winded) - 1;
  if (clumsy) s.dodgeCost *= 1 + clumsy;
  // The Want's gift: each hungry piece's own modifiers count for more (on top of the caps, as hunger is).
  const gift = bandOf(h.want).gift;
  if (gift) for (const it of w) if (it?.quality === 'hungry') for (const m of it.mods ?? []) if (m.id in s) (s as Record<string, number>)[m.id] += m.v * gift;
}

/** What's left of a heal on `h`: 1 with no STARVED bite worn. */
export const healBite = (h: Hero | undefined) => (h ? 1 - biteOn(wornBy(h), 'starved', clsOf(h)) : 1);

/** How much further off goblins notice `h`: the Want's band and any NOTICED bite (1 for neither). */
export const seenBy = (h: Hero) => 1 + bandOf(h.want).seen + biteOn(wornBy(h), 'noticed', clsOf(h));
/** What `h` keeps of coin picked up: a GREEDY bite eats its share, THE TITHE RING a tenth (sim/vowed.ts). */
export const goldKeep = (h: Hero) => (1 - biteOn(wornBy(h), 'greedy', clsOf(h))) * (vowedOn(h, 'tithe') ? VOWED_FX.kills : 1);
/** What a heal from someone else does on `h`: half at the Want's top band. */
export const othersHeal = (h: Hero) => bandOf(h.want).othersHeal;
/** A named butcher comes for a corrupt hero first: how much nearer it counts them (0 for the clean, or any other goblin). */
export const hunted = (e: { name?: string }, h: Hero) => (e.name && isCorrupt(h) ? CORRUPT.pull : 0);
