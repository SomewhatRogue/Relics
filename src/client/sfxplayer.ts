/**
 * Plays the recorded sound effects (sfxbank.ts). A sound's takes are fetched and decoded the first
 * time it is needed, then the rest of the bank warms up behind it, two at a time. Each play picks a
 * take at random (not the one just heard) with a little pitch and level wobble so a sound heard fifty
 * times a fight doesn't grate. `play` says false while a sound is still loading, or if it failed to
 * load, and the caller makes its synthesized sound instead. Cosmetic, so Math.random.
 */
import { SFX_BANK, sfxFiles, sfxGain, type SfxName } from './sfxbank';

/** A bank of recorded sounds: their names, each one's files in take order, and its level. */
export interface Bank<N extends string> {
  names: readonly N[];
  files: (name: N) => string[];
  gain: (name: N) => number;
}
const SFX: Bank<SfxName> = { names: Object.keys(SFX_BANK) as SfxName[], files: sfxFiles, gain: sfxGain };

export interface SfxIO {
  ac: BaseAudioContext;
  /** The effects bus (the master gain: mute and volume live there). */
  out: AudioNode;
}

export interface PlayOpts {
  /** Level, on top of the bank's own (1 is as made). */
  vol?: number;
  /** Playback rate (pitch and speed together). */
  rate?: number;
  /** A given take (0 is _1) instead of a random one. */
  take?: number;
  /** Play only the last this-many seconds (a click at the end of a crank). */
  tail?: number;
  /** False for no pitch and level wobble. */
  vary?: boolean;
}

interface Entry {
  state: 'loading' | 'ready' | 'failed';
  bufs: AudioBuffer[];
  done: Promise<void>;
}

export function createSfxPlayer(io: () => SfxIO | null, bytes: (file: string) => Promise<ArrayBuffer>, rand: () => number = Math.random) {
  return createSamplePlayer(SFX, io, bytes, rand, true);
}

/**
 * A player for any bank. `warmAll`: after the first sound, load the whole bank behind it (the sound
 * effects); otherwise each sound loads only when asked for (the voices, too many to hold decoded).
 */
export function createSamplePlayer<N extends string>(def: Bank<N>, io: () => SfxIO | null, bytes: (file: string) => Promise<ArrayBuffer>, rand: () => number = Math.random, warmAll = false) {
  const bank = new Map<N, Entry>(), last = new Map<N, number>();
  let warming = false;

  /** Fetch and decode one sound's takes (once). Takes that fail are dropped; none at all and it stays synthesized. */
  function load(name: N, ac: BaseAudioContext): Promise<void> {
    const have = bank.get(name);
    if (have) return have.done;
    const e: Entry = { state: 'loading', bufs: [], done: Promise.resolve() };
    const decode = (f: string) => bytes(f).then((b) => ac.decodeAudioData(b));
    e.done = Promise.allSettled(def.files(name).map(decode)).then((rs) => {
      e.bufs = rs.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
      e.state = e.bufs.length ? 'ready' : 'failed';
    });
    bank.set(name, e);
    return e.done;
  }

  /** After the first sound asked for, load the rest quietly so they're ready when they come up. */
  function warm(ac: BaseAudioContext): void {
    if (warming || !warmAll) return;
    warming = true;
    const queue = [...def.names];
    const next = (): Promise<void> => {
      const n = queue.shift();
      return n ? load(n, ac).then(next) : Promise.resolve();
    };
    void next();
    void next();
  }

  /** A loaded take of `name`, or null (and its loading started). */
  function buffer(name: N, take?: number): AudioBuffer | null {
    const x = io();
    if (!x) return null;
    const e = bank.get(name);
    if (!e) void load(name, x.ac);
    warm(x.ac);
    if (!e || e.state !== 'ready') return null;
    const n = e.bufs.length;
    if (take !== undefined) return e.bufs[Math.min(take, n - 1)];
    let i = Math.floor(rand() * n);
    if (n > 1 && i === last.get(name)) i = (i + 1) % n;
    last.set(name, i);
    return e.bufs[i];
  }

  /** Play one take now: its length in seconds, or 0 if it isn't ready (the caller falls back). */
  function start(name: N, o: PlayOpts = {}, out?: AudioNode): number {
    const buf = buffer(name, o.take), x = io();
    if (!buf || !x) return 0;
    const { ac, out: bus } = x, src = ac.createBufferSource(), g = ac.createGain(), vary = o.vary !== false;
    src.buffer = buf;
    src.playbackRate.value = (o.rate ?? 1) * (vary ? 0.96 + rand() * 0.08 : 1);
    g.gain.value = def.gain(name) * (o.vol ?? 1) * (vary ? 0.88 + rand() * 0.12 : 1);
    src.connect(g).connect(out ?? bus);
    const from = o.tail ? Math.max(0, buf.duration - o.tail) : 0;
    src.start(ac.currentTime, from);
    return (buf.duration - from) / src.playbackRate.value;
  }
  /** Play one take now. False if it isn't ready (the caller plays its synth sound instead). */
  const play = (name: N, o: PlayOpts = {}) => start(name, o) > 0;

  const state = (name: N) => bank.get(name)?.state ?? 'unloaded';
  return { play, start, buffer, load: (name: N) => (io() ? load(name, io()!.ac) : Promise.resolve()), state };
}
