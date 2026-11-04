/**
 * A routed job's weather (Kyle, 2026-11-04): one pattern for the whole job, from its seed and fitting
 * its country, that changes room to room only the way weather does. A light drizzle all the way; a
 * thunderstorm that builds, breaks over one room and passes; fog that creeps in a little more each
 * room and is never suddenly thick; or clear. Underground there's none. Paint only: no rule changes
 * with it, so it lives on the theme (rain and the storm drawn by client/weather.ts, fog as the mist).
 */
import type { Theme } from './arena.js';
import type { Job, PlaceKind } from './jobs.js';
import { Rng } from './rng.js';
import { routeOf } from './route.js';

export type Pattern = 'clear' | 'drizzle' | 'storm' | 'fog';
export interface Weather { rain: number; storm: number; fog: number }

/** How likely each pattern is, by the country (fog lies on the fen and the river, storms over open fields). */
const ODDS: Record<'wet' | 'wood' | 'open', [Pattern, number][]> = {
  wet: [['fog', 0.4], ['drizzle', 0.25], ['clear', 0.2], ['storm', 0.15]],
  wood: [['drizzle', 0.3], ['fog', 0.25], ['clear', 0.3], ['storm', 0.15]],
  open: [['clear', 0.4], ['drizzle', 0.25], ['storm', 0.2], ['fog', 0.15]],
};
const country = (k: PlaceKind) => (k === 'marsh' || k === 'river' ? 'wet' : k === 'forest' ? 'wood' : 'open');

/** The job's pattern, and the room its storm breaks over (or its fog starts thinnest). */
export function patternOf(job: Job): { pattern: Pattern; peak: number; start: number } {
  const rng = new Rng(job.seed * 4421 + 17), odds = ODDS[country(job.place.kind)];
  let r = rng.next(), pattern: Pattern = 'clear';
  for (const [p, w] of odds) if ((r -= w) < 0) {
    pattern = p;
    break;
  }
  return { pattern, peak: job.rooms > 2 ? 1 + rng.int(job.rooms - 2) : rng.int(job.rooms), start: rng.range(0.05, 0.2) };
}

/** How each country takes the weather (layout 3): the fen holds its fog, the trees keep off some rain. */
const TAKES: Record<string, { rain: number; fog: number }> = { fen: { rain: 1.1, fog: 1 }, wood: { rain: 0.7, fog: 0.8 }, rock: { rain: 1, fog: 0.55 }, fields: { rain: 1, fog: 0.65 }, village: { rain: 1, fog: 0.6 } };

/**
 * Layout 3: the job's one pattern carried across the countries it crosses, each taking it its own way,
 * and fog never more than a step thicker or thinner than the room before (out of a mine it creeps back).
 */
function weather3(job: Job, index: number): Weather {
  const r = routeOf(job), { pattern, peak, start } = patternOf(job);
  let fog = 0, out: Weather = { rain: 0, storm: 0, fog: 0 };
  for (let i = 0; i <= index; i++) {
    const spec = r[i], under = spec.heart ? job.place.kind === 'mine' : spec.country === 'under' && !spec.from, k = TAKES[spec.country ?? (job.place.kind === 'marsh' || job.place.kind === 'river' ? 'fen' : job.place.kind === 'forest' ? 'wood' : 'fields')] ?? TAKES.fields;
    const want = under || pattern !== 'fog' ? 0 : Math.min(0.85, (start + i * 0.18) * k.fog * 1.3);
    fog = under ? 0 : Math.max(fog - 0.18, Math.min(fog + 0.18, want));
    const d = Math.abs(i - peak);
    out = under ? { rain: 0, storm: 0, fog: 0 }
      : pattern === 'drizzle' ? { rain: Math.round((0.32 + (i % 2) * 0.06) * k.rain * 100) / 100, storm: 0, fog: 0 }
      : pattern === 'storm' ? { rain: Math.round((([1, 0.5, 0.18][d] ?? 0) * k.rain) * 100) / 100, storm: [1, 0.35][d] ?? 0, fog: 0 }
      : { rain: 0, storm: 0, fog: Math.round(fog * 100) / 100 };
  }
  return out;
}

/** The weather in one room of the job (none indoors or underground). */
export function weatherIn(job: Job, index: number): Weather {
  if (job.layout === 3) return weather3(job, index);
  const spec = routeOf(job)[index], under = spec.heart ? job.place.kind === 'mine' : spec.skin === 'under';
  if (under) return { rain: 0, storm: 0, fog: 0 };
  const { pattern, peak, start } = patternOf(job), d = Math.abs(index - peak);
  if (pattern === 'drizzle') return { rain: 0.32 + (index % 2) * 0.06, storm: 0, fog: 0 };
  if (pattern === 'storm') return { rain: [1, 0.5, 0.18][d] ?? 0, storm: [1, 0.35][d] ?? 0, fog: 0 };
  // Fog comes in by steps of no more than 0.18 a room.
  if (pattern === 'fog') return { rain: 0, storm: 0, fog: Math.min(0.85, start + index * 0.18) };
  return { rain: 0, storm: 0, fog: 0 };
}

/** The room's theme with its weather on it: rain and storm as they are, fog as the mist (never less than the hour's). */
export function weatherAt(job: Job, index: number, theme: Theme): Theme {
  const w = weatherIn(job, index);
  if (!w.rain && !w.fog) return theme;
  return { ...theme, mist: Math.max(theme.mist ?? 0, w.fog * 2.4), rain: w.rain || undefined, storm: w.storm || undefined, fog: w.fog || undefined };
}
