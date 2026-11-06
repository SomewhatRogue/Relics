/**
 * Fishing at the millpond (shared/fishing.ts, docs/DECISIONS.md 2026-11-06): the bite comes when the
 * cast's seed says, a strike on a nibble is too soon and a slow one misses; reeling well lands it,
 * holding through a big fish's run snaps the line and leaving it slack throws the hook; kinds and sizes
 * fit where you cast; the same cast is the same fish; and the biggest catch is kept on the hero.
 */
import { describe, expect, it } from 'vitest';
import { FISH, SPECIES, speciesOf, weighs } from '../src/shared/fishtune';
import { cast, fitFishRecord, meterAt, newFishRecord, newFishing, nibbling, recordCatch, rollFish, seedOf, stepFish, type FishState } from '../src/shared/fishing';
import { Rng } from '../src/shared/rng';

const DT = 1 / 60;
/** A cast of `reach` from `seed`, stepped till the bite. */
function toBite(seed: number, reach = 0.5): FishState {
  const s = newFishing();
  cast(s, reach, seed);
  for (let i = 0; i < 60 * 30 && s.phase !== 'bite'; i++) stepFish(s, { held: false, presses: 0 }, DT, () => 0);
  return s;
}
/** Strike, then reel as a careful player would (or as `play` says), till it's over. */
function fight(s: FishState, play: (s: FishState) => boolean): FishState {
  let presses = s.seen;
  stepFish(s, { held: true, presses: ++presses }, DT, () => 0);
  for (let i = 0; i < 60 * 120 && s.phase === 'reel'; i++) stepFish(s, { held: play(s), presses }, DT, () => 0);
  return s;
}
const careful = (s: FishState) => !s.running && s.tension < 0.75;

describe('the bite', () => {
  it('comes when the seed says, after the float has flown and some nibbles, and never before', () => {
    for (let n = 0; n < 50; n++) {
      const seed = seedOf('htestfish01', n), reach = (n % 5) / 4, s = newFishing();
      cast(s, reach, seed);
      expect(s.biteAt).toBeGreaterThanOrEqual(FISH.wait[0]);
      expect(s.biteAt).toBeLessThanOrEqual(FISH.wait[1] + FISH.waitFar * reach);
      expect(s.nibbles.length).toBeLessThanOrEqual(FISH.nibbles);
      for (const t of s.nibbles) expect(t).toBeLessThan(s.biteAt);
      let waited = 0;
      while (s.phase !== 'bite') {
        stepFish(s, { held: false, presses: 0 }, DT, () => 0);
        if (s.phase === 'wait') waited += DT;
        expect(waited).toBeLessThan(s.biteAt + 0.05);
      }
      expect(Math.abs(waited - s.biteAt)).toBeLessThan(0.05);
    }
  });

  it('a strike on a nibble (or on nothing) is too soon; too slow and it has gone', () => {
    // A cast with a nibble: strike in the middle of it.
    let seed = 0, s = newFishing();
    for (let n = 0; !s.nibbles.length; n++) (s = newFishing()), cast(s, 0.3, (seed = seedOf('hnibble01', n)));
    while (!nibbling(s)) stepFish(s, { held: false, presses: 0 }, DT, () => 0);
    stepFish(s, { held: true, presses: 1 }, DT, () => 0);
    expect([s.phase, s.why]).toEqual(['lost', 'early']);
    // Too slow: the window passes.
    const slow = toBite(seed);
    for (let i = 0; i < 60 * (FISH.window + 0.1); i++) stepFish(slow, { held: false, presses: 0 }, DT, () => 0);
    expect([slow.phase, slow.why]).toEqual(['lost', 'missed']);
    // In time: on.
    const quick = toBite(seed);
    stepFish(quick, { held: true, presses: 1 }, DT, () => 0);
    expect(quick.phase).toBe('reel');
  });

  it('the cast: hold to swing the meter, let go and the cast goes as far as it showed, taking the next seed', () => {
    const s = newFishing();
    let seeds = 0;
    stepFish(s, { held: true, presses: 1 }, DT, () => ++seeds);
    expect(s.phase).toBe('aim');
    for (let i = 0; i < 30; i++) stepFish(s, { held: true, presses: 1 }, DT, () => ++seeds);
    const showing = s.meter;
    expect(showing).toBeCloseTo(meterAt(s.t), 5);
    stepFish(s, { held: false, presses: 1 }, DT, () => ++seeds);
    expect(s.phase).toBe('fly');
    expect(s.reach).toBeCloseTo(showing, 5);
    expect(seeds).toBe(1);
  });
});

describe('the fight', () => {
  it('reeling in the rests and letting it run lands nearly everything, near or far', () => {
    let landed = 0, n = 0;
    for (let i = 0; i < 300; i++, n++) if (fight(toBite(seedOf('hreel00001', i), (i % 6) / 5), careful).phase === 'landed') landed++;
    expect(landed / n).toBeGreaterThan(0.95);
  });

  it('holding on through a big fish running snaps the line', () => {
    const s = toBite(seedOf('hsnap00001', 1), 1);
    s.fish = { sp: 'pike', oz: 480, pull: 1.05, fight: 0.6 };
    fight(s, () => true);
    expect([s.phase, s.why]).toEqual(['lost', 'snapped']);
  });

  it('a small one can be reeled straight in', () => {
    const s = toBite(seedOf('hsmall0001', 1), 0);
    s.fish = { sp: 'roach', oz: 6, pull: 0.12, fight: 0.3 };
    expect(fight(s, () => true).phase).toBe('landed');
  });

  it('leaving the line slack, it throws the hook', () => {
    const s = toBite(seedOf('hslack0001', 2), 0.4);
    s.fish = { sp: 'perch', oz: 20, pull: 0.25, fight: 0.4 };
    fight(s, () => false);
    expect([s.phase, s.why]).toEqual(['lost', 'thrown']);
  });

  it('the fish runs and rests on its own clock, with a warning before each run', () => {
    const s = toBite(seedOf('hclock0001', 3), 0.8), seen = { run: 0, tell: 0 };
    let was = false;
    fight(s, (q) => {
      if (q.running && !was) seen.run++;
      if (q.tell) seen.tell++;
      was = q.running;
      return careful(q);
    });
    expect(seen.run).toBeGreaterThan(0);
    expect(seen.tell).toBeGreaterThan(0);
  });
});

describe('what bites', () => {
  it('every kind and size is in its range; small ones near the bank, the big ones out deep', () => {
    const r = new Rng(9), near: Record<string, number> = {}, far: Record<string, number> = {};
    for (let i = 0; i < 20000; i++) {
      const a = rollFish(0.05, r.next(), r.next()), b = rollFish(0.95, r.next(), r.next());
      for (const f of [a, b]) {
        const sp = speciesOf(f.sp);
        expect(f.oz).toBeGreaterThanOrEqual(sp.min);
        expect(f.oz).toBeLessThanOrEqual(sp.max);
      }
      near[a.sp] = (near[a.sp] ?? 0) + 1;
      far[b.sp] = (far[b.sp] ?? 0) + 1;
    }
    expect((near.roach ?? 0) + (near.rudd ?? 0) + (near.perch ?? 0)).toBeGreaterThan(15000);
    expect(near.pike ?? 0).toBeLessThan(100);
    expect(far.pike ?? 0).toBeGreaterThan(1000);
    expect(far.carp ?? 0).toBeGreaterThan(1000);
    // Every kind turns up somewhere along the pond.
    const all = new Set<string>();
    for (let i = 0; i < 4000; i++) all.add(rollFish(i / 4000, r.next(), r.next()).sp);
    expect(all.size).toBe(SPECIES.length);
    // Big ones are rarer than small ones.
    const pikes = Array.from({ length: 5000 }, () => rollFish(1, 0.999, r.next())).filter((f) => f.sp === 'pike');
    expect(pikes.filter((f) => f.oz < 200).length).toBeGreaterThan(pikes.filter((f) => f.oz > 400).length);
  });

  it('the same cast is the same fish (a refresh rolls nothing again); the next cast is another', () => {
    const a = newFishing(), b = newFishing(), c = newFishing();
    cast(a, 0.6, seedOf('hsame00001', 7));
    cast(b, 0.6, seedOf('hsame00001', 7));
    cast(c, 0.6, seedOf('hsame00001', 8));
    expect([b.fish, b.biteAt, b.nibbles]).toEqual([a.fish, a.biteAt, a.nibbles]);
    expect([c.fish, c.biteAt]).not.toEqual([a.fish, a.biteAt]);
  });

  it('weights read as they are said', () => {
    expect(weighs(11)).toBe('11 oz');
    expect(weighs(48)).toBe('3 lb');
    expect(weighs(37)).toBe('2 lb 5 oz');
  });
});

describe('the biggest catch', () => {
  it('is kept: the biggest of each kind and of all, the first of a kind said', () => {
    const r = newFishRecord();
    expect(recordCatch(r, 'roach', 8)).toEqual({ kind: false, ever: true, first: true });
    expect(recordCatch(r, 'roach', 5)).toEqual({ kind: false, ever: false, first: false });
    expect(recordCatch(r, 'roach', 12)).toEqual({ kind: true, ever: true, first: false });
    expect(recordCatch(r, 'pike', 300)).toEqual({ kind: false, ever: true, first: true });
    expect(recordCatch(r, 'perch', 20)).toEqual({ kind: false, ever: false, first: true });
    expect(r.best).toEqual({ sp: 'pike', oz: 300 });
    expect(r.bests).toEqual({ roach: 12, pike: 300, perch: 20 });
    expect(r.caught).toBe(5);
  });

  it('comes back from a save made sound (nothing odd or impossible kept)', () => {
    const r = fitFishRecord({ casts: 12.7, caught: -3, bests: { roach: 9, pike: 99999, wyrm: 40, carp: 'big' }, best: { sp: 'pike', oz: 99999 } });
    expect(r.casts).toBe(12);
    expect(r.caught).toBe(0);
    expect(r.bests).toEqual({ roach: 9, pike: speciesOf('pike').max });
    expect(r.best).toEqual({ sp: 'pike', oz: speciesOf('pike').max });
    expect(fitFishRecord(null)).toEqual(newFishRecord());
  });
});
