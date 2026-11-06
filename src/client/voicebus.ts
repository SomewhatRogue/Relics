/**
 * The voices' own bus, under the effects bus (so SOUND silences them too), with its own switch:
 * VOICES in the options box, remembered on this device. Off, nothing recorded is said and the
 * townsfolk's typed lines keep their blips.
 */
import { sfxOut } from './sfx';
import type { SfxIO } from './sfxplayer';

const LEVEL = 0.85;
let on = true;
try {
  on = localStorage.getItem('relic.voices') !== '0';
} catch {
  /* no storage */
}
let bus: GainNode | null = null;
let busOf: BaseAudioContext | null = null;

export const voicesOn = () => on;
export function setVoices(v: boolean): void {
  on = v;
  if (bus) bus.gain.value = v ? LEVEL : 0;
  try {
    localStorage.setItem('relic.voices', v ? '1' : '0');
  } catch {
    /* this session only */
  }
}

/** The context and the voices' bus, once sound is unlocked and if voices are on; null otherwise. */
export function voiceOut(): SfxIO | null {
  const o = sfxOut();
  if (!o || !on) return null;
  if (!bus || busOf !== o.ac) {
    bus = o.ac.createGain();
    bus.gain.value = LEVEL;
    bus.connect(o.out);
    busOf = o.ac;
  }
  return { ac: o.ac, out: bus };
}
