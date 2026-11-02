/**
 * What spiders sound like: a dry skitter of legs (louder the closer), a hiss as one gathers itself to
 * pounce, a wet bite, sacs tearing when a wave hatches, the brood mother's gurgling spit and the glob's
 * splat, a bright tick on a weakness. Built from the shared noise and tone hooks (sfx.ts).
 */
import { burst, ready, tone } from './sfx';

export const spiderSounds = {
  /** Many small legs on stone, `near` 0..1. */
  skitter(near = 1) {
    if (!ready()) return;
    for (let i = 0; i < 6; i++) burst('bandpass', 4200 + i * 300, 2600, 9, 0.06 + 0.12 * near, 0.018, i * 0.028 + Math.random() * 0.01);
  },
  hiss() {
    if (!ready()) return;
    burst('highpass', 6000, 3200, 1, 0.14, 0.32);
  },
  /** The bite landing: wet, short, with a crunch under it. */
  wetbite() {
    if (!ready()) return;
    burst('bandpass', 1500, 400, 3, 0.45, 0.09);
    burst('lowpass', 700, 160, 1, 0.4, 0.16, 0.03);
    tone('sine', 260, 120, 0.1, 0.08, 0.02);
  },
  hatch() {
    if (!ready()) return;
    burst('bandpass', 1400, 500, 3, 0.35, 0.25);
    for (let i = 0; i < 5; i++) burst('bandpass', 3500, 2200, 8, 0.12, 0.02, 0.1 + i * 0.05);
  },
  spit() {
    if (!ready()) return;
    burst('lowpass', 500, 1400, 2, 0.3, 0.35);
    tone('sine', 160, 380, 0.12, 0.3);
  },
  splat() {
    if (!ready()) return;
    burst('lowpass', 900, 140, 1, 0.5, 0.28);
    burst('bandpass', 2000, 600, 2, 0.2, 0.12);
  },
  weak() {
    if (!ready()) return;
    tone('square', 990, 1480, 0.05, 0.08);
  },
};
