/** A hero's weapon traits, and which element (if any) the weapon is forged with. */
import { ELEMENT_TRAITS, type Element, type TraitId } from '../shared/tuning';
import type { Hero } from './types';

export const traitsOf = (h: Hero): TraitId[] => h.arms[h.weapon]?.traits ?? [];
export const has = (h: Hero, t: TraitId) => traitsOf(h).includes(t);

const EL: Partial<Record<TraitId, Element>> = { ember: 'fire', rime: 'frost', storm: 'storm' };
/** The element a forged weapon puts on charged hits and full draws ('' if none). */
export const forgedElement = (h: Hero): Element | '' => EL[traitsOf(h).find((t) => ELEMENT_TRAITS.includes(t)) ?? 'tempo'] ?? '';
