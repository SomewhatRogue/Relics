/**
 * What the newer goblins' doings look like for a moment: a net coming down, a hero working loose or
 * cut out, a thief's grab and its loot back, a banner falling, dirt going up off a sapper, oil splashing
 * and catching, crows bursting off the dead. Words only where you need to act on them.
 */
import { POTIONS, type PotionId } from '../shared/potions';
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { coins } from '../shared/coins';

const DIRT = ['#5a4a3a', '#6a5a48', '#3a3028'], OIL = ['#2a2418', '#4a3a1a', '#6a5a2a'], FIRE = ['#ff9a3c', '#ffd27a', '#ff6a2a'];

export function foeFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  switch (ev.k) {
    case 'impact':
      if (ev.kind === 'net') return fx.burst(x, y - 4, 10, ['#a89a72', '#8a7a58'], 50, false), false;
      if (ev.kind === 'lob') return fx.burst(x, y - 2, 18, OIL, 70, false, 200, true), false;
      if (ev.kind === 'erupt') return fx.burst(x, y - 2, 26, DIRT, 90, false, 240, true), (fx.shake = Math.max(fx.shake, 3)), false;
      return false;
    case 'netted':
      fx.say(x, y - 30, 'NETTED', '#e8d090');
      fx.say(x, y - 22, 'ATTACK TO BREAK FREE', '#c8b880', 1.6);
      return true;
    case 'struggle':
      fx.burst(x, y - 8, 3, ['#a89a72'], 30, false);
      return true;
    case 'cutfree':
      fx.burst(x, y - 8, 12, ['#a89a72', '#cfd6dc'], 60, false);
      fx.say(x, y - 28, 'CUT FREE', '#bfe4ff');
      return true;
    case 'netfree':
      fx.burst(x, y - 8, 10, ['#a89a72', '#8a7a58'], 50, false);
      return true;
    case 'stolen':
      fx.say(x, y - 28, ev.potion ? `${POTIONS[ev.potion as PotionId]?.short ?? 'POTION'} STOLEN` : `${coins(ev.n)} STOLEN`, '#ffd040');
      return true;
    case 'escaped':
      fx.say(x, y - 22, 'THIEF GOT AWAY', '#a08a6a');
      return true;
    case 'bannerfall':
      fx.burst(x, y - 18, 14, ['#8a6a4a', '#6a4a32', '#7a1d1d'], 60, false);
      fx.shake = Math.max(fx.shake, 3);
      return true;
    case 'routed':
      return true;
    case 'rooffall':
      fx.burst(x, y - 4, 12, ['#6a647a', '#4f4a5c'], 60, false);
      return true;
    case 'dig':
    case 'surface':
      fx.burst(x, y - 2, ev.k === 'dig' ? 14 : 8, DIRT, 50, false, 200, true);
      return true;
    case 'unearthed':
      fx.burst(x, y - 2, 30, DIRT, 100, false, 240, true);
      fx.shake = Math.max(fx.shake, 4);
      return true;
    case 'slick':
      return true;
    case 'oilwarn':
      fx.burst(x, y - 6, 6, FIRE, 30, true);
      return true;
    case 'oilup':
      fx.burst(x, y - 4, 30, FIRE, 90, true);
      fx.shake = Math.max(fx.shake, 3);
      return true;
    case 'crows':
      fx.burst(x, y - 10, 22, ['#141218', '#24202a', '#0a0a0e'], 90, false, -60);
      return true;
    case 'whip':
    case 'howl':
    case 'scatter':
    case 'listen':
      return true;
    default:
      return false;
  }
}
