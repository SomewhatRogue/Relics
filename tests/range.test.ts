/**
 * The archery butts (shared/range.ts, rangeboard.ts; docs/DECISIONS.md 2026-11-06): targets stand,
 * slide and swing where the numbers say; an arrow scores by the ring where it lands, times the lane;
 * a moving one has to be led; a Ranger's sight wanders less; a round replays to the same score from its
 * seed and arrows, a made-up record doesn't; and the town's board only takes what the arrows really scored.
 */
import { describe, expect, it } from 'vitest';
import { LANES, RANGE, RANGE_BOARD, RANGE_MAX } from '../src/shared/rangetune';
import { hittable, newRange, replayRange, stepRange, sway, targetAt, wave, type RangeState, type Target } from '../src/shared/range';
import { addRangeLine, claimScore, cleanClaim } from '../src/shared/rangeboard';
import { seedOf } from '../src/shared/fishing';
import { contribute } from '../src/shared/worldsync';
import { newWorld } from '../src/shared/story';
import { clean, memoryWorldStore } from '../api/_world';

const T = (o: Partial<Target>): Target => ({ id: 1, slot: 0, lane: 2, kind: 'post', t0: 0, life: 99, end: Infinity, hit: false, cx: 60, amp: 0, hz: 0, ph: 0, ...o });

/** A good archer: aims where the nearest target will be when the arrow lands, less the sight's wander. */
function shootRound(seed: number, steady: boolean, lead = true): RangeState {
  const s = newRange(seed, steady);
  while (!s.over) {
    const t = s.frame / RANGE.fps, up = s.targets.filter((g) => hittable(g, t + RANGE.fly) && hittable(g, t)).sort((a, b) => b.lane - a.lane)[0];
    let shot: [number, number] | null = null;
    if (up && t >= s.nockAt) {
      const [x, y] = targetAt(up, lead ? t + RANGE.fly : t), [wx, wy] = sway(s, t);
      shot = [Math.round((x - wx) * 10), Math.round((y - wy) * 10)];
    }
    stepRange(s, shot);
  }
  return s;
}

describe('targets move as the numbers say', () => {
  it('wave is sine to within a thousandth, from plain arithmetic', () => {
    for (let x = -3; x < 3; x += 0.0137) expect(Math.abs(wave(x) - Math.sin(x * Math.PI * 2))).toBeLessThan(0.0012);
  });

  it('a post stands still, a slide runs its rail and back, a swing keeps to its rope below the beam', () => {
    const post = T({}), slide = T({ kind: 'slide', amp: 20, hz: 0.25 }), swing = T({ kind: 'swing', lane: 1, amp: 0.3, hz: 0.3 });
    const xs: number[] = [];
    for (let t = 0; t < 8; t += 0.05) {
      expect(targetAt(post, t)).toEqual([60, LANES[2].y]);
      const [sx, sy] = targetAt(slide, t);
      expect(sy).toBe(LANES[2].y);
      expect(Math.abs(sx - 60)).toBeLessThanOrEqual(20.0001);
      xs.push(sx);
      const [wx, wy] = targetAt(swing, t), L = LANES[1], d = Math.hypot(wx - 60, wy - (L.y - L.hang));
      expect(Math.abs(d - L.hang)).toBeLessThan(0.1);
      expect(wy).toBeGreaterThan(L.y - L.hang);
    }
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(38);
  });

  it('targets come up through a round in all three lanes, sliding and swinging later on, and go down in their time', () => {
    const s = newRange(seedOf('hround0001', 0), false), seen = new Set<string>();
    let first = { slide: Infinity, swing: Infinity };
    while (!s.over) {
      stepRange(s);
      for (const g of s.targets) {
        seen.add(`${g.lane}:${g.kind}`);
        if (g.kind !== 'post') first[g.kind] = Math.min(first[g.kind], g.t0);
        expect(s.t - g.t0).toBeLessThan(g.life + RANGE.drop + 0.05);
      }
      expect(s.targets.filter((g) => g.end > s.t).length).toBeLessThanOrEqual(RANGE.slots);
    }
    expect([...seen].filter((k) => k.endsWith('post')).length).toBe(3);
    expect(first.slide).toBeGreaterThanOrEqual(RANGE.slideFrom);
    expect(first.swing).toBeGreaterThanOrEqual(RANGE.swingFrom);
    expect(s.frame).toBe(RANGE.round * RANGE.fps);
  });
});

describe('scoring', () => {
  it('the ring where it lands, times the lane; the gold far back is worth the most', () => {
    const hitAt = (lane: 0 | 1 | 2, dx: number) => {
      const s = newRange(1, false);
      s.slots = s.slots.map(() => -1);
      s.targets = [T({ lane, t0: -1 })];
      s.flights = [{ x: 60 + dx, y: LANES[lane].y, land: 0 }];
      stepRange(s);
      return s.score;
    };
    expect(hitAt(2, 0)).toBe(10);
    expect(hitAt(1, 0)).toBe(20);
    expect(hitAt(0, 0)).toBe(30);
    const r = LANES[2].r;
    expect(hitAt(2, r * 0.3)).toBe(8);
    expect(hitAt(2, r * 0.5)).toBe(6);
    expect(hitAt(2, r * 0.7)).toBe(4);
    expect(hitAt(2, r * 0.95)).toBe(2);
    expect(hitAt(2, r + 0.5)).toBe(0);
  });

  it('a moving target has to be led: aiming where it is now scores far less than where it will be', () => {
    let led = 0, now = 0;
    for (let i = 0; i < 6; i++) (led += shootRound(seedOf('hlead00001', i), true, true).score), (now += shootRound(seedOf('hlead00001', i), true, false).score);
    expect(led).toBeGreaterThan(now * 1.15);
  });

  it("a Ranger's sight wanders about half as far, and steadier hands score more", () => {
    const a = newRange(5, false), b = newRange(5, true);
    let wa = 0, wb = 0;
    for (let t = 0; t < 60; t += 0.1) (wa = Math.max(wa, Math.hypot(...sway(a, t)))), (wb = Math.max(wb, Math.hypot(...sway(b, t))));
    expect(wb / wa).toBeCloseTo(RANGE.steady, 1);
    // A careless archer who ignores the wander: the Ranger's arrows land closer.
    let plain = 0, ranger = 0;
    for (let i = 0; i < 8; i++) {
      for (const [steady, add] of [[false, (n: number) => (plain += n)], [true, (n: number) => (ranger += n)]] as const) {
        const s = newRange(seedOf('hsteady001', i), steady);
        while (!s.over) {
          const t = s.frame / RANGE.fps, up = s.targets.filter((g) => hittable(g, t + RANGE.fly)).sort((x, y) => y.lane - x.lane)[0];
          const at = up && t >= s.nockAt ? targetAt(up, t + RANGE.fly) : null;
          stepRange(s, at ? [Math.round(at[0] * 10), Math.round(at[1] * 10)] : null);
        }
        add(s.score);
      }
    }
    expect(ranger).toBeGreaterThan(plain);
  });

  it('a good round scores well under the most a round could', () => {
    const s = shootRound(seedOf('hgood00001', 0), false);
    expect(s.hits).toBeGreaterThan(20);
    expect(s.score).toBeGreaterThan(200);
    expect(s.score).toBeLessThan(RANGE_MAX);
  });
});

describe('a round replays, a made-up one does not', () => {
  it('the same seed and arrows give the same score, arrow for arrow', () => {
    for (let i = 0; i < 4; i++) {
      const seed = seedOf('hreplay001', i), s = shootRound(seed, i % 2 === 0), r = replayRange(seed, i % 2 === 0, JSON.parse(JSON.stringify(s.record)));
      expect(r).not.toBeNull();
      expect([r!.score, r!.hits, r!.shots, r!.golds]).toEqual([s.score, s.hits, s.shots, s.golds]);
    }
  });

  it('arrows between nocks, out of order, after the bell, too many, or with another seed: not the round', () => {
    const seed = seedOf('hforge0001', 0), s = shootRound(seed, false), rec = s.record;
    expect(replayRange(seed, false, [...rec, [rec[rec.length - 1][0] + 1, 600, 1200]])).toBeNull();
    expect(replayRange(seed, false, [rec[1], rec[0], ...rec.slice(2)])).toBeNull();
    expect(replayRange(seed, false, [...rec, [RANGE.round * RANGE.fps + 5, 600, 1200]])).toBeNull();
    expect(replayRange(seed, false, Array.from({ length: RANGE.shots + 1 }, (_, i) => [i * 30, 600, 1200]))).toBeNull();
    // The same arrows on another round's targets mostly miss.
    expect(replayRange(seedOf('hforge0001', 1), false, rec)?.score ?? 0).toBeLessThan(s.score / 2);
  });
});

describe("the town's board", () => {
  it('takes the score the arrows really make, each hero once at their best, the top ten', () => {
    const seed = seedOf('hboard0001', 3), s = shootRound(seed, false), w = newWorld();
    contribute(w, { hero: { id: 'hboard0001', name: 'WREN', cls: 'WARRIOR' }, range: { n: 3, shots: s.record } });
    expect(w.range).toEqual([{ id: 'hboard0001', name: 'WREN', cls: 'WARRIOR', n: s.score }]);
    // The same arrows sent as another round, or as a Ranger, aren't that round: they score what they score there.
    expect(claimScore('hboard0001', 'WARRIOR', { n: 4, shots: s.record })).toBeLessThan(s.score);
    // A worse round later doesn't knock the best off.
    contribute(w, { hero: { id: 'hboard0001', name: 'WREN', cls: 'WARRIOR' }, range: { n: 4, shots: s.record.slice(0, 2) } });
    expect(w.range![0].n).toBe(s.score);
    let b = w.range;
    for (let i = 0; i < 14; i++) b = addRangeLine(b, { id: 'h' + i, name: 'X' + i, cls: 'MAGE', n: i * 10 });
    expect(b!.length).toBe(RANGE_BOARD);
    expect(b!.map((l) => l.n)).toEqual([...b!.map((l) => l.n)].sort((x, y) => y - x));
  });

  it('the world server cleans a claim and applies it once (a round is one write, scored again there)', async () => {
    const seed = seedOf('hserver001', 0), s = shootRound(seed, true);
    const c = clean({ hero: { id: 'hserver001', name: 'ash', cls: 'RANGER' }, range: { n: 0, shots: s.record } });
    expect(c?.range?.shots.length).toBe(s.record.length);
    expect(cleanClaim({ n: 0, shots: [[1, 2]] })).toBeNull();
    expect(cleanClaim({ n: -1, shots: [] })).toBeNull();
    expect(clean({ hero: { id: 'hserver001', name: 'ash', cls: 'RANGER' }, range: { n: 0, shots: 'lots' } })?.range).toBeUndefined();
    const store = memoryWorldStore();
    const v = await store.apply('wickhold', c!);
    expect(v.world.range?.[0]).toEqual({ id: 'hserver001', name: 'ASH', cls: 'RANGER', n: s.score });
    // A score typed in by hand (no arrows to back it) doesn't get on.
    const forged = clean({ hero: { id: 'hforger001', name: 'CHEAT', cls: 'RANGER' }, range: { n: 0, shots: [] }, score: 9999 });
    expect((await store.apply('wickhold', forged!)).world.range?.some((l) => l.id === 'hforger001')).toBe(false);
  });
});
