/**
 * A job's hour: dawn, day, dusk or night (night is still the twist, with its extra pay). The hour sets
 * how a run room is lit, through the same lighting the town uses: the ambient's level and colour, the
 * moon, how much torches, braziers and lanterns matter, dawn's mist and dusk's long shadows. It also
 * sets how far a resting goblin sees (darker, less far) and how far a Healer's censer gives them away.
 * Rolled from the job's own seed on its own stream, so the rest of the board stays what it was.
 */
import type { Theme } from './arena.js';
import type { Job, PlaceKind } from './jobs.js';
import { lampsFor } from './lamps.js';
import { Rng } from './rng.js';

export type Time = 'dawn' | 'day' | 'dusk' | 'night';
/** The one word the board shows. */
export const TIME_WORD: Record<Time, string> = { dawn: 'DAWN', day: 'DAY', dusk: 'DUSK', night: 'NIGHT' };

/**
 * Each hour's light. `ambient`: the open-sky light (scaled by how open the place is); `moon`: the
 * moon pool's share of the place's own; `torch`: how much fires and lanterns count; `mist` (dawn) and
 * `sun` (low sun: shadows stretched east at dusk, west at dawn); `sight`: how far a resting goblin
 * sees, as a share of ALERT.sight; `glow`: how far a lit censer gives you away, as a share.
 */
export const TIMES: Record<Time, { ambient: [number, number, number]; moon: number; torch: number; mist: number; sun: number; sight: number; glow: number }> = {
  dawn: { ambient: [0.5, 0.56, 0.68], moon: 0.3, torch: 0.7, mist: 0.6, sun: -0.6, sight: 0.9, glow: 0.8 },
  day: { ambient: [0.84, 0.82, 0.74], moon: 0, torch: 0.35, mist: 0, sun: 0, sight: 1, glow: 0.5 },
  dusk: { ambient: [0.78, 0.52, 0.38], moon: 0, torch: 0.8, mist: 0, sun: 1, sight: 0.9, glow: 0.85 },
  night: { ambient: [0, 0, 0], moon: 0.5, torch: 1, mist: 0, sun: 0, sight: 0.8, glow: 1 },
};

/** How much open sky a kind of place has (a forest's canopy, a fen's murk). Under the ground, none. */
const OPEN: Record<PlaceKind, number> = { village: 0.97, farm: 1, field: 1, forest: 0.8, mine: 0, river: 0.97, marsh: 0.9, ruins: 0.94 };

/** Out of daylight hours, how many jobs fall at dawn and dusk rather than broad day. */
const EDGES = { dawn: 0.25, dusk: 0.25 };

/** The hour for a job that isn't at night (seeded from the job, on its own stream). */
export function rollTime(seed: number, night: boolean): Time {
  if (night) return 'night';
  const r = new Rng(seed * 389 + 17).next();
  return r < EDGES.dawn ? 'dawn' : r < EDGES.dawn + EDGES.dusk ? 'dusk' : 'day';
}

/** A job's hour (an old job without one: night if it was a night job, else day). */
export const timeOf = (j: Pick<Job, 'twist'> & { time?: Time }): Time => j.time ?? (j.twist === 'night' ? 'night' : 'day');

const mix = (a: number[], b: number[], k: number) => a.map((v, i) => v + (b[i] - v) * k) as Theme['ambient'];

/** A place's own (night-time) theme, lit for the hour. Underground, the hour changes nothing but night. */
export function lightFor(base: Theme, kind: PlaceKind, time: Time): Theme {
  const t = TIMES[time], open = OPEN[kind];
  if (time === 'night') return { ...base, ambient: base.ambient.map((v) => v * 0.65) as Theme['ambient'], moon: base.moon * t.moon, torch: 1, time, sight: t.sight, glow: t.glow };
  if (!open) return { ...base, time, torch: 1, sight: TIMES.night.sight, glow: 1 };
  // The sky's light through the place's own tint (a little of it), as much as the place lets in.
  const sky = mix(base.ambient, t.ambient, open);
  return { ...base, ambient: sky, moon: base.moon * t.moon, day: time === 'day', torch: t.torch, lamps: lampsFor(time), mist: t.mist * open, sun: t.sun, time, sight: t.sight, glow: t.glow };
}

/** How far a resting goblin sees here, and how far a censer gives you away (shares; 1 off a job). */
export const sightIn = (theme: Theme | undefined) => theme?.sight ?? 1;
export const glowIn = (theme: Theme | undefined) => theme?.glow ?? 1;
