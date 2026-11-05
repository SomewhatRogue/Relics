/**
 * A storm's lightning, seen and heard where it lands (sim/storm.ts decides it): a crackle and a few
 * sparks on the spot as its circle shows, then the crack, a scorch with cracks round it, earth thrown
 * up, the screen shaking, and the thunder a moment later. The flash over everything is the lighting's
 * (client/skyfx.ts). Cosmetic only, so Math.random.
 */
import type { FightEvent } from '../sim/types';
import type { Fx } from './fx';
import { burst, ready, tone } from './sfx';

const COLD = ['#ffffff', '#c8dcff', '#9fb8ff'];

/** Snaps strung over `spread` seconds. */
function crackle(n: number, spread: number, peak: number, delay = 0): void {
  for (let i = 0; i < n; i++) {
    const f = 2600 + Math.random() * 4200;
    burst('highpass', f, f * 1.3, 5, peak * (0.5 + Math.random() * 0.6), 0.006 + Math.random() * 0.014, delay + Math.random() * spread);
  }
}

/** True if it was one of these (and has been drawn and played). */
export function stormFx(fx: Fx, ev: FightEvent, x: number, y: number): boolean {
  if (ev.k === 'strikewarn') {
    fx.burst(x, y - 2, 6, COLD, 30, true);
    if (ready()) crackle(14, 0.9, 0.12), tone('sawtooth', 70, 140, 0.03, 0.9);
    return true;
  }
  if (ev.k !== 'strike') return false;
  fx.crater(x, y, 10);
  fx.debris(x, y - 2, 18);
  fx.burst(x, y - 4, 26, COLD, 90, true);
  fx.rings.push({ x, y, life: 0.3, max: 0.3, col: '#c8dcff' });
  fx.shake = Math.max(fx.shake, 7);
  if (ready()) {
    // The crack where it lands, then the thunder rolling in after.
    burst('highpass', 2500, 7000, 1, 0.8, 0.08);
    tone('square', 220, 50, 0.22, 0.2);
    crackle(10, 0.2, 0.3);
    const late = 0.35 + Math.random() * 0.4;
    burst('lowpass', 260, 50, 0.7, 0.75, 2.2, late);
    tone('sine', 52, 34, 0.5, 2, late);
    burst('lowpass', 180, 40, 0.6, 0.4, 1.6, late + 0.5);
  }
  return true;
}
