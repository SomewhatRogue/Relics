/**
 * What plays where: three pieces for each kind of place (how a piece is written: score.ts). The
 * names show on the bard's list in the square.
 */
import type { Area, Score } from './score';
import { CHURCH, INSIDE, TOWN, YARD } from './scores-home';
import { FARM, FIELD, FOREST, MINE, VILLAGE } from './scores-wild';
import { BOSS } from './scores-boss';

export type { Area, Score } from './score';

export const SCORES: Record<Area, Score[]> = { town: TOWN, inside: INSIDE, church: CHURCH, yard: YARD, village: VILLAGE, farm: FARM, field: FIELD, forest: FOREST, mine: MINE, boss: BOSS };
