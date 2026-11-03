/**
 * Effects for the skills taught after the first (sim/skills.ts): a stamp's dust and crack, the volley
 * loosed and its arrows landing, a vanish's smoke, the knife fan, a fire ring bursting, lantern light,
 * a tether's strike, a chain thrown, a hound sent and pinning. Cosmetic only.
 */
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { toPx } from './world';

const flash = (fx: Fx, x: number, y: number, r: number, i: number, c: [number, number, number], life = 0.16) =>
  fx.flashes.push({ x, y, r, i, c, life, max: life });

/** True if it was one of these (and has been drawn). */
export function skillFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  switch (ev.k) {
    case 'stamp':
      fx.say(x, y - 36, 'STAMP', '#e0d8c8');
      fx.burst(x, y - 2, 26, ['#8a8496', '#c8c4d0', '#6a647a'], 90, false, 220, true);
      fx.rings.push({ x, y, life: 0.35, max: 0.35, col: '#e0d8c8', size: 40 });
      fx.crack(x, y, 6);
      fx.shake = Math.max(fx.shake, 5);
      return true;
    case 'volleyshot':
      fx.burst(x, y - 16, 8, ['#f4ecd0', '#c8b080'], 50, false);
      return true;
    case 'arrowfall':
      fx.burst(x, y - 2, 5, ['#8a7a5a', '#c8b080'], 40, false, 200, true);
      return true;
    case 'vanish':
      fx.say(x, y - 34, 'GONE', '#c9a8ff');
      fx.burst(x, y - 8, 24, ['#3a3346', '#5a5468', '#6a5a8a'], 45, false);
      return true;
    case 'knives':
      fx.burst(x, y - 10, 8, ['#c8c4d0', '#ffffff'], 40, true);
      return true;
    case 'firering':
      fx.say(x, y - 36, 'FIRE RING', '#ffb44c');
      fx.burst(x, y - 6, 40, ['#fff1b0', '#ffd27a', '#ff9a3c', '#ff6a20'], 140, true);
      fx.rings.push({ x, y, life: 0.35, max: 0.35, col: '#ff9a3c', size: 42 });
      fx.shake = Math.max(fx.shake, 3);
      flash(fx, x, y - 6, 110, 1.4, [1, 0.6, 0.3], 0.22);
      return true;
    case 'lanternlight':
      fx.burst(x, y - 10, 36, ['#ffffff', '#fff1b0', '#ffd27a'], 120, true);
      fx.rings.push({ x, y, life: 0.45, max: 0.45, col: '#fff1b0', size: 48 });
      flash(fx, x, y - 10, 140, 2, [1, 0.92, 0.65], 0.3);
      return true;
    case 'tetherzap': {
      const [x2, y2] = toPx(ev.x2, ev.y2);
      fx.arcs.push({ x, y: y - 12, x2, y2: y2 - 10, life: 0.12 });
      fx.burst(x2, y2 - 10, 5, ['#fff27a', '#ffffff'], 50, true);
      return true;
    }
    case 'chainpull': {
      const [x2, y2] = toPx(ev.x2, ev.y2);
      fx.arcs.push({ x, y: y - 8, x2, y2: y2 - 8, life: 0.25, col: '#ffe9a8' });
      return true;
    }
    case 'sic':
      return true;
    case 'houndpin':
      fx.say(x, y - 30, 'PINNED', '#d8c48a');
      fx.burst(x, y - 6, 8, ['#8a8496', '#c8c4d0'], 40, false);
      return true;
    default:
      return false;
  }
}

/** Each skill event's sound, borrowed from sfx.ts (soundscape.ts plays it). */
export const SKILL_SOUNDS: Partial<Record<FightEvent['k'], string>> = {
  stamp: 'boom', volleyshot: 'throw', arrowfall: 'arrow', vanish: 'smoke', knives: 'throw', firering: 'oilfire',
  lanternlight: 'smite', tetherzap: 'spark', chainpull: 'hookfire', houndpin: 'pinned',
  // Not a skill, but the same borrowing: a nest catching (sim/torch.ts).
  torched: 'oilfire',
  // The found relics (fxrelics.ts).
  bell: 'smite', knuckle: 'boom', sentry: 'throw', hookprop: 'hookfire', relicfound: 'fanfare',
};
