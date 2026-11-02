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
    text: "Lye, buckets and a few strong backs to scrub the square and the gate where they came through, and a proper burying for the ones on Odric's cart, who've waited long enough.",
    done: "The square's scrubbed, the dead are in the ground by the church, and the crows have gone to bother somebody else.",
  },
  lanes: {
    name: 'Clear the Lanes', by: 'gold', need: 150, mend: true, lost: 'carts are burned in the lanes',
    text: "Burnt carts and tumbled stone in every lane from the night of the breach, and the Fosters' dresser, though nobody knows how it got there. Coin for carters and a mule.",
    done: 'The lanes are clear. The Fosters got their dresser back and say it was never that colour.',
  },
  shutters: {
    name: 'Mend the Shutters and Roofs', by: 'gold', need: 200, mend: true, lost: 'shutters are torn off',
    text: 'Half the shutters in town are boards nailed over holes and the rest are scorched, and the roofs let in more than light. Coin for a thatcher, nails, and a glazier if one can be found.',
    done: "New shutters, patched roofs, and the scorch scrubbed off the walls, mostly. The tavern's sign is still crooked. Gannet likes it crooked.",
  },
  lanterns: {
    name: 'Lanterns along the Lanes', by: 'gold', need: 120, mend: true, lost: 'the lane lamps are smashed',
    text: "The lamp posts in the lanes went down the night of the breach, and nobody's had the oil or the nerve to put them up. Coin for posts, glass, oil, and a lamplighter who doesn't mind the dark.",
    done: 'Lamps along the lanes again, lit at dusk. The watch says it can see what\'s coming. The watch is less sure that\'s an improvement.',
  },
  dig: {
    name: 'The Garden: Clear and Dig', by: 'gold', need: 80, mend: true, lost: "Perrin's garden is trampled flat",
    text: 'The patch west of the well was the physic garden before the siege. Soldiers camped on it, the hungry trampled the rest, and there\'s a dead apple tree in it nobody will cut. Widow Perrin wants it back. Coin for spades, a fence, and somebody with an axe.',
    done: 'The dead tree is down, the fence is up and the beds are dug. Perrin is out there every morning telling the worms where to go.',
  },
  plant: {
    name: 'The Garden: Plant the Beds', by: 'gold', need: 120, after: 'dig', mend: true, lost: "Perrin's beds are trampled",
    text: 'Dug beds and nothing in them. Seed and cuttings cost, and the carter wants paying double to bring anything up the north road.',
    done: "The beds are planted: feverfew, marigold, sage, and roses off a bush Perrin's mother put in. The square smells of something besides smoke.",
  },
  arbour: {
    name: 'The Garden: Benches and a Lamp', by: 'gold', need: 160, after: 'plant', mend: true, lost: 'the garden benches are broken up',
    text: "Somewhere to sit when the work's done, and a lamp so you can sit there after dark without falling in the marigolds. Coin for two benches and a post.",
    done: "Two benches and a lamp in Perrin's garden. Of an evening there's usually somebody on them, not saying much, which is what a bench is for.",
  },
  stakes: {
    name: 'Stakes for the Breach', by: 'gold', need: 150, mend: true, arms: true, lost: 'the stakes at the breach are pulled down',
    text: "Where the north wall came down, it's held with hurdles, cart beds and whatever was lying about, lashed up with rope. Coin for oak stakes, sharpened, and the men to drive them.",
    done: "Oak stakes across the breach, sharpened and driven deep. It still isn't a wall, but it's a better argument than rope.",
  },
  timber: {
    name: 'A Timber Wall and a Walk', by: 'gold', need: 350, after: 'stakes', mend: true, arms: true, lost: 'the timber walk on the north wall is burned',
    text: "Stakes keep them out on a good night. A timber wall with a walk along the top lets the watch see over it on a bad one. Coin for beams, a carpenter, and a ladder that doesn't wobble.",
    done: 'A timber wall across the breach, with a walk along the top. Dunn has walked it end to end twice and complained both times, so he\'s pleased.',
  },
  stonewall: {
    name: 'Stone for the North Wall', by: 'gold', need: 800, after: 'timber', holds: true, arms: true,
    text: "Wenna saw these walls go up in stone, and she'd like to see the gap closed the same way before they bury her. Masons, a quarry cart and a great deal of coin. Stone, once it's up, stays up.",
    done: 'The breach is stone again, the same grey as the rest. The hungry can pull down a lot of things, but not that, and not quickly.',
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
