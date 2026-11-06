/**
 * The Staithe's moments (sim/staithe.ts, staithebits.ts, gaffer.ts, skimmer.ts): the gaffer's hook out
 * over the water (or across to you), the log going across and shoved in, a net catching a foot, the
 * jetty's boards giving, the punt over, someone taken off the jetty, the skimmer rimed in place, a hook
 * snapped. Words only where they tell you something (shared/staithewords.ts). Drawing only.
 */
import { STAITHE_WORDS as W } from '../shared/staithewords';
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { OX, OY, PX } from './world';

const ROPE = ['#a89a72', '#8a7a58'], WATER = ['#9fe8ff', '#5a8aa8', '#e8fbff'], WOOD = ['#6a5034', '#4a3420', '#2e2016'];

export function staitheFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  switch (ev.k) {
    case 'gaffed':
    case 'hooked': {
      // The line out and back: a run of cord specks from the gaffer to who it took.
      const x2 = OX + ev.x2 * PX, y2 = OY + ev.y2 * PX, n = Math.max(4, Math.round(Math.hypot(x2 - x, y2 - y) / 4));
      for (let i = 0; i <= n; i++) fx.burst(x + ((x2 - x) * i) / n, y - 8 + ((y2 - y) * i) / n, 1, ROPE, 6, false);
      if (ev.k === 'gaffed') fx.burst(x2, y2 - 6, 10, WATER, 50, false, 120);
      return true;
    }
    case 'logacross':
      fx.burst(x, y, 12, WOOD, 40, false, 120);
      fx.say(x, y - 24, W.says.across, '#ff9a6a', 1.4);
      return true;
    case 'logshoved':
      fx.burst(x, y, 24, WATER, 80, false, 160);
      fx.say(x, y - 24, W.says.shoved, '#9fe8ff', 1.2);
      fx.shake = Math.max(fx.shake, 2);
      return true;
    case 'snagged':
      fx.burst(x, y - 8, 8, ROPE, 40, false);
      fx.say(x, y - 28, W.says.snagged, '#e8d090');
      return true;
    case 'thrown':
      fx.burst(x, y - 4, 16, [...WATER, ...WOOD], 70, false, 160);
      fx.say(x, y - 28, W.says.thrown, '#ff9a6a', 1.2);
      return true;
    case 'trip':
      fx.say(x, y - 30, W.says.trip, '#c8f0c0', 1.2);
      return true;
    case 'puntover':
      return true;
    case 'folklost':
      fx.burst(x, y - 6, 8, WATER, 50, false, 120);
      fx.say(x, y - 26, W.says.lost, '#ff6a5a', 1.2);
      return true;
    case 'skimpin':
      fx.burst(x, y - 10, 10, ['#cfe8ff', '#ffffff'], 40, true);
      fx.say(x, y - 30, W.says.pinned, '#cfe8ff');
      return true;
    case 'hooksnap':
      fx.burst(x, y - 12, 8, ['#9a9aa4', '#6a5038'], 70, false, 200, true);
      fx.say(x, y - 32, W.says.snapped, '#ffffff');
      return true;
    case 'smokehouse':
      fx.burst(x, y - 10, 14, ['#6a6470', '#8a8490'], 30, false, -40);
      return true;
  }
  return false;
}
