/**
 * The boss hunts on the board. The first: the Doorkeepers in the great barn at Lowfurrow Fields, a hunt
 * posted from late in chapter 1 (BARN_HUNT.from brought home, or the bell rung). Two rooms: the fields,
 * then the barn (shared/barnarena.ts). A new seed each day.
 */
import { PLACES, payFor, type Job } from './jobs.js';
import { Rng } from './rng.js';
import { rollTime } from './timeofday.js';
import { BARN_HUNT } from './bosstune.js';
import { BARN_POST, DOOR_NAMES } from './bosswords.js';
import type { WorldState } from './story.js';

/** The day's Doorkeepers hunt. `straight`: the barn alone, one room (a test hook: ?barn=arena). */
export function barnHunt(day: number, straight = false): Job {
  const rng = new Rng(day * 3109 + 43), seed = day * 457 + 163, night = rng.next() < 0.35;
  const place = PLACES.find((p) => p.name === 'Lowfurrow Fields')!;
  return {
    id: `d${day}-barn`, place, objective: 'hunt', twist: night ? 'night' : 'none', time: rollTime(seed, night), rooms: straight ? 1 : 2, size: 'short', layout: 4,
    boss: DOOR_NAMES.plate, arena: 'doorkeepers', seed, reward: payFor(2, 1, night, 'short') + 40, ...BARN_POST,
  };
}

/** Posted once chapter 1 is well on: enough brought home, or the bell's done. */
export const barnPosted = (w: Pick<WorldState, 'rescued' | 'storyDone'>) => w.rescued >= BARN_HUNT.from || w.storyDone.includes('barrowby-bell');
