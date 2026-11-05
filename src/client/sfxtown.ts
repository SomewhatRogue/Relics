/**
 * Small sounds made in WebAudio from the kit's own pieces (sfx.ts tone and burst): coins changing hands
 * at any stall, Halvard's hammer on the anvil, the chime of an objective done, and the dull knock of a
 * press that did nothing. Short, and never on a loop.
 */
import { burst, ready, tone } from './sfx';

export const sfxTown = {
  /** Coins: two or three bright little clinks, a hair apart, over a soft rattle. */
  coins() {
    if (!ready()) return;
    burst('bandpass', 5200, 3800, 4, 0.12, 0.06);
    tone('square', 2350, 2300, 0.05, 0.05, 0.0);
    tone('square', 3150, 3100, 0.045, 0.06, 0.055);
    tone('triangle', 2650, 2600, 0.07, 0.09, 0.11);
    burst('highpass', 6000, 4000, 1, 0.06, 0.12, 0.04);
  },
  /** Hammer on the anvil: a hard strike, a ringing steel partial that hangs, and a second, softer blow. */
  anvil() {
    if (!ready()) return;
    for (const [at, v] of [[0, 1], [0.32, 0.6]] as const) {
      burst('highpass', 3500, 1500, 1, 0.45 * v, 0.05, at);
      burst('lowpass', 900, 200, 0.7, 0.35 * v, 0.08, at);
      tone('triangle', 1870, 1860, 0.12 * v, 0.6 * v, at);
      tone('sine', 2960, 2950, 0.06 * v, 0.45 * v, at);
      tone('sine', 4410, 4400, 0.03 * v, 0.3 * v, at);
    }
  },
  /** An objective done: three notes rising, bright and short. */
  chime() {
    if (!ready()) return;
    [988, 1319, 1976].forEach((f, i) => tone('triangle', f, f, 0.12, 0.35, i * 0.07));
    tone('sine', 3951, 3951, 0.03, 0.5, 0.14);
  },
  /** A press that did nothing (nothing to grab): a soft, dull knock. */
  dull() {
    if (!ready()) return;
    tone('sine', 150, 90, 0.18, 0.09);
    burst('lowpass', 500, 150, 0.7, 0.12, 0.05);
  },
  /** ATTACK held on an empty crossbow: the dry click of the latch with nothing in it. */
  empty() {
    if (!ready()) return;
    burst('bandpass', 2600, 1800, 6, 0.25, 0.03);
    burst('bandpass', 1400, 900, 5, 0.18, 0.03, 0.06);
  },
  /** Rats scattering (`n` of them, the nearest `dist` tiles off): a thin squeak or two and a patter of feet, quiet. */
  rats(n: number, dist: number) {
    if (!ready() || dist > 10) return;
    const v = Math.max(0.25, 1 - dist / 10);
    tone('sine', 3300, 4300, 0.03 * v, 0.07);
    if (n > 1) tone('sine', 3900, 3200, 0.022 * v, 0.06, 0.08);
    for (let i = 0; i < 5 + Math.min(6, n * 2); i++) burst('bandpass', 2600 + (i % 3) * 500, 1800, 3, 0.035 * v, 0.018, 0.02 + i * (0.035 + (i % 2) * 0.012));
  },
};
