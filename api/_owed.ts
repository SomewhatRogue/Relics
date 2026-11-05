/**
 * What a job owes the players in it, kept by the job's leader (api/owed.ts): whoever runs the room
 * writes each member's share as the job goes and at its end, so a player whose page closed, crashed
 * or reloaded after the job ended can claim it when they come back. One Redis hash per hero,
 * `relic:owed:<heroId>`, a field per job (the party's room code) holding that player's run as the
 * leader last had it. A week's keeping; a claim reads it, the player's game pays it and marks the job
 * paid in its own save, then drops it. Without Redis it lives in memory (tests, local dev).
 * A write is one HSET a member (pipelined, no MULTI), and an EXPIRE only for a job new to that hero:
 * every command is counted (_meter.ts).
 */
import { Meter } from './_meter.js';

export interface Owed { job: string; run: string }
export interface OwedStore {
  /** The leader's word for each member: hero id to their run (JSON). */
  write(job: string, owed: Record<string, string>): Promise<void>;
  list(hero: string): Promise<Owed[]>;
  drop(hero: string, job: string): Promise<void>;
}

export const WEEK_S = 7 * 24 * 3600;
/** At most this many members a write, and this many jobs owed to one hero. */
export const MAX_MEMBERS = 6, MAX_JOBS = 8, MAX_RUN = 6000;
const hk = (hero: string) => `relic:owed:${hero}`;
export const HERO = /^h[a-z0-9]{6,24}$/;
export const JOB = /^[A-Z0-9]{3,12}$/;

const num = (v: unknown, max: number) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max;

/** A run as a leader could really send it: small, with sane gold and experience. Null if not. */
export function cleanRun(raw: unknown): string | null {
  const r = raw as { gold?: unknown; xp?: unknown; job?: unknown; end?: unknown } | null;
  if (!r || typeof r !== 'object' || !num(r.gold, 5000) || !num(r.xp, 50000) || !r.job || typeof r.job !== 'object') return null;
  const s = JSON.stringify(r);
  return s.length <= MAX_RUN ? s : null;
}

export function memoryOwedStore(): OwedStore {
  const kept = new Map<string, Map<string, string>>();
  return {
    async write(job, owed) {
      for (const [hero, run] of Object.entries(owed)) {
        const m = kept.get(hero) ?? new Map<string, string>();
        if (!m.has(job) && m.size >= MAX_JOBS) continue;
        m.set(job, run);
        kept.set(hero, m);
      }
    },
    async list(hero) {
      return [...(kept.get(hero) ?? new Map<string, string>())].map(([job, run]) => ({ job, run }));
    },
    async drop(hero, job) {
      kept.get(hero)?.delete(job);
    },
  };
}

export async function redisOwedStore(url: string, meter = new Meter()): Promise<OwedStore> {
  const { createClient } = await import('redis');
  const r = createClient({ url });
  r.on('error', (e) => console.log(JSON.stringify({ owed: 1, ev: 'err', msg: String(e?.message ?? e) })));
  await r.connect();
  meter.attach({ incrBy: (k, n) => r.incrBy(k, n), expire: (k, t) => r.expire(k, t) });
  return {
    async write(job, owed) {
      const heroes = Object.keys(owed);
      meter.add('hset', heroes.length);
      // HSET says 1 for a field it made: a job new to that hero, whose week starts now.
      const made = await Promise.all(heroes.map((h) => r.hSet(hk(h), job, owed[h])));
      const fresh = heroes.filter((_, i) => Number(made[i]) > 0);
      meter.add('expire', fresh.length);
      await Promise.all(fresh.map((h) => r.expire(hk(h), WEEK_S)));
    },
    async list(hero) {
      meter.add('hgetall');
      const all = await r.hGetAll(hk(hero));
      return Object.entries(all).slice(0, MAX_JOBS).map(([job, run]) => ({ job, run }));
    },
    async drop(hero, job) {
      meter.add('hdel');
      await r.hDel(hk(hero), job);
    },
  };
}
