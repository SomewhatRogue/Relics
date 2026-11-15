/**
 * Where relics come from (docs/design/relics.md, Kyle approved 2026-11-15): each relic has one home, a
 * church quest or a great boss's first kill, and winning it is a moment, never a roll. One of each,
 * never twice. Gone (2026-11-15): the named butcher's 4% and its first-kill sure relic, zone climaxes',
 * story missions', the beacon's and the deep dive's rolled relics, boss chests' relic odds.
 */
import type { RelicItem } from './relicitems.js';

/** A relic won on a run, and what gave it (the recap's RELICS row reads it). */
export interface RelicWon { item: RelicItem; from: string }
/** What a win is noted on: a run (sim/run.ts) or anything with the same list. */
export interface Awarded { relicsWon?: RelicWon[] }
