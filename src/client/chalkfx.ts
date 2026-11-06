/**
 * The chalker's moments (sim/chalker.ts) as a flash of effects and a sound: a scratch of chalk dust at
 * each stroke, a red flash, a shake and the words when the fifth turns the pack, a puff when the strokes
 * are wiped. The words are placeholders for the lore keeper and the line editor (shared/chalk.ts).
 */
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { sfx } from './sfx';
import { goblin } from './voices';

export const CHALK_WORDS = { chalked: 'CHALKED', wiped: 'CHALK WIPED' };

export function chalkFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  if (ev.k === 'chalk') return fx.burst(x, y - 32, 3, ['#e8e4d8', '#e0302a'], 20, false), true;
  if (ev.k === 'chalked') {
    fx.burst(x, y - 30, 16, ['#e0302a', '#ff6a5a', '#ffd0c0'], 70, true);
    fx.flashes.push({ x, y: y - 20, r: 70, i: 1, c: [1, 0.15, 0.1], life: 0.3, max: 0.3 });
    fx.shake = Math.max(fx.shake, 3);
    fx.say(x, y - 54, CHALK_WORDS.chalked, '#ff5a4a', 1.2);
    return true;
  }
  if (ev.k === 'chalkwipe') return fx.burst(x, y - 30, 10, ['#e8e4d8', '#c8c4b8'], 40, false, -30), fx.say(x, y - 54, CHALK_WORDS.wiped, '#d8d4c8'), true;
  return false;
}

/** Its sounds, from the kit we have. */
export function chalkSound(ev: FightEvent): boolean {
  if (ev.k === 'chalk') return sfx.lift(), true;
  if (ev.k === 'chalked') return goblin.cackle(Math.round(ev.x * 7 + ev.y * 3)), sfx.rally(), true;
  if (ev.k === 'chalkwipe') return sfx.smoke(), true;
  return false;
}
