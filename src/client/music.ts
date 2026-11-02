/**
 * Music, played live from recorded instruments (sampler.ts, fetched once sound is unlocked; the
 * synthesized ones stand in until then). Each kind of place has three pieces (scores.ts), written a
 * bar at a time through a shared reverb (track.ts). Moving to another place crossfades. Under it all
 * a fight layer (timpani, a bass drum, driving low strings) rises when goblins come for you and falls
 * away when they're dead; a boss gets its own music, announced by a drum, a gong and a low horn.
 */
import { play } from './orchestra';
import { loadSamples } from './sampler';
import { SCORES, type Area, type Score } from './scores';
import { audioOut } from './sfx';
import { Track } from './track';

const AHEAD = 0.6, FADE = 2.5;

export interface Rig {
  bus: GainNode;
  fight: GainNode;
  reverb: ConvolverNode;
}

/** The bus a piece plays into: a level, a fight fader, a hall's reverb (decaying noise), and a gentle
 * compressor so a boss's drums and a gong never clip. */
export function buildRig(c: BaseAudioContext, out: AudioNode): Rig {
  const bus = c.createGain(), fight = c.createGain(), reverb = c.createConvolver(), comp = c.createDynamicsCompressor(), trim = c.createGain();
  comp.threshold.value = -14;
  comp.knee.value = 8;
  comp.ratio.value = 4;
  comp.attack.value = 0.01;
  comp.release.value = 0.3;
  trim.gain.value = 0.57; // the compressor adds its own makeup gain (about 5 dB); take it back off
  bus.connect(comp).connect(trim).connect(out);
  fight.gain.value = 0.0001;
  fight.connect(bus);
  const len = Math.floor(c.sampleRate * 3.2), ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    let lp = 0;
    // Darker as it dies away, like stone.
    for (let i = 0; i < len; i++) (lp += (Math.random() * 2 - 1 - lp) * (0.9 - 0.7 * (i / len))), (d[i] = lp * (1 - i / len) ** 2.4);
  }
  reverb.buffer = ir;
  reverb.connect(bus);
  return { bus, fight, reverb };
}

/** Into a boss fight: a bass drum, a gong and a low horn, so the change can't be missed. */
export function sting(c: BaseAudioContext, out: AudioNode, t: number): void {
  play(c, out, 'bassdrum', t, 36, 1, 1);
  play(c, out, 'timp', t + 0.01, 38, 1, 1);
  play(c, out, 'gong', t + 0.03, 50, 4, 0.8);
  play(c, out, 'horn', t + 0.06, 38, 2.4, 1);
  play(c, out, 'tuba', t + 0.06, 26, 2.4, 0.9);
}

export class Music {
  private track: Track | null = null;
  private rig: Rig | null = null;
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
    if (!this.rig) (this.rig = buildRig(c, a.music)), void loadSamples(c);
    const r = this.rig;
    if (this.track?.key !== this.wantKey) {
      const boss = this.wantKey.startsWith('boss:') && !!this.track && !this.track.key.startsWith('boss:');
      if (boss) sting(c, r.bus, c.currentTime + 0.02);
      this.track?.fadeOut(boss ? 0.5 : FADE);
      this.track = new Track(c, this.want, this.wantKey, r.bus, r.reverb, r.fight, () => this.danger, boss ? 0.3 : FADE);
    }
    r.fight.gain.setTargetAtTime(0.0001 + this.danger * this.track.fightLevel, c.currentTime, 0.8);
    this.track.fill(c.currentTime + AHEAD);
  }
}
