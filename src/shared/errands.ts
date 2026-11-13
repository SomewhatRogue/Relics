/**
 * A hero's town errands (docs/design/town-quests.md): the two first ones a runner brings on their
 * first arrival in Wickhold (refill the relic at the church, see your trainer), and a word to check in
 * with the trainer whenever a level opens a new class skill. Pure, on the profile: the goal line, the
 * marks over people and the panels all ask here.
 *
 * Heroes from before errands (no record) have done them all: they never get the first two.
 */
import { SKILL_CHOICES } from './magic.js';
import type { Profile } from './progress.js';
import { knowsSkill, skillStep } from './skillteach.js';
import { CLASS_ORDER, type HeroClass } from './weapons.js';
import { questBack, questDue, questHeld, reported, takeQuest } from './heroquests.js';

/** `quest`: your trainer has a hero quest for you; `job`: one in hand, to do; `back`: one done, to tell them of (shared/heroquests.ts). */
export type ErrandId = 'relic' | 'trainer' | 'skill' | 'quest' | 'job' | 'back';
export interface Errands {
  /** The runner has found you and said their line (the first two are yours from then). */
  told: boolean;
  /** The first two, done. */
  relic: boolean;
  trainer: boolean;
  /** The level the trainer last saw you at (a skill opened above it is news). */
  seen: number;
}

export const newErrands = (): Errands => ({ told: false, relic: false, trainer: false, seen: 1 });
/** Everything done, as for a hero from before errands. */
export const doneErrands = (level: number): Errands => ({ told: true, relic: true, trainer: true, seen: level });

/** Fill in a saved hero's record (old heroes: all done; a broken one made sound). */
export function fitErrands(e: unknown, level: number): Errands {
  if (!e || typeof e !== 'object') return doneErrands(level);
  const o = e as Partial<Errands>;
  return { told: !!o.told, relic: !!o.relic, trainer: !!o.trainer, seen: Math.max(1, Math.floor(Number(o.seen) || 1)) };
}

/** Where each class's trainer is (the hall's door in town, shared/town.ts). */
export const TRAINER_DOOR: Record<HeroClass, string> = { WARRIOR: 'hall', RANGER: 'lodge', ROGUE: 'tavern', MAGE: 'tower', HEALER: 'church' };

/** The level of the newest class skill this hero could learn now and hasn't (0: none open). */
export function openSkillLevel(p: Profile): number {
  let lv = 0;
  for (const r of SKILL_CHOICES[p.cls]) {
    const s = skillStep(p, r);
    if (s.level <= p.level && !knowsSkill(p, r)) lv = Math.max(lv, s.level);
  }
  return lv;
}

/** The errands open now, in order. (The trainer's first errand covers the skill's news too.) */
export function openErrands(p: Profile): ErrandId[] {
  const e = p.errands ?? doneErrands(p.level), out: ErrandId[] = [];
  if (e.told && !e.relic) out.push('relic');
  if (e.told && !e.trainer) out.push('trainer');
  else if (openSkillLevel(p) > e.seen) out.push('skill');
  // (Not before the runner's been: the first is handed over at the first meeting.)
  if (questDue(p) && e.told && e.trainer) out.push('quest');
  if (questHeld(p)) out.push('job');
  if (questBack(p)) out.push('back');
  return out;
}

/** The first two, while either is still to do (done ones too, so the goal line can tick them off). */
export function firstErrands(p: Profile): { id: ErrandId; done: boolean }[] {
  const e = p.errands;
  if (!e?.told || (e.relic && e.trainer)) return [];
  return [{ id: 'relic', done: e.relic }, { id: 'trainer', done: e.trainer }];
}

/** Does the runner still have to come? */
export const runnerDue = (p: Profile) => !!p.errands && !p.errands.told && p.prologue;

/** The runner has said their line. */
export function told(p: Profile): void {
  if (p.errands) p.errands.told = true;
}

/** The relic's errand done (at the church). True if that ticked it off. */
export function relicDone(p: Profile): boolean {
  if (!p.errands?.told || p.errands.relic) return false;
  p.errands.relic = true;
  return true;
}

/** Who an errand sends you to: a door in town and who's behind it (an npc's `talk` and `arg`). */
export function errandWho(p: Profile, id: ErrandId): { door: string; talk: string; arg?: number; spot?: string } {
  if (id === 'relic') return { door: 'church', talk: 'church' };
  // A quest in hand: the board, where your job for it is; or Cobb's ladder, for what's found in the Deep.
  if (id === 'job') return questHeld(p)?.q.post ? { door: '', talk: 'board', spot: 'board' } : { door: '', talk: 'sewer', spot: 'sewer' };
  return { door: TRAINER_DOOR[p.cls], talk: 'trainer', arg: CLASS_ORDER.indexOf(p.cls) };
}

/** Talking to someone: your own trainer ticks off the trainer's errand and hears the news of a new skill. True if anything changed. */
export function talkedTo(p: Profile, talk: string, arg?: number): boolean {
  const e = p.errands;
  if (!e || talk !== 'trainer' || arg !== CLASS_ORDER.indexOf(p.cls)) return false;
  const was = JSON.stringify(e);
  if (e.told) e.trainer = true;
  e.seen = Math.max(e.seen, p.level);
  // Hears of the one you've done, and hands over the quest they have for you (the first at the first meeting).
  const back = !!questBack(p);
  reported(p);
  const took = e.told && e.trainer && takeQuest(p);
  return back || took || JSON.stringify(e) !== was;
}
