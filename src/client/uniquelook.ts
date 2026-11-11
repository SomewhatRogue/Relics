/** How a unique piece (shared/uniques.ts) looks anywhere an item shows: one colour of its own, apart from the tiers'. */
import { TIERS, type Item } from '../shared/tuning';
import { UNIQUES, type UniqueId } from '../shared/uniques';

export const UNIQUE_COL = '#2fe0c8';
export const isUnique = (it: Item): boolean => !!it.unique && it.unique in UNIQUES;
/** The colour of a piece's frame: the unique colour, or its tier's. */
export const itemCol = (it: Item): string => (isUnique(it) ? UNIQUE_COL : TIERS[it.quality].col);
/** A unique piece's italic line, or ''. */
export const uniqueLine = (it: Item): string => (isUnique(it) ? UNIQUES[it.unique as UniqueId].line : '');
