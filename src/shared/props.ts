/**
 * Things in the room that break and fly: barrels, an oil barrel, crates, a table, and the pieces
 * they break into. Anything can smash them; only a strong class can lift and throw them.
 */
import type { HeroClass } from './weapons.js';

export type PropKind = 'barrel' | 'oil' | 'crate' | 'table' | 'plank' | 'stave' | 'cage' | 'larder';

export interface PropSpec {
  radius: number;
  weight: number;
  hp: number;
  /** What it breaks into. */
  pieces: { kind: PropKind; n: number } | null;
}

export const PROPS: Record<PropKind, PropSpec> = {
  barrel: { radius: 0.36, weight: 2.5, hp: 30, pieces: { kind: 'stave', n: 3 } },
  oil: { radius: 0.36, weight: 2.5, hp: 20, pieces: { kind: 'stave', n: 2 } },
  crate: { radius: 0.42, weight: 3, hp: 35, pieces: { kind: 'plank', n: 2 } },
  table: { radius: 0.55, weight: 4, hp: 45, pieces: { kind: 'plank', n: 3 } },
  plank: { radius: 0.24, weight: 0.8, hp: 10, pieces: null },
  stave: { radius: 0.2, weight: 0.6, hp: 8, pieces: null },
  /** A goblin cage with someone in it: break it and they go free. Too heavy to lift. */
  cage: { radius: 0.55, weight: 99, hp: 40, pieces: { kind: 'plank', n: 2 } },
  /** The goblins' larder: a rack of stolen stores and worse. Smash it. */
  larder: { radius: 0.45, weight: 99, hp: 25, pieces: null },
};

/** Classes big enough to lift and throw them (a Barbarian joins when the Warrior forks). */
export const STRONG: HeroClass[] = ['WARRIOR'];

export const PROP = {
  /** Thrown from overhead this fast, airborne this long. */
  throwSpeed: 14,
  air: 0.4,
  /** Lifted ones are slower to carry the heavier they are. */
  carrySpeed: 0.7,
  /** A thrown prop hits a goblin for this per tile a second, times its weight (capped). */
  hitPerSpeed: 0.8,
  hitMax: 45,
  /** Slamming it down: damage to goblins within reach of where it lands, and it breaks. */
  slamRadius: 1.3,
  slamDmg: 28,
  /** Broken big props come back after this (the training room keeps its furniture); pieces fade. */
  respawn: 20,
  pieceLife: 25,
  /** The oil barrel bursts into flame. */
  oilRadius: 1.8,
};

/** Where the training room's furniture stands. */
export const ROOM_PROPS: { kind: PropKind; x: number; y: number }[] = [
  { kind: 'barrel', x: 1.3, y: 6.2 },
  { kind: 'barrel', x: 1.3, y: 7.3 },
  { kind: 'barrel', x: 2.3, y: 6.7 },
  { kind: 'oil', x: 16.7, y: 6.5 },
  { kind: 'crate', x: 16.6, y: 7.7 },
  { kind: 'crate', x: 12.4, y: 8.8 },
  { kind: 'table', x: 6, y: 8.8 },
];

/**
 * Wooden buildings out on a job: smashed by blows and blasts, set alight by oil, fire spells and
 * burning goblins, and burned down to rubble you walk over. Town buildings have no health: they stand.
 */
export const WOOD: Partial<Record<import('./arena').BlockKind, { hp: number; door?: string }>> = {
  house: { hp: 160, door: 'cottage' },
  barn: { hp: 260, door: 'barn' },
  den: { hp: 120 },
  tent: { hp: 60 },
  fence: { hp: 40 },
};
export const BLAZE = {
  /** Health a burning building loses a second. */
  dps: 24,
  /** Burning this long, it lights wood this close. */
  spreadAfter: 2.5,
  spreadReach: 1.2,
  /** Goblins this close to the flames catch; burning goblins this close set wood alight. */
  reach: 0.6,
  /** An oil barrel's fire lights wood this close. */
  oilReach: 1.8,
  /** Melee blows on a wall do this share of their damage (fire is the way). */
  melee: 0.5,
  blast: 0.6,
  /** A goblin den sends out a scrapper this often while it stands (up to this many goblins about). */
  denEvery: 9,
  denCap: 6,
};
