/**
 * The world effects heard (shared/worldfx.ts): lightning bending into an ironhide (a crack and the
 * thunder), a jolt crackling across water (at most a few a second, a stream ticks ten times), a butcher
 * chewing at a body and coming up FED (a growl), a body going up as ash, ice forming, steam hissing.
 */
import type { FightEvent } from '../sim/types';
import { burst, ready, tone, sfx } from './sfx';

let poolAt = -9;

/** True if it was one of these. */
export function worldSound(ev: FightEvent): boolean {
  switch (ev.k) {
    case 'rodhit':
      if (!ready()) return true;
      sfx.shock();
      burst('lowpass', 4000, 200, 0.9, 0.8, 0.5);
      tone('sine', 70, 40, 0.5, 0.6, 0.05);
      return true;
    case 'pooljolt': {
      const t = performance.now() / 1000;
      if (t - poolAt < 0.25) return true;
      poolAt = t;
      if (!ready()) return true;
      sfx.shock();
      // The water fizzing with it.
      burst('bandpass', 2500, 1200, 2, 0.35, 0.35);
      return true;
    }
    case 'meal':
      return sfx.gnaw(1), true;
    case 'mealbroken':
      return sfx.growl(false), true;
    case 'fed':
      return sfx.growl(true), sfx.gnaw(1), true;
    case 'ashed':
      return sfx.ignite(), true;
    case 'iced':
      return sfx.freeze(), true;
    case 'thaw':
    case 'steamup':
      return sfx.steam(), true;
  }
  return false;
}
