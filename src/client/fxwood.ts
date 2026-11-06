/**
 * Hangman's Wood's moments (sim/snares.ts, dropper.ts, hangfire.ts, hempen.ts, woodzone.ts): a hero
 * snatched up by the ankle (SNARED) and cut down, a snare laid, a dropper letting go over someone (LOOK UP)
 * and landing, burning wood off the oak hitting the ground, Hempen's noose thrown, the fire lit. Words only
 * where they tell you something (shared/hangwords.ts WOOD_CALLS). Drawing only.
 */
import { WOOD_CALLS as W } from '../shared/hangwords';
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';

export function woodFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  switch (ev.k) {
    case 'hoisted':
      fx.burst(x, y - 6, 10, ['#a8946a', '#6a5038'], 70, false);
      fx.say(x, y - 34, W.hoisted, '#e8d090');
      return true;
    case 'cutdown':
      fx.burst(x, y - 12, 10, ['#a8946a', '#cfd6dc'], 60, false);
      fx.say(x, y - 30, W.cut, '#bfe4ff');
      return true;
    case 'snarelaid':
      fx.burst(x, y, 4, ['#a8946a'], 20, false);
      return true;
    case 'perchdrop':
      fx.say(x, y - 30, W.drop, '#ff9a6a');
      return true;
    case 'perchland':
      fx.burst(x, y - 4, 14, ['#5a4a3a', '#8a7a5a', '#3a2e24'], 80, false);
      fx.shake = Math.max(fx.shake, 4);
      return true;
    case 'oakfall':
      fx.burst(x, y - 6, 16, ['#ffd27a', '#ff6a20', '#3a2e24'], 90, true);
      return true;
    case 'noosed':
    case 'checklit':
      fx.burst(x, y - 10, ev.k === 'checklit' ? 18 : 6, ev.k === 'checklit' ? ['#ffd27a', '#ff9a3c'] : ['#a8946a'], 60, ev.k === 'checklit');
      return true;
    default:
      return false;
  }
}
