/**
 * How a new sort of the hungry bleeds in (the biome proposal: "staged in its own scene first; rare the
 * next week; common a chapter later"). A template with a `debut` is, by the job's day:
 * - **staged**: never in a pack, only in its way's scene (its home region's room for that fork way);
 * - **rare**: weight `debut.weight`, in its home region only, and in one room of a job at most;
 * - **common**: the template's own weight, anywhere it fits.
 * The day is the board's (one finished job on the shared world's clock: WorldState.day), read off the
 * job's id. Jobs without one (the story mission, an old save) count as staged. Pure, no dice.
 */
import type { Job } from './jobs.js';
import type { WayKind } from './ways.js';
import type { Template } from './encounters.js';
import { TEMPLATES } from './encounters.js';
import type { Lay } from './vignettes.js';
import { stageChalker } from './chalkstage.js';

export interface Debut {
  /** The fork way whose room stages it first. */
  staged: WayKind;
  /** Its home region: staged and rare only here. */
  home: string;
  /** Its debut day; rare from `from + rare`, common from `from + common` (board days). */
  from: number;
  rare: number;
  common: number;
  /** Its weight while rare. */
  weight: number;
}

export type Stage = 'staged' | 'rare' | 'common';

/** The board day a job was posted on (`d12-0` is day 12), or null. */
export function jobDay(job: Job): number | null {
  const m = /^d(\d+)-/.exec(job.id);
  return m ? Number(m[1]) : null;
}

export function stageOf(d: Debut, day: number | null): Stage {
  if (day === null || day < d.from + d.rare) return 'staged';
  return day < d.from + d.common ? 'rare' : 'common';
}

/** The one room of a job a rare sort may turn up in (room 2 on). */
export const rareRoom = (job: Job) => 1 + (job.seed % Math.max(1, job.rooms - 1));

/** A template's weight in room `index` of `job` (0: not here). */
export function weightIn(t: Template, job: Job, index: number): number {
  const d = t.debut;
  if (!d) return t.weight;
  const s = stageOf(d, jobDay(job));
  if (s === 'common') return t.weight;
  if (s === 'staged' || job.place.region !== d.home || index !== rareRoom(job)) return 0;
  return d.weight;
}

/** How each staged sort is put into its way's scene. */
const STAGERS: Record<string, (l: Lay) => void> = { chalk: stageChalker };

/** A layout-4 room reached by fork way `way`: each sort staged there, in its home region. */
export function stageDebuts(l: Lay, job: Job, way: WayKind): void {
  for (const t of TEMPLATES) if (t.debut?.staged === way && t.debut.home === job.place.region) STAGERS[t.id]?.(l);
}
