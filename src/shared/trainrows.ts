/**
 * The trainer's list as data, one row per thing offered (the lessons first, then the drills): its
 * name, its ranks as pips, what the next rank adds, and its tag (a price, the level it waits on, or
 * MAX). Built from a profile alone, so the screen and the tests read the same rows.
 */
import { DRILLS, DRILL_ORDER, LEAVES, SKILL_GAIN, TEACHES, TECHNIQUE, drillGain, drillLevel, drillPrice, type DrillId } from './drills.js';
import { RELICS, SKILL_CHOICES } from './magic.js';
import type { Profile } from './progress.js';
import { drillNeeds, drillState, hasLesson, lessonState, type Lesson, type TrainState } from './training.js';

/** A pip: a rank you have, one your level allows, one still locked behind a level. */
export type Pip = 'on' | 'off' | 'lock';
/** One rank on a row's ladder: what you'd have with it, the level it needs, its price. */
export interface Rung { rank: number; gain: string; level: number; price: number; have: boolean }
export interface TrainRow {
  id: DrillId | Lesson;
  lesson: boolean;
  name: string;
  /** What the row is, a few words (lessons), or what a single rank gives (drills). */
  text: string;
  rank: number;
  max: number;
  pips: Pip[];
  /** What the next rank adds ('' once there's no more). */
  gain: string;
  /** What you have now, and what you'd have after the next rank (totals; '' when there's none). */
  now: string;
  next: string;
  state: TrainState;
  /** The next rank's price and the level it needs (0 at the top). */
  price: number;
  level: number;
  /** The lesson's name to learn first, when `state` is `needs`. */
  needs: string;
  /** The short word on the right: "245g", "LEVEL 6", "MAX", "LEARNED", "NEEDS SKILL". */
  tag: string;
  ladder: Rung[];
}

const tagFor = (s: TrainState, price: number, level: number, needs: string, lesson: boolean) =>
  s === 'max' ? (lesson ? 'LEARNED' : 'MAX') : s === 'locked' ? `LEVEL ${level}` : s === 'needs' ? `NEEDS ${needs}` : `${price}g`;

function lessonRow(p: Profile, l: Lesson): TrainRow {
  const t = TEACHES[l], state = lessonState(p, l), have = state === 'max';
  const name = l === 'skill' ? SKILL_CHOICES[p.cls].map((r) => RELICS[r].name).join(', ') : LEAVES[p.cls]!.name;
  const text = l === 'skill' ? SKILL_GAIN[p.cls] : LEAVES[p.cls]!.gain;
  return {
    id: l, lesson: true, name, text, rank: have ? 1 : 0, max: 1, pips: [have ? 'on' : p.level < t.level ? 'lock' : 'off'],
    gain: have ? '' : text, now: have ? text : '', next: have ? '' : text, state, price: have ? 0 : t.price, level: have ? 0 : t.level,
    needs: '', tag: tagFor(state, t.price, t.level, '', true), ladder: [{ rank: 1, gain: text, level: t.level, price: t.price, have }],
  };
}

function drillRow(p: Profile, id: DrillId): TrainRow {
  const d = DRILLS[id], r = p.drills?.[id] ?? 0, state = drillState(p, id), top = r >= d.max;
  const need = drillNeeds(p, id), needs = need === 'leave' ? LEAVES[p.cls]?.short ?? '' : need ? 'SKILL' : '';
  const gain = (n: number) => drillGain(id, p.cls, n), price = top ? 0 : drillPrice(id, r), level = top ? 0 : drillLevel(id, r);
  return {
    id, lesson: false, name: id === 'technique' ? TECHNIQUE[p.cls].name : d.name, text: id === 'technique' ? TECHNIQUE[p.cls].text : d.text,
    rank: r, max: d.max, pips: d.levels.map((lv, i) => (i < r ? 'on' : lv <= p.level ? 'off' : 'lock')),
    gain: top ? '' : gain(1), now: r ? gain(r) : '', next: top ? '' : gain(r + 1), state, price, level, needs,
    tag: tagFor(state, price, level, needs, false),
    ladder: d.levels.map((lv, i) => ({ rank: i + 1, gain: gain(i + 1), level: lv, price: drillPrice(id, i), have: i < r })),
  };
}

/** Everything this hero's trainer offers, in order: the class skill, the dodge's leave-behind, the drills. */
export function trainerRows(p: Profile): TrainRow[] {
  const lessons = (['skill', 'leave'] as Lesson[]).filter((l) => hasLesson(p, l)).map((l) => lessonRow(p, l));
  return [...lessons, ...DRILL_ORDER.map((id) => drillRow(p, id))];
}
