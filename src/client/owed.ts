/**
 * What a job owes each player, kept by whoever runs the job (the room decides, so the leader's word is
 * the one that counts) on the server (api/owed.ts): the leader's game writes each member's share as
 * the job goes (when it changed, at most every few seconds) and at the end, for whoever was still with
 * it. A player who comes back after the job ended, or whose job fell apart, claims it on load
 * (Game.settle). Each player's own device keeps a copy too (jobbank.ts), used only if the server
 * can't be reached.
 */
import type { Run } from '../sim/run';

/** The leader writes each member's share at most every EVERY seconds (and at the end): each write is a Redis command a member. */
const API = '/api/owed', EVERY = 15, TIMEOUT = 6000;
/** One job's share as kept: the run as the leader had it, with this player's tallies under `me`. */
export type OwedRun = Run & { end?: 'won' | 'beaten' };

async function call(url: string, init?: RequestInit): Promise<Response | null> {
  try {
    const c = new AbortController(), t = setTimeout(() => c.abort(), TIMEOUT);
    const r = await fetch(url, { ...init, signal: c.signal, cache: 'no-store' });
    clearTimeout(t);
    return r;
  } catch {
    return null;
  }
}

/** Every job still owing this hero; null when the server can't be reached. */
export async function owedTo(hero: string): Promise<{ job: string; run: OwedRun }[] | null> {
  const r = await call(`${API}?hero=${encodeURIComponent(hero)}`);
  if (!r?.ok) return null;
  try {
    const b = (await r.json()) as { owed?: { job: string; run: OwedRun }[] };
    return Array.isArray(b.owed) ? b.owed : null;
  } catch {
    return null;
  }
}

/** Paid: the server lets it go (a lost request is harmless: the hero's save says it's paid). */
export function dropOwed(hero: string, job: string): void {
  void call(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hero, job, drop: 1 }) });
}

/** The run with player `id`'s own tallies under `me` (the leader's own under `@lead`), as a friend's game reads it. */
const theirs = (run: Run, id: string, me: string): Run => (id === me ? run : JSON.parse(JSON.stringify(run).split('"me"').join('"@lead"').split(`"${id}"`).join('"me"')));

/** The leader's book for one job: each member's share, written to the server. */
export class OwedBook {
  private sent = '';
  private at = -99;

  constructor(readonly job: string, private me: string) {}

  /**
   * Each frame, leading: `with` is everyone still with the job (the leader too). Those who aren't
   * keep the share they had when they went.
   */
  frame(now: number, run: Run | null, withIds: string[]): void {
    if (!run || now - this.at < EVERY) return;
    const sig = JSON.stringify([withIds, run.gold, run.xp, run.index, run.kills, run.rescued, run.dens, run.party]);
    if (sig === this.sent) return;
    this.at = now;
    this.sent = sig;
    this.write(run, withIds);
  }

  /** The end: everyone still with it is owed the outcome (the leader is paid here and now). */
  end(won: boolean, run: Run, withIds: string[]): void {
    this.write(run, withIds.filter((id) => id !== this.me), won ? 'won' : 'beaten');
  }

  private write(run: Run, ids: string[], end?: 'won' | 'beaten'): void {
    if (!ids.length) return;
    const owed: Record<string, OwedRun> = {};
    for (const id of ids) owed[id] = { ...theirs(run, id, this.me), ...(end ? { end } : {}) };
    void call(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ job: this.job, owed }) });
  }
}
