/**
 * The Haulier's working as effects and sounds (events from sim/haulbook.ts, sim/haulcarts.ts; the bodies are
 * client/hauldraw.ts and client/sumpdraw.ts): a cart set rolling, crashing, pulling up; lightning on the
 * winding gear; the plate flung off for good; landing a leap; its sparks hitting the floor. Cosmetic only.
 */
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import type { Enemy } from '../sim/types';
import type { Light } from './light';
import { sfx } from './sfx';
import { BRAKE_WORDS } from '../shared/opencutwords';

/** When the gear last crackled (wall clock, seconds), and whether lightning fell on it; where a cart last pulled up. */
export const HAUL_FX = { gearAt: -9, gearHit: false, jolt: null as null | { x: number; y: number; at: number } };
export const secs = () => performance.now() / 1000;

/** True if it was one of these (and has been drawn). */
export function haulFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  if (ev.k === 'cart') {
    if (ev.what === 'go') {
      fx.burst(x, y - 2, 12, ['#8a8494', '#6a647a', '#b8b4ac'], 38, false, 60, true);
      fx.shake = Math.max(fx.shake, 1.5);
    } else if (ev.what === 'aim') {
      fx.say(x, y - 40, BRAKE_WORDS.how, '#ffd27a', 2.4);
    } else if (ev.what === 'flip') {
      fx.burst(x, y - 6, 18, ['#ffd27a', '#ffffff', '#ff9a40'], 90, true);
      fx.say(x, y - 30, BRAKE_WORDS.flip, '#ffd27a');
      fx.shake = Math.max(fx.shake, 4);
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
  if (ev.k === 'haulleap') {
    // Down from the leap: the floor thrown up round it, grit and stone, a ring, and the whole screen jolts.
    fx.burst(x, y - 2, 24, ['#8a8494', '#6a647a', '#b8b4ac', '#57525e'], 90, false, 200, true);
    fx.burst(x, y - 10, 10, ['#ffd27a', '#ffffff'], 70, true);
    fx.rings.push({ x, y, life: 0.35, max: 0.35, col: '#d8c8a8', size: 34 });
    fx.flashes.push({ x, y: y - 6, r: 70, i: 0.9, c: [1, 0.78, 0.5], life: 0.14, max: 0.14 });
    fx.shake = Math.max(fx.shake, 7);
    return true;
  }
  if (ev.k === 'sparks') {
    // A shower of sparks off the gear hitting the floor: white-hot, then the burning.
    fx.burst(x, y - 4, 22, ['#ffd27a', '#ffffff', '#ff9a3c', '#ff6a20'], 95, true, 140);
    fx.flashes.push({ x, y: y - 4, r: 46, i: 1.1, c: [1, 0.7, 0.3], life: 0.18, max: 0.18 });
    fx.shake = Math.max(fx.shake, 2.5);
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
  if (ev.k === 'cart') return ev.what === 'hit' ? (sfx.propbreak(), sfx.slam()) : ev.what === 'flip' ? (sfx.slam(), sfx.rumble()) : ev.what === 'aim' ? undefined : ev.what === 'stop' ? sfx.thud() : sfx.rumble(), true;
  if (ev.k === 'gear') return sfx.shock(), ev.hit && sfx.boom(), true;
  if (ev.k === 'bare') return sfx.wardbreak(), sfx.propbreak(), sfx.slam(), true;
  if (ev.k === 'haulleap') return sfx.slam(), sfx.boom(), true;
  if (ev.k === 'sparks') return sfx.ignite(), sfx.shock(), true;
  return false;
}

/**
 * The light the Haulier carries (screen x, y of its feet): its smelter's stack smoulders warm, the plate is
 * lit from the stack, and each tell lights it its own colour (red wind-up, a gold crack, green bare, a hot
 * chain), so it is never a silhouette between the torches. Cosmetic only.
 */
export function haulLights(e: Enemy, x: number, y: number, t: number, now: number): Light[] {
  const b = e.boss!, a = e.attack, bare = !!b.bare, fl = Math.sin(now * 13 + e.id) * 4;
  // (A cool, low fill so the plate reads as grey iron, not lit cream: the stack is the warm light.)
  const out: Light[] = [{ x, y: y - 22, r: 60, i: 0.1, c: [0.7, 0.76, 0.9] }];
  if (!bare) out.push({ x, y: y - 44, r: 84 + fl, i: 0.34, c: [1, 0.6, 0.26] });
  if (e.cracked && !bare) out.push({ x, y: y - 24, r: 44, i: 0.25 + 0.2 * Math.sin(now * 9), c: [1, 0.82, 0.3] });
  if (bare || b.phase === 2) out.push({ x, y: y - 26, r: 90, i: bare ? 0.22 : 0.2, c: [0.5, 1, 0.3] }, { x, y: y - 32, r: 30, i: 0.3, c: [1, 0.25, 0.15] });
  if (a && a.t < a.windup + a.active && (b.move === 'pick' || b.move === 'overhead')) out.push({ x, y: y - (b.move === 'overhead' ? 54 : 34), r: 64, i: 0.15 + 0.3 * Math.min(1, a.t / a.windup), c: [1, 0.2, 0.12] });
  if (a && b.move === 'drag') out.push({ x, y: y - 8, r: 120, i: 0.35, c: [1, 0.72, 0.42] });
  // Crouched to leap: red under it; hauling the crank: the sparks' warm flicker on it.
  if (a && b.move === 'leap' && a.t < a.windup) out.push({ x, y: y - 4, r: 56, i: 0.08 + 0.14 * Math.min(1, a.t / a.windup), c: [1, 0.25, 0.15] });
  if (a && b.move === 'crank' && a.t < a.windup) out.push({ x, y: y - 48, r: 70, i: 0.1 + 0.05 * Math.sin(now * 23), c: [1, 0.7, 0.3] });
  void t;
  return out;
}
