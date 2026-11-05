/**
 * What the way taken at a layout-4 fork paid (shared/ways.ts): a share more (or less) of the job's pay,
 * and for a rescue way a share more for each one brought out of its room alive; pieces of treasure more.
 * Worked out from the job and the roads taken (the run every friend follows has both), so every player's
 * game pays the same and the recap says why.
 */
import type { Job } from './jobs.js';
import { routeOf } from './route.js';
import { WAYS, type WayKind } from './ways.js';

export interface WayGot { way: WayKind; index: number; saved: number; pay: number; treasure: number }

/** The way taken at the job's fork and the room it led into, or null (no fork, not taken yet, an older job). */
export function wayTaken(job: Job, roads: Record<number, string>): { way: WayKind; index: number } | null {
  if (job.layout !== 4) return null;
  const r = routeOf(job, 'h'), f = r.findIndex((x) => (x.outs?.length ?? 0) === 2), road = f >= 0 ? roads[f + 1] : undefined;
  const way = road ? r[f].outs!.find((o) => o.road === road)?.way : undefined;
  return way ? { way, index: f + 1 } : null;
}

/** What it paid: `saved`, the freed brought out of each room. */
export function wayGot(job: Job, roads: Record<number, string>, saved: Record<number, number> = {}): WayGot | null {
  const t = wayTaken(job, roads);
  if (!t) return null;
  const w = WAYS[t.way], n = saved[t.index] ?? 0;
  return { ...t, saved: n, pay: w.pay + (w.perSaved ?? 0) * n, treasure: w.treasure };
}

/** The recap's line for it: "DRUMS: +25% pay, +1 treasure", "SMOKE: 1 saved, +15% pay", "QUIET: -20% pay". */
export function wayLine(g: WayGot): string {
  const w = WAYS[g.way], pct = Math.round(g.pay * 100), parts: string[] = [];
  if (w.perSaved !== undefined) parts.push(`${g.saved} saved`);
  if (pct) parts.push(`${pct > 0 ? '+' : ''}${pct}% pay`);
  if (g.treasure) parts.push(`+${g.treasure} treasure`);
  return `${w.word}: ${parts.join(', ') || 'nothing more'}`;
}
