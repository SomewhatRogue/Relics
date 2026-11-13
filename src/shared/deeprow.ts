/**
 * The Deep skill as a trainer's row (shared/trainrows.ts): not there at all till the hero has been deep
 * enough (shared/deepskill.ts), then one lesson to buy, like a class skill's. Key `learn:deep`.
 */
import { DEEP_SKILL, deepSkillOf, deepSkillState } from './deepskill.js';
import { DEEP_SKILL_NAME, DEEP_SKILL_WORDS } from './deepskillwords.js';
import { coinsHtml } from './coins.js';
import type { Profile } from './progress.js';
import type { TrainRow } from './trainrows.js';

/** The row, or none (hidden: not deep enough, or the class's isn't built yet). */
export function deepRows(p: Profile): TrainRow[] {
  const id = deepSkillOf(p.cls), state = deepSkillState(p);
  if (!id || state === 'hidden') return [];
  const have = state === 'max', text = DEEP_SKILL_WORDS[id], price = DEEP_SKILL.price;
  return [{
    id: 'deep', key: 'learn:deep', group: 'skills', lesson: true, name: DEEP_SKILL_NAME[id], text, rank: have ? 1 : 0, max: 1,
    pips: [have ? 'on' : 'off'], gain: have ? '' : text, now: have ? text : '', next: have ? '' : text, state,
    price: have ? 0 : price, level: 0, needs: '', tag: have ? 'LEARNED' : coinsHtml(price),
    ladder: [{ rank: 1, gain: text, level: 0, price, have }],
  }];
}
