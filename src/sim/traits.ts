/** A hero's weapon traits, and which element (if any) the weapon is forged with. */
import { ELEMENT_TRAITS, type Element, type TraitId } from '../shared/tuning';
import { edgeTrait, gradeOf, type Grade } from '../shared/edges';
import type { Hero } from './types';

export const traitsOf = (h: Hero): TraitId[] => {
  const w = h.arms[h.weapon], e = edgeTrait(w);
  return e ? [...(w?.traits ?? []), e] : w?.traits ?? [];
};
export const has = (h: Hero, t: TraitId) => traitsOf(h).includes(t);

const EL: Partial<Record<TraitId, Element>> = { ember: 'fire', rime: 'frost', storm: 'storm' };
/** The element a forged weapon puts on charged hits and full draws ('' if none). */
export const forgedElement = (h: Hero): Element | '' => EL[traitsOf(h).find((t) => ELEMENT_TRAITS.includes(t)) ?? 'tempo'] ?? '';

/** The grade of the edge the forged element comes from: 1 for a plain edge, or for a piece's own element (a unique's). */
export const forgedGrade = (h: Hero): Grade => (edgeTrait(h.arms[h.weapon]) ? gradeOf(h.arms[h.weapon]) : 1);
