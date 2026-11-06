/**
 * Threat and pacing (docs/plans/bosses.md section 3; Kyle, 2026-11-05): threat budgets and on-screen caps, beats in
 * order, packs held back and let go, a party scaled by toughness, the party's level, kiting answered, BIG
 * ONEs, the same every time, and a single-target kit clearing a room about as well as an area one.
 */
import { describe, expect, it } from 'vitest';
import { board, type Job } from '../src/shared/jobs';
import { planRoom, type Foe } from '../src/shared/terrain';
import { BIG, HOLD, LEVEL_SCALE, PARTY_TOUGH, SPRINT, THREAT, TICK, VARIANTS, levelHarm, levelHp } from '../src/shared/tuning';
import { beatsFor, bigRooms, capsFor, foeThreat, meaty, roomBudget, threatIn, tierOf } from '../src/shared/roombudget';
import { threatOf } from '../src/shared/threat';
import { leanOdds, itemLevel } from '../src/shared/lootlevel';
import { DROP_ODDS } from '../src/shared/gear';
import { isSpecial } from '../src/shared/encounter';
import { Rng } from '../src/shared/rng';
import { scaleFoes } from '../src/sim/party';
import { ArenaRoom } from '../src/sim/room';
import { newRun, runRoom } from '../src/sim/run';
import { NO_INTENT, type Enemy } from '../src/sim/types';
import { clearTimes, sampleRooms } from './clearbot';

const jobs = Array.from({ length: 30 }, (_, d) => board(d + 1)).flat();
const rooms = jobs.flatMap((j) => Array.from({ length: j.rooms }, (_, i) => ({ j, i, foes: planRoom(j, i).foes })));
const fighters = (fs: Foe[]) => fs.filter((f) => (f.kind === 'scrapper' || f.kind === 'butcher') && !f.name);
const packsOf = (fs: Foe[]) => [...new Set(fs.filter((f) => f.pack !== undefined && f.pack < 80).map((f) => f.pack!))].sort((a, b) => a - b).map((p) => fs.filter((f) => f.pack === p));
const seedOf = (j: Job, i: number) => j.seed * 17 + i * 5 + 2;

describe('threat', () => {
  it('prices small fry at half a point, specials 2, meaty 4, a butcher 8', () => {
    expect(THREAT.chaff).toBe(0.5);
    expect(threatOf('fodder')).toBe(0.5);
    expect(threatOf('wolf')).toBe(0.5);
    expect(threatOf('archer')).toBe(2);
    expect(threatOf('heavy')).toBe(4);
    expect(threatOf('butcher')).toBe(8);
    expect(threatOf('heavy', true)).toBe(8);
  });

  it("keeps every room within its budget, for each party size, and a pack's meaty and heavy ones within the caps", () => {
    for (const r of rooms) for (const n of [1, 2, 3, 4]) {
      const fs = n === 1 ? r.foes : scaleFoes(r.foes.map((f) => ({ ...f })), n, seedOf(r.j, r.i));
      // (A layout-4 scene may add a goblin or two at its dead or its tents after the room is laid, packless: not the fights.)
      expect(threatIn(fighters(fs).filter((f) => f.pack !== undefined)), `${r.j.id} room ${r.i} party ${n}`).toBeLessThanOrEqual(roomBudget(r.j, r.i, n) + 1e-9);
      const cap = capsFor(n, r.i);
      for (const p of packsOf(fs)) {
        expect(p.filter(meaty).length).toBeLessThanOrEqual(cap.meaty);
        expect(p.filter((f) => tierOf(f) === 'heavy').length).toBeLessThanOrEqual(cap.heavy);
        // No pack alone is more than a screen's worth.
        expect(threatIn(p.filter((f) => !f.name))).toBeLessThanOrEqual(cap.threat);
      }
    }
  });

  it('still lays swarms worth splatting at half a point (and no more small ones than before)', () => {
    const splats = rooms.flatMap((r) => packsOf(r.foes).filter((p) => p[0].beat === 'splat'));
    const sizes = splats.map((p) => p.filter((f) => !isSpecial(f)).length);
    expect(sizes.reduce((s, n) => s + n, 0) / sizes.length).toBeGreaterThanOrEqual(5);
    const small = rooms.map((r) => fighters(r.foes).filter((f) => !isSpecial(f)).length);
    // Before the budget a room had 9.2 goblins on average, about 7 of them small.
    expect(small.reduce((s, n) => s + n, 0) / small.length).toBeLessThan(9);
  });
});

describe('beats', () => {
  it('come in order from the way in: a swarm, then a fight, then the closer', () => {
    const rank = { splat: 0, tactic: 1, closer: 2 };
    let withSplat = 0, any = 0;
    for (const r of rooms) {
      const beats = packsOf(r.foes).map((p) => p[0].beat).filter((b) => b);
      if (!beats.length) continue;
      any++;
      for (let k = 1; k < beats.length; k++) expect(rank[beats[k]!]).toBeGreaterThanOrEqual(rank[beats[k - 1]!]);
      if (r.i === 0) expect(beats).not.toContain('closer');
      if (beats.includes('splat')) withSplat++;
    }
    // Some rooms keep a swarm to splat; it no longer fills every one.
    expect(withSplat / any).toBeGreaterThan(0.4);
    expect(withSplat / any).toBeLessThan(0.85);
  });

  it('shapes the beats by the number of fights', () => {
    const rng = new Rng(3);
    expect(beatsFor(2, 0, rng)).toEqual(['splat', 'tactic']);
    expect(beatsFor(3, 2, rng).at(-1)).toBe('closer');
    expect(beatsFor(1, 2, rng, true)).toEqual(['closer']);
  });
});

/** A room of two packs: one awake about the hero, the other asleep ahead (`second` its small ones). */
function heldRoom(first: Foe[], second = 4) {
  const foes: Foe[] = [...first, ...Array.from({ length: second }, (_, k) => ({ kind: 'scrapper' as const, x: 12 + k * 0.6, y: 4, pack: 2, role: 'fodder' as const }))];
  const room = new ArenaRoom(3, { foes, map: { ...planRoom(jobs[0], 0).map, rounds: [], blocks: [] }, furniture: [] });
  room.pace = { index: 1 };
  const h = room.join('me');
  // Stood where pack 2 sees them (not within HOLD.near), with the butcher's crowd about them.
  Object.assign(h, { x: 12.9, y: 12, fx: 0, fy: -1, safeT: 1e9 });
  for (const e of room.enemies) if (e.pack === 1) e.alert = true;
  for (const e of room.enemies) if (e.pack === 2) (e.fx = 0), (e.fy = 1);
  // Walk up till pack 2 sees them (it's dark: not far), then stand.
  for (let i = 0; i < 4 / TICK && !room.enemies.some((e) => e.pack === 2 && e.alert); i++) room.setIntent('me', { ...NO_INTENT, my: -0.6 }), room.step();
  room.setIntent('me', NO_INTENT);
  return { room, h, held: () => room.enemies.filter((e) => e.pack === 2 && e.held).length };
}
const crowd: Foe[] = [{ kind: 'butcher', x: 4, y: 14, pack: 1, role: 'butcher' }, ...Array.from({ length: 4 }, (_, k) => ({ kind: 'scrapper' as const, x: 4 + k, y: 16, pack: 1, role: 'fodder' as const }))];

describe('holding back', () => {
  const step = (room: ArenaRoom, s: number, me?: (r: ArenaRoom) => void) => { for (let i = 0; i < s / TICK; i++) (me?.(room), room.step()); };

  it('holds a pack that wakes while the screen is full, and it strikes nothing', () => {
    const { room, held } = heldRoom(crowd);
    step(room, 0.5);
    expect(held()).toBeGreaterThan(0);
    expect(room.enemies.filter((e) => e.held && e.attack).length).toBe(0);
  });

  it('lets it come at once when a hero walks up to it', () => {
    const { room, h, held } = heldRoom(crowd);
    step(room, 0.5);
    expect(held()).toBeGreaterThan(0);
    Object.assign(h, { x: 12, y: 4 + HOLD.near - 0.5 });
    step(room, 0.2);
    expect(held()).toBe(0);
  });

  it('lets it come at once when it is hit', () => {
    const { room, held } = heldRoom(crowd);
    step(room, 0.5);
    const e = room.enemies.find((x) => x.pack === 2 && x.held)!;
    (e.hitAt = room.time), (e.hp -= 5);
    step(room, 0.1);
    expect(held()).toBe(0);
  });

  it('lets it come after a while anyway, and never holds a pack from an empty screen', () => {
    const { room, held } = heldRoom(crowd);
    step(room, 0.5);
    expect(held()).toBeGreaterThan(0);
    step(room, HOLD.wait + 0.2);
    expect(held()).toBe(0);
    const alone = heldRoom([]);
    step(alone.room, 0.5);
    expect(alone.held()).toBe(0);
  });
});

describe('a bigger party: toughness, not numbers', () => {
  it('raises health and damage by the table, and the count only by the set amount', () => {
    for (const r of rooms.slice(0, 160)) for (const n of [2, 3, 4]) {
      const one = r.foes.map((f) => ({ ...f })), more = scaleFoes(r.foes.map((f) => ({ ...f })), n, seedOf(r.j, r.i));
      let grow = 0, specials = 0;
      for (const p of [...new Set(one.filter((f) => f.pack !== undefined).map((f) => f.pack))].map((id) => one.filter((f) => f.pack === id))) {
        const small = p.filter((f) => !isSpecial(f) && !f.name && f.kind === 'scrapper' && !f.task).length;
        grow += Math.round(small * PARTY_TOUGH.chaff * (n - 1));
        if (n >= 3 && p.find((f) => isSpecial(f) && !f.bow)?.more) specials++;
      }
      // The small ones grow by the set share at most (the party's budget may stop them short), and one special a pack from three.
      const extra = more.slice(one.length);
      expect(extra.filter((f) => !isSpecial(f)).length).toBeLessThanOrEqual(grow);
      expect(extra.filter((f) => isSpecial(f)).length).toBeLessThanOrEqual(specials);
      for (let k = 0; k < one.length; k++) {
        const f = one[k], g = more[k];
        if (f.pack === undefined || f.name) continue;
        const base = f.hp ?? (f.variant ? VARIANTS[f.variant].hp : f.kind === 'butcher' ? 260 : 36);
        expect(g.hp).toBe(Math.round(base * PARTY_TOUGH.hp[n - 1]));
        expect(g.harm).toBeCloseTo((f.harm ?? 1) * PARTY_TOUGH.harm[n - 1], 3);
      }
    }
  });

  it('hits harder in the room: a party of four goblin lands its blow PARTY_TOUGH.harm times as hard', () => {
    const job = jobs.find((j) => j.layout === 4)!, solo = runRoom({ ...newRun(job), index: 1 }), four = runRoom({ ...newRun(job), index: 1, party: 4 });
    const a = solo.enemies.find((e) => e.role === 'fodder')!, b = four.enemies.find((e) => e.id === a.id)!;
    expect(b.harm).toBeCloseTo(PARTY_TOUGH.harm[3], 3);
    expect(b.maxHp).toBe(Math.round(a.maxHp * PARTY_TOUGH.hp[3]));
  });
});

describe("the party's level", () => {
  it('makes every goblin tougher and harder hitting by the curve, the same goblins', () => {
    const job = jobs.find((j) => j.deep)!;
    for (const i of [1, job.rooms - 1]) {
      const low = runRoom({ ...newRun(job), index: i }), high = runRoom({ ...newRun(job), index: i, level: 7 });
      expect(high.enemies.length).toBe(low.enemies.length);
      for (const e of low.enemies) {
        const f = high.enemies.find((x) => x.id === e.id)!;
        expect([f.kind, f.variant, f.x, f.y]).toEqual([e.kind, e.variant, e.x, e.y]);
        if (e.kind !== 'scrapper' && e.kind !== 'butcher') continue;
        // (A named one is scaled for the party afterwards, the same both ways.)
        expect(f.maxHp).toBeGreaterThanOrEqual(Math.round(e.maxHp * levelHp(7)) - 1);
        expect(f.harm ?? 1).toBeCloseTo((e.harm ?? 1) * levelHarm(7), 2);
      }
    }
    expect(levelHp(7)).toBeCloseTo(1 + 6 * LEVEL_SCALE.hp, 6);
  });

  it('is capped', () => {
    expect(levelHp(1)).toBe(1);
    expect(levelHp(40)).toBe(1 + LEVEL_SCALE.hpMost);
    expect(levelHarm(40)).toBe(1 + LEVEL_SCALE.harmMost);
    expect(levelHp(40)).toBeLessThanOrEqual(1.5);
  });

  it('lifts the loot: the tiers lean up a level at a time, the rare ones only a little', () => {
    const order = ['plain', 'fine', 'forged', 'tolmouth', 'touched', 'turning', 'hungry'];
    const mean = (o: [string, number][]) => o.reduce((s, [t, p]) => s + order.indexOf(t) * p, 0);
    const rare = (o: [string, number][]) => o.filter(([t]) => ['touched', 'turning', 'hungry'].includes(t)).reduce((s, [, p]) => s + p, 0);
    for (const from of ['butcher', 'chest', 'named'] as const) {
      const base = DROP_ODDS[from];
      expect(leanOdds(base, 1)).toEqual(base);
      let last = mean(base);
      for (const lv of [3, 5, 8, 10]) {
        const o = leanOdds(base, lv);
        expect(o.reduce((s, [, p]) => s + p, 0)).toBeCloseTo(base.reduce((s, [, p]) => s + p, 0), 9);
        expect(mean(o)).toBeGreaterThan(last);
        last = mean(o);
      }
      expect(rare(leanOdds(base, 10))).toBeGreaterThan(rare(base));
      expect(rare(leanOdds(base, 10))).toBeLessThan(rare(base) * 1.5);
    }
    expect([itemLevel(1), itemLevel(5), itemLevel(9)]).toEqual([0, 1, 2]);
  });
});

/** One awake goblin of a pack chasing a hero who runs off to the right. */
function chaseRoom(n = 1, pace = true) {
  const foes: Foe[] = Array.from({ length: n }, (_, k) => ({ kind: 'scrapper' as const, x: 6 - (k % 3) * 0.8, y: 10 + Math.floor(k / 3) * 0.8, pack: 1, role: 'fodder' as const }));
  const map = { ...planRoom(jobs[0], 0).map, rounds: [], blocks: [], w: 400, h: 24 };
  const room = new ArenaRoom(5, { foes, map, furniture: [] });
  if (pace) room.pace = { index: 1 };
  const h = room.join('me');
  Object.assign(h, { x: 9, y: 10.5, safeT: 1e9 });
  for (const e of room.enemies) e.alert = true;
  return { room, h };
}

describe('kiting', () => {
  it('a goblin chasing the same hero sprints after SPRINT.after s: a slow lean first, then the burst', () => {
    const { room } = chaseRoom();
    const e = room.enemies[0];
    let began = -1;
    const pace: number[] = [];
    for (let i = 0; i < 6 / TICK; i++) {
      room.setIntent('me', { ...NO_INTENT, mx: 1 });
      const x0 = e.x;
      room.step();
      if (e.chaseAt !== undefined && began < 0) began = room.time;
      if (e.sprintAt !== undefined) pace.push((e.x - x0) / TICK);
    }
    expect(e.sprintAt).toBeDefined();
    expect(e.sprintAt! - began).toBeGreaterThanOrEqual(SPRINT.after - 0.05);
    expect(e.sprintAt! - began).toBeLessThan(SPRINT.after + 0.5);
    // The tell: slower than its walk while it leans; then much faster than a hero.
    const lean = pace.slice(1, Math.floor(SPRINT.lean / TICK) - 1), burst = pace.slice(Math.ceil(SPRINT.lean / TICK) + 3, Math.floor((SPRINT.lean + SPRINT.burst) / TICK));
    expect(Math.max(...lean)).toBeLessThan(2);
    expect(Math.max(...burst)).toBeGreaterThan(5);
  });

  it("a pack's flankers spread out round a running hero instead of filing after them", () => {
    const spread = (pace: boolean) => {
      const { room, h } = chaseRoom(6, pace);
      for (let i = 0; i < 2.5 / TICK; i++) (room.setIntent('me', { ...NO_INTENT, mx: 1 }), room.step());
      const off = room.enemies.map((e) => e.y - h.y);
      return Math.max(...off) - Math.min(...off);
    };
    expect(spread(true)).toBeGreaterThan(spread(false) + 1);
  });
});

describe('BIG ONEs', () => {
  it('one or two a job, each the closer of its room, a few times as tough', () => {
    for (const j of jobs.filter((x) => x.layout === 4)) {
      const big = bigRooms(j), named = !!j.boss || !!j.deep || j.objective === 'hunt';
      // (A hunt of two rooms has none to spare: its last holds the named one.)
      expect(big.length).toBeGreaterThanOrEqual(j.rooms - (named ? 2 : 1) >= 1 ? 1 : 0);
      expect(big.length).toBeLessThanOrEqual(2);
      expect(big).not.toContain(0);
      for (let i = 0; i < j.rooms; i++) {
        const bs = planRoom(j, i).foes.filter((f) => f.big);
        if (!big.includes(i)) expect(bs.length).toBe(0);
        expect(bs.length).toBeLessThanOrEqual(1);
        for (const b of bs) {
          expect(b.beat).toBe('closer');
          expect(b.hp).toBe(Math.round(VARIANTS[b.role as 'heavy' | 'ironhide'].hp * BIG.hp));
          expect(foeThreat(b)).toBe(THREAT.meaty * THREAT.big);
        }
      }
    }
    // Most jobs get theirs (a short hunt has no room to spare).
    const got = jobs.filter((j) => j.layout === 4 && Array.from({ length: j.rooms }, (_, i) => planRoom(j, i).foes.some((f) => f.big)).some(Boolean)).length;
    expect(got / jobs.filter((j) => j.layout === 4).length).toBeGreaterThanOrEqual(0.6);
  });

  it('is bigger in the room and drops a sure handful of gold and a piece', () => {
    const r = rooms.find((x) => x.foes.some((f) => f.big))!, room = runRoom({ ...newRun(r.j), index: r.i });
    room.join('me');
    const b = room.enemies.find((e) => e.big)!;
    expect(b.radius).toBeGreaterThan(0.4);
    expect(b.harm).toBeCloseTo(BIG.harm, 3);
    // Burning on its last legs: it dies in the room's own tick, and drops.
    Object.assign(b, { hp: 1, burnUntil: 99, burnNext: 0, lastBy: 'me' });
    for (let i = 0; i < 30 && b.hp > 0; i++) room.step();
    expect(b.hp).toBeLessThanOrEqual(0);
    expect(room.pickups.some((p) => (p.gold ?? 0) >= BIG.gold[0] && Math.hypot(p.x - b.x, p.y - b.y) < 1)).toBe(true);
    expect(room.drops.some((d) => Math.hypot(d.x - b.x, d.y - b.y) < 0.1)).toBe(true);
  });
});

describe('the same every time', () => {
  it('lays the same rooms and plays the same fight from the same seed', () => {
    const j = jobs[9];
    expect(planRoom(j, 2).foes).toEqual(planRoom(j, 2).foes);
    const play = () => {
      const room = runRoom({ ...newRun(j), index: 2, party: 2, level: 4 });
      room.join('a'), room.join('b');
      for (let i = 0; i < 12 / TICK; i++) {
        room.setIntent('a', { ...NO_INTENT, my: -1, attackSeq: Math.floor(i / 9) });
        room.setIntent('b', { ...NO_INTENT, mx: 1, my: -0.5 });
        room.step();
      }
      return JSON.stringify(room.enemies.map((e: Enemy) => [e.x, e.y, e.hp, e.held, e.sprintAt, e.act]));
    };
    expect(play()).toBe(play());
  });
});

describe('a single-target kit clears a room comfortably', () => {
  it('twin daggers clear the same rooms in about the time a focus staff does, without taking far more', { timeout: 600000 }, () => {
    const r = clearTimes(sampleRooms(2, 3), ['daggers', 'staff']);
    expect(r.daggers.unclear + r.staff.unclear).toBe(0);
    expect(r.daggers.mean / r.staff.mean).toBeLessThan(1.15);
    expect(r.daggers.taken / Math.max(1, r.staff.taken)).toBeLessThan(1.25);
  });
});
