/**
 * Goblin voices, made live: scrappers gibber and cackle as they come, yelp when cut, shriek when they
 * die, hiss as they stab; the butcher grunts, roars into its slam and groans as it falls. Each goblin
 * has its own pitch (from its id) so a crowd sounds like a crowd. Formants are a sawtooth through two
 * band-pass filters, which is enough to sound like a throat.
 */
import { burst, noise, ready, sfxOut } from './sfx';

let ctx: AudioContext | null = null;
let out: AudioNode | null = null;

/**
 * One syllable: pitch sliding f0 to f1 through vowel formants v1 and v2 (Hz), with a little rasp.
 */
function syllable(at: number, dur: number, f0: number, f1: number, v1: number, v2: number, peak: number, rasp = 0.3): void {
  const c = ctx!, o = c.createOscillator(), g = c.createGain(), a = c.createBiquadFilter(), b = c.createBiquadFilter(), mix = c.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(f0, at);
  o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), at + dur);
  a.type = b.type = 'bandpass';
  a.frequency.value = v1;
  b.frequency.value = v2;
  a.Q.value = 6;
  b.Q.value = 8;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + Math.min(0.03, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(a).connect(mix);
  o.connect(b).connect(mix);
  mix.connect(g).connect(out!);
  o.start(at);
  o.stop(at + dur + 0.05);
  if (rasp > 0) {
    const n = noise(dur, c), f = c.createBiquadFilter(), ng = c.createGain();
    f.type = 'bandpass';
    f.frequency.value = v2;
    f.Q.value = 2;
    ng.gain.setValueAtTime(0.0001, at);
    ng.gain.exponentialRampToValueAtTime(peak * rasp, at + 0.01);
    ng.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    n.connect(f).connect(ng).connect(out!);
    n.start(at, Math.random());
    n.stop(at + dur + 0.05);
  }
}

const VOWELS: [number, number][] = [[700, 1200], [400, 2200], [550, 1800], [300, 900], [650, 1600]];
export const pitchOf = (id: number) => 1 + ((id * 37) % 11) / 22;
const ok = () => {
  const o = sfxOut();
  if (o) (ctx = o.ac), (out = o.out);
  return !!o;
};

export const goblin = {
  /** Gibbering as it comes: three to six quick syllables. */
  chatter(id: number) {
    if (!ok()) return;
    const p = pitchOf(id), t = ctx!.currentTime, n = 3 + Math.floor(Math.random() * 4);
    let at = t;
    for (let i = 0; i < n; i++) {
      const [v1, v2] = VOWELS[Math.floor(Math.random() * VOWELS.length)], d = 0.05 + Math.random() * 0.07, f = (260 + Math.random() * 140) * p;
      syllable(at, d, f, f * (0.8 + Math.random() * 0.5), v1 * 1.3, v2 * 1.3, 0.15, 0.4);
      at += d + Math.random() * 0.04;
    }
  },
  /** A nasty little laugh. */
  cackle(id: number) {
    if (!ok()) return;
    const p = pitchOf(id), t = ctx!.currentTime;
    for (let i = 0; i < 5; i++) syllable(t + i * 0.085, 0.07, 420 * p, 340 * p, 750, 1900, 0.2, 0.5);
  },
  yelp(id: number) {
    if (ok()) syllable(ctx!.currentTime, 0.14, 520 * pitchOf(id), 360 * pitchOf(id), 650, 1700, 0.3, 0.5);
  },
  shriek(id: number) {
    if (!ok()) return;
    const p = pitchOf(id), t = ctx!.currentTime;
    // Low and short (Kyle, 2026-11-08: deaths were "too high and shrill").
    syllable(t, 0.3, 420 * p, 150 * p, 600, 1600, 0.3, 0.7);
  },
  /** The hiss before a stab. */
  hiss() {
    if (ready()) burst('highpass', 3000, 4500, 1, 0.12, 0.18);
  },
  /** An archer drawing: the bow creaks. */
  draw() {
    if (ready()) burst('bandpass', 300, 700, 9, 0.28, 0.6), burst('bandpass', 500, 900, 9, 0.12, 0.4, 0.3);
  },
  /** A hexer calling the ground up: a low drone, the same few syllables over and over. */
  chant(id: number) {
    if (!ok()) return;
    const p = pitchOf(id), t = ctx!.currentTime;
    for (let i = 0; i < 4; i++) syllable(t + i * 0.26, 0.24, 150 * p, 120 * p, i % 2 ? 400 : 700, i % 2 ? 2200 : 1200, 0.16, 0.6);
  },
  /** The ground going up under a hex: a wet crack and a hiss of something burning green. */
  hexBurst() {
    if (ready()) burst('lowpass', 1200, 120, 0.8, 0.7, 0.35), burst('highpass', 2400, 5200, 1, 0.18, 0.4, 0.05);
  },
  /** One beat of a drummer's drum, quieter the further off (`v` 0 to 1); the off-beat a little higher. */
  drum(v: number, off: boolean) {
    if (!ready() || v <= 0) return;
    burst('lowpass', off ? 260 : 180, 50, 1.2, 0.55 * v, 0.22);
    burst('bandpass', off ? 900 : 700, 300, 3, 0.15 * v, 0.06);
  },
  /** Out of a den: a screech. */
  screech() {
    if (ok()) syllable(ctx!.currentTime, 0.3, 900, 500, 900, 2600, 0.25, 0.8);
  },
};

export const butcher = {
  grunt() {
    if (ok()) syllable(ctx!.currentTime, 0.18, 95, 70, 400, 900, 0.4, 0.6);
  },
  roar(slam: boolean) {
    if (!ok()) return;
    const t = ctx!.currentTime;
    syllable(t, slam ? 1.1 : 0.7, slam ? 120 : 100, slam ? 60 : 75, 450, 1100, 0.45, 0.8);
    syllable(t, slam ? 1.1 : 0.7, slam ? 61 : 51, slam ? 31 : 38, 300, 700, 0.35, 0.3);
  },
  /** ENRAGED, into a big blow: a short low snarl. */
  growl() {
    if (!ok()) return;
    const t = ctx!.currentTime;
    syllable(t, 0.45, 70, 52, 260, 600, 0.4, 0.9);
  },
  groan() {
    if (!ok()) return;
    const t = ctx!.currentTime;
    syllable(t, 1.2, 90, 40, 400, 800, 0.45, 0.6);
  },
};
