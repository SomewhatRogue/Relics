/**
 * Weather as a rule (Kyle, 2026-11-04): a job's sky is CLEAR, RAIN, FOG or STORM, rolled from its seed
 * (shared/weather.ts) and carried on each room's theme as `sky` (none indoors or underground), so every
 * screen in a party has the same. What it changes, read by the room: rain (and a storm) shortens burns,
 * slows fire jumping and covers your feet; fog shortens how far goblins see and archers reach. Nothing
 * here touches a hero's pace or a shot's flight. Numbers: WEATHER and LIGHTNING in shared/tuning.ts.
 */
import type { Theme } from './arena.js';
import { WEATHER } from './tuning.js';

export type Sky = 'clear' | 'rain' | 'fog' | 'storm';

/** The board's word for each (Kyle's style: one word). */
export const SKY_WORD: Record<Sky, string> = { clear: 'CLEAR', rain: 'RAIN', fog: 'FOG', storm: 'STORM' };

/** The job card's WEATHER row: the word, then what it does. */
export const SKY_ROW: Record<Sky, string> = {
  clear: 'Clear',
  rain: 'Rain: burns are shorter, goblins hear you less',
  fog: 'Fog: goblins and their archers see less far',
  storm: 'Storm: rain, and lightning strikes things in the open',
};

/** Said over your hero when an expedition's weather turns (shared/expedsky.ts): to rain, to a storm, or the fog lifting. */
export const SKY_TURN: Partial<Record<Sky, string>> = {
  clear: 'The fog is lifting. Goblins can see further.',
  rain: 'Rain. Burns are shorter, goblins hear you less.',
  storm: 'Storm. Lightning hits things in the open.',
};

const skyOf = (t: Theme | undefined) => t?.sky ?? 'clear';
/** Raining here (a storm rains too). */
export const wet = (t: Theme | undefined) => skyOf(t) === 'rain' || skyOf(t) === 'storm';
export const fogged = (t: Theme | undefined) => skyOf(t) === 'fog';

/** How long a goblin burns, and a lit slick, as a share of the usual. */
export const burnFor = (t: Theme | undefined) => (wet(t) ? WEATHER.rain.burn : 1);
export const slickFor = (t: Theme | undefined) => (wet(t) ? WEATHER.rain.slick : 1);
/** How far fire jumps between goblins, as a share. */
export const spreadFor = (t: Theme | undefined) => (wet(t) ? WEATHER.rain.spread : 1);
/** How far a goblin notices you, as a share: the rain covers your feet, the fog hides you. */
export const noticeFor = (t: Theme | undefined) => (wet(t) ? WEATHER.rain.hush : 1) * (fogged(t) ? WEATHER.fog.sight : 1);
/** How far an archer or a roof archer reaches, as a share. */
export const reachFor = (t: Theme | undefined) => (fogged(t) ? WEATHER.fog.reach : 1);

/** A whole map under one sky (the expedition's): how hard it rains or how thick the fog lies, for drawing. */
export function skyTheme(theme: Theme, sky: Sky): Theme {
  const t: Theme = { ...theme, rain: undefined, storm: undefined, fog: undefined, sky: undefined };
  if (sky === 'rain') return { ...t, rain: 0.4, sky };
  if (sky === 'storm') return { ...t, rain: 0.9, storm: 1, sky };
  if (sky === 'fog') return { ...t, fog: 0.6, sky };
  return t;
}
