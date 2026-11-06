/**
 * The Drowned Rat's arm-wrestling table and knife board (docs/DECISIONS.md 2026-11-06, the second town
 * pastimes): the rules of each, the bets (the dice's limits and payout, never paid twice), the seeds a
 * refresh can't roll again, and the knife board's replay-checked town board.
 */
import { describe, expect, it } from 'vitest';
import { ARM, ARM_FOES, armFoe, type ArmFoe } from '../src/shared/armtune';
import { fitArmRecord, heaving, newArm, pushOf, stepArm, telling, zoneAt, type ArmState } from '../src/shared/armwrestle';
import { HOUSE, KNIFE_MAX, KNIVES } from '../src/shared/knifetune';
import { aimAt, fitKnifeRecord, houseScore, newKnives, ready, replayKnives, ringOf, stepKnives, type KnifeState } from '../src/shared/knives';
import { cleanKnifeClaim, knifeClaimScore, knifeSeed } from '../src/shared/knifeboard';
import { BETS, settleStake, stakeOk, takeStake, type Stake } from '../src/shared/stakes';
import { contribute } from '../src/shared/worldsync';
import { newWorld } from '../src/shared/story';
import { seedOf } from '../src/shared/fishing';
import { clean, memoryWorldStore } from '../api/_world';

/** A player at the table who watches the band a little late (`lag` steps) and bears down when under it. */
function bout(seed: number, foe: ArmFoe, lag = 14, slop = 0.02): ArmState {
  const s = newArm(seed, foe), seen: number[] = [];
  while (!s.over) {
    seen.push(zoneAt(s));
    stepArm(s, s.grip < seen[Math.max(0, seen.length - 1 - lag)] - slop);
  }
  return s;
}
const wins = (foe: ArmFoe, lag: number, slop: number, n = 120) => Array.from({ length: n }, (_, i) => bout(i * 7919 + 11, foe, lag, slop).won).filter(Boolean).length / n;

describe('arm-wrestling: the rules', () => {
  it('in the band you push them over, out of it they push you; letting go or holding on regardless loses', () => {
    for (const f of ARM_FOES) {
      const idle = newArm(5, f), mash = newArm(5, f);
      while (!idle.over) stepArm(idle, false);
      while (!mash.over) stepArm(mash, true);
      expect([idle.won, mash.won], f.id).toEqual([false, false]);
      expect(idle.lean).toBe(-1);
    }
    // Held in the band's middle for a step: the lean goes their way at the near rate.
    const s = newArm(9, ARM_FOES[0]);
    s.grip = zoneAt(s, 0);
    const before = s.lean;
    stepArm(s, s.grip < zoneAt(s, 0));
    expect(s.inZone).toBe(true);
    expect(s.lean).toBeGreaterThan(before);
  });

  it('a careful player beats every regular, and each is harder than the one before', () => {
    for (const f of ARM_FOES) expect(wins(f, 9, 0.01, 40), f.id).toBeGreaterThan(0.9);
    const rates = ARM_FOES.map((f) => wins(f, 20, 0.03));
    for (let i = 1; i < rates.length; i++) expect(rates[i], ARM_FOES[i].id).toBeLessThanOrEqual(rates[i - 1]);
    expect(rates[0]).toBeGreaterThan(0.9);
    expect(rates[3]).toBeLessThan(0.3);
  });

  it('a heave is told first, then shoves the band and pushes harder; they tire, and a bout always ends', () => {
    const s = newArm(77, armFoe('gannet'));
    let told = -1, shoved = -1;
    while (!s.over && shoved < 0) {
      stepArm(s, s.grip < zoneAt(s));
      if (s.events.some((e) => e.k === 'tell')) told = s.t;
      if (s.events.some((e) => e.k === 'heave')) shoved = s.t;
    }
    expect(told).toBeGreaterThan(0);
    expect(shoved - told).toBeCloseTo(ARM.tell, 1);
    expect(telling(s, told + 0.1)).toBe(true);
    expect(heaving(s, shoved + 0.1)).toBe(true);
    expect(pushOf(s, shoved + 0.1)).toBeCloseTo(s.foe.push * ARM.heavePush, 5);
    expect(pushOf(newArm(1, s.foe), ARM.tired + 10)).toBeGreaterThan(s.foe.push * 1.5);
    for (const f of ARM_FOES) for (let i = 0; i < 20; i++) expect(bout(i * 13, f, 30, 0.08).t).toBeLessThanOrEqual(ARM.cap);
  });

  it('the band stays on the bar and moves no faster than a grip can follow', () => {
    for (const f of ARM_FOES) {
      const s = newArm(3, f);
      let last = zoneAt(s, 0), most = 0;
      for (let t = 1 / 60; t < 30; t += 1 / 60) {
        const z = zoneAt(s, t);
        expect(z - f.width).toBeGreaterThanOrEqual(-1e-9);
        expect(z + f.width).toBeLessThanOrEqual(1 + 1e-9);
        most = Math.max(most, Math.abs(z - last) * 60);
        last = z;
      }
      expect(most, f.id).toBeLessThan(ARM.rise);
    }
  });

  it('the same seed and the same holds give the same bout; another seed another', () => {
    const a = bout(seedOf('hwren0001:arm', 3), ARM_FOES[2]), b = bout(seedOf('hwren0001:arm', 3), ARM_FOES[2]), c = bout(seedOf('hwren0001:arm', 4), ARM_FOES[2]);
    expect([a.t, a.lean, a.won, a.held]).toEqual([b.t, b.lean, b.won, b.held]);
    expect(c.t === a.t && c.held === a.held).toBe(false);
  });

  it('the record is fitted from a save, never trusting odd values', () => {
    expect(fitArmRecord({ bouts: 4.7, wins: -2, beat: ['drunk', 7, 'gannet'] })).toEqual({ bouts: 4, wins: 0, beat: ['drunk', 'gannet'] });
    expect(fitArmRecord(null)).toEqual({ bouts: 0, wins: 0, beat: [] });
  });
});

/** A thrower who waits for the point to come over the middle (looking `look` s ahead) and lets go `late` s off. */
function throwRound(seed: number, steady: boolean, late = 0, look = 0.8): KnifeState {
  const s = newKnives(seed, steady);
  let at = -1;
  while (!s.over) {
    if (ready(s) && at < 0) {
      let best = Infinity;
      for (let f = s.frame; f < s.frame + look * 60; f++) {
        const [x, y] = aimAt(s, f / 60), d = Math.hypot(x, y);
        if (d < best) (best = d), (at = f);
      }
      at += Math.round(late * 60);
    }
    if (stepKnives(s, at >= 0 && s.frame >= at)) at = -1;
  }
  return s;
}

describe('knife-throwing: the rules', () => {
  it('the rings score 10, 8, 6, 4, 2 from the bull out, and off the board nothing', () => {
    const R = KNIVES.r;
    expect([0, 0.25, 0.45, 0.65, 0.85].map((k) => ringOf(R * k, 0))).toEqual([0, 1, 2, 3, 4]);
    expect(ringOf(R + 0.5, 0)).toBe(-1);
    expect(KNIVES.rings).toEqual([10, 8, 6, 4, 2]);
  });

  it('nine knives a round, one in hand at a time, judged where the point was as it went', () => {
    const s = throwRound(42, false);
    expect(s.thrown).toBe(9);
    expect(s.record).toHaveLength(9);
    for (let i = 1; i < 9; i++) expect(s.record[i] - s.record[i - 1]).toBeGreaterThanOrEqual(KNIVES.reach * 60 - 1);
    expect(s.score).toBe(s.stuck.reduce((n, k) => n + k.pts, 0));
    expect(s.score).toBeLessThanOrEqual(KNIFE_MAX);
    // Thrown blind at once, every time a knife is in hand: worse than waiting for it.
    const blind = newKnives(42, false);
    while (!blind.over) stepKnives(blind, true);
    expect(blind.score).toBeLessThan(s.score);
  });

  it('holding a knife makes the hand sway wider; a Rogue sways less and scores more', () => {
    const s = newKnives(7, false), r = newKnives(7, true);
    const spread = (k: KnifeState, from: number) => Math.max(...Array.from({ length: 120 }, (_, i) => Math.hypot(...aimAt(k, from + i / 60))));
    expect(spread(s, 4)).toBeGreaterThan(spread(s, 0.5) * 1.2);
    expect(spread(r, 0.5)).toBeLessThan(spread(s, 0.5) * 0.7);
    const mean = (steady: boolean) => Array.from({ length: 80 }, (_, i) => throwRound(i * 31 + 3, steady, ((i * 37) % 13 - 6) / 60).score).reduce((a, b) => a + b, 0) / 80;
    expect(mean(true)).toBeGreaterThan(mean(false) + 5);
  });

  it('a round replays exactly from its seed and its moments; a made-up one does not', () => {
    const s = throwRound(99, true, 0.05);
    expect(replayKnives(99, true, s.record)?.score).toBe(s.score);
    expect(replayKnives(99, true, s.record.slice(0, 8))).toBeNull();
    expect(replayKnives(99, true, [...s.record].reverse())).toBeNull();
    expect(replayKnives(99, true, s.record.map((f, i) => (i === 3 ? s.record[2] + 2 : f)))).toBeNull();
    expect(replayKnives(99, true, Array.from({ length: 9 }, (_, i) => 30 + i * 42))).toBeNull();
  });

  it("the card sharp's round comes from the seed, the same every time, and from his range", () => {
    for (let i = 0; i < 200; i++) {
      const h = houseScore(seedOf('hx', i));
      expect(h).toBe(houseScore(seedOf('hx', i)));
      expect(h).toBeGreaterThanOrEqual(HOUSE.low);
      expect(h).toBeLessThanOrEqual(HOUSE.high);
    }
    // A careful thrower beats him more often than not, a careless one less.
    const beat = (late: number) => Array.from({ length: 100 }, (_, i) => throwRound(knifeSeed('hbet', i), false, late).score > houseScore(knifeSeed('hbet', i))).filter(Boolean).length;
    expect(beat(0)).toBeGreaterThan(60);
    expect(beat(0.12)).toBeLessThan(beat(0));
  });

  it('the board takes only what the throws really score, each hero once at their best', async () => {
    const id = 'hknifer01', s = throwRound(knifeSeed(id, 0), false);
    expect(knifeClaimScore(id, 'WARRIOR', { n: 0, throws: s.record })).toBe(s.score);
    // Another round's seed under the same moments is another round (it's the seed that's scored, not a claim).
    expect(replayKnives(knifeSeed(id, 1), false, s.record)?.stuck).not.toEqual(s.stuck);
    const w = newWorld();
    contribute(w, { hero: { id, name: 'WREN', cls: 'WARRIOR' }, knives: { n: 0, throws: s.record } });
    contribute(w, { hero: { id, name: 'WREN', cls: 'WARRIOR' }, knives: { n: 0, throws: s.record } });
    expect(w.knives).toEqual([{ id, name: 'WREN', cls: 'WARRIOR', n: s.score }]);
    // The server cleans a claim; a forged one (no throws to back a score) doesn't get on.
    expect(cleanKnifeClaim({ n: 0, throws: [1, 2] })).toBeNull();
    expect(cleanKnifeClaim({ n: 0, throws: 'all bulls' })).toBeNull();
    const store = memoryWorldStore(), c = clean({ hero: { id, name: 'wren', cls: 'WARRIOR' }, knives: { n: 0, throws: s.record } });
    expect((await store.apply('wickhold', c!)).world.knives?.[0].n).toBe(s.score);
    const forged = clean({ hero: { id: 'hforger02', name: 'CHEAT', cls: 'ROGUE' }, knives: { n: 0, throws: Array.from({ length: 9 }, (_, i) => i) } });
    expect((await store.apply('wickhold', forged!)).world.knives?.some((l) => l.id === 'hforger02')).toBe(false);
  });

  it('the record is fitted from a save', () => {
    expect(fitKnifeRecord({ rounds: 3, best: 999 })).toEqual({ rounds: 3, best: 90 });
  });
});

describe('the bets, as the dice take them', () => {
  type Purse = { gold: number; stake?: Stake };
  it('10, 25 or 50, never more than you have or than the regular will take', () => {
    expect(BETS).toEqual([10, 25, 50]);
    expect(stakeOk({ gold: 100 }, 25)).toBe(true);
    expect(stakeOk({ gold: 100 }, 30)).toBe(false);
    expect(stakeOk({ gold: 100 }, 0)).toBe(false);
    expect(stakeOk({ gold: 100 }, -10)).toBe(false);
    expect(stakeOk({ gold: 20 }, 25)).toBe(false);
    expect(stakeOk({ gold: 100 }, 25, armFoe('drunk').cap)).toBe(false);
    const p: Purse = { gold: 20 };
    expect(takeStake(p, 'arm', 0, 25)).toBe(false);
    expect(p).toEqual({ gold: 20 });
  });

  it('the stake leaves the purse as the bout starts; a win pays even money, a loss nothing', () => {
    const p: Purse = { gold: 100 };
    expect(takeStake(p, 'arm', 0, 50)).toBe(true);
    expect(p.gold).toBe(50);
    expect(settleStake(p, 'arm', 0, true)).toBe(100);
    expect(p.gold).toBe(150);
    expect(takeStake(p, 'knives', 1, 50)).toBe(true);
    expect(settleStake(p, 'knives', 1, false)).toBe(0);
    expect(p.gold).toBe(100);
  });

  it('never paid twice, never for another bout, and a stake left lying from a refresh is lost', () => {
    const p: Purse = { gold: 100 };
    takeStake(p, 'arm', 4, 25);
    expect(settleStake(p, 'arm', 5, true)).toBe(0);
    expect(settleStake(p, 'knives', 4, true)).toBe(0);
    expect(settleStake(p, 'arm', 4, true)).toBe(50);
    expect(settleStake(p, 'arm', 4, true)).toBe(0);
    expect(p.gold).toBe(125);
    // Bet, then the page goes (the stake saved with it); the next bout's bet takes its place and the old one never pays.
    takeStake(p, 'arm', 5, 25);
    const reloaded: Purse = JSON.parse(JSON.stringify(p));
    takeStake(reloaded, 'arm', 6, 10);
    expect(settleStake(reloaded, 'arm', 5, true)).toBe(0);
    expect(settleStake(reloaded, 'arm', 6, true)).toBe(20);
    expect(reloaded.gold).toBe(125 - 25 - 10 + 20);
  });
});
