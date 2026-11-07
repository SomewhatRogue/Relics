/**
 * A shift at Halvard's forge (docs/DECISIONS.md 2026-11-06, "WORK A SHIFT"): the run of pieces and the
 * rising pace, scoring (clean, near, the streak, pieces done), the pay and its cap and rest, the seed a
 * refresh can't roll again, and the town's board, which takes only a shift played again from its strikes.
 */
import { describe, expect, it } from 'vitest';
import { newShift, replayShift, shiftGlow, stepShift, SHIFT_MOST, type ShiftState } from '../src/shared/forgeshift';
import { SHIFT, SHIFT_PAY, PIECE_KINDS } from '../src/shared/shifttune';
import { cleanShiftClaim, shiftClaimScore, shiftSeed } from '../src/shared/shiftboard';
import { fitShiftRecord, paidNow, restLeft, settleShift, shiftGold, startShift, type ShiftRecord } from '../src/shared/shiftpay';
import { payFor } from '../src/shared/jobs';
import { contribute } from '../src/shared/worldsync';
import { newWorld } from '../src/shared/story';
import { clean, memoryWorldStore } from '../api/_world';

/** Strike `late` s after each glow's peak, give or take `noise` (its own steady numbers, not the shift's). */
function play(seed: number, late = 0, noise = 0): ShiftState {
  const s = newShift(seed);
  let x = (seed % 9973) + 7, plan = -1;
  const rnd = () => (x = (x * 16807) % 2147483647) / 2147483647;
  while (!s.over) {
    const p = s.piece;
    if (p && plan < 0) {
      const i = p.peaks.findIndex((_, k) => !p.used[k] && !p.passed[k]);
      if (i >= 0) plan = p.peaks[i] + late + (rnd() * 2 - 1) * noise;
    }
    const hit = plan >= 0 && s.frame / SHIFT.fps + 1e-9 >= plan;
    if (hit) plan = -1;
    stepShift(s, hit);
    if (s.events.some((e) => e.k === 'made' || e.k === 'spoiled' || e.k === 'pass')) plan = -1;
  }
  return s;
}
const seeds = (n: number, tag = 'hshift') => Array.from({ length: n }, (_, i) => shiftSeed(tag + i, 0));
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

describe('the shift', () => {
  it('runs to the bell, piece after piece, every kind turning up, the pace rising', () => {
    const s = newShift(shiftSeed('hrun01', 0)), laid: { kind: string; t: number; gap: number }[] = [];
    while (!s.over) {
      stepShift(s, false);
      const p = s.piece;
      if (s.events.some((e) => e.k === 'lay') && p) laid.push({ kind: p.kind, t: p.t0, gap: p.peaks[1] - p.peaks[0] });
    }
    expect(s.t).toBeGreaterThanOrEqual(SHIFT.length - 1 / SHIFT.fps);
    expect(s.score).toBe(0);
    expect(s.made).toBe(0);
    expect(s.spoiled).toBeGreaterThanOrEqual(laid.length - 1);
    for (const k of PIECE_KINDS) expect(laid.some((l) => l.kind === k), k).toBe(true);
    const early = mean(laid.filter((l) => l.t < 20).map((l) => l.gap)), late = mean(laid.filter((l) => l.t > 55).map((l) => l.gap));
    expect(early).toBeGreaterThan(1);
    expect(late).toBeLessThan(0.8);
    // The glow peaks at each peak and is dull between pieces.
    const t = newShift(shiftSeed('hrun01', 0));
    while (!t.piece) stepShift(t, false);
    expect(shiftGlow(t, t.piece.peaks[0])).toBe(1);
    expect(shiftGlow(t, t.piece.peaks[0] - SHIFT.rise)).toBeLessThan(0.05);
  });

  it('a clean strike scores 10, a near one 4, a cold one nothing and ends the streak; the streak adds up to +10', () => {
    const s = newShift(shiftSeed('hscore1', 0));
    while (!s.piece) stepShift(s, false);
    const at = (t: number) => { while (s.frame < Math.round(t * SHIFT.fps)) stepShift(s, false); stepShift(s, true); return s.events.find((e) => e.k === 'strike'); };
    const p = s.piece!;
    expect(at(p.peaks[0])).toMatchObject({ mark: 'clean', pts: 10, streak: 1 });
    if (p.need > 1) expect(at(p.peaks[1] + 0.12)).toMatchObject({ mark: 'fair', pts: 4 + SHIFT.streak.per, streak: 2 });
    // Whole shifts: a perfect one is all clean, one long streak, nothing spoiled; its per-strike bonus caps.
    const best = play(shiftSeed('hscore1', 1));
    expect(best.cold + best.fair + best.spoiled).toBe(0);
    expect(best.bestStreak).toBe(best.clean);
    const pieces = best.score - best.clean * SHIFT.points.clean;
    expect(pieces).toBeLessThanOrEqual(best.clean * SHIFT.streak.per * SHIFT.streak.cap + best.made * SHIFT.pieces.blank.pts);
    expect(best.score).toBeLessThan(SHIFT_MOST);
  });

  it('a careful smith beats a sloppy one, who beats one who never strikes', () => {
    const at = (late: number, noise: number) => mean(seeds(30).map((sd) => play(sd, late, noise).score));
    const good = at(0.02, 0.05), fair = at(0.08, 0.15), poor = at(0.12, 0.3);
    expect(good).toBeGreaterThan(fair);
    expect(fair).toBeGreaterThan(poor);
    expect(poor).toBeGreaterThan(0);
    // A good shift reaches the pay cap; a fair one gets some of it.
    expect(shiftGold(good)).toBe(SHIFT_PAY.cap);
    expect(shiftGold(fair)).toBeGreaterThan(5);
    expect(shiftGold(fair)).toBeLessThan(SHIFT_PAY.cap);
  });

  it('a glow let go by ends the streak; a piece with its glows gone is spoiled', () => {
    const s = newShift(shiftSeed('hpass1', 0));
    while (!s.piece) stepShift(s, false);
    while (s.frame < Math.round(s.piece!.peaks[0] * SHIFT.fps)) stepShift(s, false);
    stepShift(s, true);
    expect(s.streak).toBe(1);
    if (s.piece) {
      while (s.piece && !s.events.some((e) => e.k === 'pass')) stepShift(s, false);
      expect(s.streak).toBe(0);
    }
  });

  it('the same seed is the same shift; the next shift is another', () => {
    const a = play(shiftSeed('hsame1', 3), 0.04, 0.1), b = play(shiftSeed('hsame1', 3), 0.04, 0.1), c = play(shiftSeed('hsame1', 4), 0.04, 0.1);
    expect(b.score).toBe(a.score);
    expect(b.record).toEqual(a.record);
    expect(c.record).not.toEqual(a.record);
    // The hero's count of shifts is the seed: started (and saved) as it begins, so a refresh starts the next.
    const r: ShiftRecord = { shifts: 0, best: 0, restUntil: 0 };
    expect(startShift(r, 0).n).toBe(0);
    expect(startShift(r, 0).n).toBe(1);
    expect(r.shifts).toBe(2);
    expect(shiftSeed('hsame1', 0)).not.toBe(shiftSeed('hsame2', 0));
  });
});

describe('the pay', () => {
  it('a gold for every 50 points, at most 25 a shift', () => {
    expect(shiftGold(0)).toBe(0);
    expect(shiftGold(49)).toBe(0);
    expect(shiftGold(50)).toBe(1);
    expect(shiftGold(620)).toBe(12);
    expect(shiftGold(1e6)).toBe(SHIFT_PAY.cap);
  });

  it('paid once, only at the bell, then a rest before the next paid shift; a shift in the rest pays nothing', () => {
    const r: ShiftRecord = { shifts: 0, best: 0, restUntil: 0 }, t0 = 1_000_000;
    const a = startShift(r, t0);
    expect(a.paid).toBe(true);
    expect(restLeft(r, t0)).toBe(SHIFT.length + SHIFT_PAY.rest);
    expect(settleShift(r, a.n, 2000, true)).toEqual({ gold: SHIFT_PAY.cap, best: true });
    // Never twice for the same shift.
    expect(settleShift(r, a.n, 2000, true).gold).toBe(0);
    // In the rest: it can be worked (for the board, and the best), not paid.
    const b = startShift(r, t0 + 80_000);
    expect(b.paid).toBe(false);
    expect(settleShift(r, b.n, 2500, true)).toEqual({ gold: 0, best: true });
    expect(r.best).toBe(2500);
    // After the rest it pays again.
    expect(paidNow(r, t0 + (SHIFT.length + SHIFT_PAY.rest) * 1000)).toBe(true);
    // STOP (or a refresh) mid-shift: no pay, and the rest still runs from the start.
    const c = startShift(r, t0 + 400_000);
    expect(c.paid).toBe(true);
    expect(settleShift(r, c.n, 1500, false).gold).toBe(0);
    expect(paidNow(r, t0 + 400_000 + 60_000)).toBe(false);
    // A shift that was owed pay and lost to a refresh isn't paid by the next.
    const d = startShift(r, t0 + 400_000 + (SHIFT.length + SHIFT_PAY.rest) * 1000);
    expect(settleShift(r, c.n, 9999, true).gold).toBe(0);
    expect(settleShift(r, d.n, 600, true).gold).toBe(12);
  });

  it('clearly worse gold a minute than a job, even before a job\'s kill gold', () => {
    const shift = SHIFT_PAY.cap / ((SHIFT.length + SHIFT_PAY.rest) / 60);
    const job = payFor(2, 0, false, 'short') / 5;
    expect(shift).toBeLessThan(5);
    expect(shift).toBeLessThan(job * 0.7);
  });

  it('the record is fitted from a save', () => {
    const now = 5_000_000;
    expect(fitShiftRecord({ shifts: 4, best: 1e9, restUntil: 1e15, owed: 9 }, now)).toEqual({ shifts: 4, best: SHIFT_MOST, restUntil: now + (SHIFT.length + SHIFT_PAY.rest) * 1000 });
    expect(fitShiftRecord({ shifts: 4, best: 800, restUntil: 10, owed: 3 }, now)).toEqual({ shifts: 4, best: 800, restUntil: 10, owed: 3 });
    expect(fitShiftRecord('junk', now)).toEqual({ shifts: 0, best: 0, restUntil: 0 });
  });
});

describe('the town board', () => {
  it('a shift replays exactly from its strikes; made-up strikes are no shift', () => {
    const id = 'hboard01', s = play(shiftSeed(id, 0), 0.03, 0.08);
    expect(replayShift(shiftSeed(id, 0), s.record)?.score).toBe(s.score);
    expect(shiftClaimScore(id, 'MAGE', { n: 0, hits: s.record })).toBe(s.score);
    // A strike the rules wouldn't take (inside the lock, between pieces) makes it no shift.
    expect(replayShift(shiftSeed(id, 0), [s.record[0], s.record[0] + 1])).toBeNull();
    expect(replayShift(shiftSeed(id, 0), [0])).toBeNull();
    // The same strikes under another shift's seed score another (lower) shift, or none.
    expect(shiftClaimScore(id, 'MAGE', { n: 1, hits: s.record })).toBeLessThan(s.score);
  });

  it('the board takes only what the strikes really score, each hero once at their best; forged ones are refused', async () => {
    const id = 'hboard02', s = play(shiftSeed(id, 0), 0.02, 0.06);
    const w = newWorld();
    contribute(w, { hero: { id, name: 'WREN', cls: 'MAGE' }, shift: { n: 0, hits: s.record } });
    contribute(w, { hero: { id, name: 'WREN', cls: 'MAGE' }, shift: { n: 0, hits: s.record } });
    expect(w.shift).toEqual([{ id, name: 'WREN', cls: 'MAGE', n: s.score }]);
    // The wire: a claim that isn't one is dropped.
    expect(cleanShiftClaim({ n: 0, hits: [] })).toBeNull();
    expect(cleanShiftClaim({ n: 0, hits: [5, 3] })).toBeNull();
    expect(cleanShiftClaim({ n: 0, hits: 'all clean' })).toBeNull();
    expect(cleanShiftClaim({ n: 0, hits: [SHIFT.length * SHIFT.fps] })).toBeNull();
    expect(cleanShiftClaim({ n: 0, hits: Array.from({ length: SHIFT.most + 1 }, (_, i) => i * 10) })).toBeNull();
    // On the server (the fast path's store): a real shift goes up, a forged record doesn't.
    const store = memoryWorldStore(), c = clean({ hero: { id, name: 'wren', cls: 'MAGE' }, shift: { n: 0, hits: s.record } });
    expect((await store.apply('wickhold', c!)).world.shift?.[0].n).toBe(s.score);
    const forged = clean({ hero: { id: 'hforger03', name: 'CHEAT', cls: 'ROGUE' }, shift: { n: 0, hits: Array.from({ length: 300 }, (_, i) => 30 + i * 14) } });
    expect((await store.apply('wickhold', forged!)).world.shift?.some((l) => l.id === 'hforger03')).toBe(false);
    // Someone else's strikes under your name are scored on your seed, not theirs.
    const stolen = clean({ hero: { id: 'hthief004', name: 'THIEF', cls: 'ROGUE' }, shift: { n: 0, hits: s.record } });
    const after = (await store.apply('wickhold', stolen!)).world.shift?.find((l) => l.id === 'hthief004')?.n ?? 0;
    expect(after).toBeLessThan(s.score);
    // The top ten, best first.
    for (let i = 0; i < 12; i++) {
      const h = `hmany${String(i).padStart(4, '0')}`, r = play(shiftSeed(h, 0), 0.01 * i, 0.02 * i);
      contribute(w, { hero: { id: h, name: 'H' + i, cls: 'MAGE' }, shift: { n: 0, hits: r.record } });
    }
    expect(w.shift!.length).toBe(10);
    expect(w.shift!.map((l) => l.n)).toEqual([...w.shift!.map((l) => l.n)].sort((a, b) => b - a));
  });
});

describe("a Warrior's edge at the forge", () => {
  it('the same strikes, a little late, land cleaner for a Warrior, and the board plays them back that way', () => {
    const id = 'hknight1', seed = shiftSeed(id, 0);
    // Strikes timed a touch past the clean window: cold or fair for anyone, clean more often for a Warrior.
    const s = play(seed, SHIFT.clean * 1.2, 0);
    const k = replayShift(seed, s.record, true);
    expect(k).not.toBeNull();
    expect(k!.clean).toBeGreaterThan(s.clean);
    expect(k!.score).toBeGreaterThan(s.score);
    expect(shiftClaimScore(id, 'WARRIOR', { n: 0, hits: s.record })).toBe(k!.score);
    expect(shiftClaimScore(id, 'MAGE', { n: 0, hits: s.record })).toBe(s.score);
  });
});
