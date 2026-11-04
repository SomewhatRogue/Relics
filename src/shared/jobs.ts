/**
 * Jobs: a place plus an objective plus a twist, posted on Wickhold's job board. The board changes
 * each day (one finished run is a day for now). A chapter's story mission sits on it until it's done.
 */
import { Rng } from './rng.js';
import { rollTime, type Time } from './timeofday.js';

export type PlaceKind = 'village' | 'farm' | 'field' | 'forest' | 'mine' | 'river' | 'marsh' | 'ruins';
export interface Place { name: string; kind: PlaceKind; region: string; ruin: number }

export const PLACES: Place[] = [
  { name: 'Barrowby', kind: 'village', region: 'Barrowfields', ruin: 1 },
  { name: "Tollan's Farm", kind: 'farm', region: 'Barrowfields', ruin: 1 },
  { name: 'Lowfurrow Fields', kind: 'field', region: 'Barrowfields', ruin: 1 },
  { name: 'Fennick Ford', kind: 'village', region: 'Fenmere', ruin: 2 },
  { name: 'The Charcoal Camps', kind: 'forest', region: 'Greyhollow', ruin: 2 },
  { name: "Hangman's Wood", kind: 'forest', region: 'Greyhollow', ruin: 2 },
  { name: 'The Copperdeep Shafts', kind: 'mine', region: 'Copperdeep', ruin: 2 },
  { name: 'The Sheepwash', kind: 'river', region: 'Barrowfields', ruin: 1 },
  { name: 'Brokenbridge', kind: 'river', region: 'Copperdeep', ruin: 2 },
  { name: 'The Peat Cuts', kind: 'marsh', region: 'Fenmere', ruin: 2 },
  { name: 'Sallow Carr', kind: 'marsh', region: 'Greyhollow', ruin: 2 },
  { name: 'Ketterby', kind: 'ruins', region: 'Barrowfields', ruin: 1 },
  { name: 'Hesketh Hall', kind: 'ruins', region: 'Fenmere', ruin: 3 },
];

export type Objective = 'rescue' | 'hunt' | 'larder' | 'burn' | 'story';
/**
 * How long a job is: a short one is about five minutes, a long one about fifteen. Longer pays
 * better, all told and per room, and its treasure is better (treasure.ts).
 */
export type Size = 'short' | 'medium' | 'long';
export const SIZES: Record<Size, { rooms: number; label: string; minutes: string; pay: number }> = {
  short: { rooms: 2, label: 'SHORT', minutes: 'about 5 minutes', pay: 1 },
  medium: { rooms: 3, label: 'MEDIUM', minutes: 'about 10 minutes', pay: 1.15 },
  long: { rooms: 5, label: 'LONG', minutes: 'about 15 minutes', pay: 1.35 },
};
/** Gold a job pays: by room, by how bad the place is, more at night, more for a longer one. */
export const payFor = (rooms: number, ruin: number, night: boolean, size: Size) => Math.round((18 + ruin * 9 + (night ? 6 : 0)) * rooms * SIZES[size].pay);
export type Twist = 'none' | 'night';
/** A story mission is for a party: at least this many heroes when the world is shared online. */
export const STORY_PARTY = 3;
/** The short name of a job's kind, for the board's list. */
export const KIND: Record<Objective, string> = { rescue: 'RESCUE', hunt: 'HUNT', larder: 'LARDER', burn: 'DENS', story: 'STORY' };
/** How hard a job is, 1 to 5: the place's ruin, its length, night, and a deep dive. */
export const danger = (j: Job) => Math.max(1, Math.min(5, Math.round(1 + j.place.ruin * 0.6 + (j.size === 'long' ? 1 : j.size === 'short' ? 0 : 0.5) + (j.twist === 'night' ? 0.5 : 0) + (j.deep ? 1 : 0) + (j.objective === 'story' ? 1 : 0))));

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
  /** How long (old jobs without one are medium). */
  size?: Size;
  /** The hour (shared/timeofday.ts; old jobs without one: night if it was a night job, else day). */
  time?: Time;
  /**
   * How its rooms are laid out: 3, a route that turns, forks, rejoins and crosses countries, with side
   * ways (shared/routeports.ts); 2, a route of different rooms to the place's heart, always bottom to
   * top (shared/route.ts); none, an old saved job, every room its place's own plan as it always was.
   * Saved jobs keep the layout they were made with.
   */
  layout?: 2 | 3;
}

const BOSSES = ['MAWL', 'SKARN', 'OLD KNUCKLES', 'OLD SPOON', 'GUTCHAIN', 'MOTHER RUST'];

function describe(o: Objective, p: Place, boss: string): { title: string; text: string } {
  if (o === 'rescue') return { title: `Rescue at ${p.name}`, text: `There were folk alive in cages at ${p.name} three days ago, and some may be yet. Break the cages open and bring them home.` };
  if (o === 'hunt') return { title: `Hunt ${boss}`, text: `${boss} has made a larder of ${p.name}, and a dozen little ones eat from it. Kill it and the rest lose their nerve.` };
  if (o === 'burn') return { title: `Burn out the dens at ${p.name}`, text: `The hungry have put up dens at ${p.name}, and any den you leave, they come back to. Burn every one. They hoard lamp oil, so use theirs.` };
  return { title: `Smash the larder at ${p.name}`, text: `They keep a larder at ${p.name}, and some of it is grain. Smash every rack, and don't look too long at the rest.` };
}

/** Under Wickhold itself: on the board once the town works have driven the goblins below to bay. */
export const SEWERS: Place = { name: 'The Wickhold Sewers', kind: 'mine', region: 'Wickhold', ruin: 2 };

/** Today's jobs: three ordinary ones (one in the sewers, once they're open) and a deep dive. */
export function board(day: number, sewers = false): Job[] {
  return [...ordinary(day, sewers), deepDive(day)];
}

/** Five rooms into the worst of it, a named butcher at the bottom with a relic in its gut. */
export function deepDive(day: number): Job {
  const rng = new Rng(day * 613 + 7), place = rng.pick(PLACES.filter((p) => p.ruin >= 2)), boss = rng.pick(BOSSES), night = rng.next() < 0.5;
  return {
    id: `d${day}-deep`, place: { ...place, ruin: 3 }, objective: 'hunt', twist: night ? 'night' : 'none', time: rollTime(day * 131 + 59, night), rooms: 5, boss, deep: true, size: 'long', layout: 3,
    reward: payFor(5, 3, false, 'long') + 40, seed: day * 131 + 59, title: `Deep: ${boss} at ${place.name}`,
    text: `Five rooms down through ${place.name}, the worst of it, and ${boss} at the bottom with a relic grown into it. Kill it and the relic is yours.`,
  };
}

/** Four a day: a short one, two medium, a long one, each somewhere different (a kind of place apiece where it can). */
function ordinary(day: number, sewers: boolean): Job[] {
  const rng = new Rng(day * 977 + 31);
  const objectives: Objective[] = rng.shuffle(['rescue', 'hunt', 'larder', 'burn', 'rescue', 'hunt']);
  const places: Place[] = [];
  for (const p of rng.shuffle([...PLACES])) if (!places.some((q) => q.kind === p.kind)) places.push(p);
  if (sewers) places.splice(day % 3, 0, SEWERS);
  const sizes: Size[] = ['short', 'medium', 'medium', 'long'];
  return sizes.map((size, i) => {
    const place = places[i % places.length], objective = objectives[i], boss = rng.pick(BOSSES);
    const twist: Twist = rng.next() < 0.3 ? 'night' : 'none', rooms = SIZES[size].rooms, seed = day * 101 + i * 7 + 1;
    return {
      id: `d${day}-${i}`, place, objective, twist, time: rollTime(seed, twist === 'night'), rooms, size, layout: 3, boss: objective === 'hunt' ? boss : undefined,
      reward: payFor(rooms, place.ruin, twist === 'night', size), seed, ...describe(objective, place, boss),
    };
  });
}
