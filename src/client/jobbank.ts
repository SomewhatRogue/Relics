/**
 * What this hero has earned on the job they're on (the party's gold pot and the experience so far),
 * kept on this device as it changes, beside the session (session.ts). A job can go on without this
 * page: a reload, a crash, a closed tab, a phone that killed it. Back in the job, it's paid at the end
 * as ever; if the job can't be got back into (it ended meanwhile, the party's gone), Game.payBanked
 * pays it once on load. Paying marks the job paid in the hero's own save (one store, so a reload in the
 * middle of it can't pay twice), and only then is the tally let go.
 */
import type { Run } from '../sim/run';

export interface Bank {
  /** The job: the party's room code, or this device's own for a job alone. */
  job: string;
  /** The run as this player last had it (a friend: as the leader's room last said). */
  run: Run;
  /** A job with friends (going early pays the pot in full; alone, the job is lost: half). */
  party: boolean;
  /** The leader's word on how it ended, heard here before this page could act on it. */
  end?: { won: boolean; run: Run };
}

const KEY = 'relic-job-bank';
/** The last tally written (so an unchanged run isn't written every frame). */
let last = '';

function all(): Record<string, Bank> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') ?? {};
  } catch {
    return {};
  }
}

function put(m: Record<string, Bank>): void {
  try {
    if (Object.keys(m).length) localStorage.setItem(KEY, JSON.stringify(m));
    else localStorage.removeItem(KEY);
  } catch { /* private window: a reload loses the job's tally */ }
}

/** Keep hero `hero`'s tally for this job (written only when it changed). */
export function bankJob(hero: string, b: Bank): void {
  const r = b.run, sig = [hero, b.job, b.party, r.gold, r.xp, r.index, r.kills, r.rescued, r.dens, r.party, !!b.end].join();
  if (sig === last) return;
  last = sig;
  const m = all();
  // (The leader's word on the end, once heard, stays with it.)
  m[hero] = { ...b, end: b.end ?? (m[hero]?.job === b.job ? m[hero].end : undefined) };
  put(m);
}

/** The leader's word that the job ended, kept the moment it's heard (a hidden page acts on it later). */
export function bankEnd(hero: string, job: string, end: { won: boolean; run: Run }): void {
  const m = all(), b = m[hero];
  if (!b || b.job !== job) return;
  m[hero] = { ...b, end };
  put(m);
  last = '';
}

/** This hero's kept tally, if any (`job`: only that job's). */
export function banked(hero: string, job?: string): Bank | null {
  const b = all()[hero];
  return b && (!job || b.job === job) ? b : null;
}

/** Paid (or nothing to pay): let it go. */
export function unbank(hero: string): void {
  const m = all();
  delete m[hero];
  put(m);
  last = '';
}

/** A job alone gets a name of its own here (a party's is its room code). */
export const soloJob = () => 'solo-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
