/**
 * Each relic's one home (docs/design/relics.md section 1; the table is a draft the lore keeper settles):
 * every hero starts with the javelin; a great boss's first kill gives its own; the rest come from Mother
 * Isolde's church quests (slice 6), which send you to the next great bosses. One of each, never rolled.
 */
import type { RelicId } from './magic.js';

/** A great boss with a relic of its own: who it is (sim/bosskit.ts BossOn.who, or the pair). */
export type GreatBoss = 'hempen' | 'doorkeepers' | 'haulier' | 'fen';
/** Where a relic is won: the start, a great boss, or a church quest. */
export type RelicHome = 'start' | GreatBoss | 'church';

export interface Home { kind: RelicId; home: RelicHome; /** A boss whose first kill gives it here (others: not wired yet). */ live?: boolean }

export const RELIC_HOMES: Home[] = [
  { kind: 'javelin', home: 'start' },
  // The Haulier at the Open Cut's end: the Instances chat calls giveHome there (sim/relicboss.ts) and sets live.
  { kind: 'hook', home: 'haulier' },
  { kind: 'knuckle', home: 'hempen', live: true },
  { kind: 'lodestone', home: 'doorkeepers', live: true },
  // Fenmere's end boss (not built yet; the net is the Ranger's skill too, to settle with the lore keeper).
  { kind: 'net', home: 'fen' },
  { kind: 'bomb', home: 'church' },
  { kind: 'sentry', home: 'church' },
  { kind: 'bell', home: 'church' },
];

/** The relic a great boss gives (none: it has none of its own). */
export const bossRelic = (b: GreatBoss): RelicId | undefined => RELIC_HOMES.find((h) => h.home === b)?.kind;
/** Where a relic is won. */
export const homeOf = (k: RelicId): RelicHome | undefined => RELIC_HOMES.find((h) => h.kind === k)?.home;
