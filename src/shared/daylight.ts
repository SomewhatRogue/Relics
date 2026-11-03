/**
 * Wickhold's day: one shared clock for everyone (the same hour on every screen, from the real time),
 * a full day and night every DAY_MINUTES. Dawn, a long grey day, dusk, and night, when the braziers
 * and lanterns do the work. Only the town follows it; jobs keep their own (night jobs are night).
 */
import type { Theme } from './arena.js';

export const DAY_MINUTES = 40;
const NIGHT: Theme['ambient'] = [0.27, 0.25, 0.33];
const NOON: Theme['ambient'] = [0.86, 0.83, 0.76];
const DUSK: Theme['ambient'] = [0.62, 0.42, 0.4];
/** How much a fire's pool of light fades under the noon sun (a job's day hour: timeofday.ts torch 0.35). */
const SUN_DIMS = 0.65;

/** Where in the day it is: 0 midnight, 0.25 dawn, 0.5 noon, 0.75 dusk. */
export const dayPhase = (ms: number) => (ms / 60000 / DAY_MINUTES) % 1;

/** How light it is (0 night, 1 full day) at a point in the day. */
export function daylight(phase: number): number {
  const sun = Math.sin((phase - 0.25) * Math.PI * 2);
  return Math.max(0, Math.min(1, sun * 1.6 + 0.25));
}

const mix = (a: number[], b: number[], k: number) => a.map((v, i) => v + (b[i] - v) * k) as Theme['ambient'];

/** The town's light at a point in the day: night's, warming through dusk and dawn, to day's. */
export function townLight(base: Theme, phase: number): Theme {
  const d = daylight(phase), edge = 1 - Math.abs(d - 0.5) * 2;
  const ambient = mix(mix(NIGHT, NOON, d), DUSK, Math.max(0, edge) * 0.35);
  return { ...base, ambient, moon: base.moon * (1 - d), day: d > 0.65, dayAt: phase, torch: 1 - SUN_DIMS * d };
}
