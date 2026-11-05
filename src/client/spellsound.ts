/**
 * A Mage's held spells and GRASP, heard (sim/holds.ts, sim/grasp.ts decide them). Each element sounds
 * like itself, bigger than its tap (magesfx.ts): fire a deep whoosh with crackle, frost a hiss and a
 * glassy chime, storm a hard snap and a rolling crack. A ring raised hums on; a spell let go on the flash
 * gets a little more on top. (The wand's storm stream hums on its own: streamsound.ts.) Cosmetic, so Math.random.
 */
import type { FightEvent } from '../sim/types';
import { sfx, burst, ready, tone } from './sfx';

/** Snaps and pops strung over `spread` seconds. */
function crackle(n: number, spread: number, peak: number, delay = 0): void {
  for (let i = 0; i < n; i++) {
    const f = 2400 + Math.random() * 4000;
    burst('highpass', f, f * 1.3, 5, peak * (0.55 + Math.random() * 0.6), 0.006 + Math.random() * 0.014, delay + Math.random() * spread);
  }
}

const fire = (big: boolean) => (burst('bandpass', 1400, 300, 0.7, 0.4, 0.35), burst('lowpass', 900, 120, 0.8, 0.3, 0.4, 0.05), crackle(big ? 16 : 10, 0.45, 0.22, 0.05));
const frost = (big: boolean) => (burst('highpass', 7000, 3000, 1, 0.32, 0.3), tone('triangle', 2637, 2630, 0.1, 0.35, 0.05), tone('triangle', 3951, 3940, 0.07, 0.3, 0.1), big && tone('triangle', 5274, 5260, 0.06, 0.4, 0.16));
const storm = (big: boolean) => (burst('highpass', 3000, 6000, 1, 0.5, 0.06), tone('square', 180, 60, 0.18, 0.25), burst('lowpass', 600, 80, 0.6, 0.35, 0.5, 0.06), crackle(big ? 14 : 9, 0.3, 0.25));

/** True if it was one of these (and has been played). */
export function spellSound(ev: FightEvent): boolean {
  if (ev.k === 'grasp') {
    if (ready()) burst('bandpass', 300, 1400, 1.5, 0.3, 0.35), tone('sine', 220, 440, 0.12, 0.3), tone('sine', 330, 660, 0.06, 0.3, 0.04);
    return true;
  }
  if (ev.k === 'grasped') return true;
  if (ev.k !== 'spell') return false;
  if (!ready()) return true;
  const big = ev.big;
  if (ev.what === 'shatter') return sfx.shatter(), frost(big), true;
  if (ev.what === 'nova') return frost(big), sfx.freeze(), true;
  if (ev.what === 'coldblast') return frost(big), true;
  if (ev.what === 'thunderbolt') return storm(big), sfx.rumble(), true;
  if (ev.what === 'dash') return storm(big), true;
  if (ev.what === 'stormring') return storm(big), tone('sawtooth', 110, 110, 0.05, 0.8, 0.1), true;
  if (ev.what === 'flamering') return fire(big), sfx.flare(), true;
  fire(big);
  return true;
}
