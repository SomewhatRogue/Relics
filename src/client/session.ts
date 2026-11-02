/**
 * The job you're in with friends, kept in this browser, so a reload (or a phone that killed the
 * page) can find its way back in: the party's room, who leads, the job, and which hero. Stale
 * after 15 minutes without a word. (Online only; a solo run never writes it.)
 */
import type { Job } from '../shared/jobs';

export interface Session { code: string; lead: string; job: Job; hero: string; at: number }
const KEY = 'relic-coop', JOB = 'relic-coop-job', FRESH = 15 * 60_000;

export function keepSession(s: Omit<Session, 'at'>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...s, at: Date.now() }));
  } catch { /* private window: no way back after a reload */ }
}

export function forgetSession(): void {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(JOB);
  } catch { /* nothing kept */ }
}

/**
 * Leading: the whole job as it stands (the same save that goes to the party every 2 s), so a reload
 * of the leader's page can pick the job up where it was and lead it again.
 */
export function keepJob(save: string): void {
  try {
    localStorage.setItem(JOB, save);
  } catch { /* too big or no storage: a friend takes it on instead */ }
}

export function keptJob(): string | null {
  try {
    return localStorage.getItem(JOB);
  } catch {
    return null;
  }
}

/** Still in a job with friends, as this hero? */
export function session(hero: string): Session | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Session | null;
    return s && s.hero === hero && Date.now() - s.at < FRESH ? s : null;
  } catch {
    return null;
  }
}

/** Still at it: keep it fresh. */
export function touchSession(): void {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Session | null;
    if (s) localStorage.setItem(KEY, JSON.stringify({ ...s, at: Date.now() }));
  } catch { /* nothing kept */ }
}
