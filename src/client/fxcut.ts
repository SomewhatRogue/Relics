/**
 * The long cut's moments (sim/samuraicut.ts), cosmetic only; the line and the marks it leaves are cutdraw.ts's.
 * The stance: a small ring and a glint at the Rogue's feet. The slash: one straight white streak along the
 * line, a cold flash, a jolt. Each one cut as it lands: a white line across it, blood, all in the same frame.
 * Its sounds: a held ring for the stance, a long whoosh for the slash, a heavy cut for each one falling
 * (recorded samples, retuned; sfxevents.ts plays them through `cutSample`).
 */
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import type { SfxName } from './sfxbank';
import type { PlayOpts } from './sfxplayer';
import { toPx } from './world';

const STEEL = ['#ffffff', '#c8d0dc', '#e8ecf2'];
const BLOOD = ['#7a1010', '#a81c1c', '#5a0808'];

export function cutFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  switch (ev.k) {
    case 'cutstance':
      fx.rings.push({ x, y: y - 2, life: 0.4, max: 0.4, col: '#c8d0dc', size: 14 });
      fx.flashes.push({ x, y: y - 10, r: 30, i: 0.5, c: [0.85, 0.9, 1], life: 0.25, max: 0.25 });
      return true;
    case 'cutslash': {
      const [x0, y0] = toPx(ev.x0, ev.y0);
      fx.arcs.push({ x: x0, y: y0 - 10, x2: x, y2: y - 10, life: 0.35, col: '#ffffff', straight: true });
      fx.arcs.push({ x: x0, y: y0 - 9, x2: x, y2: y - 9, life: 0.2, col: '#c8d0dc', straight: true });
      fx.flashes.push({ x, y: y - 10, r: 60, i: 0.9, c: [0.85, 0.9, 1], life: 0.2, max: 0.2 });
      fx.shake = Math.max(fx.shake, 3);
      return true;
    }
    case 'cutfall':
      fx.arcs.push({ x: x - ev.dy * 12 - ev.dx * 10, y: y - 18 + ev.dx * 6, x2: x + ev.dy * 12 + ev.dx * 10, y2: y - 6 - ev.dx * 6, life: 0.3, col: '#ffffff', straight: true });
      fx.burst(x, y - 12, 16, BLOOD, 80, false);
      fx.burst(x, y - 12, 6, STEEL, 60, true);
      fx.shake = Math.max(fx.shake, 5);
      return true;
    default:
      return false;
  }
}

let lastFall = -1e9;

/** Its sound: true if one played (sfxevents.ts). `play`: the bank's player (sfxroutes.ts playPick). */
export function cutSample(ev: FightEvent, play: (p: [SfxName, PlayOpts]) => boolean): boolean {
  if (ev.k === 'cutstance') return play(['parry_ring', { rate: 0.6, vol: 0.55 }]);
  if (ev.k === 'cutslash') return play(['throw_whoosh', { rate: 0.75, vol: 1 }]);
  // (Many fall in the same frame: one heavy cut for them all, the rest quiet.)
  if (ev.k === 'cutfall') {
    const now = typeof performance === 'undefined' ? 0 : performance.now(), again = now - lastFall < 80;
    lastFall = now;
    return again || play(['hit_cleave', { rate: 0.85, vol: 1 }]);
  }
  return false;
}
