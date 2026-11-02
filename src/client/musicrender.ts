/**
 * For listening without playing: renders a stretch of a piece offline, the way the game would play
 * it (the fight layer at `danger`, the boss sting first if asked). `synth` renders it with the
 * synthesized instruments, before any recorded note has loaded; `only` keeps just those instruments. Used by scripts/listen.cjs.
 */
import { buildRig, sting } from './music';
import { loadSamples } from './sampler';
import { SCORES, type Area } from './scores';
import { Track } from './track';

export async function renderMusic(area: Area, version: number, danger: number, seconds: number, opts: { sting?: boolean; synth?: boolean; only?: string[] } = {}): Promise<AudioBuffer> {
  const c = new OfflineAudioContext(2, Math.ceil(seconds * 44100), 44100), whole = SCORES[area][version];
  const s = opts.only ? { ...whole, parts: whole.parts.filter((p) => opts.only!.includes(p.ins)) } : whole;
  if (!opts.synth) await loadSamples(c);
  const rig = buildRig(c, c.destination);
  if (opts.sting) sting(c, rig.bus, 0.02);
  const track = new Track(c, s, area + ':' + s.name, rig.bus, rig.reverb, rig.fight, () => danger, opts.sting ? 0.3 : 0.05);
  rig.fight.gain.value = 0.0001 + danger * track.fightLevel;
  track.fill(seconds);
  return c.startRendering();
}
