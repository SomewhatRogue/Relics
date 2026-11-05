/**
 * A job's weather (Kyle, 2026-11-04): one sky for the whole job, CLEAR, RAIN, FOG or STORM, from its
 * seed and fitting its country (fog on the fen and the river, rain over fields and wood, storms rarer,
 * more fog at night), shown on the board and changing room to room only the way weather does: rain all
 * the way; a storm that builds and breaks over one room, lightning in every room of it; fog that creeps
 * in a little more each room and is never suddenly thick. Underground there's none. It's a rule as well
 * as paint: each room's theme carries `sky` (shared/sky.ts says what it changes), and its rain, storm
 * and fog for drawing (client/weather.ts, the fog through the lighting pass).
 */
import type { Theme } from './arena.js';
import type { Job, PlaceKind } from './jobs.js';
import { Rng } from './rng.js';
import { routeOf } from './route.js';
import type { Sky } from './sky.js';
import { timeOf } from './timeofday.js';

export type Pattern = Sky;
export interface Weather { rain: number; storm: number; fog: number }

/** How likely each sky is, by the country: fog lies on the fen and the river, rain on fields and wood, storms rarer. */
const ODDS: Record<'wet' | 'wood' | 'open', [Pattern, number][]> = {
  wet: [['fog', 0.45], ['rain', 0.2], ['clear', 0.25], ['storm', 0.1]],
  wood: [['rain', 0.35], ['fog', 0.2], ['clear', 0.35], ['storm', 0.1]],
  open: [['rain', 0.3], ['clear', 0.45], ['fog', 0.12], ['storm', 0.13]],
};
/** At night this much more fog, out of the clear. */
const NIGHT_FOG = 0.12;
const country = (k: PlaceKind) => (k === 'marsh' || k === 'river' ? 'wet' : k === 'forest' ? 'wood' : 'open');

/** The job's sky, and the room its storm breaks over (or its fog starts thinnest). */
export function patternOf(job: Job): { pattern: Pattern; peak: number; start: number } {
  const night = timeOf(job) === 'night', rng = new Rng(job.seed * 4421 + 17);
  const odds = ODDS[country(job.place.kind)].map(([p, w]): [Pattern, number] => [p, night ? (p === 'fog' ? w + NIGHT_FOG : p === 'clear' ? w - NIGHT_FOG : w) : w]);
  let r = rng.next(), pattern: Pattern = 'clear';
  for (const [p, w] of odds) if ((r -= w) < 0) {
    pattern = p;
    break;
  }
  return { pattern, peak: job.rooms > 2 ? 1 + rng.int(job.rooms - 2) : rng.int(job.rooms), start: rng.range(0.05, 0.2) };
}

/** The sky the board shows for a job (and an expedition sets out under). */
export const skyOfJob = (job: Job): Sky => patternOf(job).pattern;

/** A storm by distance from the room it breaks over: the rain and the lightning, never quite gone from a storm job. */
const STORM_AT = [1, 0.6, 0.35], STORM_LEAST = 0.3;

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
      : pattern === 'rain' ? { rain: Math.round((0.32 + (i % 2) * 0.06) * k.rain * 100) / 100, storm: 0, fog: 0 }
      : pattern === 'storm' ? { rain: Math.round(((STORM_AT[d] ?? STORM_LEAST) * k.rain) * 100) / 100, storm: STORM_AT[d] ?? STORM_LEAST, fog: 0 }
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
  if (pattern === 'rain') return { rain: 0.32 + (index % 2) * 0.06, storm: 0, fog: 0 };
  if (pattern === 'storm') return { rain: STORM_AT[d] ?? STORM_LEAST, storm: STORM_AT[d] ?? STORM_LEAST, fog: 0 };
  // Fog comes in by steps of no more than 0.18 a room.
  if (pattern === 'fog') return { rain: 0, storm: 0, fog: Math.min(0.85, start + index * 0.18) };
  return { rain: 0, storm: 0, fog: 0 };
}

/** The room's theme with its weather on it: the sky as a rule, rain and storm as they are, fog as the mist too (never less than the hour's). */
export function weatherAt(job: Job, index: number, theme: Theme): Theme {
  const w = weatherIn(job, index);
  if (!w.rain && !w.fog) return theme;
  const sky: Sky = w.storm ? 'storm' : w.rain ? 'rain' : 'fog';
  return { ...theme, mist: Math.max(theme.mist ?? 0, w.fog * 2.4), rain: w.rain || undefined, storm: w.storm || undefined, fog: w.fog || undefined, sky };
}
