/** Effects for magic and the new relics: bursts, gusts, lightning, steam, ice, blessings. Cosmetic only. */
import { COAL } from './copy';
import { POTIONS, TIERS, TIER_ORDER } from '../shared/tuning';
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
    case 'beam': {
      const [x2, y2] = toPx(ev.x2, ev.y2);
      fx.arcs.push({ x, y, x2, y2, life: 0.3, col: '#ffe9a8' });
      break;
    }
    case 'blessed':
      fx.say(x, y - 36, 'BLESSED', '#ffe9a8');
      fx.rings.push({ x, y: y - 8, life: 0.4, max: 0.4, col: '#ffe9a8', size: 16 });
      flash(fx, x, y - 8, 50, 1, [1, 0.9, 0.6], 0.25);
      break;
    case 'rally':
      fx.say(x, y - 36, 'WAR CRY', '#ff8a6a');
      fx.rings.push({ x, y, life: 0.6, max: 0.6, col: '#ff8a6a', size: 140 });
      fx.shake = Math.max(fx.shake, 3);
      break;
    case 'bash':
      fx.burst(x, y, 10, ['#8a8496', '#c8c4d0'], 40, false);
      fx.shake = Math.max(fx.shake, 2);
      break;
    case 'rallied':
      fx.burst(x, y - 10, 8, ['#ffb0a0', '#ffffff'], 30, true);
      break;
    case 'smite':
      fx.say(x, y - 40, 'SMITE', '#fff1b0');
      for (let i = 0; i < 26; i++) {
        const life = 0.2 + Math.random() * 0.25;
        fx.parts.push({ x: x + (Math.random() - 0.5) * 6, y: y - Math.random() * 60, vx: 0, vy: 40, life, max: life, col: i % 2 ? '#ffffff' : '#ffe9a8', glow: true, grav: 0, stick: false });
      }
      fx.burst(x, y - 4, 22, ['#ffffff', '#ffe9a8', '#ffd27a'], 90, true);
      fx.rings.push({ x, y, life: 0.35, max: 0.35, col: '#ffe9a8', size: 30 });
      fx.crater(x, y, 6);
      fx.shake = Math.max(fx.shake, 4);
      flash(fx, x, y - 10, 100, 1.8, [1, 0.92, 0.65], 0.22);
      break;
    case 'net':
      fx.burst(x, y - 6, 10, ['#8a7a5a', '#6a5a3a'], 50, false);
      break;
    case 'snared':
      fx.say(x, y - 30, 'NETTED', '#d8c48a');
      break;
    case 'well':
      fx.rings.push({ x, y, life: 0.4, max: 0.4, col: '#b080ff', size: 50 });
      fx.shake = Math.max(fx.shake, 2);
      break;
    case 'shadow':
      fx.burst(x, y - 8, 18, ['#3a3346', '#6a5a8a', '#c9a8ff'], 50, true);
      fx.say(x, y - 30, 'BEHIND', '#d8a0ff');
      break;
    case 'gold':
      if (ev.id === 'me') fx.say(x, y - 26, `+${ev.n} GOLD`, '#ffd27a');
      break;
    case 'potion':
      fx.say(x, y - 30, POTIONS[ev.kind].short, POTIONS[ev.kind].col);
      break;
    case 'drink':
      fx.burst(x, y - 12, 8, [POTIONS[ev.kind].col, '#ffffff'], 30, true);
      break;
    case 'chest':
      if (ev.state === 'open') {
        fx.burst(x, y - 10, 10 + TIER_ORDER.indexOf(ev.tier) * 8, [TIERS[ev.tier].col, '#ffffff'], 60, true);
        fx.rings.push({ x, y: y - 6, life: 0.6, max: 0.6, col: TIERS[ev.tier].col, size: 20 + TIER_ORDER.indexOf(ev.tier) * 8 });
        fx.say(x, y - 34, TIERS[ev.tier].name, TIERS[ev.tier].col);
      }
      break;
    case 'spend':
      if (ev.n >= 5) fx.say(x, y - 30, `-${ev.n} GOLD`, '#ff9a6a');
      break;
    case 'ransom':
      fx.say(x, y - 40, 'RANSOMED', '#ff4a3a');
      fx.burst(x, y - 10, 16, ['#d4a537', '#ff4a3a'], 60, true);
      break;
    case 'tooth':
      fx.say(x, y - 34, 'THE TOOTH TAKES IT', '#ff4a3a');
      break;
    case 'chained':
      fx.say(x, y - 30, 'CHAINED', '#9aa3ad');
      break;
    case 'smoke':
      fx.rings.push({ x, y: y - 4, life: 0.5, max: 0.5, col: '#9a94a8', size: 30 });
      break;
    case 'coal':
      fx.say(x, y - 30, COAL.pickup, '#ffb35a');
      fx.burst(x, y - 10, 14, ['#ffd27a', '#ff9a3c', '#ffffff'], 40, true);
      fx.rings.push({ x, y: y - 6, life: 0.5, max: 0.5, col: '#ffb35a', size: 18 });
      break;
    case 'drop':
      fx.say(x, y - 24, ev.q === 'forged' ? 'FORGED' : 'LOOT', ev.q === 'forged' ? '#ffd27a' : '#9fd0ff');
      fx.burst(x, y - 6, 12, ev.q === 'forged' ? ['#ffd27a', '#ffffff'] : ['#9fd0ff', '#ffffff'], 50, true);
      break;
    case 'loot':
      fx.say(x, y - 32, ev.name, '#ffd27a');
      fx.rings.push({ x, y: y - 4, life: 0.3, max: 0.3, col: '#ffd27a', size: 14 });
      break;
    case 'perfect':
      fx.say(x, y - 30, 'PERFECT', '#ffffff');
      fx.rings.push({ x, y: y - 8, life: 0.25, max: 0.25, col: '#ffffff', size: 12 });
      flash(fx, x, y - 8, 40, 1, [1, 1, 1], 0.1);
      break;
    case 'tempo':
      fx.say(x, y - 34, 'SIDESTEP', '#7fe0c8');
      break;
    case 'grab':
      fx.say(x, y - 30, 'GRABBED', '#ffd27a');
      break;
    case 'hurl':
      fx.burst(x, y - 10, 8, ['#6a647a', '#57525e'], 40, false);
      break;
    case 'slam':
      fx.crater(x, y, 8);
      fx.burst(x, y - 2, 18, ['#6a647a', '#4f4a5c', '#8a8494'], 80, false, 220, true);
      fx.burst(x, y - 4, 14, ['#7a1d1d', '#5a1414', '#9a2a2a'], 60, false, 200, true);
      fx.rings.push({ x, y, life: 0.3, max: 0.3, col: '#d8c8a8', size: 20 });
      fx.say(x, y - 34, 'SLAM', '#ffe070');
      fx.shake = Math.max(fx.shake, 6);
      flash(fx, x, y - 4, 50, 0.7, [1, 0.7, 0.4], 0.12);
      break;
    case 'bodyhit':
      fx.burst(x, y - 8, 12, ['#ffffff', '#ffd27a', '#7a1d1d'], 70, false, 160, true);
      fx.say(x, y - 28, 'CRUNCH', '#ffd27a');
      fx.shake = Math.max(fx.shake, 4);
      break;
    case 'wriggle':
      fx.say(x, y - 26, 'SLIPPED FREE', '#c8c4d0');
      break;
    case 'propbreak':
      fx.gore.splinters(x, y - 6, ev.kind === 'table' || ev.kind === 'crate', ev.dx, ev.dy);
      fx.burst(x, y - 6, 10, ['#6a647a', '#57525e'], 50, false);
      fx.say(x, y - 26, ev.kind === 'plank' || ev.kind === 'stave' ? 'CRACK' : 'SMASH', '#d8c48a');
      fx.shake = Math.max(fx.shake, ev.kind === 'table' ? 4 : 2);
      break;
    case 'oilfire':
      fx.say(x, y - 34, 'OIL FIRE', '#ff9a3c');
      fx.burst(x, y - 8, 40, ['#fff1b0', '#ffd27a', '#ff9a3c', '#ff6a20'], 120, true);
      fx.rings.push({ x, y, life: 0.4, max: 0.4, col: '#ff9a3c', size: 34 });
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2, r = Math.random() * 26;
        fx.decal(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.55, i % 2 ? '#1a1410' : '#2a2018');
      }
      fx.shake = Math.max(fx.shake, 5);
      flash(fx, x, y - 8, 110, 1.8, [1, 0.6, 0.25], 0.35);
      break;
    case 'lift':
      fx.burst(x, y - 4, 6, ['#6a647a', '#57525e'], 30, false);
      break;
    case 'heal':
      fx.say(x, y - 28, '+' + ev.n, '#7dff8a');
      fx.burst(x, y - 8, 8, ['#7dff8a', '#ffffff'], 30, true);
      break;
  }
}
