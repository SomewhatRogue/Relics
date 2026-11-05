/**
 * The wand's storm stream, heard: a sustained crackle while it's on (filtered noise and a low buzz under
 * it, with snaps scattered over the top), a step higher in pitch and louder at each step of build, with a
 * sharp rising zip as a tap adds one, quieter the further off it is. One voice, for the nearest stream within earshot; it fades out when the stream goes off.
 * Reads the hero's `stream` each frame (sim/stream.ts decides it). Cosmetic, so Math.random.
 */
import type { ArenaRoom } from '../sim/room';
import type { Hero } from '../sim/types';
import { burst, noise, sfxOut, tone } from './sfx';
import { streamsOn } from './streamdraw';

/** How far off a stream is still heard, in tiles. */
const EAR = 14;

let voice: { src: AudioBufferSourceNode; band: BiquadFilterNode; buzz: OscillatorNode; gain: GainNode } | null = null;
let snapAt = 0;
/** The step last heard, and for which hero, so a step up is heard once. */
let heard = { id: '', step: 0 };

function start(ac: AudioContext, out: AudioNode): NonNullable<typeof voice> {
  const src = noise(4), band = ac.createBiquadFilter(), buzz = ac.createOscillator(), buzzGain = ac.createGain(), gain = ac.createGain();
  band.type = 'bandpass';
  band.Q.value = 3;
  buzz.type = 'sawtooth';
  buzzGain.gain.value = 0.12;
  gain.gain.value = 0.0001;
  src.connect(band).connect(gain);
  buzz.connect(buzzGain).connect(gain);
  gain.connect(out);
  src.start();
  buzz.start();
  return { src, band, buzz, gain };
}

function stop(ac: AudioContext): void {
  if (!voice) return;
  const v = voice, t = ac.currentTime;
  voice = null;
  v.gain.gain.setTargetAtTime(0.0001, t, 0.04);
  v.src.stop(t + 0.3);
  v.buzz.stop(t + 0.3);
}

/** Each frame: the nearest stream to `me`, heard at its build. */
export function streamSound(room: ArenaRoom, me: Hero | undefined, now: number): void {
  const io = sfxOut();
  if (!io) return;
  let best: { h: Hero; k: number; near: number; held: boolean } | null = null;
  for (const { h, e, k } of streamsOn(room)) {
    const near = me ? 1 - Math.hypot(h.x - me.x, h.y - me.y) / EAR : 1;
    if (near > 0 && (!best || near > best.near)) best = { h, k, near, held: !!e };
  }
  if (!best) return (heard = { id: '', step: 0 }), stop(io.ac);
  voice ??= start(io.ac, io.out);
  const t = io.ac.currentTime, { h, k, near, held } = best, step = h.stream?.step ?? 1;
  // A step up: a quick rising zip over the top, higher at each step.
  if (heard.id === h.id && step > heard.step) {
    const f = 1400 + 900 * step;
    tone('sawtooth', f * 0.5, f, 0.05 * near, 0.09), burst('highpass', f * 1.5, f * 3, 4, 0.18 * near, 0.05);
  }
  heard = { id: h.id, step };
  // A step higher with each: the crackle's band climbs, the buzz under it too, and it grows louder.
  voice.band.frequency.setTargetAtTime(1200 + 2600 * k, t, 0.05);
  voice.buzz.frequency.setTargetAtTime(70 + 150 * k, t, 0.05);
  voice.gain.gain.setTargetAtTime(Math.max(0.0001, (held ? 0.14 + 0.18 * k : 0.07 + 0.05 * k) * near), t, 0.03);
  // Snaps over the top, quicker as it builds.
  if (now >= snapAt) {
    const f = 2600 + 3000 * k + Math.random() * 1500;
    burst('highpass', f, f * 1.3, 5, (0.1 + 0.12 * k) * near, 0.01 + Math.random() * 0.012);
    snapAt = now + 0.05 + Math.random() * (0.12 - 0.06 * k);
  }
}
