/** Effects for magic and the new relics: bursts, gusts, lightning, steam, ice, blessings. Cosmetic only. */
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { EL_COL, EL_LIGHT } from './palette';
import { toPx } from './world';

const flash = (fx: Fx, x: number, y: number, r: number, i: number, c: [number, number, number], life = 0.14) =>
  fx.flashes.push({ x, y, r, i, c, life, max: life });

export function magicFx(fx: Fx, ev: FightEvent, x: number, y: number): void {
  switch (ev.k) {
    case 'shoot':
      if (ev.kind !== 'arrow') fx.burst(x + ev.dx * 10, y - 10 + ev.dy * 6, 5, [EL_COL[ev.el], '#ffffff'], 40, true);
      break;
    case 'burst': {
      const col = ev.el ? EL_COL[ev.el] : '#ffb44c', r = ev.r * 16;
      fx.burst(x, y - 6, 26, [col, '#ffffff', ev.el === 'frost' ? '#9fd8ff' : '#ff6a20'], r * 5, true);
      fx.burst(x, y - 4, 10, ['#6a647a', '#4f4a5c'], r * 3, false, 200, true);
      fx.rings.push({ x, y, life: 0.3, max: 0.3, col, size: r * 1.2 });
      fx.crater(x, y, Math.round(r * 0.35));
      fx.shake = Math.max(fx.shake, 3);
      flash(fx, x, y - 6, r * 3, 1.2, ev.el ? EL_LIGHT[ev.el] : [1, 0.7, 0.35], 0.18);
      break;
    }
    case 'gust':
      for (let i = 0; i < 34; i++) {
        const a = Math.atan2(ev.dy, ev.dx) + (Math.random() - 0.5) * 1.3, s = 120 + Math.random() * 120, life = 0.25 + Math.random() * 0.2;
        const col = ev.el && i % 3 === 0 ? EL_COL[ev.el] : i % 2 ? '#dfe6ee' : '#9aa6b4';
        fx.parts.push({ x: x + ev.dx * 8, y: y - 8 + ev.dy * 5, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7, life, max: life, col, glow: true, grav: 0, stick: false });
      }
      fx.shake = Math.max(fx.shake, 1.5);
      break;
    case 'shock': {
      const [x2, y2] = toPx(ev.x2, ev.y2);
      fx.arcs.push({ x, y, x2, y2, life: 0.18 });
      fx.burst(x2, y2 - 10, 6, ['#fff27a', '#ffffff'], 60, true);
      flash(fx, (x + x2) / 2, (y + y2) / 2 - 10, 60, 1, [1, 0.95, 0.6], 0.1);
      break;
    }
    case 'ignite':
      fx.say(x, y - 30, 'BURNING', '#ff9a3c');
      fx.burst(x, y - 10, 8, ['#ffd27a', '#ff9a3c', '#ff6a20'], 40, true);
      break;
    case 'chill':
      fx.say(x, y - 30, 'CHILLED', '#bfe8ff');
      fx.burst(x, y - 10, 8, ['#dff4ff', '#9fd8ff'], 35, true);
      break;
    case 'freeze':
      fx.say(x, y - 32, 'FROZEN', '#dff4ff');
      fx.rings.push({ x, y: y - 8, life: 0.3, max: 0.3, col: '#bfe8ff' });
      flash(fx, x, y - 8, 50, 0.9, [0.6, 0.85, 1]);
      break;
    case 'shatter':
      fx.say(x, y - 34, 'SHATTER', '#ffffff');
      fx.burst(x, y - 10, 28, ['#ffffff', '#dff4ff', '#9fd8ff'], 110, true, 260);
      fx.shake = Math.max(fx.shake, 4);
      flash(fx, x, y - 8, 70, 1.3, [0.7, 0.9, 1], 0.16);
      break;
    case 'steam':
      fx.say(x, y - 34, 'STEAM', '#e8ecf0');
      fx.burst(x, y - 10, 34, ['#ffffff', '#e8ecf0', '#c8ccd4'], 70, true);
      fx.rings.push({ x, y: y - 6, life: 0.4, max: 0.4, col: '#e8ecf0', size: 30 });
      fx.shake = Math.max(fx.shake, 2);
      break;
    case 'flare':
      fx.say(x, y - 34, 'FLARE', '#ffd27a');
      fx.burst(x, y - 10, 30, ['#fff1b0', '#ffd27a', '#ff9a3c', '#ff6a20'], 130, true);
      fx.rings.push({ x, y: y - 6, life: 0.3, max: 0.3, col: '#ffb44c', size: 28 });
      fx.crater(x, y, 6);
      fx.shake = Math.max(fx.shake, 4);
      flash(fx, x, y - 8, 90, 1.5, [1, 0.65, 0.3], 0.2);
      break;
    case 'blink':
      fx.burst(x, y - 8, 16, ['#c9a8ff', '#ffffff'], 60, true);
      fx.rings.push({ x, y: y - 8, life: 0.2, max: 0.2, col: '#c9a8ff', size: 10 });
      break;
    case 'bless':
      fx.rings.push({ x, y: y - 2, life: 0.45, max: 0.45, col: '#ffe9a8', size: 44 });
      fx.burst(x, y - 8, 16, ['#ffe9a8', '#ffffff', '#ffd27a'], 50, true);
      flash(fx, x, y - 8, 70, 0.9, [1, 0.9, 0.6], 0.25);
      break;
    case 'heal':
      fx.say(x, y - 28, '+' + ev.n, '#7dff8a');
      fx.burst(x, y - 8, 8, ['#7dff8a', '#ffffff'], 30, true);
      break;
  }
}
