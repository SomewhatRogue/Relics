/**
 * Town works: what Wickhold builds together. Everyone's gold, burned dens and rescues fill them; a
 * finished work changes the town for everyone (more guards on the walls, a quarter cleared, the sewers
 * opened to jobs). Worlds with a server share them across every player in the world.
 */
import type { WorldState } from './story.js';

export type WorkId = 'watch' | 'oldquarter' | 'sewers';

export interface Work {
  name: string;
  /** What fills it: gold given at the works board, or dens burned out on jobs. */
  by: 'gold' | 'dens';
  need: number;
  text: string;
  done: string;
}

export const WORKS: Record<WorkId, Work> = {
  watch: { name: 'Man the Walls', by: 'gold', need: 400, text: 'Pay and arm more of the watch.', done: 'More guards walk the walls and the square, day and night.' },
  oldquarter: { name: 'Clear the Old Quarter', by: 'gold', need: 600, text: 'Haul away the rubble from the siege and open the east lane.', done: 'The east lane is open. The Old Quarter and its chapel lie beyond.' },
  sewers: { name: 'Drive Them from Below', by: 'dens', need: 6, text: 'Burn out goblin dens on jobs until the ones under the town lose their nerve.', done: 'The sewer grate by the Drowned Rat is open, and jobs below the town go on the board.' },
};
export const WORK_ORDER = Object.keys(WORKS) as WorkId[];

/** How far along a work is (gold given, or dens burned all told). */
export const workProgress = (w: WorldState, id: WorkId) => (WORKS[id].by === 'dens' ? w.dens : w.works[id] ?? 0);
export const workDone = (w: WorldState, id: WorkId) => workProgress(w, id) >= WORKS[id].need;
