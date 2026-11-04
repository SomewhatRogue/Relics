/**
 * The Cleric's weapons, seen (sim/holy.ts, censer.ts, flail.ts decide them): a holy shield settles on a
 * friend in a soft gold ring and chimes off a blow; the mace's perfect smite stands a pillar of light
 * where it falls; the censer's coals burst gold when swung through and flare red-gold on its perfect,
 * and its chain snags on a wall with a spark; the flail's perfect rings stars round what it stuns.
 * Cosmetic only, and the same overlay draws in both views (the shield on the hero: client/holyshield.ts).
 */
import { CENSER } from '../shared/tuning';
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { PX } from './world';

const HOLY = ['#fff4c8', '#ffe08a', '#ffffff'], EMBER = ['#ffb040', '#ff7a2a', '#ffe08a'], STEEL = ['#c8c4d0', '#ffffff', '#ffd27a'];

/** True if it was one of these (and has been drawn). */
export function clericFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  switch (ev.k) {
    case 'holyshield':
      fx.rings.push({ x, y: y - 9, life: 0.4, max: 0.4, col: '#ffe9a8', size: 13 });
      fx.burst(x, y - 9, 10, HOLY, 45, true);
      return true;
    case 'shieldsoak':
      fx.rings.push({ x, y: y - 9, life: 0.18, max: 0.18, col: '#fff4c8', size: 11 });
      fx.burst(x, y - 9, 6, HOLY, 60, true);
      return true;
    case 'shieldgone':
      fx.burst(x, y - 9, 14, HOLY, 90, true);
      return true;
    case 'holysmite':
      // A pillar of light where the perfect smite fell, then gold rising in it.
      fx.flashes.push({ x, y: y - 10, r: 90, i: 1.5, c: [1, 0.92, 0.6], life: 0.3, max: 0.3 });
      fx.rings.push({ x, y, life: 0.5, max: 0.5, col: '#ffe9a8', size: 26 }, { x, y, life: 0.35, max: 0.35, col: '#ffffff', size: 16 });
      for (let i = 0; i < 5; i++) fx.burst(x, y - i * 8, 6, HOLY, 30, true, 40);
      fx.shake = Math.max(fx.shake, 3);
      return true;
    case 'coalburst':
      fx.rings.push({ x, y, life: 0.35, max: 0.35, col: '#ffe08a', size: CENSER.burst * PX * 0.5 });
      fx.burst(x, y - 3, 14, [...HOLY, '#ffb040'], 70, true);
      return true;
    case 'coalflare':
      fx.flashes.push({ x, y: y - 4, r: CENSER.flare * PX * 1.6, i: 1.3, c: [1, 0.6, 0.25], life: 0.22, max: 0.22 });
      fx.rings.push({ x, y, life: 0.4, max: 0.4, col: '#ff9a3c', size: CENSER.flare * PX });
      fx.burst(x, y - 4, 22, EMBER, 120, true, 200);
      fx.shake = Math.max(fx.shake, 2);
      return true;
    case 'snag':
      fx.say(x, y - 18, 'SNAGGED', '#c8c4d0');
      fx.burst(x, y - 6, 10, STEEL, 80, true);
      fx.shake = Math.max(fx.shake, 2);
      return true;
    case 'flailstun':
      fx.rings.push({ x, y: y - 8, life: 0.3, max: 0.3, col: '#ffd27a', size: 14 }, { x, y: y - 8, life: 0.22, max: 0.22, col: '#ffffff', size: 9 });
      fx.flashes.push({ x, y: y - 8, r: 55, i: 1.1, c: [1, 0.9, 0.6], life: 0.15, max: 0.15 });
      fx.burst(x, y - 22, 12, ['#ffd27a', '#ffffff'], 60, true);
      fx.shake = Math.max(fx.shake, 4);
      return true;
  }
  return false;
}
