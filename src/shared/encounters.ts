/**
 * Encounters (Kyle, 2026-11-04: "Too much chaos on the screen reads messy. I'd rather have more
 * impactful battles, but splattering little goblins is also fun"). A routed room's goblins come as a
 * few fights, each a pack built from one template: at most one centrepiece threat (a brute, a
 * banner-bearer, a butcher, a shield wall, the log-carriers), at most one kind of goblin backing it,
 * and small ones to fill it out. Packs wake on their own (a pack's shout wakes only its own), so a room
 * plays as fights with breathing room between, not one swarm. Numbers and the table only: the rules
 * that lay it out are shared/encounter.ts, the party's extra are sim/packs.ts.
 */
import type { PlaceKind } from './jobs.js';

/** What a goblin in a pack is for. `fodder` is the small ones; every other role is a special. */
export type Role = 'fodder' | 'lunger' | 'shield' | 'heavy' | 'hexer' | 'drummer' | 'butcher' | 'archer'
  | 'banner' | 'netter' | 'thief' | 'log' | 'roofer' | 'keeper' | 'wolf' | 'oiler' | 'torch' | 'sapper' | 'blind' | 'ironhide';

export interface Template {
  id: string;
  /** What it is, in plain words (for the record and the tests; never on screen). */
  said: string;
  /** The centrepiece: one threat, or a pair of the same (the shield wall). */
  centre?: Role[];
  /** What backs it up: one kind. */
  support?: Role[];
  /** How many small ones, and what they are (goblins unless it says: wolves, the blind hunters). */
  fodder: [number, number];
  fodderKind?: Role;
  /** The small ones go down in a blow or two (ENCOUNTER.bunchHp): the fights you splatter. */
  bunch?: boolean;
  /** Only in these places (anywhere when left out). */
  places?: PlaceKind[];
  /** Not before this room of a job, nor below this much ruin. */
  from?: number;
  ruin?: number;
  /** Needs a house with its roof on in the room. */
  roofs?: boolean;
  weight: number;
  /** One more special in a party of three or more. */
  more?: Role;
}

const OPEN: PlaceKind[] = ['field', 'farm', 'forest', 'river', 'marsh'];
const ABOVE: PlaceKind[] = ['village', 'farm', 'field', 'forest', 'river', 'marsh', 'ruins'];

export const TEMPLATES: Template[] = [
  { id: 'swarm', said: 'a swarm of small ones', fodder: [4, 6], bunch: true, weight: 3, more: 'lunger' },
  { id: 'brute', said: 'a brute and the little ones', centre: ['heavy'], fodder: [3, 4], weight: 3, more: 'lunger' },
  { id: 'banner', said: 'a banner-bearer and its pack', centre: ['banner'], fodder: [3, 5], from: 1, weight: 2.5, more: 'lunger', places: ABOVE },
  { id: 'butcher', said: 'a butcher at the fire', centre: ['butcher'], fodder: [2, 4], from: 1, ruin: 2, weight: 2 },
  { id: 'wall', said: 'two shields and an archer', centre: ['shield', 'shield'], support: ['archer'], fodder: [1, 2], ruin: 1, weight: 2 },
  { id: 'netter', said: 'a swarm of small ones and a netter', support: ['netter'], fodder: [4, 5], bunch: true, weight: 2.5 },
  { id: 'logs', said: 'log-carriers through the hedge', centre: ['log'], fodder: [2, 3], from: 1, weight: 2, places: ['farm', 'field', 'village', 'river'] },
  { id: 'drum', said: 'a brute with a drum behind it', centre: ['heavy'], support: ['drummer'], fodder: [3, 4], from: 1, weight: 1 },
  { id: 'hexer', said: 'a hexer behind a shield', centre: ['shield'], support: ['hexer'], fodder: [2, 4], from: 1, weight: 1 },
  { id: 'thief', said: 'a crowd, and a sneak-thief in it', support: ['thief'], fodder: [3, 5], bunch: true, weight: 1.5, places: ['village', 'farm', 'ruins', 'river', 'field'] },
  { id: 'oil', said: 'an oil thrower and its torch', centre: ['oiler'], support: ['torch'], fodder: [2, 3], from: 1, ruin: 1, weight: 1.5, places: ['village', 'farm', 'mine', 'ruins', 'field'] },
  { id: 'roof', said: 'archers on the roofs', centre: ['roofer'], support: ['roofer'], fodder: [2, 3], roofs: true, weight: 2.5 },
  { id: 'wolves', said: 'a wolf-keeper and its wolves', centre: ['keeper'], fodder: [3, 4], fodderKind: 'wolf', weight: 2, places: OPEN },
  { id: 'sapper', said: 'a brute in front and a sapper under', centre: ['heavy'], support: ['sapper'], fodder: [2, 3], from: 1, weight: 1.5, places: ['farm', 'field', 'forest', 'mine', 'marsh'] },
  { id: 'iron', said: 'an ironhide and the little ones', centre: ['ironhide'], fodder: [3, 4], from: 1, weight: 1.5, more: 'lunger' },
  { id: 'ironback', said: 'a brute with an ironhide at its side', centre: ['heavy'], support: ['ironhide'], fodder: [2, 3], from: 1, ruin: 1, weight: 1 },
  { id: 'cave', said: 'blind hunters in the dark', fodder: [3, 4], fodderKind: 'blind', weight: 4, places: ['mine'] },
];

/**
 * - `fights`: the most packs a room is split into (by room); smaller bands join the nearest.
 * - `specials`: the most specials in a room (by room; `deep` more on a deep job or at ruin 3; the
 *   party's `more` on top). A named butcher doesn't count.
 * - `ledge`: archers kept on a ledge (`high` on the high road).
 * - `bunchHp`: the small ones of a swarm. `band`: how near goblins stand to be one pack.
 * - `first`: the first room's first fight is one of these.
 * - `hearOther`: a fight in another pack is heard only this close (ALERT.hear in your own).
 * - Party: `fodder` more small ones a player past the first; the centrepiece `centre` tougher.
 */
export const ENCOUNTER = {
  fights: [2, 2, 3, 3],
  specials: [2, 3, 3, 4],
  deep: 1,
  ledge: 2,
  high: 3,
  bunchHp: 22,
  band: 3.4,
  first: ['swarm', 'brute', 'netter', 'wolves', 'cave', 'thief'],
  hearOther: 2.2,
  party: { fodder: 0.5, centre: 0.35 },
};

/** Roles that are a kind of small goblin (the rest are something else: a wolf, the log-carriers). */
export const GOBLIN_ROLES: Role[] = ['fodder', 'lunger', 'shield', 'heavy', 'hexer', 'drummer', 'archer', 'banner', 'netter', 'thief', 'roofer', 'keeper', 'oiler', 'torch', 'sapper', 'blind', 'ironhide'];
/** Backers that keep to the back of a pack (put furthest from the way in). */
export const BACK_ROLES: Role[] = ['archer', 'hexer', 'drummer', 'banner', 'netter', 'oiler', 'torch', 'keeper'];
