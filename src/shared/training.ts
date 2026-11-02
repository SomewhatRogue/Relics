/**
 * The trainer's rules, pure, on a hero's profile: what each drill and lesson stands at (buyable, short
 * of gold, waiting on a level, waiting on a lesson, done), and paying for one. The game and the
 * trainer's screen both ask here, so what the screen offers is what the purchase allows. Ranks a hero
 * already has are never taken away, even above what their level would allow today.
 */
import { DRILLS, LEAVES, TEACHES, drillLevel, drillPrice, type DrillId } from './drills.js';
import type { Profile } from './progress.js';

export type Lesson = 'skill' | 'leave';
/** `buy` now; `poor` (level's fine, gold isn't); `locked` (level); `needs` (a lesson first); `max`. */
export type TrainState = 'buy' | 'poor' | 'locked' | 'needs' | 'max';

/** Has this hero been taught it? (Old heroes from before lessons know everything.) */
export const knowsLesson = (p: Profile, l: Lesson) => !p.learned || p.learned.includes(l);
/** The lesson a drill waits on: the skill's own drill, a Mage's channel, a Ranger's snares. */
export const drillNeeds = (p: Profile, id: DrillId): Lesson | null =>
  id === 'skill' || (id === 'technique' && p.cls === 'MAGE') ? 'skill' : id === 'technique' && p.cls === 'RANGER' ? 'leave' : null;

export function drillState(p: Profile, id: DrillId): TrainState {
  const r = p.drills?.[id] ?? 0, need = drillNeeds(p, id);
  if (r >= DRILLS[id].max) return 'max';
  if (p.level < drillLevel(id, r)) return 'locked';
  if (need && !knowsLesson(p, need)) return 'needs';
  return p.gold < drillPrice(id, r) ? 'poor' : 'buy';
}

/** Whether this class has the lesson at all (only a Ranger's and a Mage's dodge leave something). */
export const hasLesson = (p: Profile, l: Lesson) => l === 'skill' || !!LEAVES[p.cls];

export function lessonState(p: Profile, l: Lesson): TrainState {
  if (!hasLesson(p, l) || knowsLesson(p, l)) return 'max';
  if (p.level < TEACHES[l].level) return 'locked';
  return p.gold < TEACHES[l].price ? 'poor' : 'buy';
}

/** Pay for the next rank of a drill. False (and nothing spent) unless it's buyable now. */
export function buyDrill(p: Profile, id: DrillId): boolean {
  if (drillState(p, id) !== 'buy') return false;
  const r = p.drills?.[id] ?? 0;
  p.gold -= drillPrice(id, r);
  // A new object, so everything that keeps the old numbers sees the change.
  p.drills = { ...p.drills, [id]: r + 1 };
  return true;
}

/** Pay to be taught a lesson. False (and nothing spent) unless it's buyable now. */
export function learnLesson(p: Profile, l: Lesson): boolean {
  if (lessonState(p, l) !== 'buy') return false;
  p.gold -= TEACHES[l].price;
  p.learned = [...(p.learned ?? []), l];
  return true;
}
