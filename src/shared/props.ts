/**
 * Things in the room that break and fly: barrels, an oil barrel, crates, a table, and the pieces
 * they break into. Anything can smash them; only a strong class can lift and throw them.
 */
import type { HeroClass } from './weapons';

export type PropKind = 'barrel' | 'oil' | 'crate' | 'table' | 'plank' | 'stave';

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
