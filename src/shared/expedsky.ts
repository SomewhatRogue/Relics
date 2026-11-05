/**
 * The Barrowfields' weather (Kyle, 2026-11-04): the expedition sets out under its posting's sky
 * (shared/weather.ts skyOfJob) and, more often than not, it turns once partway through: clear to rain,
 * rain to a storm, or the fog lifting. A storm stays a storm. When and whether come from the job's seed
 * on a stream of their own, so every screen in the party has the same; the room makes the turn
 * (sim/exped.ts) and a friend's screen follows it from the expedition's state (`wx`).
 */
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import { skyTheme, type Sky } from './sky.js';
import { skyOfJob } from './weather.js';
import type { Theme } from './arena.js';

/** How likely a turn is, and the window it comes in (seconds in: the expedition runs about 20 minutes). */
export const SKY_TURNS = { chance: 0.6, after: [240, 600] as [number, number] };
const NEXT: Partial<Record<Sky, Sky>> = { clear: 'rain', rain: 'storm', fog: 'clear' };

/** The expedition's sky: what it starts as, and what it turns to at `at` (none: it holds). `done` once turned. */
export interface ExpedSky { from: Sky; to?: Sky; at?: number; done?: boolean }

export function expedSky(job: Job): ExpedSky {
  const from = skyOfJob(job), rng = new Rng(job.seed * 733 + 5), to = NEXT[from], go = rng.next() < SKY_TURNS.chance, at = Math.round(rng.range(...SKY_TURNS.after));
  return to && go ? { from, to, at } : { from };
}

/** The sky now (the room's clock). */
export const skyNow = (x: ExpedSky, t: number): Sky => (x.to && x.at !== undefined && t >= x.at ? x.to : x.from);

/** The map's theme under the sky as it stands: the same call on the leader's screen and a friend's. */
export function themeUnder(theme: Theme, x: ExpedSky | undefined, t: number): Theme {
  if (!x) return theme;
  const sky = skyNow(x, t);
  return (theme.sky ?? 'clear') === sky ? theme : skyTheme(theme, sky);
}
