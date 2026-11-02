/**
 * The orchestra the scores write for: recorded instruments (sampler.ts) with how each one swells in
 * and lets go, how loud it sits in the mix, and the synthesized instrument that stands in for it
 * until its notes have loaded (or if they never do), so the music is never silent.
 */
import { INSTRUMENTS, type Play } from './instruments';
import { playSample, sampleReady, type Envelope } from './sampler';
import type { SampleId } from './samplemap';

export type Ins = 'strings' | 'pizz' | 'spic' | 'horn' | 'tuba' | 'harp' | 'flute' | 'organ' | 'choir' | 'oohs' | 'timp' | 'bassdrum' | 'frame' | 'chimes' | 'glock' | 'gong';

interface Voice {
  /** Sample sets, loudest first: the first whose `vel` and `low` the note reaches plays it. */
  layers: { id: SampleId; vel?: number; low?: number }[];
  /** Attack: a share of the note's length, kept between these (seconds). */
  attack: [number, number];
  release: number;
  ring?: boolean;
  mix: number;
  synth: Play;
}

const low: Play = (c, out, t, m, d, v) => INSTRUMENTS.drum(c, out, t, 40, d, v * (m < 45 ? 1 : 0.7));
const pad: Play = (c, out, t, m, d, v) => (m < 45 ? INSTRUMENTS.drone : INSTRUMENTS.pad)(c, out, t, m, d, v);

const V: Record<Ins, Voice> = {
  strings: { layers: [{ id: 'strings-f', vel: 0.75, low: 33 }, { id: 'strings-p' }], attack: [0.08, 0.5], release: 0.9, mix: 0.55, synth: pad },
  pizz: { layers: [{ id: 'pizz' }], attack: [0.002, 0.002], release: 0.2, ring: true, mix: 0.7, synth: INSTRUMENTS.lute },
  spic: { layers: [{ id: 'spic' }], attack: [0.004, 0.004], release: 0.12, mix: 0.55, synth: INSTRUMENTS.lute },
  horn: { layers: [{ id: 'horn' }], attack: [0.06, 0.25], release: 0.45, mix: 0.8, synth: INSTRUMENTS.horn },
  tuba: { layers: [{ id: 'tuba' }], attack: [0.06, 0.2], release: 0.4, mix: 0.5, synth: INSTRUMENTS.horn },
  harp: { layers: [{ id: 'harp' }], attack: [0.002, 0.002], release: 0.4, ring: true, mix: 0.8, synth: INSTRUMENTS.harp },
  flute: { layers: [{ id: 'flute' }], attack: [0.05, 0.16], release: 0.3, mix: 0.7, synth: INSTRUMENTS.flute },
  organ: { layers: [{ id: 'organ' }], attack: [0.06, 0.12], release: 0.5, mix: 0.32, synth: INSTRUMENTS.organ },
  choir: { layers: [{ id: 'choir' }], attack: [0.12, 0.6], release: 1.1, mix: 0.6, synth: INSTRUMENTS.pad },
  oohs: { layers: [{ id: 'oohs' }], attack: [0.15, 0.7], release: 1.2, mix: 0.55, synth: INSTRUMENTS.pad },
  timp: { layers: [{ id: 'timp' }], attack: [0.002, 0.002], release: 0.3, ring: true, mix: 1.3, synth: low },
  bassdrum: { layers: [{ id: 'bassdrum' }], attack: [0.002, 0.002], release: 0.3, ring: true, mix: 0.8, synth: low },
  frame: { layers: [{ id: 'frame' }], attack: [0.002, 0.002], release: 0.2, ring: true, mix: 0.45, synth: INSTRUMENTS.drum },
  chimes: { layers: [{ id: 'chimes' }], attack: [0.002, 0.002], release: 1, ring: true, mix: 0.3, synth: INSTRUMENTS.bell },
  glock: { layers: [{ id: 'glock' }], attack: [0.002, 0.002], release: 0.5, ring: true, mix: 0.25, synth: INSTRUMENTS.bell },
  gong: { layers: [{ id: 'gong' }], attack: [0.002, 0.002], release: 1, ring: true, mix: 0.55, synth: low },
};

/** The drums keep their own pitch unless a part asks (`timp` is tuned to the chord). */
const FIXED: Partial<Record<Ins, number>> = { bassdrum: 36, gong: 50 };

/** One note: recorded if that instrument has loaded, synthesized if not. */
export function play(c: BaseAudioContext, out: AudioNode, ins: Ins, t: number, m: number, dur: number, vel: number): void {
  const v = V[ins], layer = v.layers.find((l) => vel >= (l.vel ?? 0) && m >= (l.low ?? 0) && sampleReady(l.id)) ?? v.layers.find((l) => sampleReady(l.id));
  const note = FIXED[ins] ?? m;
  if (!layer) {
    v.synth(c, out, t, note, dur, vel);
    return;
  }
  const env: Envelope = { attack: Math.min(v.attack[1], Math.max(v.attack[0], dur * 0.25)), release: v.release, ring: v.ring };
  playSample(c, out, layer.id, t, note, dur, vel * v.mix, env);
}
