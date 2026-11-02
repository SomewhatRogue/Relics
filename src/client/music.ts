/**
 * Music, made live (no files): each kind of place has three pieces (scores.ts), played a bar at a
 * time through a shared reverb, with a little chance in the tune so nothing loops exactly. Moving to
 * another place crossfades. Under it all a fight layer (low toms, a driving ostinato) rises when
 * goblins come for you and falls away when they're dead; a boss gets its own music.
 */
import { INSTRUMENTS, type InstrumentId } from './instruments';
import { SCORES, type Area, type Score } from './scores';
import { audioOut } from './sfx';

const AHEAD = 0.6, FADE = 2.5;

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A note of the score's mode, `k` steps up from the tonic (any octave). */
const step = (s: Score, k: number) => s.root + 12 * Math.floor(k / 7) + s.mode[((k % 7) + 7) % 7];

class Track {
  readonly out: GainNode;
  private next: number;
  private bar = 0;
  private rand: () => number;
  private last = 9;

  constructor(private c: AudioContext, readonly score: Score, readonly key: string, bus: AudioNode, reverb: AudioNode, private fight: AudioNode, fade = FADE) {
    this.out = c.createGain();
    this.out.gain.setValueAtTime(0.0001, c.currentTime);
    this.out.gain.exponentialRampToValueAtTime(1, c.currentTime + fade);
    this.out.connect(bus);
    const send = c.createGain();
    send.gain.value = score.wet;
    this.out.connect(send).connect(reverb);
    this.next = c.currentTime + 0.1;
    this.rand = rng(score.seed + Math.floor(Math.random() * 1000));
  }

  fadeOut(fade = FADE): void {
    const t = this.c.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setValueAtTime(Math.max(0.0001, this.out.gain.value), t);
    this.out.gain.exponentialRampToValueAtTime(0.0001, t + fade);
    setTimeout(() => this.out.disconnect(), (fade + 2) * 1000);
  }

  /** Write bars until `until`. */
  fill(until: number): void {
    while (this.next < until) this.playBar(this.next), (this.next += (60 / this.score.bpm) * this.score.beats), this.bar++;
  }

  private play(id: InstrumentId | undefined, t: number, m: number, dur: number, v: number, out: AudioNode = this.out): void {
    if (id) INSTRUMENTS[id](this.c, out, t, m, dur, v);
  }

  private playBar(t: number): void {
    const s = this.score, beat = 60 / s.bpm, eighth = beat / 2, n = s.beats * 2, barLen = beat * s.beats;
    const deg = s.prog[this.bar % s.prog.length], chord = [0, 2, 4].map((i) => step(s, deg + i));
    // Bass on the downbeat (the horn on each half bar), chords held over the bar.
    if (s.bass === 'horn') for (let h = 0; h < 2; h++) this.play('horn', t + (h * barLen) / 2, chord[0] - 12, barLen / 2 - 0.05, 0.9);
    else this.play(s.bass, t, chord[0] - 12, barLen, 1);
    if (s.hold) for (const m of chord) this.play(s.hold, t, m + 12, barLen, 0.8);
    // The picked pattern.
    if (s.pick && s.pattern) for (let i = 0; i < n; i++) {
      const p = s.pattern[i % s.pattern.length];
      if (p < 0) continue;
      this.play(s.pick, t + i * eighth + (i % 2 ? eighth * 0.06 : 0), (p === 3 ? chord[0] + 12 : chord[p]) + 12, eighth * 1.6, i === 0 ? 1 : 0.75);
    }
    // The tune: a walk through the mode, landing on the chord on strong beats; it rests every fourth bar.
    if (s.tune && this.bar % 4 !== 3) {
      const busy = s.busy ?? 0.4, starts: number[] = [];
      for (let i = 0; i < n; i++) if (i === 0 ? this.rand() < 0.7 : this.rand() < busy * (i % 2 ? 0.6 : 1)) starts.push(i);
      starts.forEach((i, j) => {
        const len = ((starts[j + 1] ?? n) - i) * eighth;
        this.last += Math.round((this.rand() - 0.5) * 4);
        this.last = Math.max(7, Math.min(16, this.last));
        let k = this.last;
        if (i % 2 === 0 && this.rand() < 0.6) k = deg + [0, 2, 4][Math.floor(this.rand() * 3)] + 7 * Math.round((this.last - deg) / 7);
        this.play(s.tune, t + i * eighth, step(s, k) + (s.tune === 'horn' ? -12 : 0), len * 0.95, 0.85);
      });
    }
    for (let i = 0; i < n && s.drums; i++) {
      const d = s.drums[i % s.drums.length];
      if (d) this.play('drum', t + i * eighth, d === 2 ? 40 : 60, eighth, i === 0 ? 1 : 0.7);
    }
    // The fight layer: toms on the beat, a driving low pattern, all on its own fader.
    for (let i = 0; i < n; i++) {
      if (i % 2 === 0) this.play('drum', t + i * eighth, 40, eighth, i === 0 ? 1 : 0.8, this.fight);
      else if (this.rand() < 0.5) this.play('drum', t + i * eighth, 60, eighth, 0.5, this.fight);
      this.play('lute', t + i * eighth, chord[0] - (i % 4 === 3 ? 7 : 12), eighth * 0.9, i % 2 ? 0.55 : 0.8, this.fight);
    }
  }
}

export class Music {
  private track: Track | null = null;
  private bus: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private fight: GainNode | null = null;
  private wantKey = '';
  private want: Score | null = null;
  private danger = 0;

  /** The piece for this place (`version` picks one of its three). */
  set(area: Area, version: number): void {
    const list = SCORES[area], s = list[((version % list.length) + list.length) % list.length];
    this.wantKey = area + ':' + s.name;
    this.want = s;
  }

  /** How hard the fight is pressing, 0 to 1. */
  setDanger(d: number): void {
    this.danger = d;
  }

  get playing(): string {
    return this.track?.score.name ?? '';
  }

  /** Call every frame: starts, changes and writes ahead. */
  tick(): void {
    const a = audioOut();
    if (!a || !this.want) return;
    const c = a.ac;
    if (!this.bus) this.build(c, a.music);
    if (this.track?.key !== this.wantKey) {
      // Into a boss fight: quick, with a hit on the drum and a low horn, so the change can't be missed.
      const boss = this.wantKey.startsWith('boss:') && !!this.track && !this.track.key.startsWith('boss:');
      if (boss) {
        INSTRUMENTS.drum(c, this.bus!, c.currentTime + 0.02, 36, 0.6, 1);
        INSTRUMENTS.horn(c, this.bus!, c.currentTime + 0.05, 38, 2.4, 1);
      }
      this.track?.fadeOut(boss ? 0.5 : FADE);
      this.track = new Track(c, this.want, this.wantKey, this.bus!, this.reverb!, this.fight!, boss ? 0.3 : FADE);
    }
    this.fight!.gain.setTargetAtTime(0.0001 + this.danger * 0.8, c.currentTime, 0.8);
    this.track.fill(c.currentTime + AHEAD);
  }

  private build(c: AudioContext, out: AudioNode): void {
    this.bus = c.createGain();
    this.bus.connect(out);
    this.fight = c.createGain();
    this.fight.gain.value = 0.0001;
    this.fight.connect(this.bus);
    // A hall's reverb, made from decaying noise.
    this.reverb = c.createConvolver();
    const len = Math.floor(c.sampleRate * 2.8), ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6;
    }
    this.reverb.buffer = ir;
    this.reverb.connect(this.bus);
  }
}
