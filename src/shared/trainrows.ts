/**
 * The trainer's list as data, one row per thing offered (the lessons first, then the drills): its
 * name, its ranks as pips, what the next rank adds, and its tag (a price, the level it waits on, or
 * MAX). Built from a profile alone, so the screen and the tests read the same rows.
 */
import { DRILLS, DRILL_ORDER, LEAVES, TEACHES, drillGain, drillLevel, drillPrice, type DrillId } from './drills.js';
import { TECHS, TECH_WORDS, type TechId } from './techniques.js';
import { RUNGS, RUNG_WORDS, type RungId } from './ladder.js';
import { stepRows } from './steprows.js';
import { RELICS, SKILL_CHOICES, type RelicId } from './magic.js';
import { knowsSkill, skillState, skillStep } from './skillteach.js';
import { SKILL_WORDS } from './skillwords.js';
import type { Profile } from './progress.js';
import type { HeroClass } from './weapons.js';
import { barWords } from './barword.js';
import { drillNeeds, drillState, hasLesson, lessonState, type Lesson, type TrainState } from './training.js';
import { coinsHtml } from './coins.js';

/** A pip: a rank you have, one your level allows, one still locked behind a level. */
export type Pip = 'on' | 'off' | 'lock';
/** One rank on a row's ladder: what you'd have with it, the level it needs, its price. */
export interface Rung { rank: number; gain: string; level: number; price: number; have: boolean }
/** Where a row sits on the trainer's screen: the skills, the class's own craft (technique and what
 *  the dodge leaves), the movement ladder (its dodge, or what stands in for it), or the base stats. */
export type TrainGroup = 'skills' | 'craft' | 'ladder' | 'ranks';
export interface TrainRow {
  id: DrillId | Lesson | RelicId | TechId | RungId;
  /** A technique row (one of the class's three): bought as the next rank of the technique drill. */
  tech?: TechId;
  /** A rung of the movement ladder (shared/ladder.ts): bought as the next rank of the ladder drill. */
  rung?: RungId;
  /** Unique on the screen ('learn:skill', 'learn:horn', 'drill:skill'...): the skill lesson and the
   *  skill drill share an id. */
  key: string;
  group: TrainGroup;
  lesson: boolean;
  /** A skill row: the skill it teaches. */
  skill?: RelicId;
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
  s === 'max' ? (lesson ? 'LEARNED' : 'MAX') : s === 'locked' ? `LEVEL ${level}` : s === 'needs' ? `NEEDS ${needs}` : coinsHtml(price);

function lessonRow(p: Profile, l: Lesson): TrainRow {
  const t = TEACHES[l], state = lessonState(p, l), have = state === 'max', first = SKILL_CHOICES[p.cls][0];
  const name = l === 'skill' ? RELICS[first].name : LEAVES[p.cls]!.name;
  const text = l === 'skill' ? SKILL_WORDS[first] ?? '' : LEAVES[p.cls]!.gain;
  return {
    id: l, key: 'learn:' + l, group: l === 'skill' ? 'skills' : 'craft', lesson: true, ...(l === 'skill' ? { skill: first } : {}), name, text, rank: have ? 1 : 0, max: 1, pips: [have ? 'on' : p.level < t.level ? 'lock' : 'off'],
    gain: have ? '' : text, now: have ? text : '', next: have ? '' : text, state, price: have ? 0 : t.price, level: have ? 0 : t.level,
    needs: '', tag: tagFor(state, t.price, t.level, '', true), ladder: [{ rank: 1, gain: text, level: t.level, price: t.price, have }],
  };
}

/** A skill taught after the first: its level, its price, waiting on the first. */
function skillRow(p: Profile, r: RelicId): TrainRow {
  const t = skillStep(p, r), state = skillState(p, r), have = knowsSkill(p, r), text = SKILL_WORDS[r] ?? '';
  const needs = RELICS[SKILL_CHOICES[p.cls][0]].name;
  return {
    id: r, key: 'learn:' + r, group: 'skills', lesson: true, skill: r, name: RELICS[r].name, text, rank: have ? 1 : 0, max: 1,
    pips: [have ? 'on' : p.level < t.level ? 'lock' : 'off'], gain: have ? '' : text, now: have ? text : '', next: have ? '' : text, state,
    price: have ? 0 : t.price, level: have ? 0 : t.level, needs: state === 'needs' ? needs : '', tag: tagFor(state, t.price, t.level, needs, true),
    ladder: [{ rank: 1, gain: text, level: t.level, price: t.price, have }],
  };
}

function drillRow(p: Profile, id: DrillId): TrainRow {
  const d = DRILLS[id], r = p.drills?.[id] ?? 0, state = drillState(p, id), top = r >= d.max;
  const need = drillNeeds(p, id), needs = need === 'leave' ? LEAVES[p.cls]?.short ?? '' : need ? 'SKILL' : '';
  const gain = (n: number) => drillGain(id, p.cls, n), price = top ? 0 : drillPrice(id, r), level = top ? 0 : drillLevel(id, r, p.cls);
  return {
    id, key: 'drill:' + id, group: id === 'technique' ? 'craft' : 'ranks', lesson: false, name: d.name, text: d.text,
    rank: r, max: d.max, pips: d.levels.map((lv, i) => (i < r ? 'on' : lv <= p.level ? 'off' : 'lock')),
    gain: top ? '' : gain(1), now: r ? gain(r) : '', next: top ? '' : gain(r + 1), state, price, level, needs,
    tag: tagFor(state, price, level, needs, false),
    ladder: d.levels.map((lv, i) => ({ rank: i + 1, gain: gain(i + 1), level: lv, price: drillPrice(id, i), have: i < r })),
  };
}

/** A Mage's row says magic where the others say stamina (shared/barword.ts). */
const magicRow = (r: TrainRow, cls: HeroClass): TrainRow => cls !== 'MAGE' ? r : {
  ...r, name: barWords(r.name, cls), text: barWords(r.text, cls), gain: barWords(r.gain, cls), now: barWords(r.now, cls), next: barWords(r.next, cls),
  ladder: r.ladder.map((u) => ({ ...u, gain: barWords(u.gain, cls) })),
};

/** Everything this hero's trainer offers, in order: the class's three skills, the dodge's
 *  leave-behind, the three techniques, the movement ladder, the drills. */
export function trainerRows(p: Profile): TrainRow[] {
  const skills = [lessonRow(p, 'skill'), ...SKILL_CHOICES[p.cls].slice(1).map((r) => skillRow(p, r))];
  const leave = hasLesson(p, 'leave') ? [lessonRow(p, 'leave')] : [];
  // The technique: three rows of moves; then the ladder's three rungs.
  const techs = stepRows(p, 'technique', TECHS[p.cls], TECH_WORDS, 'craft', 'tech'), rungs = stepRows(p, 'ladder', RUNGS[p.cls], RUNG_WORDS, 'ladder', 'rung');
  const drills = DRILL_ORDER.flatMap((id) => (id === 'technique' ? [...techs, ...rungs] : [drillRow(p, id)]));
  return [...skills, ...leave, ...drills].map((r) => magicRow(r, p.cls));
}
