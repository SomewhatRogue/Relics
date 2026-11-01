/**
 * Jobs: a place plus an objective plus a twist, posted on Wickhold's job board. The board changes
 * each day (one finished run is a day for now). A chapter's story mission sits on it until it's done.
 */
import { Rng } from './rng.js';

export type PlaceKind = 'village' | 'farm' | 'field' | 'forest' | 'mine';
export interface Place { name: string; kind: PlaceKind; region: string; ruin: number }

export const PLACES: Place[] = [
  { name: 'Barrowby', kind: 'village', region: 'Barrowfields', ruin: 1 },
  { name: "Tollan's Farm", kind: 'farm', region: 'Barrowfields', ruin: 1 },
  { name: 'Lowfurrow Fields', kind: 'field', region: 'Barrowfields', ruin: 1 },
  { name: 'Fennick Ford', kind: 'village', region: 'Fenmere', ruin: 2 },
  { name: 'The Charcoal Camps', kind: 'forest', region: 'Greyhollow', ruin: 2 },
  { name: "Hangman's Wood", kind: 'forest', region: 'Greyhollow', ruin: 2 },
  { name: 'The Copperdeep Shafts', kind: 'mine', region: 'Copperdeep', ruin: 2 },
];

export type Objective = 'rescue' | 'hunt' | 'larder' | 'burn' | 'story';
export type Twist = 'none' | 'night';

export interface Job {
  id: string;
  place: Place;
  objective: Objective;
  twist: Twist;
  /** Rooms in the run; the last holds the objective. */
  rooms: number;
  /** Gold paid on success (before the town's bonuses). */
  reward: number;
  seed: number;
  title: string;
  text: string;
  /** The named goblin to kill (hunts and the story mission). */
  boss?: string;
}

const BOSSES = ['MAWL THE FLAYER', 'SKARN', 'OLD KNUCKLES', 'THE TALLY MAN', 'GUTCHAIN', 'MOTHER RUST'];

function describe(o: Objective, p: Place, boss: string): { title: string; text: string } {
  if (o === 'rescue') return { title: `Rescue at ${p.name}`, text: `Folk alive in cages at ${p.name}, at last count. Last count was three days ago. Break the cages, bring them home, don't stop to count.` };
  if (o === 'hunt') return { title: `Hunt ${boss}`, text: `${boss} has taken ${p.name} for a larder and the little ones for a family. Kill it and the rest scatter. Bring back something to prove it; we've been lied to before.` };
  if (o === 'burn') return { title: `Burn out the dens at ${p.name}`, text: `The hungry have dug in at ${p.name}, and they breed in those holes like rats in a granary. Burn every den. There's oil lying about; they hoard it and never think. Wood burns into wood.` };
  return { title: `Burn the larder at ${p.name}`, text: `They keep a larder at ${p.name}. Some of it is grain. Smash every rack, and don't look too long at the rest.` };
}

/** Under Wickhold itself: on the board once the town works have driven the goblins below to bay. */
export const SEWERS: Place = { name: 'The Wickhold Sewers', kind: 'mine', region: 'Wickhold', ruin: 2 };

/** Today's three jobs (one of them in the sewers, once they're open). */
export function board(day: number, sewers = false): Job[] {
  const rng = new Rng(day * 977 + 31);
  const objectives: Objective[] = rng.shuffle(['rescue', 'hunt', 'larder', 'burn', 'rescue']);
  const places = rng.shuffle([...PLACES]);
  if (sewers) places.splice(day % 3, 0, SEWERS);
  return [0, 1, 2].map((i) => {
    const place = places[i], objective = objectives[i], boss = rng.pick(BOSSES);
    const twist: Twist = rng.next() < 0.3 ? 'night' : 'none';
    return {
      id: `d${day}-${i}`, place, objective, twist, rooms: 3, boss: objective === 'hunt' ? boss : undefined,
      reward: 40 + place.ruin * 20 + (twist === 'night' ? 15 : 0), seed: day * 101 + i * 7 + 1, ...describe(objective, place, boss),
    };
  });
}
