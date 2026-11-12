/**
 * Things in the room that break and fly: barrels, an oil barrel, crates, a table, and the pieces
 * they break into. Anything can smash them; only a strong class can lift and throw them.
 */
import type { HeroClass } from './weapons.js';

export type PropKind = 'barrel' | 'oil' | 'crate' | 'table' | 'plank' | 'stave' | 'cage' | 'larder' | 'punt' | 'lamp' | 'cart' | 'tub' | 'column' | 'log';

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
  /** The Staithe's: a punt drawn up on the bank (cover; a Warrior can lift it), an oil lamp on its post (broken, its oil spills on the water). */
  punt: { radius: 0.62, weight: 5, hp: 70, pieces: { kind: 'plank', n: 3 } },
  lamp: { radius: 0.2, weight: 0.6, hp: 6, pieces: null },
  /** The Haulier's working (shared/sumparena.ts): an ore cart on the rail. Never broken or lifted; it rolls (sim/haulbook.ts). */
  cart: { radius: 0.6, weight: 99, hp: 9999, pieces: null },
  /** An instance puzzle's ore tub (shared/puzzle.ts): pushed a square at a time, never broken, knocked or lifted (sim/tubs.ts). */
  tub: { radius: 0.56, weight: 99, hp: 9999, pieces: null },
  /** THE LISTENER's dripstone column (shared/cavearena.ts): stands till hit, then falls the way it leans (sim/columns.ts). Never lifted, moved or broken. */
  column: { radius: 0.45, weight: 99, hp: 9999, pieces: null },
  /** THE LEECHMAN's log, laid across a deep channel (sim/leechlog.ts): a blow knocks it into the water. Never lifted, moved or broken. */
  log: { radius: 0.9, weight: 99, hp: 9999, pieces: null },
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
  /** Drawing only: a prop that takes a blow and holds shakes this long (both views). */
  shake: 0.22,
};

/**
 * A false prisoner (sim/falsecage.ts): `chance` of a cage out in the open, rolled on the room's own
 * stream as it breaks. What stands up `lurch`es that long, then tears open and `goblins` come out of it,
 * held `beat` seconds (so it reads) before they go for you. Never a captive in a house: the cry at a
 * house's woodpile is always someone real (the story bible).
 */
export const FALSE_CAGE = { chance: 1 / 20, lurch: 0.9, beat: 0.6, goblins: 2, spread: 0.45 };

/**
 * Whoever was in a cage, once it breaks (sim/survivors.ts). Not fighters: a couple of blows kill them.
 * They stand a moment, then follow the nearest player at a slow walk, keeping a gap and out of the way;
 * nobody within `notice` and they wait where they are. They're home once brought out of the house they
 * were caged in, or (caged out in the open) within `homeReach` of where the party came into the room;
 * then they walk off toward it and are gone within `walkOff` seconds.
 */
export const SURVIVOR = { hp: 24, radius: 0.26, speed: 2.3, gap: 1.3, notice: 9, standUp: 1.4, room: 0.15, knock: 3, bumpEvery: 0.35, homeReach: 2.5, walkOff: 8 };

/**
 * Stepping out of a house with someone you've freed: a third of the time a few goblins are waiting by
 * the door (2 or 3, more for a bigger party, never more than `most`), some of them the tougher sorts.
 */
export const AMBUSH = { chance: 1 / 3, min: 2, extra: 1, most: 5, near: 2.4, far: 3.4, variant: 0.3 };

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
  shack: { hp: 80 },
  fence: { hp: 40 },
  // Layout 4: a fallen trunk across the way, a fence of sharpened stakes round a war band's fire.
  log: { hp: 90 },
  stakes: { hp: 50 },
  // The Staithe (shared/staithe.ts): the jetty burns through in a while; the smokehouse takes STAITHE.smoke
  // seconds of burning (BLAZE.dps a second); racks and hung nets go quickly. The log only ever falls in.
  jetty: { hp: 300 },
  gangway: { hp: 9999 },
  smokehouse: { hp: 960 },
  dryrack: { hp: 40 },
  hungnet: { hp: 12 },
  // Hangman's Wood's Gospel Oak (shared/hangtune.ts OAK): a long burn, from inside.
  oak: { hp: 480 },
  // The Doorkeepers' barn (shared/barnarena.ts): a hay stack burns down in 6 s.
  haystack: { hp: 144 },
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
