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
import { MEATY_ON } from './meaty.js';
import { MEATY2_ON } from './meaty2.js';
import { stagePlanker, stageForker, stageSwingle } from './meatystage.js';
import { stageGorger, stageKegman, stagePouncer } from './meatystage2.js';

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
  /** Staged in a zone of its own instead of a fork way's room (shared/hangwood.ts: 'hangmans'). */
  zone?: string;
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
  if (!switchedOn(t.id)) return 0;
  if (!d) return t.weight;
  const s = stageOf(d, jobDay(job));
  if (s === 'common') return t.weight;
  if (s === 'staged' || job.place.region !== d.home || index !== rareRoom(job)) return 0;
  return d.weight;
}

/** How each staged sort is put into its way's scene. */
const STAGERS: Record<string, (l: Lay) => void> = { chalk: stageChalker, plank: stagePlanker, swing: stageSwingle, fork: stageForker, keg: stageKegman, pounce: stagePouncer, gorge: stageGorger };
/** The new meaty sorts' templates (shared/meaty.ts, meaty2.ts), each three switched off together by MEATY_ON and MEATY2_ON. */
const MEATY_TEMPLATES = new Set(['plank', 'swing', 'fork']);
const MEATY2_TEMPLATES = new Set(['keg', 'pounce', 'gorge']);
const switchedOn = (id: string) => (MEATY_ON.on || !MEATY_TEMPLATES.has(id)) && (MEATY2_ON.on || !MEATY2_TEMPLATES.has(id));

/**
 * A layout-4 room reached by fork way `way`: each sort staged there, in its home region. Of the new meaty
 * sorts a scene shows one at a time (two would crowd a lone hero's screen and the room's caps): the first
 * three's while it's still bleeding in, then, once it's common, the second three's that shares its scene
 * (shared/meaty2.ts: the Kegman after the Planker in DRUMS, the Gorger after the Swingle in SMOKE).
 */
export function stageDebuts(l: Lay, job: Job, way: WayKind): void {
  const here = TEMPLATES.filter((t) => t.debut?.staged === way && t.debut.home === job.place.region && switchedOn(t.id)), day = jobDay(job);
  const newer = here.find((t) => MEATY2_TEMPLATES.has(t.id)), older = here.find((t) => MEATY_TEMPLATES.has(t.id));
  const stillOld = !!older && stageOf(older.debut!, day) !== 'common';
  for (const t of here) {
    if (newer && t === older && !stillOld) continue;
    if (t === newer && stillOld) continue;
    STAGERS[t.id]?.(l);
  }
}
