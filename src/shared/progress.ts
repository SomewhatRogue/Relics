/**
 * A hero's progress between runs: gold, experience and levels, perks chosen at the trainer, and the
 * weapons found. Levels open choices (one of two perks), never a stat that quietly climbs.
 */
import type { Item } from './loot';
import { Rng } from './rng';
import type { WeaponId } from './weapons';

export type PerkId = 'tough' | 'endurance' | 'relicsworn' | 'footwork' | 'guard' | 'secondwind';

export const PERKS: Record<PerkId, { name: string; text: string }> = {
  tough: { name: 'TOUGH', text: '20 more health' },
  endurance: { name: 'ENDURANCE', text: 'Stamina comes back a third faster' },
  relicsworn: { name: 'RELIC SWORN', text: 'Relics recharge a fifth faster' },
  footwork: { name: 'FOOTWORK', text: 'Dodge again a fifth sooner' },
  guard: { name: 'GUARD', text: 'A slightly wider parry window' },
  secondwind: { name: 'SECOND WIND', text: 'Back on your feet sooner when downed' },
};
export const PERK_ORDER = Object.keys(PERKS) as PerkId[];
export const PERK = { tough: 20, endurance: 1.3, relicsworn: 0.8, footwork: 0.8, guard: 0.05, secondwind: 0.6 };

/** Chapter 1's level cap (it lifts when the council moves the story on). */
export const LEVEL_CAP = 10;
/** Total experience to reach a level: 100, 300, 600, 1000... */
export const xpFor = (level: number) => 50 * level * (level - 1);
export const levelFor = (xp: number) => {
  let l = 1;
  while (l < LEVEL_CAP && xp >= xpFor(l + 1)) l++;
  return l;
};

export interface Profile {
  gold: number;
  xp: number;
  level: number;
  perks: PerkId[];
  /** Level ups not yet spent at the trainer. */
  picks: number;
  arms: Partial<Record<WeaponId, Item>>;
  weapon: WeaponId;
  runs: number;
}

export const newProfile = (): Profile => ({ gold: 0, xp: 0, level: 1, perks: [], picks: 0, arms: {}, weapon: 'sword', runs: 0 });

/** Add experience; returns how many levels were gained (each is a pick at the trainer). */
export function gainXp(p: Profile, n: number): number {
  p.xp += n;
  const l = levelFor(p.xp), gained = l - p.level;
  if (gained > 0) (p.level = l), (p.picks += gained);
  return gained;
}

/** The two perks the trainer offers for the next pick (ones not yet taken). */
export function perkOffer(p: Profile): PerkId[] {
  const left = PERK_ORDER.filter((k) => !p.perks.includes(k));
  return new Rng(p.level * 13 + p.perks.length * 7 + 3).shuffle(left).slice(0, 2);
}

/** Gold and experience for a kill. */
export const BOUNTY = { scrapper: { gold: 4, xp: 10 }, butcher: { gold: 30, xp: 60 }, boss: { gold: 80, xp: 150 }, rescue: 25, objective: 50 };
export const SHOP = { fine: 60, forged: 160 };
