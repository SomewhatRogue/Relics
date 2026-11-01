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
  watch: { name: 'Man the Walls', by: 'gold', need: 400, text: 'Coin for spears, boots and wages. Two more on the walls means two more who see them coming.', done: 'Two more of the watch walk the walls and the square. In new boots.' },
  oldquarter: { name: 'Clear the Old Quarter', by: 'gold', need: 600, text: 'Haul the siege rubble out of the east lane. Nobody has been past it in eleven years. Nobody much wants to.', done: 'The east lane is open. Beyond it, the Old Quarter, and the chapel Father Odric nailed shut.' },
  sewers: { name: 'Drive Them from Below', by: 'dens', need: 6, text: 'Something scratches under the Drowned Rat at night. Burn out enough dens on jobs and the ones below lose their nerve.', done: 'The grate behind the Drowned Rat is open, and jobs under the town go on the board. Bring a lantern. Bring two.' },
};
export const WORK_ORDER = Object.keys(WORKS) as WorkId[];

/** How far along a work is (gold given, or dens burned all told). */
export const workProgress = (w: WorldState, id: WorkId) => (WORKS[id].by === 'dens' ? w.dens : w.works[id] ?? 0);
export const workDone = (w: WorldState, id: WorkId) => workProgress(w, id) >= WORKS[id].need;
