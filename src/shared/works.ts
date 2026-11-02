/**
 * Town works: what Wickhold builds together. Everyone's gold, burned dens and rescues fill them; a
 * finished work changes the town for everyone (more guards on the walls, a quarter cleared, the sewers
 * opened to jobs, the blood scrubbed off the square, the breach in the north wall mended). Worlds with
 * a server share them across every player in the world.
 *
 * Some works come in stages (`after`): the garden is dug, then planted, then given benches; the
 * breach is staked, then walled in timber, then in stone. A stage opens once the one before is done.
 * Mending works (`mend`) can be undone by a raid (shared/raids.ts); stone (`holds`) can't.
 */
import type { WorldState } from './story.js';

export type WorkId = 'watch' | 'oldquarter' | 'sewers' | 'wash' | 'lanes' | 'shutters' | 'lanterns' | 'dig' | 'plant' | 'arbour' | 'stakes' | 'timber' | 'stonewall';

export interface Work {
  name: string;
  /** What fills it: gold given at the works board, or dens burned out on jobs. */
  by: 'gold' | 'dens';
  need: number;
  text: string;
  done: string;
  /** Opens only once this work is done (a stage of the garden or the wall). */
  after?: WorkId;
  /** Mending the town after the breach: a raid can undo it. `lost` says how, after one. */
  mend?: boolean;
  lost?: string;
  /** Holds against raids (stone). */
  holds?: boolean;
  /** For the defence: gear given here counts (weapons and armour for the walls). */
  arms?: boolean;
}

export const WORKS: Record<WorkId, Work> = {
  watch: { name: 'Man the Walls', by: 'gold', need: 400, arms: true, text: 'Coin for spears, boots and wages. Two more on the walls means two more who see them coming.', done: 'Two more of the watch walk the walls and the square. In new boots.' },
  oldquarter: { name: 'Clear the Old Quarter', by: 'gold', need: 600, text: 'Haul the siege rubble out of the east lane. Nobody has been past it in eleven years. Nobody much wants to.', done: 'The east lane is open. Beyond it, the Old Quarter, and the chapel Father Odric nailed shut.' },
  sewers: { name: 'Drive Them from Below', by: 'dens', need: 6, text: 'Something scratches under the Drowned Rat at night. Burn out enough dens on jobs and the ones below lose their nerve.', done: 'The grate behind the Drowned Rat is open, and jobs under the town go on the board. Bring a lantern. Bring two.' },
  wash: {
    name: 'Wash the Square', by: 'gold', need: 60, mend: true, lost: 'the square is bloodied again',
    text: "Scrub the blood off the square and bury the dead on Odric's cart.",
    done: "The square's scrubbed and the dead are in the ground by the church.",
  },
  lanes: {
    name: 'Clear the Lanes', by: 'gold', need: 150, mend: true, lost: 'carts are burned in the lanes',
    text: "Burnt carts and rubble in every lane, and somehow the Fosters' dresser.",
    done: "The lanes are clear, and the Fosters say their dresser was never that colour.",
  },
  shutters: {
    name: 'Mend the Shutters and Roofs', by: 'gold', need: 200, mend: true, lost: 'shutters are torn off',
    text: "Half the town's shutters are boards over holes, and the roofs let the rain in.",
    done: "Shutters hung and roofs patched, except Gannet's sign, which he likes crooked.",
  },
  lanterns: {
    name: 'Lanterns along the Lanes', by: 'gold', need: 120, mend: true, lost: "the lane lamps are smashed and the oil's gone",
    text: "Nobody's had the oil or the nerve to put the lane lamps back up.",
    done: "Lamps lit in the lanes again, and the watch can see what's coming now.",
  },
  dig: {
    name: 'The Garden: Clear and Dig', by: 'gold', need: 80, mend: true, lost: "Perrin's garden is trampled flat",
    text: "Fence and dig Widow Perrin's trampled garden, and get somebody to cut the dead tree.",
    done: "The beds are dug, and Perrin's out every morning telling the worms where to go.",
  },
  plant: {
    name: 'The Garden: Plant the Beds', by: 'gold', need: 120, after: 'dig', mend: true, lost: "Perrin's beds are trampled",
    text: "Seed for Perrin's beds, and seed is dear when nobody's bringing any in.",
    done: "Feverfew, marigold and sage in the beds, and the square smells of something besides smoke.",
  },
  arbour: {
    name: 'The Garden: Benches and a Lamp', by: 'gold', need: 160, after: 'plant', mend: true, lost: 'the garden benches are broken up',
    text: "Two benches and a lamp, so you can sit out after dark without falling in the marigolds.",
    done: "There's usually somebody on Perrin's benches of an evening, not saying much.",
  },
  stakes: {
    name: 'Stakes for the Breach', by: 'gold', need: 150, mend: true, arms: true, lost: 'the stakes at the breach are pulled down',
    text: "Oak stakes to drive across the breach, where it's hurdles and rope now.",
    done: "Oak stakes across the breach, not a wall yet, but a better argument than rope.",
  },
  timber: {
    name: 'A Timber Wall and a Walk', by: 'gold', need: 350, after: 'stakes', mend: true, arms: true, lost: 'the timber walk on the north wall is burned',
    text: "A timber wall with a walk along the top, so the watch can see over.",
    done: "The breach is timber now, and the watch walks the top of it.",
  },
  stonewall: {
    name: 'Stone for the North Wall', by: 'gold', need: 800, after: 'timber', holds: true, arms: true,
    text: "Masons and quarry stone to close the breach for good.",
    done: "The breach is stone again, the same grey as the rest.",
  },
};
export const WORK_ORDER = Object.keys(WORKS) as WorkId[];
/** The mending works, in the order they're listed. */
export const MENDS = WORK_ORDER.filter((k) => WORKS[k].mend || WORKS[k].holds);

/** How far along a work is (gold given, or dens burned all told). */
export const workProgress = (w: WorldState, id: WorkId) => (WORKS[id].by === 'dens' ? w.dens : w.works[id] ?? 0);
export const workDone = (w: WorldState, id: WorkId) => workProgress(w, id) >= WORKS[id].need;
/** Open to give to: not done, and the stage before it (if any) done. */
export const workOpen = (w: WorldState, id: WorkId) => !workDone(w, id) && (!WORKS[id].after || workDone(w, WORKS[id].after!));
/** How many stages of a line are done, counting from its first (the garden from 'dig', the wall from 'stakes'). */
export function stagesDone(w: WorldState, first: WorkId): number {
  let n = 0;
  for (let k: WorkId | undefined = first; k && workDone(w, k); k = WORK_ORDER.find((j) => WORKS[j].after === k)) n++;
  return n;
}
