/**
 * The Deep (docs/design/the-deep.md): an endless dungeon under Wickhold, in from the sewer grate. Each
 * floor is one room from the ordinary generator, a fresh map every time; at its end a checkpoint where
 * each hero leaves with what they found or goes deeper. Floor scaling (threat and loot by band) is
 * build step 3; for now every floor is a Sewers-hard room with its own seed.
 */
import type { Job, Objective, Place } from './jobs.js';
import { rollTime } from './timeofday.js';

/** Under the town: the 'under' country, the drains' rooms (shared/countries.ts, nodes4.ts). */
export const DEEP_PLACE: Place = { name: 'The Deep', kind: 'mine', region: 'Wickhold', ruin: 2 };

/** What a floor asks of you, turn about; a floor never repeats the last one's. */
const ASKS: Objective[] = ['larder', 'burn', 'rescue'];

/**
 * Floor `n` (from 1) of a run that set out with `seed`. Same seed and floor, same floor: the party's
 * screens build the same map. `title` is the floor's name on the HUD and the recap.
 */
export function deepFloor(n: number, seed: number, title: string): Job {
  const s = (seed * 7919 + n * 104729) >>> 0, objective = ASKS[(seed + n) % ASKS.length];
  return {
    id: `deep-${seed}-${n}`, place: DEEP_PLACE, objective, twist: 'none', time: rollTime(s, false), rooms: 1, size: 'short', layout: 4,
    reward: 0, seed: s, title, text: '', floor: n,
  };
}

/** A Deep floor (not any other job). */
export const isDeep = (j: Job | undefined): boolean => !!j?.floor;
