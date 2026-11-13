/**
 * Hero quests (docs/design/hero-quests.md): a level opens a quest, your trainer hands it over, your board
 * gets a job of your own for it, and doing its one thing opens the next of the world on your board. The
 * quests are the board's own objectives with a count (kill this, burn three, bring out four).
 *
 * What counts is the job's facts at its end (`QuestFacts`), on whoever's job it was: a run joined counts
 * toward your own quest (Kyle, 2026-11-13). Old heroes have done every quest up to their level. Pure.
 */
import { PLACES, SIZES, payFor, type Job, type Objective, type Place, type Size } from './jobs.js';
import type { Profile } from './progress.js';
import { rollTime } from './timeofday.js';

export type QuestId = 'q3' | 'q4' | 'q5' | 'q7' | 'q9';
/** What a quest opens: Hangman's Wood, the expeditions (the Barrowfields, Fenmere), the Deep, the Open Cut. */
export type Gate = 'hangman' | 'exped' | 'deep' | 'opencut';

/** How a job ended, as a quest counts it. `haulier`: THE HAULIER killed (a Deep floor's arena). */
export interface QuestFacts { job: Job; won: boolean; rescued: number; dens: number; haulier?: boolean }

export interface QuestDef {
  id: QuestId;
  level: number;
  kind: Objective;
  need: number;
  /** How much of `need` a job's end brings. */
  counts: (f: QuestFacts) => number;
  opens?: Gate;
  /** Your board's posting for it (none: it's found where it is, the Haulier in the Deep). */
  post?: { place: string; size: Size; boss?: string; deep?: boolean };
}

const at = (f: QuestFacts, name: string) => f.job.place.name === name;
const region = (f: QuestFacts, r: string) => f.job.place.region === r && !f.job.exped;

/** The ladder (first draft, dull on purpose: the spec's table). */
export const QUESTS: QuestDef[] = [
  { id: 'q3', level: 3, kind: 'hunt', need: 1, counts: (f) => (f.won && f.job.objective === 'hunt' && !!f.job.boss && !f.job.floor ? 1 : 0), post: { place: "Tollan's Farm", size: 'short', boss: 'MAWL' } },
  { id: 'q4', level: 4, kind: 'burn', need: 3, counts: (f) => (region(f, 'Greyhollow') ? f.dens : 0), opens: 'hangman', post: { place: 'Sallow Carr', size: 'medium' } },
  { id: 'q5', level: 5, kind: 'rescue', need: 4, counts: (f) => (at(f, 'Fennick Ford') ? f.rescued : 0), opens: 'exped', post: { place: 'Fennick Ford', size: 'medium' } },
  { id: 'q7', level: 7, kind: 'hunt', need: 1, counts: (f) => (f.won && !!f.job.deep && !f.job.floor ? 1 : 0), opens: 'deep', post: { place: 'The Copperdeep Shafts', size: 'long', boss: 'GUTCHAIN', deep: true } },
  { id: 'q9', level: 9, kind: 'hunt', need: 1, counts: (f) => (f.haulier ? 1 : 0), opens: 'opencut' },
];
export const quest = (id: QuestId) => QUESTS.find((q) => q.id === id)!;

/** A hero's quests: the one in hand (`at`, `n` of its need) and those done. */
export interface Quests { at: QuestId | null; n: number; done: QuestId[] }

export const newQuests = (): Quests => ({ at: null, n: 0, done: [] });
/** Every quest up to this level done (an old hero). */
export const doneQuests = (level: number): Quests => ({ at: null, n: 0, done: QUESTS.filter((q) => q.level <= level).map((q) => q.id) });

/** A saved hero's record made sound (none: an old hero, done up to their level). */
export function fitQuests(e: unknown, level: number): Quests {
  if (!e || typeof e !== 'object') return doneQuests(level);
  const o = e as Partial<Quests>, ok = (x: unknown): x is QuestId => QUESTS.some((q) => q.id === x);
  const done = Array.isArray(o.done) ? [...new Set(o.done.filter(ok))] : [];
  const held = ok(o.at) && !done.includes(o.at) ? o.at : null;
  return { at: held, n: held ? Math.max(0, Math.min(quest(held).need, Math.floor(Number(o.n) || 0))) : 0, done };
}

const rec = (p: Profile) => p.quests ?? doneQuests(p.level);

/** The quest your trainer has for you now: the first not done, at your level, if none's in hand. */
export function questDue(p: Profile): QuestDef | null {
  const r = rec(p);
  if (r.at) return null;
  return QUESTS.find((q) => !r.done.includes(q.id) && q.level <= p.level) ?? null;
}

/** The quest in hand, and how far along. */
export function questHeld(p: Profile): { q: QuestDef; n: number } | null {
  const r = rec(p);
  return r.at ? { q: quest(r.at), n: r.n } : null;
}

/** Your trainer hands it over. True if one was given. */
export function takeQuest(p: Profile): boolean {
  const q = questDue(p);
  if (!q || !p.quests) return false;
  Object.assign(p.quests, { at: q.id, n: 0 });
  return true;
}

/** A job's end: the quest in hand counts what it brought. The quest finished, if this finished it. */
export function questCount(p: Profile, f: QuestFacts): QuestDef | null {
  const r = p.quests, held = r?.at ? quest(r.at) : null;
  if (!r || !held) return null;
  r.n = Math.min(held.need, r.n + Math.max(0, held.counts(f)));
  if (r.n < held.need) return null;
  Object.assign(r, { at: null, n: 0, done: [...r.done, held.id] });
  return held;
}

/** Is this part of the world open to this hero? (Old heroes: as far as their level.) */
export const isOpen = (p: Profile, g: Gate) => QUESTS.filter((q) => q.opens === g).every((q) => rec(p).done.includes(q.id));

/** Which gate a job stands behind (none: always on the board). */
export function gateOf(j: Job): Gate | null {
  if (j.instance === 'opencut') return 'opencut';
  if (j.exped === 'hangmans' || j.zone === 'hangman') return 'hangman';
  if (j.exped) return 'exped';
  return null;
}

/** A small stable number from a hero's id and the quest (the posting's seed). */
function seedOf(id: string, q: QuestId): number {
  let h = 2166136261;
  for (const c of id + ':' + q) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) % 900000 + 1000;
}

/** Your board's job for the quest in hand: the same every day till it's done. The words: client/questwords.ts. */
export function questJob(p: Profile, words: (q: QuestDef, place: Place) => { title: string; text: string }): Job | null {
  const held = questHeld(p), post = held?.q.post;
  if (!held || !post) return null;
  const place = PLACES.find((x) => x.name === post.place)!, seed = seedOf(p.id, held.q.id), rooms = post.deep ? 5 : SIZES[post.size].rooms;
  const placed = post.deep ? { ...place, ruin: 3 } : place;
  return {
    id: `quest-${held.q.id}-${seed}`, place: placed, objective: held.q.kind, twist: 'none', time: rollTime(seed, false), rooms, size: post.size, layout: 4, seed,
    reward: payFor(rooms, placed.ruin, false, post.size) + (post.deep ? 40 : 0), ...(post.boss ? { boss: post.boss } : {}), ...(post.deep ? { deep: true } : {}),
    quest: held.q.id, ...words(held.q, placed),
  };
}
