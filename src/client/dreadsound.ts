/**
 * What being out of bounds sounds like, from the shared kit (sfx.ts). Your own hero: a low drone that
 * swells with the dread, a heartbeat that quickens, a breath far off at the warning and a whisper when
 * it gets worse. Anyone's: the thing rising and the crush (wild), or the hungry pouring in and pulling
 * them down (settled), and the soft thump of being set back in town. Cosmetic: Math.random is fine.
 */
import { burst, ready, sfxOut, tone } from './sfx';

export class DreadSound {
  private drone: { g: GainNode; f: BiquadFilterNode } | null = null;
  private beatAt = 0;

  /** Each frame: `level` 0 to 1 for your own hero (0 in bounds), `stage` 0 to 3. */
  frame(level: number, stage: number, now: number): void {
    const o = sfxOut();
    if (!o) return;
    if (level > 0.01 && !this.drone) this.drone = makeDrone(o.ac, o.out);
    if (this.drone) {
      this.drone.g.gain.setTargetAtTime(level * 0.22, o.ac.currentTime, 0.4);
      this.drone.f.frequency.setTargetAtTime(90 + level * 120, o.ac.currentTime, 0.5);
    }
    if (stage < 1 || level < 0.05) return;
    // Lub-dub, quicker as it comes: once a second, then nearly twice, then racing once you're held.
    const gap = stage >= 3 ? 0.36 : stage === 2 ? 0.58 : 0.95;
    if (now - this.beatAt < gap) return;
    this.beatAt = now;
    const v = 0.25 + level * 0.45;
    tone('sine', 62, 38, v, 0.13);
    tone('sine', 55, 34, v * 0.7, 0.12, 0.17);
  }

  /** A `dread` event (sim/dread.ts): `mine` when it's your own hero's. */
  event(n: number, by: string, mine: boolean): void {
    if (!ready()) return;
    if (n === 1 && mine) breath();
    if (n === 2 && mine) whisper(), tone('sawtooth', 48, 33, 0.07, 1.8);
    if (n === 3 && by === 'shadow') {
      // Something vast rising out of the ground.
      burst('lowpass', 140, 420, 0.7, 0.55, 1.1);
      tone('sine', 34, 46, 0.4, 1.1);
      tone('sawtooth', 41, 30, 0.1, 1.1);
    }
    if (n === 3 && by === 'swarm') {
      // The hungry pouring out of the dark: a rush of feet and a rising chatter.
      for (let i = 0; i < 14; i++) burst('bandpass', 700 + Math.random() * 900, 400, 4, 0.12, 0.05, i * 0.07);
      for (let i = 0; i < 8; i++) tone('square', 300 + Math.random() * 260, 180 + Math.random() * 120, 0.035, 0.09, 0.2 + i * 0.1);
    }
    if (n === 4 && by === 'shadow') {
      // The crush: a huge weight coming down, the ground cracking.
      burst('lowpass', 900, 40, 0.8, 1, 0.9);
      tone('sine', 70, 26, 0.7, 0.8);
      burst('bandpass', 2400, 500, 2, 0.35, 0.25, 0.02);
    }
    if (n === 4 && by === 'swarm') {
      for (let i = 0; i < 9; i++) burst('lowpass', 900, 200, 1, 0.3, 0.08, i * 0.06);
      tone('sine', 90, 45, 0.3, 0.4, 0.5);
    }
    if (n === 5 && mine) burst('lowpass', 300, 80, 0.7, 0.35, 0.4), breath();
  }
}

function makeDrone(ac: AudioContext, out: AudioNode) {
  const g = ac.createGain(), f = ac.createBiquadFilter();
  g.gain.value = 0;
  f.type = 'lowpass';
  f.frequency.value = 90;
  f.Q.value = 3;
  for (const hz of [41, 41.6, 61.8]) {
    const o = ac.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = hz;
    o.connect(f);
    o.start();
  }
  f.connect(g).connect(out);
  return { g, f };
}

/** A long breath far off, in and out. */
function breath(): void {
  burst('bandpass', 380, 620, 1.4, 0.16, 1.1);
  burst('bandpass', 650, 300, 1.4, 0.13, 1.4, 1.2);
}

/** Something whispering just out of hearing: sibilants and a murmur, no words. */
function whisper(): void {
  for (let i = 0; i < 7; i++) burst('bandpass', 3800 + Math.random() * 2400, 2600, 6, 0.06, 0.12 + Math.random() * 0.1, i * 0.17 + Math.random() * 0.05);
  burst('bandpass', 260, 180, 3, 0.08, 1.2, 0.1);
}
