/**
 * A hero's progress between runs: gold, experience and levels, perks chosen at the trainer, and the
 * weapons found. Levels open choices (one of two perks), never a stat that quietly climbs.
 */
import type { Item } from './loot.js';
import { Rng } from './rng.js';
import type { Augment, RelicId } from './magic.js';
import { CLASS_KITS, type HeroClass, type WeaponId } from './weapons.js';

export type PerkId = 'tough' | 'endurance' | 'relicsworn' | 'footwork' | 'guard' | 'secondwind' | 'ironhide' | 'steadyhand' | 'shadowed' | 'focus' | 'devotion';

/** Every class's trainer teaches the shared perks and one of the class's own (`cls`). */
export const PERKS: Record<PerkId, { name: string; text: string; cls?: HeroClass }> = {
  tough: { name: 'TOUGH', text: '20 more health' },
  endurance: { name: 'ENDURANCE', text: 'Stamina comes back a third faster' },
  relicsworn: { name: 'RELIC-WISE', text: 'Your skill and relic recharge a fifth faster' },
  footwork: { name: 'FOOTWORK', text: 'Dodge again a fifth sooner' },
  guard: { name: 'GUARD', text: 'A slightly wider parry window' },
  secondwind: { name: 'SECOND WIND', text: 'Back on your feet sooner when downed' },
  ironhide: { name: 'IRONHIDE', text: 'Blocking costs a quarter less stamina', cls: 'WARRIOR' },
  steadyhand: { name: 'STEADY HAND', text: 'Bows draw a sixth faster', cls: 'RANGER' },
  shadowed: { name: 'SHADOWED', text: 'Backstabs hit half as hard again', cls: 'ROGUE' },
  focus: { name: 'FOCUS', text: 'The blink comes back a quarter sooner', cls: 'MAGE' },
  devotion: { name: 'DEVOTION', text: 'Blessed ground a quarter wider, the ward a quarter stronger', cls: 'HEALER' },
};
export const PERK_ORDER = Object.keys(PERKS) as PerkId[];
export const PERK = { tough: 20, endurance: 1.3, relicsworn: 0.8, footwork: 0.8, guard: 0.05, secondwind: 0.6, ironhide: 0.75, steadyhand: 0.85, shadowed: 0.5, focus: 0.75, devotion: 1.25 };

/** Chapter 1's level cap (it lifts when the council moves the story on). */
export const LEVEL_CAP = 10;
/** Total experience to reach a level: 100, 300, 600, 1000... */
export const xpFor = (level: number) => 50 * level * (level - 1);
export const levelFor = (xp: number) => {
  let l = 1;
  while (l < LEVEL_CAP && xp >= xpFor(l + 1)) l++;
  return l;
};

/** What a hero has done, for the Roll of the Brave (the leaderboard). */
export interface Stats { jobs: number; saved: number; kills: number; given: number; dens: number }
export const STAT_ORDER: (keyof Stats)[] = ['jobs', 'saved', 'given', 'kills', 'dens'];
export const STAT_NAME: Record<keyof Stats, string> = { jobs: 'JOBS DONE', saved: 'PEOPLE SAVED', given: 'GOLD GIVEN', kills: 'GOBLINS KILLED', dens: 'DENS BURNED' };
export const newStats = (): Stats => ({ jobs: 0, saved: 0, kills: 0, given: 0, dens: 0 });

export interface Profile {
  /** Who this hero is on the Roll of the Brave (made once, never shown). */
  id: string;
  /** The hero's name, and the class chosen when they were made (for life). */
  name: string;
  cls: HeroClass;
  gold: number;
  xp: number;
  level: number;
  perks: PerkId[];
  /** Level ups not yet spent at the trainer. */
  picks: number;
  /** The weapon in hand (`weapon`, plain if `arms` has nothing for it) and the pack. */
  arms: Partial<Record<WeaponId, Item>>;
  weapon: WeaponId;
  bag: Item[];
  /** Coals fed to a Healer's censer (sim/lantern.ts). */
  glow: number;
  /** Relics found at the end of deep dives, and the one carried into a job ('' none). */
  relics: RelicId[];
  relic: RelicId | '';
  /** Elements the relic-wright has fitted to this hero's skill and relics. */
  augments: Partial<Record<RelicId, Augment>>;
  runs: number;
  stats: Stats;
  /** A coin in the well: the next job starts blessed. */
  wish: boolean;
  /** Dice games played (seeds the next roll). */
  dice: number;
}

export const newProfile = (cls: HeroClass = 'WARRIOR', name = 'HERO'): Profile =>
  ({ id: heroId(), name, cls, gold: 0, xp: 0, level: 1, perks: [], picks: 0, arms: {}, weapon: CLASS_KITS[cls][0], bag: [], glow: 0, relics: [], relic: '', augments: {}, runs: 0, stats: newStats(), wish: false, dice: 0 });

function heroId(): string {
  const c = 'abcdefghijkmnpqrstuvwxyz23456789';
  let s = 'h';
  for (let i = 0; i < 11; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}

/** Up to three heroes per player; each keeps its own class, level and kit (the world is shared). */
export const HERO_SLOTS = 3;

/** Add experience; returns how many levels were gained (each is a pick at the trainer). */
export function gainXp(p: Profile, n: number): number {
  p.xp += n;
  const l = levelFor(p.xp), gained = l - p.level;
  if (gained > 0) (p.level = l), (p.picks += gained);
  return gained;
}

/** What your class's trainer offers for the next pick: the class's own perk (until taken) and a shared one. */
export function perkOffer(p: Profile): PerkId[] {
  const own = PERK_ORDER.filter((k) => PERKS[k].cls === p.cls && !p.perks.includes(k));
  const shared = new Rng(p.level * 13 + p.perks.length * 7 + 3).shuffle(PERK_ORDER.filter((k) => !PERKS[k].cls && !p.perks.includes(k)));
  return [...own, ...shared].slice(0, 2);
}

/** Gold and experience for a kill. */
export const BOUNTY = { scrapper: { gold: 4, xp: 10 }, butcher: { gold: 30, xp: 60 }, boss: { gold: 80, xp: 150 }, rescue: 25, objective: 50 };
export const SHOP = { fine: 60, forged: 160, augment: 45, wish: 5 };
