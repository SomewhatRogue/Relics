/**
 * Bounties on the north fields (docs/design/outside-the-gate.md, "Bounties: the first slice"): two posted a day at
 * the North Gate out of five, each a pack (and kind) of what lives out there. A death of one counts for every hero in
 * the room, struck by whoever; the count is kept across trips; done, one is handed in at the gate or a keeper for
 * copper and experience. Pure, on the profile. `n` is what the map places (tests/bounties.test.ts keeps it so).
 */
import type { EnemyKind } from '../sim/types.js';
import { seedOf } from './fishing.js';
import { gainXp, type Profile } from './progress.js';
import { Rng } from './rng.js';

export interface Bounty { id: string; land: 'gatefields'; packs: number[]; kinds?: EnemyKind[]; n: number; pay: number; xp: number }
export type Held = { id: string; day: number; got: number };

export const HELD_MAX = 2;

export const BOUNTIES: Bounty[] = [
  { id: 'wolves', land: 'gatefields', packs: [405], n: 5, pay: 50, xp: 80 },
  { id: 'den', land: 'gatefields', packs: [406], n: 4, pay: 70, xp: 110 },
  { id: 'nest', land: 'gatefields', packs: [407], kinds: ['nest'], n: 1, pay: 70, xp: 120 },
  { id: 'raiders', land: 'gatefields', packs: [402, 403, 404], n: 8, pay: 60, xp: 90 },
  { id: 'snarers', land: 'gatefields', packs: [408], n: 4, pay: 40, xp: 60 },
];

export const bountyOf = (id: string): Bounty | undefined => BOUNTIES.find((b) => b.id === id);

/** The two posted on a day: seeded by the day, never the same one twice. */
export function postedOn(day: number): Bounty[] {
  const r = new Rng(seedOf('bounties', day)), a = r.int(BOUNTIES.length);
  const b = (a + 1 + r.int(BOUNTIES.length - 1)) % BOUNTIES.length;
  return [BOUNTIES[a], BOUNTIES[b]];
}

export const held = (p: Pick<Profile, 'bounties'>): Held[] => p.bounties ?? [];
export const isHeld = (p: Pick<Profile, 'bounties'>, id: string): boolean => held(p).some((h) => h.id === id);
export const canTake = (p: Pick<Profile, 'bounties'>, id: string): boolean => !!bountyOf(id) && !isHeld(p, id) && held(p).length < HELD_MAX;

/** Take one posted on `day` into hand: at most two, never one already held. */
export function take(p: Profile, id: string, day: number): boolean {
  if (!canTake(p, id) || !postedOn(day).some((b) => b.id === id)) return false;
  (p.bounties ??= []).push({ id, day, got: 0 });
  return true;
}

export const isDone = (h: Held): boolean => h.got >= (bountyOf(h.id)?.n ?? Infinity);

/** A death of a body of `pack` and `kind`: one more on each held bounty it fits that isn't full. True if any counted. */
export function countDeath(p: Profile, pack: number | undefined, kind: EnemyKind): boolean {
  let any = false;
  for (const h of held(p)) {
    const b = bountyOf(h.id);
    if (!b || pack === undefined || h.got >= b.n || !b.packs.includes(pack) || (b.kinds && !b.kinds.includes(kind))) continue;
    h.got++, (any = true);
  }
  return any;
}

/** Hand one in: paid in copper (and the COIN EARNED tally) and experience, then gone from the hand. Null if not done. */
export function handIn(p: Profile, id: string): { pay: number; xp: number } | null {
  const h = held(p).find((x) => x.id === id), b = bountyOf(id);
  if (!h || !b || !isDone(h)) return null;
  p.bounties = held(p).filter((x) => x !== h);
  if (!p.bounties.length) delete p.bounties;
  p.gold += b.pay;
  if (p.stats) p.stats.gold += b.pay;
  gainXp(p, b.xp);
  return { pay: b.pay, xp: b.xp };
}

/** A saved list, fitted: entries of a known bounty with sane numbers, none twice, two at most. */
export function fitBounties(v: unknown): Held[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: Held[] = [];
  for (const h of v) {
    const b = h && typeof h === 'object' ? bountyOf((h as Held).id) : undefined;
    if (!b || out.some((o) => o.id === b.id) || out.length >= HELD_MAX) continue;
    const { day, got } = h as Held;
    if (!Number.isFinite(day) || !Number.isFinite(got)) continue;
    out.push({ id: b.id, day: Math.max(0, Math.floor(day)), got: Math.min(b.n, Math.max(0, Math.floor(got))) });
  }
  return out.length ? out : undefined;
}
