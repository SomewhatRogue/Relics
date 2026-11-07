/**
 * The boss kit as effects and sounds (sim/poise.ts, doorwall.ts, doorpair.ts): STAGGERED in gold with a
 * flash and a shake, BRACED over the blocker as the boss rebounds, DOOR DOWN with splinters, a phase's
 * roar shaking the screen, a dull knock as the pair swap their doors, an ENRAGED one's growl into each big
 * blow. The words are shared/bosswords.ts's.
 * Cosmetic only.
 */
import { BOSS_CALLS } from '../shared/bosswords';
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { sfx } from './sfx';
import { butcher } from './voices';

/** True if it was one of these (and has been drawn). */
export function bossFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  if (ev.k === 'staggered') {
    fx.say(x, y - 44, BOSS_CALLS.staggered, '#ffd040', 1.2);
    fx.burst(x, y - 14, 18, ['#ffffff', '#ffd040', '#fff1b0'], 90, true);
    fx.flashes.push({ x, y: y - 12, r: 60, i: 1.3, c: [1, 0.85, 0.4], life: 0.25, max: 0.25 });
    fx.shake = Math.max(fx.shake, 4);
    return true;
  }
  if (ev.k === 'rebound') {
    fx.say(x, y - 34, BOSS_CALLS.braced, '#ffd27a', 0.9);
    fx.burst(x, y - 10, 12, ['#ffd27a', '#ff9a40', '#ffffff'], 85, true);
    fx.shake = Math.max(fx.shake, 2.5);
    return true;
  }
  if (ev.k === 'doordown') {
    fx.say(x, y - 40, BOSS_CALLS.doorDown, '#e8c060', 1.1);
    fx.burst(x, y - 10, 14, ['#8a6a40', '#5a3d22', '#c8b090'], 80, false, 220, true);
    fx.shake = Math.max(fx.shake, 2);
    return true;
  }
  if (ev.k === 'roar') {
    fx.burst(x, y - 20, 16, ['#e8501f', '#ffb0a0', '#ffffff'], 70, true);
    fx.shake = Math.max(fx.shake, 6);
    return true;
  }
  if (ev.k === 'growl') return fx.burst(x, y - 30, 5, ['#e8401f', '#a01810'], 40, true), true;
  return ev.k === 'doorswap';
}

/** Their sounds, from the kit we have. True when it was one of theirs. */
export function bossSound(ev: FightEvent): boolean {
  switch (ev.k) {
    case 'staggered': return sfx.wardbreak(), butcher.groan(), true;
    case 'rebound': return sfx.block(), sfx.thud(), true;
    case 'doordown': return sfx.propbreak(), sfx.thud(), true;
    case 'roar': return butcher.roar(true), true;
    case 'doorswap': return sfx.thud(), true;
    case 'growl': return butcher.growl(), true;
    default: return false;
  }
}
