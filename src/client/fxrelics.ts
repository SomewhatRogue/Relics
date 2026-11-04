/**
 * Effects for the found relics (sim/foundrelics.ts) and relics as things you own: a bell's rings, a
 * knuckle's line of force, a wind-up bow set down, a barrel hooked, the marks they leave (MARKED,
 * SLOWED), a friend quickened or SPARED, a dark relic pressed, a relic picked up. Everything a relic
 * does is drawn in gold or warm white, never the goblins' red: it never hurts a friend. Cosmetic only.
 */
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { RELICW } from './relicwords';
import { toPx } from './world';

const GOLD = '#ffd27a', WARM = '#fff1b0';
const flash = (fx: Fx, x: number, y: number, r: number, i: number, c: [number, number, number], life = 0.16) =>
  fx.flashes.push({ x, y, r, i, c, life, max: life });

/** True if it was one of these (and has been drawn). */
export function relicFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  switch (ev.k) {
    case 'bell':
      fx.say(x, y - 36, 'WHISTLE', WARM);
      for (const [life, size] of [[0.35, 30], [0.5, 46], [0.65, 56]]) fx.rings.push({ x, y, life, max: life, col: GOLD, size });
      fx.burst(x, y - 14, 10, [WARM, '#e8dcc0'], 40, true);
      flash(fx, x, y - 10, 90, 0.9, [1, 0.88, 0.6], 0.2);
      return true;
    case 'quick':
      fx.say(x, y - 30, RELICW.quick, WARM, 0.7);
      fx.burst(x, y - 4, 6, [GOLD, WARM], 30, true);
      return true;
    case 'knuckle': {
      const [x2, y2] = toPx(ev.x2, ev.y2), n = 14;
      for (let i = 1; i <= n; i++) {
        const k = i / n, px = x + (x2 - x) * k, py = y - 8 + (y2 - y) * k;
        fx.burst(px, py, 2, [GOLD, WARM, '#e8dcc0'], 30 + 40 * k, true);
      }
      fx.rings.push({ x: x2, y: y2, life: 0.3, max: 0.3, col: GOLD, size: 18 });
      fx.shake = Math.max(fx.shake, 4);
      flash(fx, x, y - 8, 80, 1, [1, 0.85, 0.55], 0.15);
      return true;
    }
    case 'sentry':
      fx.burst(x, y - 4, 10, ['#8a5a30', '#c8b080', GOLD], 40, false, 160, true);
      fx.rings.push({ x, y, life: 0.4, max: 0.4, col: GOLD, size: 24 });
      return true;
    case 'sentryend':
      fx.burst(x, y - 6, 8, ['#8a8494', '#c8c4d0'], 30, false, 120, true);
      return true;
    case 'hookprop': {
      const [x2, y2] = toPx(ev.x2, ev.y2);
      fx.arcs.push({ x, y: y - 10, x2, y2: y2 - 6, life: 0.2, col: '#c8ccd8' });
      fx.burst(x2, y2 - 6, 5, ['#8a6a4a', '#c8b080'], 40, false, 200, true);
      return true;
    }
    case 'marked':
      fx.say(x, y - 30, RELICW.marked, GOLD, 0.6);
      return true;
    case 'hobbled':
      fx.say(x, y - 28, RELICW.hobbled, '#e8dcc0', 0.6);
      return true;
    case 'spared':
      // A friend in a relic's reach: a gold shell flickers round them and it passes them by.
      fx.say(x, y - 34, RELICW.spared, WARM, 0.8);
      fx.rings.push({ x, y: y - 6, life: 0.3, max: 0.3, col: WARM, size: 12 });
      return true;
    case 'dark':
      fx.say(x, y - 32, RELICW.pressedDark, '#8a8494', 0.6);
      fx.burst(x, y - 12, 4, ['#4a4852', '#6a6872'], 20, false, 120);
      return true;
    case 'relicfound':
      fx.say(x, y - 40, RELICW.found, GOLD, 1.4);
      fx.burst(x, y - 12, 30, [GOLD, WARM, '#ffffff'], 90, true);
      fx.rings.push({ x, y, life: 0.6, max: 0.6, col: GOLD, size: 30 });
      flash(fx, x, y - 10, 120, 1.6, [1, 0.85, 0.5], 0.4);
      return true;
    default:
      return false;
  }
}
