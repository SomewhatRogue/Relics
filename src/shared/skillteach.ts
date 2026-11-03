/**
 * Which of their class's three skills a hero has been taught, and paying the trainer for the next.
 * The first is the `skill` lesson (training.ts); the second and third come later (SKILL_STEPS).
 * A hero taught their skill before there were three keeps what they had then: a Warrior knew both the
 * Shield Charge and the War Cry, so knows them still.
 */
import { SKILL_STEPS } from './drills.js';
import { SKILL_CHOICES, type RelicId } from './magic.js';
import type { Profile } from './progress.js';
import { knowsLesson, lessonState, learnLesson, type TrainState } from './training.js';
import type { HeroClass } from './weapons.js';

const LEGACY: Partial<Record<HeroClass, RelicId[]>> = { WARRIOR: ['horn'] };

/** Where `r` sits in its class's order (-1: not this class's). */
export const skillIndex = (p: Profile, r: RelicId) => SKILL_CHOICES[p.cls].indexOf(r);

export function knowsSkill(p: Profile, r: RelicId): boolean {
  const i = skillIndex(p, r);
  if (i < 0 || !knowsLesson(p, 'skill')) return false;
  return i === 0 || (p.taught ?? LEGACY[p.cls] ?? []).includes(r);
}

export const knownSkills = (p: Profile) => SKILL_CHOICES[p.cls].filter((r) => knowsSkill(p, r));

/** The level and price `r` is taught at. */
export const skillStep = (p: Profile, r: RelicId) => SKILL_STEPS[Math.max(0, skillIndex(p, r))];

export function skillState(p: Profile, r: RelicId): TrainState {
  const i = skillIndex(p, r);
  if (i <= 0) return lessonState(p, 'skill');
  if (knowsSkill(p, r)) return 'max';
  const t = SKILL_STEPS[i];
  if (p.level < t.level) return 'locked';
  if (!knowsLesson(p, 'skill')) return 'needs';
  return p.gold < t.price ? 'poor' : 'buy';
}

/** Pay to be taught `r`. False (and nothing spent) unless it's buyable now. */
export function learnSkill(p: Profile, r: RelicId): boolean {
  if (skillIndex(p, r) === 0) return learnLesson(p, 'skill');
  if (skillState(p, r) !== 'buy') return false;
  p.gold -= skillStep(p, r).price;
  p.taught = [...(p.taught ?? LEGACY[p.cls] ?? []), r];
  return true;
}
