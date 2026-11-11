/**
 * The Haulier's working as effects and sounds (events from sim/haulbook.ts, sim/haulcarts.ts; the bodies are
 * client/hauldraw.ts and client/sumpdraw.ts): a cart set rolling, crashing, pulling up; lightning on the
 * winding gear; the plate flung off for good. Cosmetic only.
 */
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { sfx } from './sfx';

/** When the gear last crackled (wall clock, seconds), and whether lightning fell on it; where a cart last pulled up. */
export const HAUL_FX = { gearAt: -9, gearHit: false, jolt: null as null | { x: number; y: number; at: number } };
export const secs = () => performance.now() / 1000;

/** True if it was one of these (and has been drawn). */
export function haulFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  if (ev.k === 'cart') {
    if (ev.what === 'go') {
      fx.burst(x, y - 2, 12, ['#8a8494', '#6a647a', '#b8b4ac'], 38, false, 60, true);
      fx.shake = Math.max(fx.shake, 1.5);
    } else if (ev.what === 'hit') {
      fx.burst(x, y - 8, 22, ['#ffd27a', '#ffffff', '#ff9a40'], 95, true);
      fx.burst(x, y - 6, 16, ['#5c5866', '#c8a84a', '#6a4632', '#7a7484'], 85, false, 220, true);
      fx.rings.push({ x, y, life: 0.3, max: 0.3, col: '#d8c8a8' });
      fx.flashes.push({ x, y: y - 8, r: 60, i: 1.1, c: [1, 0.8, 0.45], life: 0.16, max: 0.16 });
      fx.shake = Math.max(fx.shake, 6);
    } else {
      HAUL_FX.jolt = { x, y, at: secs() };
      fx.burst(x, y - 2, 10, ['#8a8494', '#6a647a'], 45, false, 120, true);
      fx.burst(x, y - 6, 6, ['#ffd27a', '#ffffff'], 60, true);
      fx.shake = Math.max(fx.shake, 3);
    }
    return true;
  }
  if (ev.k === 'gear') {
    HAUL_FX.gearAt = secs(), HAUL_FX.gearHit = ev.hit;
    fx.burst(x, y - 30, ev.hit ? 28 : 14, ['#bfe0ff', '#ffffff', '#8ab8ff'], ev.hit ? 110 : 70, true);
    fx.flashes.push({ x, y: y - 30, r: ev.hit ? 110 : 60, i: ev.hit ? 1.6 : 0.8, c: [0.7, 0.82, 1], life: 0.3, max: 0.3 });
    if (ev.hit) fx.rings.push({ x, y, life: 0.4, max: 0.4, col: '#bfe0ff' }), (fx.shake = Math.max(fx.shake, 3));
    return true;
  }
  if (ev.k === 'bare') {
    // The plate flung off in every direction: iron, rust, rivets, and the heat under it.
    fx.burst(x, y - 14, 26, ['#5e5a58', '#9a968f', '#6a4632', '#b8b4ac'], 120, false, 240, true);
    fx.burst(x, y - 16, 14, ['#ff9a40', '#ffd27a', '#ffffff'], 80, true);
    fx.rings.push({ x, y, life: 0.45, max: 0.45, col: '#d8c8a8' });
    fx.flashes.push({ x, y: y - 14, r: 80, i: 1.2, c: [1, 0.6, 0.35], life: 0.25, max: 0.25 });
    fx.shake = Math.max(fx.shake, 7);
    return true;
  }
  return false;
}

/** Their sounds, from the kit we have. True when it was one of theirs. */
export function haulSound(ev: FightEvent): boolean {
  if (ev.k === 'cart') return ev.what === 'hit' ? (sfx.propbreak(), sfx.slam()) : ev.what === 'stop' ? sfx.thud() : sfx.rumble(), true;
  if (ev.k === 'gear') return sfx.shock(), ev.hit && sfx.boom(), true;
  if (ev.k === 'bare') return sfx.wardbreak(), sfx.propbreak(), sfx.slam(), true;
  return false;
}
