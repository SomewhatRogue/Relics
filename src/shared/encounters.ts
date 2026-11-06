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
import type { Debut } from './debut.js';
import { CHALKER } from './chalk.js';
import { SNARE_DEBUT } from './hangwords.js';
import { PLANKER, FORKER, SWINGLE } from './meaty.js';

/** What a goblin in a pack is for. `fodder` is the small ones; every other role is a special. */
export type Role = 'fodder' | 'lunger' | 'shield' | 'heavy' | 'hexer' | 'drummer' | 'butcher' | 'archer'
  | 'banner' | 'netter' | 'thief' | 'log' | 'roofer' | 'keeper' | 'wolf' | 'oiler' | 'torch' | 'sapper' | 'blind' | 'ironhide'
  | 'chalker' | 'snarer' | 'planker' | 'swingle' | 'forker';

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
  /** A new sort bleeding in: staged, then rare, then common (shared/debut.ts). */
  debut?: Debut;
  /** Which beats of a room it can be (shared/encounter.ts): a swarm to splat, a fight to think about, the closer. */
  beats: Beat[];
  /** Its centrepiece is a BIG ONE (shared/threat.ts BIG): laid only in the room a job keeps one for. */
  big?: boolean;
}

/** A room's fights from the way in: `splat` a swarm, `tactic` fewer, meatier and readable, `closer` a heavy or a BIG ONE. */
export type Beat = 'splat' | 'tactic' | 'closer';

const OPEN: PlaceKind[] = ['field', 'farm', 'forest', 'river', 'marsh'];
const ABOVE: PlaceKind[] = ['village', 'farm', 'field', 'forest', 'river', 'marsh', 'ruins'];

export const TEMPLATES: Template[] = [
  { id: 'swarm', said: 'a swarm of small ones', fodder: [4, 6], bunch: true, weight: 3, more: 'lunger', beats: ['splat'] },
  { id: 'brute', said: 'a brute and the little ones', centre: ['heavy'], fodder: [3, 4], weight: 3, more: 'lunger', beats: ['tactic', 'closer'] },
  { id: 'banner', said: 'a banner-bearer and its pack', centre: ['banner'], fodder: [3, 5], from: 1, weight: 2.5, more: 'lunger', places: ABOVE, beats: ['tactic'] },
  { id: 'butcher', said: 'a butcher at the fire', centre: ['butcher'], fodder: [2, 4], from: 1, ruin: 2, weight: 2, beats: ['closer'] },
  { id: 'wall', said: 'two shields and an archer', centre: ['shield', 'shield'], support: ['archer'], fodder: [1, 2], ruin: 1, weight: 2, beats: ['tactic'] },
  { id: 'netter', said: 'a swarm of small ones and a netter', support: ['netter'], fodder: [4, 5], bunch: true, weight: 2.5, beats: ['splat', 'tactic'] },
  { id: 'logs', said: 'log-carriers through the hedge', centre: ['log'], fodder: [2, 3], from: 1, weight: 2, places: ['farm', 'field', 'village', 'river'], beats: ['tactic', 'closer'] },
  { id: 'drum', said: 'a brute with a drum behind it', centre: ['heavy'], support: ['drummer'], fodder: [3, 4], from: 1, weight: 1, beats: ['tactic', 'closer'] },
  { id: 'hexer', said: 'a hexer behind a shield', centre: ['shield'], support: ['hexer'], fodder: [2, 4], from: 1, weight: 1, beats: ['tactic'] },
  { id: 'thief', said: 'a crowd, and a sneak-thief in it', support: ['thief'], fodder: [3, 5], bunch: true, weight: 1.5, places: ['village', 'farm', 'ruins', 'river', 'field'], beats: ['splat'] },
  { id: 'oil', said: 'an oil thrower and its torch', centre: ['oiler'], support: ['torch'], fodder: [2, 3], from: 1, ruin: 1, weight: 1.5, places: ['village', 'farm', 'mine', 'ruins', 'field'], beats: ['tactic'] },
  { id: 'roof', said: 'archers on the roofs', centre: ['roofer'], support: ['roofer'], fodder: [2, 3], roofs: true, weight: 2.5, beats: ['tactic'] },
  { id: 'wolves', said: 'a wolf-keeper and its wolves', centre: ['keeper'], fodder: [3, 4], fodderKind: 'wolf', weight: 2, places: OPEN, beats: ['tactic'] },
  { id: 'sapper', said: 'a brute in front and a sapper under', centre: ['heavy'], support: ['sapper'], fodder: [2, 3], from: 1, weight: 1.5, places: ['farm', 'field', 'forest', 'mine', 'marsh'], beats: ['tactic', 'closer'] },
  { id: 'iron', said: 'an ironhide and the little ones', centre: ['ironhide'], fodder: [3, 4], from: 1, weight: 1.5, more: 'lunger', beats: ['tactic', 'closer'] },
  { id: 'ironback', said: 'a brute with an ironhide at its side', centre: ['heavy'], support: ['ironhide'], fodder: [2, 3], from: 1, ruin: 1, weight: 1, beats: ['closer'] },
  { id: 'chalk', said: 'a chalker behind a crowd, chalking one of you', support: ['chalker'], fodder: [3, 5], from: 1, weight: 1.5, more: 'lunger', debut: CHALKER.debut, beats: ['splat', 'tactic'] },
  { id: 'snare', said: 'a snarer behind a few small ones, snaring the ground in front of you', support: ['snarer'], fodder: [3, 4], from: 1, weight: 1.2, debut: SNARE_DEBUT, beats: ['tactic'] },
  // The new meaty sorts (shared/meaty.ts), each bleeding in (shared/debut.ts): a fight to think about, or a room's closer.
  { id: 'plank', said: 'a planker behind its barn door, and a few small ones', centre: ['planker'], fodder: [2, 3], from: 1, weight: 1.5, debut: PLANKER.debut, beats: ['tactic', 'closer'] },
  { id: 'swing', said: 'a swingle with its flail, and a few small ones', centre: ['swingle'], fodder: [2, 4], from: 1, weight: 1.5, debut: SWINGLE.debut, beats: ['tactic', 'closer'] },
  { id: 'fork', said: 'a forker with its pitchfork, and a few small ones', centre: ['forker'], fodder: [2, 3], from: 1, weight: 1.5, more: 'lunger', debut: FORKER.debut, beats: ['tactic', 'closer'] },
  { id: 'bigbrute', said: 'a BIG ONE of a brute and a few small ones', centre: ['heavy'], fodder: [2, 3], weight: 0, beats: ['closer'], big: true },
  { id: 'bigiron', said: 'a BIG ONE in iron and a few small ones', centre: ['ironhide'], fodder: [2, 3], ruin: 2, weight: 0, beats: ['closer'], big: true },
  { id: 'cave', said: 'blind hunters in the dark', fodder: [3, 4], fodderKind: 'blind', weight: 4, places: ['mine'], beats: ['splat', 'tactic'] },
];

/**
 * - `fights`: the most packs a room is split into (by room); smaller bands join the nearest.
 * - `specials`: the most specials in a room (by room; `deep` more on a deep job or at ruin 3; the
 *   party's `more` on top). A named butcher doesn't count.
 * - `ledge`: archers kept on a ledge (`high` on the high road).
 * - `bunchHp`: the small ones of a swarm. `band`: how near goblins stand to be one pack.
 * - `first`: the first room's first fight is one of these.
 * - `hearOther`: a fight in another pack is heard only this close (ALERT.hear in your own).
 * - A party: shared/threat.ts PARTY_TOUGH (tougher, not many more).
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
};

/** Roles that are a kind of small goblin (the rest are something else: a wolf, the log-carriers). */
export const GOBLIN_ROLES: Role[] = ['fodder', 'lunger', 'shield', 'heavy', 'hexer', 'drummer', 'archer', 'banner', 'netter', 'thief', 'roofer', 'keeper', 'oiler', 'torch', 'sapper', 'blind', 'ironhide', 'chalker', 'snarer', 'planker', 'swingle', 'forker'];
/** Backers that keep to the back of a pack (put furthest from the way in). */
export const BACK_ROLES: Role[] = ['archer', 'hexer', 'drummer', 'banner', 'netter', 'oiler', 'torch', 'keeper', 'chalker', 'snarer'];
