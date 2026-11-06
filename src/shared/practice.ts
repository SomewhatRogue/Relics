/**
 * The training yard's straw men (Kyle, 2026-11-05: "lets you try different scenarios including spawning
 * different enemy types to fight"). No live goblin is ever kept inside Wickhold (the lore keeper,
 * 2026-11-05): these are straw men in hungry kit, worked on ropes and poles by Corporal Brisk's watch, and
 * Squire Pell runs the board. Any sort the hero has met on a job, one at a time or a small pack, and four
 * drills. Nothing is won here (no gold, no XP, no loot), and a hero put down just gets up to the same
 * fight again.
 *
 * Practice is this browser's alone (sim/practice.ts runs it in the yard's room): nothing goes to the
 * relay. Each straw man moves and hits by the same specs as a goblin on a job (newEnemy, VARIANTS), so
 * what you learn here is the real fight; only how it's drawn says straw (client/strawman.ts).
 */
import type { Foe } from './terrain.js';
import type { HeroClass } from './tuning.js';

/** A sort of goblin, as a straw man plays it: what makes one (a Foe without where it stands). */
export type Sort = Pick<Foe, 'kind' | 'variant' | 'bow'>;
export interface Single { key: string; name: string; sort: Sort }
export interface Pack { key: string; name: string; of: string[] }
export type DrillId = 'parry' | 'shields' | 'burn' | 'hold';
export interface Drill { key: DrillId; name: string; how: string; cls?: HeroClass }

/** Every sort the watch can play, by the key a met goblin is filed under (`sortKey`). */
export const SINGLES: Single[] = [
  { key: 'scrapper', name: 'A SCRAPPER', sort: { kind: 'scrapper' } },
  { key: 'archer', name: 'AN ARCHER', sort: { kind: 'scrapper', bow: true } },
  { key: 'looter', name: 'A LOOTER', sort: { kind: 'scrapper', variant: 'looter' } },
  { key: 'lunger', name: 'A LUNGER', sort: { kind: 'scrapper', variant: 'lunger' } },
  { key: 'shield', name: 'A SHIELD', sort: { kind: 'scrapper', variant: 'shield' } },
  { key: 'heavy', name: 'A HEAVY', sort: { kind: 'scrapper', variant: 'heavy' } },
  { key: 'hexer', name: 'A HEXER', sort: { kind: 'scrapper', variant: 'hexer' } },
  { key: 'drummer', name: 'A DRUMMER', sort: { kind: 'scrapper', variant: 'drummer' } },
  { key: 'netter', name: 'A NETTER', sort: { kind: 'scrapper', variant: 'netter' } },
  { key: 'ironhide', name: 'AN IRONHIDE', sort: { kind: 'scrapper', variant: 'ironhide' } },
  { key: 'blind', name: 'A BLIND HUNTER', sort: { kind: 'scrapper', variant: 'blind' } },
  { key: 'spider', name: 'A SPIDER', sort: { kind: 'spider' } },
  { key: 'butcher', name: 'A BUTCHER', sort: { kind: 'butcher' } },
];

/** Small mixed packs (each offered once every sort in it has been met). */
export const PACKS: Pack[] = [
  { key: 'shieldarchers', name: 'A SHIELD AND TWO ARCHERS', of: ['shield', 'archer', 'archer'] },
  { key: 'five', name: 'A PACK OF FIVE', of: ['scrapper', 'scrapper', 'lunger', 'shield', 'archer'] },
  { key: 'hexed', name: 'A HEXER BEHIND THREE', of: ['hexer', 'scrapper', 'scrapper', 'scrapper'] },
  { key: 'butcherpack', name: 'A BUTCHER AND TWO SCRAPPERS', of: ['butcher', 'scrapper', 'scrapper'] },
];

export const DRILLS: Drill[] = [
  { key: 'parry', name: 'PARRY THE HEAVY', how: 'Ten swings from a heavy. Parry as many as you can.' },
  { key: 'shields', name: 'BREAK A SHIELD LINE', how: 'Three shields side by side. Put all three down.' },
  { key: 'burn', name: 'BURN A PACK', how: 'Five scrappers bunched up. Set every one of them alight.', cls: 'MAGE' },
  { key: 'hold', name: 'HOLD FOR A MINUTE', how: 'They come a few at a time. Stay on your feet for 60 seconds.' },
];

/** Numbers: the parry drill's swings, the hold's length and waves, how many can be out at once. */
export const PRACTICE = { swings: 10, hold: 60, waveEvery: 10, firstWave: 3, wave: 2, most: 8, burnFor: 60 };

/**
 * The rack in the yard's top left corner (paint only: tiles): a frame of poles with the straw men waiting
 * on it, where they're carried out from (`out`), the post with the board, and where the watch stand.
 */
export const RACK = { x: 0.4, y: 0.3, w: 2.9, h: 1.6, out: { x: 2.2, y: 2.6 }, post: { x: 4.4, y: 2.1 }, holds: 4, watch: [{ x: 0.5, y: 2.6 }, { x: 3.6, y: 2.9 }] };

/** What a goblin is filed under once a hero has met it (null: not a sort the watch plays). */
export function sortKey(e: { kind: string; variant?: string; bow?: boolean; name?: string }): string | null {
  if (e.kind === 'butcher') return 'butcher';
  if (e.kind === 'spider' || e.kind === 'brood') return 'spider';
  if (e.kind !== 'scrapper') return null;
  if (e.bow) return 'archer';
  if (!e.variant) return 'scrapper';
  return SINGLES.some((s) => s.key === e.variant) ? e.variant : null;
}

/** Sorts every hero has met by the time they reach the yard: the wood's (and a job's commonest, after one). */
export function metOf(p: { met?: string[]; prologue?: boolean; runs?: number }): Set<string> {
  const met = new Set(p.met ?? []);
  met.add('scrapper');
  if (p.prologue) for (const k of ['looter', 'lunger', 'heavy']) met.add(k);
  if ((p.runs ?? 0) > 0) for (const k of ['archer', 'shield', 'butcher']) met.add(k);
  return met;
}

/** The sort a single's key names. */
export const sortOf = (key: string): Sort | undefined => SINGLES.find((s) => s.key === key)?.sort;
