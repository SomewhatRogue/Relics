/**
 * Parties gathering in Wickhold, as plain data (the town's peer room carries it: client/parties.ts).
 * A party posted is an Offer: a small tag for the job (the whole job goes out once, when it sets out),
 * a number for this posting, and who's in, the leader first. Everything here is pure, so it's tested
 * in Node (tests/lobby.test.ts).
 */
import type { Job, Objective, Size } from './jobs.js';

export const PARTY_MAX = 4;
/** Seconds a party waits on someone who's gone quiet (a reload, a phone in a pocket) before letting them go. */
export const PARTY_GRACE = 20;

/** What the town needs to know about the job: enough to show it, not the whole posting. */
export interface JobTag { id: string; title: string; kind: Objective; place: string; size?: Size }
export type Member = [id: string, name: string];
export interface Offer { j: JobTag; n: number; m: Member[] }

export const tagOf = (j: Job): JobTag => ({ id: j.id, title: j.title, kind: j.objective, place: j.place.name, ...(j.size ? { size: j.size } : {}) });

/** A name as another browser said it, safe to keep and show. */
export const cleanName = (v: unknown): string => String(v ?? '').toUpperCase().replace(/[^A-Z0-9 '-]/g, '').slice(0, 14) || 'STRANGER';

const str = (v: unknown, n: number) => typeof v === 'string' && v.length > 0 && v.length <= n;

/** Is this (from another browser) a party we can show? */
export function isOffer(v: unknown): v is Offer {
  const o = v as Offer;
  if (!o || typeof o !== 'object' || !o.j || typeof o.j !== 'object' || !Array.isArray(o.m)) return false;
  if (!str(o.j.id, 60) || !str(o.j.title, 80) || !str(o.j.kind, 12) || !str(o.j.place, 40) || typeof o.n !== 'number') return false;
  return o.m.length >= 1 && o.m.length <= PARTY_MAX && o.m.every((x) => Array.isArray(x) && str(x[0], 64) && typeof x[1] === 'string');
}

/** A new party for this job, led by `id`. */
export const post = (job: Job, id: string, name: string, n: number): Offer => ({ j: tagOf(job), n, m: [[id, cleanName(name)]] });

/** Take `id` in, if there's room and they aren't in already. Returns whether they were. */
export function admit(o: Offer, id: string, name: unknown): boolean {
  if (o.m.length >= PARTY_MAX || o.m.some(([x]) => x === id)) return false;
  o.m.push([id, cleanName(name)]);
  return true;
}

/** Let `id` go (never the leader). Returns whether they were in. */
export function drop(o: Offer, id: string): boolean {
  const i = o.m.findIndex(([x]) => x === id);
  if (i <= 0) return false;
  o.m.splice(i, 1);
  return true;
}

/** Who came and who went between two lists of the same party, leaving out `me`. */
export function changes(before: Member[], after: Member[], me: string): { joined: string[]; left: string[] } {
  const had = new Set(before.map(([id]) => id)), has = new Set(after.map(([id]) => id));
  return {
    joined: after.filter(([id]) => id !== me && !had.has(id)).map(([, n]) => n),
    left: before.filter(([id]) => id !== me && !has.has(id)).map(([, n]) => n),
  };
}

/** The members (not the leader, not `me`) not heard from in `grace` seconds, as of `now`. */
export function quiet(o: Offer, heard: Map<string, number>, now: number, me: string, grace = PARTY_GRACE): string[] {
  return o.m.slice(1).filter(([id]) => id !== me && now - (heard.get(id) ?? now) > grace).map(([id]) => id);
}

/**
 * A member's view of the party they asked to join: `in` (listed), `asked` (not yet, ask again now and
 * then), `full`, `off` (the leader is in town but the party's down), or `quiet` (the leader not heard
 * from past the grace).
 */
export function standing(o: Offer | undefined, me: string, leadHeard: number, now: number, grace = PARTY_GRACE): 'in' | 'asked' | 'full' | 'off' | 'quiet' {
  if (now - leadHeard > grace) return 'quiet';
  if (!o) return 'off';
  if (o.m.some(([id]) => id === me)) return 'in';
  return o.m.length >= PARTY_MAX ? 'full' : 'asked';
}
