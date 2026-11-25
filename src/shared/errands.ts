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
import { carriesHungry } from './fence.js';
import { questBack, questDue, questHeld, reported, takeQuest } from './heroquests.js';
import { deepSkillOpen } from './deepskill.js';
import { payErrand } from './errandpay.js';
import { GATE_LEVEL } from './gatefieldsquest.js';
import { EDGE } from './edges.js';

/** `quest`: your trainer has a hero quest for you; `job`: one in hand, to do; `back`: one done, to tell them of (shared/heroquests.ts).
 *  `nettle`: Tobin, frightened of your hungry gear, sent you to Nettle. `church` and `under`: your first hungry piece
 *  home, the church and the Keeping Room each have a word for you (shared/wanterrands.ts, the Holy and hungry chat). */
export type ErrandId = 'relic' | 'trainer' | 'skill' | 'quest' | 'job' | 'back' | 'nettle' | 'church' | 'under' | 'yard' | 'fields' | 'fieldsback' | 'merren';
export interface Errands {
  /** The runner has found you and said their line (the first two are yours from then). */
  told: boolean;
  /** The first two, done. */
  relic: boolean;
  trainer: boolean;
  /** The level the trainer last saw you at (a skill opened above it is news). */
  seen: number;
  /** The trainer has seen you since the Deep opened your Deep skill (shared/deepskill.ts): no longer news. */
  deep?: boolean;
  /** Tobin sent you to Nettle with your hungry gear: 1 to go, 2 been (Kyle, 2026-11-14). Once only. */
  nettle?: number;
  /** Your first hungry piece home (Kyle, 2026-11-23; shared/wanterrands.ts): talk to the church, and to the Keeping
   *  Room's Dorcas, about it: 1 to go, 2 been. */
  church?: number;
  under?: number;
  /** The first chain (Kyle, 2026-11-24): church, then the trainer, who sends you to the yard to try your kit; then back
   *  to the trainer for the board's first quest. 1 to go, 2 done (shared/errandpay.ts pays it), 3 the trainer's heard. */
  yard?: number;
  /** Out the North Gate (Kyle, 2026-11-24): from level 3 the trainer sends you to rest at the Field Barn. 1 to go, 2 done
   *  (paid), 3 the trainer's heard (shared/gatefieldsquest.ts). */
  fields?: number;
  /** From level 5, not a Mage (Kyle, 2026-11-24): Old Merren by the Old Quarter will put an element on your weapon (docs/design/element-augments.md). 1 to go, 2 seen. */
  merren?: number;
}

export const newErrands = (): Errands => ({ told: false, relic: false, trainer: false, seen: 1 });
/** Everything done, as for a hero from before errands. */
export const doneErrands = (level: number): Errands => ({ told: true, relic: true, trainer: true, seen: level });

/** Fill in a saved hero's record (old heroes: all done; a broken one made sound). */
export function fitErrands(e: unknown, level: number): Errands {
  if (!e || typeof e !== 'object') return doneErrands(level);
  const o = e as Partial<Errands>;
  return { told: !!o.told, relic: !!o.relic, trainer: !!o.trainer, seen: Math.max(1, Math.floor(Number(o.seen) || 1)), ...(o.deep ? { deep: true } : {}), ...(o.nettle === 1 || o.nettle === 2 ? { nettle: o.nettle } : {}), ...(o.church === 1 || o.church === 2 ? { church: o.church } : {}), ...(o.under === 1 || o.under === 2 ? { under: o.under } : {}), ...(o.fields === 1 || o.fields === 2 || o.fields === 3 ? { fields: o.fields } : {}), ...(o.merren === 1 || o.merren === 2 ? { merren: o.merren } : {}), ...(o.yard === 1 || o.yard === 2 || o.yard === 3 ? { yard: o.yard } : {}) };
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
  // (The trainer after the church: the runner says church first, and now the trainer waits for it.)
  if (e.told && !e.trainer) {
    if (e.relic) out.push('trainer');
  }
  // (A new skill by level, or the Deep skill a floor opened and the trainer hasn't told you of: shared/deepskill.ts.)
  else if (openSkillLevel(p) > e.seen || (deepSkillOpen(p) && !p.deepTaught && !e.deep)) out.push('skill');
  // (Not before the runner's been: the first is handed over at the first meeting.)
  if (e.yard === 1) out.push('yard');
  // (After the yard, if the trainer sent you there.)
  // (Or the word to go out by the North Gate, waiting with them from level 3: `fieldsDue`.)
  if ((questDue(p) && e.told && e.trainer && e.yard !== 1) || fieldsDue(p)) out.push('quest');
  if (questHeld(p)) out.push('job');
  if (questBack(p)) out.push('back');
  // (Only while there's still something hungry on you to sell him.)
  if (e.nettle === 1 && carriesHungry(p)) out.push('nettle');
  // Your first hungry piece home: the church, and the Keeping Room under the town (shared/wanterrands.ts).
  if (e.church === 1) out.push('church');
  if (e.under === 1) out.push('under');
  if (e.fields === 1) out.push('fields');
  if (e.fields === 2) out.push('fieldsback');
  if (e.merren === 1) out.push('merren');
  return out;
}

/** The first two, while either is still to do (done ones too, so the goal line can tick them off). */
export function firstErrands(p: Profile): { id: ErrandId; done: boolean }[] {
  const e = p.errands;
  if (!e?.told || (e.relic && e.trainer && e.yard !== 1)) return [];
  return [{ id: 'relic', done: e.relic }, { id: 'trainer', done: e.trainer }, ...(e.trainer ? [{ id: 'yard' as ErrandId, done: e.yard !== 1 }] : [])];
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
  payErrand(p, 'relic');
  return true;
}

/** Who an errand sends you to: a door in town and who's behind it (an npc's `talk` and `arg`). */
export function errandWho(p: Profile, id: ErrandId): { door: string; talk: string; arg?: number; spot?: string } {
  if (id === 'relic') return { door: 'church', talk: 'church' };
  // Squire Pell, in the barracks, takes you through to the yard.
  if (id === 'yard') return { door: 'hall', talk: 'yard' };
  // Old Merren, by the Old Quarter's wall (shared/town.ts).
  if (id === 'merren') return { door: '', talk: 'merren' };
  // The way out is the North Gate's spot in the street.
  if (id === 'fields') return { door: '', talk: 'gate', spot: 'gate' };
  if (id === 'nettle') return { door: 'tavern', talk: 'vendor', arg: CLASS_ORDER.indexOf('ROGUE') };
  if (id === 'church') return { door: 'church', talk: 'church' };
  // The Keeping Room is behind the sewer grate's bricked arch.
  if (id === 'under') return { door: '', talk: 'sewer', spot: 'sewer' };
  // A quest in hand: the board, where your job for it is; or Cobb's ladder, for what's found in the Deep.
  if (id === 'job') return questHeld(p)?.q.post ? { door: '', talk: 'board', spot: 'board' } : { door: '', talk: 'sewer', spot: 'sewer' };
  return { door: TRAINER_DOOR[p.cls], talk: 'trainer', arg: CLASS_ORDER.indexOf(p.cls) };
}

/** Talking to someone: your own trainer ticks off the trainer's errand and hears the news of a new skill. True if anything changed. */
export function talkedTo(p: Profile, talk: string, arg?: number): boolean {
  const e = p.errands;
  if (!e || talk !== 'trainer' || arg !== CLASS_ORDER.indexOf(p.cls)) return false;
  const was = JSON.stringify(e);
  // (Not before the church: the first meeting waits for it. Then the yard, before any quest.)
  if (e.told && e.relic && !e.trainer) (e.trainer = true), (e.yard = 1);
  // From level 3, with the first chain done (the yard told back, or never given): out to the fields. And their word on your return.
  if (fieldsDue(p)) e.fields = 1;
  else if (e.fields === 2) e.fields = 3;
  e.seen = Math.max(e.seen, p.level);
  if (deepSkillOpen(p)) e.deep = true;
  // Hears of the one you've done, and hands over the quest they have for you (the first at the first meeting).
  const back = !!questBack(p);
  reported(p);
  const took = e.told && e.trainer && e.yard !== 1 && takeQuest(p);
  return back || took || JSON.stringify(e) !== was;
}

/** Tobin won't trade with your hungry gear on you: the first time, he sends you to Nettle. True if that's news. */
export function sendToNettle(p: Profile): boolean {
  const e = p.errands;
  if (!e || e.nettle) return false;
  e.nettle = 1;
  return true;
}

/** At Nettle's table on Tobin's word: that's done. True if it was open. */
export function metNettle(p: Profile): boolean {
  const e = p.errands;
  if (e?.nettle !== 1) return false;
  e.nettle = 2;
  payErrand(p, 'nettle');
  return true;
}

/** A straw man set going in the yard on the trainer's word: the yard's errand done, and paid. The copper paid (0: not open). */
export function yardDone(p: Profile): number {
  if (p.errands?.yard !== 1) return 0;
  p.errands.yard = 2;
  return payErrand(p, 'yard');
}

/** Back from the yard, the trainer's word on the board (the first job): once. True the first time. */
export function backFromYard(p: Profile): boolean {
  if (p.errands?.yard !== 2) return false;
  p.errands.yard = 3;
  return true;
}

/** The trainer has the word to go out waiting for you: level 3, the first chain done, and not yet told. */
export function fieldsDue(p: Profile): boolean {
  const e = p.errands;
  return !!e && e.told && e.relic && e.trainer && p.level >= GATE_LEVEL && e.fields === undefined && (e.yard === undefined || e.yard === 3);
}

/** Rested at the Field Barn on the trainer's word: the north fields' errand done, and paid. The copper paid (0: not open). */
export function fieldsDone(p: Profile): number {
  if (p.errands?.fields !== 1) return 0;
  p.errands.fields = 2;
  return payErrand(p, 'fields');
}

/** Old Merren has a word for this hero, not yet given: level 5, not a Mage, the runner's been (Kyle, 2026-11-24). */
export const merrenDue = (p: Profile): boolean => !!p.errands?.told && p.errands.merren === undefined && p.cls !== 'MAGE' && p.level >= EDGE.level;

/** Given: SEE OLD MERREN (once). True if that was news. */
export function giveMerren(p: Profile): boolean {
  if (!merrenDue(p)) return false;
  p.errands!.merren = 1;
  return true;
}

/** His panel opened: that errand is done. True if it was open. */
export function merrenSeen(p: Profile): boolean {
  if (p.errands?.merren !== 1) return false;
  p.errands.merren = 2;
  return true;
}
