/**
 * The synthesized instruments: a lute, a harp, a wooden flute, a low drone, a soft string pad, a
 * church organ, a bell, a war horn, and frame drums and toms. The music plays on these until the
 * recorded instruments (sampler.ts) have loaded, or if they never do. Each plays one note at time `t`
 * into `out`.
 */
export type Play = (c: BaseAudioContext, out: AudioNode, t: number, midi: number, dur: number, vel: number) => void;

export const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12);

function amp(c: BaseAudioContext, out: AudioNode, t: number, attack: number, peak: number, hold: number, release: number): GainNode {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  g.gain.setValueAtTime(Math.max(0.0002, peak), t + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
  g.connect(out);
  return g;
}
function osc(c: BaseAudioContext, type: OscillatorType, f: number, t: number, end: number, detune = 0): OscillatorNode {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.value = f;
  o.detune.value = detune;
  o.start(t);
  o.stop(end + 0.05);
  return o;
}
function lp(c: BaseAudioContext, f: number, q = 0.7, to?: AudioNode): BiquadFilterNode {
  const b = c.createBiquadFilter();
  b.type = 'lowpass';
  b.frequency.value = f;
  b.Q.value = q;
  if (to) b.connect(to);
  return b;
}

/** A plucked lute: bright at the pluck, darkening as it rings. */
export const lute: Play = (c, out, t, m, dur, v) => {
  const f = mtof(m), ring = Math.min(1.6, dur + 0.6), g = amp(c, out, t, 0.004, 0.22 * v, 0, ring), fl = lp(c, f * 6, 1.2, g);
  fl.frequency.setValueAtTime(f * 8, t);
  fl.frequency.exponentialRampToValueAtTime(f * 1.5, t + ring);
  osc(c, 'sawtooth', f, t, t + ring).connect(fl);
  osc(c, 'triangle', f * 2, t, t + ring, 4).connect(fl);
};

/** A harp: rounder, longer. */
export const harp: Play = (c, out, t, m, dur, v) => {
  const f = mtof(m), ring = Math.min(2.4, dur + 1.2), g = amp(c, out, t, 0.006, 0.2 * v, 0, ring);
  osc(c, 'triangle', f, t, t + ring).connect(g);
  const h = amp(c, out, t, 0.004, 0.05 * v, 0, ring * 0.4);
  osc(c, 'sine', f * 3, t, t + ring).connect(h);
};

/** A wooden flute: breathy, a slow vibrato that comes in late. */
export const flute: Play = (c, out, t, m, dur, v) => {
  const f = mtof(m), g = amp(c, out, t, 0.08, 0.13 * v, Math.max(0, dur - 0.15), 0.18), o = osc(c, 'sine', f, t, t + dur + 0.25);
  const lfo = osc(c, 'sine', 5.2, t, t + dur + 0.25), depth = c.createGain();
  depth.gain.setValueAtTime(0, t);
  depth.gain.linearRampToValueAtTime(f * 0.006, t + Math.min(0.6, dur));
  lfo.connect(depth).connect(o.frequency);
  o.connect(g);
  const n = c.createBufferSource(), nb = c.createBuffer(1, Math.ceil(c.sampleRate * (dur + 0.3)), c.sampleRate), d = nb.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  n.buffer = nb;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = f * 2;
  bp.Q.value = 3;
  n.connect(bp).connect(amp(c, out, t, 0.05, 0.03 * v, Math.max(0, dur - 0.1), 0.15));
  n.start(t);
  n.stop(t + dur + 0.3);
};

/** A low drone: two saws, dark, swelling in and out. */
export const drone: Play = (c, out, t, m, dur, v) => {
  const f = mtof(m), g = amp(c, out, t, Math.min(1, dur / 3), 0.12 * v, Math.max(0, dur - Math.min(1, dur / 3) - 0.6), 0.9), fl = lp(c, Math.min(500, f * 4), 0.8, g);
  osc(c, 'sawtooth', f, t, t + dur + 1, -6).connect(fl);
  osc(c, 'sawtooth', f, t, t + dur + 1, 6).connect(fl);
};

/** Strings, softly: a slow-bowed pad. */
export const pad: Play = (c, out, t, m, dur, v) => {
  const f = mtof(m), g = amp(c, out, t, 0.5, 0.05 * v, Math.max(0, dur - 0.5), 0.8), fl = lp(c, 1400, 0.5, g);
  for (const d of [-9, 0, 8]) osc(c, 'sawtooth', f, t, t + dur + 0.9, d).connect(fl);
};

/** A church organ: stacked sines, steady. */
export const organ: Play = (c, out, t, m, dur, v) => {
  const f = mtof(m), g = amp(c, out, t, 0.12, 0.07 * v, Math.max(0, dur - 0.12), 0.35);
  for (const [k, a] of [[1, 1], [2, 0.5], [3, 0.25], [4, 0.18]]) {
    const h = c.createGain();
    h.gain.value = a;
    h.connect(g);
    osc(c, 'sine', f * k, t, t + dur + 0.4).connect(h);
  }
};

/** A small bell, or water dripping in a mine: inharmonic partials, long ring. */
export const bell: Play = (c, out, t, m, dur, v) => {
  const f = mtof(m);
  for (const [k, a, r] of [[1, 0.12, 2.2], [2.76, 0.05, 1.2], [5.4, 0.025, 0.6]]) osc(c, 'sine', f * k, t, t + r).connect(amp(c, out, t, 0.003, a * v, 0, r));
};

/** A war horn: low brass, a slow swell. */
export const horn: Play = (c, out, t, m, dur, v) => {
  const f = mtof(m), g = amp(c, out, t, 0.18, 0.14 * v, Math.max(0, dur - 0.2), 0.3), fl = lp(c, 300, 1, g);
  fl.frequency.setValueAtTime(300, t);
  fl.frequency.linearRampToValueAtTime(1300, t + 0.25);
  osc(c, 'sawtooth', f, t, t + dur + 0.35).connect(fl);
  osc(c, 'sawtooth', f * 1.003, t, t + dur + 0.35).connect(fl);
};

/** A frame drum (`m` high: the rim; low: the skin), and a low tom for the fight. */
export const drum: Play = (c, out, t, m, _dur, v) => {
  const low = m < 50, f = low ? 70 : 180, o = osc(c, 'sine', f * 1.6, t, t + 0.4);
  o.frequency.exponentialRampToValueAtTime(f, t + 0.08);
  o.connect(amp(c, out, t, 0.002, (low ? 0.5 : 0.2) * v, 0, low ? 0.35 : 0.15));
  const n = c.createBufferSource(), nb = c.createBuffer(1, Math.ceil(c.sampleRate * 0.12), c.sampleRate), d = nb.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  n.buffer = nb;
  n.connect(lp(c, low ? 900 : 3500, 0.7, amp(c, out, t, 0.002, (low ? 0.15 : 0.12) * v, 0, 0.1)));
  n.start(t);
};

export const INSTRUMENTS = { lute, harp, flute, drone, pad, organ, bell, horn, drum };
export type InstrumentId = keyof typeof INSTRUMENTS;
