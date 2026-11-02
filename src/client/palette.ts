/** Colours shared by everything that draws magic: one per element ('' is plain arcane violet). */
import { WEAPONS, type Augment } from '../shared/tuning';
import { castElement } from '../sim/channel';
import type { Hero } from '../sim/types';

export const EL_COL: Record<Augment, string> = { '': '#c9a8ff', fire: '#ff9a3c', frost: '#bfe8ff', storm: '#fff27a' };
/** The same colours as light (0..1), for the lighting pass. */
export const EL_LIGHT: Record<Augment, [number, number, number]> = { '': [0.75, 0.6, 1], fire: [1, 0.6, 0.3], frost: [0.6, 0.85, 1], storm: [1, 0.95, 0.5] };

/** The element a hero's hand glows with: a Mage's is the one its spells are in now; anyone else's, the relic's. */
export const heldEl = (h: Hero): Augment => (WEAPONS[h.weapon].cls === 'MAGE' ? castElement(h) : h.augments[h.relic]);
