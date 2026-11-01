/**
 * Jobs: a place plus an objective plus a twist, posted on Wickhold's job board. The board changes
 * each day (one finished run is a day for now). A chapter's story mission sits on it until it's done.
 */
import { Rng } from './rng';

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
  if (o === 'rescue') return { title: `Rescue at ${p.name}`, text: `Goblins have caged survivors at ${p.name}. Break the cages and bring them home.` };
  if (o === 'hunt') return { title: `Hunt ${boss}`, text: `A butcher called ${boss} holds ${p.name}. Kill it, and the place breathes again.` };
  if (o === 'burn') return { title: `Burn out the dens at ${p.name}`, text: `Goblins have dug dens into ${p.name} and more crawl out of them every few breaths. Burn every den: oil lies about, and fire spreads wood to wood.` };
  return { title: `Burn the larder at ${p.name}`, text: `The goblins at ${p.name} keep a larder of stolen stores and worse. Smash every rack.` };
}

/** Today's three jobs. */
export function board(day: number): Job[] {
  const rng = new Rng(day * 977 + 31);
  const objectives: Objective[] = rng.shuffle(['rescue', 'hunt', 'larder', 'burn', 'rescue']);
  const places = rng.shuffle([...PLACES]);
  return [0, 1, 2].map((i) => {
    const place = places[i], objective = objectives[i], boss = rng.pick(BOSSES);
    const twist: Twist = rng.next() < 0.3 ? 'night' : 'none';
    return {
      id: `d${day}-${i}`, place, objective, twist, rooms: 3, boss: objective === 'hunt' ? boss : undefined,
      reward: 40 + place.ruin * 20 + (twist === 'night' ? 15 : 0), seed: day * 101 + i * 7 + 1, ...describe(objective, place, boss),
    };
  });
}
