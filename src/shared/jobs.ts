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
  /** A deep dive: longer, worse, a named butcher at the bottom, and a relic pried out of it. */
  deep?: boolean;
}

const BOSSES = ['MAWL', 'SKARN', 'OLD KNUCKLES', 'OLD SPOON', 'GUTCHAIN', 'MOTHER RUST'];

function describe(o: Objective, p: Place, boss: string): { title: string; text: string } {
  if (o === 'rescue') return { title: `Rescue at ${p.name}`, text: `Folk alive in cages at ${p.name}, at last count. Last count was three days ago. Break the cages, bring them home, don't stop to count.` };
  if (o === 'hunt') return { title: `Hunt ${boss}`, text: `${boss} has made a larder of ${p.name}, and a dozen little ones eat from it. Kill it and the rest lose their nerve. Bring back something to prove it; we\'ve been lied to before.` };
  if (o === 'burn') return { title: `Burn out the dens at ${p.name}`, text: `The hungry have dug in at ${p.name}. Every hole you leave, they come back to. Burn every den. They hoard lamp oil; use theirs.` };
  return { title: `Burn the larder at ${p.name}`, text: `They keep a larder at ${p.name}. Some of it is grain. Smash every rack, and don't look too long at the rest.` };
}

/** Under Wickhold itself: on the board once the town works have driven the goblins below to bay. */
export const SEWERS: Place = { name: 'The Wickhold Sewers', kind: 'mine', region: 'Wickhold', ruin: 2 };

/** Today's jobs: three ordinary ones (one in the sewers, once they're open) and a deep dive. */
export function board(day: number, sewers = false): Job[] {
  return [...ordinary(day, sewers), deepDive(day)];
}

/** Five rooms into the worst of it, a named butcher at the bottom with a relic in its gut. */
export function deepDive(day: number): Job {
  const rng = new Rng(day * 613 + 7), place = rng.pick(PLACES.filter((p) => p.ruin >= 2)), boss = rng.pick(BOSSES);
  return {
    id: `d${day}-deep`, place: { ...place, ruin: 3 }, objective: 'hunt', twist: rng.next() < 0.5 ? 'night' : 'none', rooms: 5, boss, deep: true,
    reward: 180, seed: day * 131 + 59, title: `Deep: ${boss} at ${place.name}`,
    text: `Five rooms down through ${place.name}, the worst of it, and ${boss} at the bottom. The big ones carry relics in them. Cut it out of ${boss} and it's yours.`,
  };
}

function ordinary(day: number, sewers: boolean): Job[] {
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
