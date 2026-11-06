/**
 * A routed room's threat budget, its caps and its beats (numbers: shared/threat.ts; the plan: docs/plans/
 * bosses.md section 3). Pure: shared/encounter.ts lays a room out with it, sim/packs.ts scales it for a
 * party, sim/pacing.ts holds packs back under the on-screen caps, and the tests check each.
 */
import type { Beat, Role, Template } from './encounters.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import type { Foe } from './terrain.js';
import { BUDGET, SCREEN, THREAT_TIER, threatOf } from './threat.js';

export const difficultyOf = (job: Job): keyof typeof BUDGET.difficulty =>
  job.deep ? 'deep' : job.place.ruin >= 3 ? 'hard' : job.place.ruin >= 2 ? 'normal' : 'easy';
const party = (n: number) => Math.max(1, Math.min(4, Math.round(n))) - 1;

/** What room `index` of `job` may spend, for a party of `n`. */
export const roomBudget = (job: Job, index: number, n = 1) =>
  BUDGET.room[Math.min(index, BUDGET.room.length - 1)] * BUDGET.difficulty[difficultyOf(job)] * BUDGET.party[party(n)];

/** On screen at once, for a party of `n` in room `index`: threat, meaty ones (heavies too), heavies. */
export const capsFor = (n: number, index = 0) => ({
  threat: SCREEN.threat[party(n)],
  meaty: n <= 1 && index >= 2 ? SCREEN.meaty2 : SCREEN.meaty[party(n)],
  heavy: SCREEN.heavy[party(n)],
});

/** A goblin's weight on the fight: its role's points (a named one counts as a heavy, a plain butcher as one). */
export const foeThreat = (f: { role?: Role; kind?: string; big?: boolean; name?: string; bow?: boolean }) =>
  threatOf(f.role ?? (f.kind === 'butcher' ? 'butcher' : f.bow ? 'archer' : 'fodder'), !!f.big);
export const tierOf = (f: { role?: Role; kind?: string; big?: boolean; bow?: boolean }) =>
  f.big ? 'heavy' : THREAT_TIER[f.role ?? (f.kind === 'butcher' ? 'butcher' : f.bow ? 'archer' : 'fodder')];
export const meaty = (f: Parameters<typeof tierOf>[0]) => tierOf(f) === 'meaty' || tierOf(f) === 'heavy';
export const threatIn = (fs: Foe[]) => fs.reduce((s, f) => s + foeThreat(f), 0);

/** A template's specials: their threat, how many are meaty (heavies too) and how many heavy. */
export function weighOf(t: Template): { threat: number; meaty: number; heavy: number } {
  const roles = [...(t.centre ?? []), ...(t.support ?? [])];
  const big = (i: number) => !!t.big && i === 0;
  return {
    threat: roles.reduce((s, r, i) => s + threatOf(r, big(i)), 0),
    meaty: roles.filter((r, i) => big(i) || THREAT_TIER[r] === 'meaty' || THREAT_TIER[r] === 'heavy').length,
    heavy: roles.filter((r, i) => big(i) || THREAT_TIER[r] === 'heavy').length,
  };
}

/**
 * The beats of a room with `n` fights, from the way in. The first room: a swarm, then a fight. Later
 * rooms end on a closer; a room of two fights opens on a swarm half the time (the splatting is kept,
 * it just no longer fills every room); a room of three opens on one three times in five.
 */
export function beatsFor(n: number, index: number, rng: Rng, big = false): Beat[] {
  if (n <= 0) return [];
  if (index === 0) return (['splat', 'tactic', 'tactic'] as Beat[]).slice(0, n);
  const open: Beat = rng.next() < (n >= 3 ? 0.6 : 0.5) ? 'splat' : 'tactic';
  if (n === 1) return [big ? 'closer' : 'tactic'];
  if (n === 2) return [open, 'closer'];
  return [open, ...Array<Beat>(n - 2).fill('tactic'), 'closer'];
}

/**
 * The rooms of a job that keep a BIG ONE for their closer: one in a job of three rooms or fewer, two in a
 * longer one; never the first room, nor a last room with a named butcher in it. On the job's own stream.
 */
export function bigRooms(job: Job): number[] {
  const rng = new Rng(job.seed * 389 + 23), named = !!job.boss || !!job.deep || job.objective === 'hunt';
  const can = Array.from({ length: job.rooms }, (_, i) => i).filter((i) => i >= 1 && !(named && i === job.rooms - 1));
  return rng.shuffle(can).slice(0, job.rooms >= 4 ? 2 : 1).sort((a, b) => a - b);
}
