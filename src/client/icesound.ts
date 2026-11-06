/** A frozen goblin sent skidding (a whoosh and a hiss of ice) and its crash (a thud, a big crack, glass). */
import type { FightEvent } from '../sim/types';
import { burst, ready, tone } from './sfx';
import { playSfx } from './sfxplay';

/** True if it was one of these (the crash's SHATTER rings on its own, as ever). */
export function iceSound(ev: FightEvent): boolean {
  if (ev.k !== 'fling' && ev.k !== 'icecrash') return false;
  if (!ready()) return true;
  if (playSfx(ev.k === 'fling' ? 'frost_burst' : 'ice_shatter', { vol: ev.big ? 1 : 0.85 })) return true;
  if (ev.k === 'fling') {
    burst('bandpass', 300, 1600, 0.7, ev.big ? 0.7 : 0.5, 0.32);
    burst('highpass', 3500, 6500, 1, 0.25, 0.5, 0.05);
    return true;
  }
  tone('sine', 110, 40, ev.big ? 0.9 : 0.6, 0.3);
  burst('lowpass', 5000, 300, 0.8, ev.big ? 0.95 : 0.7, 0.35);
  for (let i = 0; i < (ev.big ? 7 : 4); i++) tone('triangle', 3000 - i * 220, 2300, 0.06, 0.14, 0.04 + i * 0.03);
  return true;
}
