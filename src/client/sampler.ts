/**
 * The recorded notes: fetched and decoded once sound is unlocked (a few at a time, the most used
 * first), then played by pitch-shifting the nearest recorded note. Held sounds loop between the
 * points in samplemap.ts; every note gets an attack and a release. Until an instrument has all its
 * notes (or if they fail to load) `ready` says no and the music plays the synthesized ones instead.
 */
import { SAMPLES, type SampleId, type SampleNote } from './samplemap';
import { sampleBytes } from './samplesrc';

const buffers = new Map<string, AudioBuffer>();
const done = new Set<SampleId>();
let loading: Promise<void> | null = null;

/** The order to fetch in: what most places play first, the boss's drums and choir last. */
const ORDER: SampleId[] = ['strings-p', 'harp', 'flute', 'oohs', 'pizz', 'organ', 'choir', 'strings-f', 'horn', 'chimes', 'glock', 'frame', 'tuba', 'spic', 'timp', 'bassdrum', 'gong'];

/** Start fetching (once). Resolves when every instrument has loaded or failed. */
export function loadSamples(c: BaseAudioContext): Promise<void> {
  if (loading) return loading;
  const queue = ORDER.flatMap((id) => SAMPLES[id].map((n) => [id, n] as const));
  const left = new Map<SampleId, number>(ORDER.map((id) => [id, SAMPLES[id].length]));
  const worker = async (): Promise<void> => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      const [id, n] = job;
      try {
        buffers.set(n.file, await c.decodeAudioData(await sampleBytes(n.file)));
        left.set(id, left.get(id)! - 1);
        if (left.get(id) === 0) done.add(id);
      } catch {
        left.set(id, -1); // one missing note and the whole instrument stays synthesized
      }
    }
  };
  loading = Promise.all([worker(), worker(), worker(), worker()]).then(() => undefined);
  return loading;
}

export const sampleReady = (id: SampleId) => done.has(id);

export interface Envelope {
  attack: number;
  release: number;
  /** Let a struck note ring its own length instead of stopping at `dur`. */
  ring?: boolean;
}

function nearest(id: SampleId, m: number): SampleNote {
  let best: SampleNote = SAMPLES[id][0];
  for (const n of SAMPLES[id]) if (Math.abs(n.root - m) < Math.abs(best.root - m)) best = n;
  return best;
}

/** One note of a loaded instrument. */
export function playSample(c: BaseAudioContext, out: AudioNode, id: SampleId, t: number, m: number, dur: number, vel: number, env: Envelope): void {
  const n = nearest(id, m), buf = buffers.get(n.file);
  if (!buf) return;
  const src = c.createBufferSource(), g = c.createGain(), rate = 2 ** ((m - n.root) / 12), peak = n.gain * vel;
  src.buffer = buf;
  src.playbackRate.value = rate;
  if (n.loop) {
    src.loop = true;
    src.loopStart = n.loop[0];
    src.loopEnd = n.loop[1];
  }
  const natural = buf.duration / rate;
  src.connect(g).connect(out);
  src.start(t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + env.attack);
  if (!n.loop && env.ring) src.stop(t + natural + 0.05);
  else {
    // Held to `dur` (a struck note no longer than it rings), then let go.
    const off = t + Math.max(env.attack, n.loop ? dur : Math.min(dur, natural));
    g.gain.setValueAtTime(peak, off);
    g.gain.setTargetAtTime(0, off, env.release / 4);
    src.stop(off + env.release + 0.05);
  }
}
