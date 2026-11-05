import { describe, expect, it } from 'vitest';
import { expedPlan, GOALS } from '../src/shared/expedmap';
import { expedition } from '../src/shared/expedjob';
import { EXPED } from '../src/shared/tuning';
import { newRun, runRoom, tally, goal } from '../src/sim/run';
import { NO_INTENT } from '../src/sim/types';
import type { ArenaRoom } from '../src/sim/room';
import type { XGoal } from '../src/sim/exped';
import { walkable } from './walk';
import { EXPED_COINS, EXPED_PACKS } from '../src/shared/tuning';
import { isSpecial } from '../src/shared/encounter';
import { ringOf } from '../src/shared/expedrings';
import { Rng } from '../src/shared/rng';
import type { Foe } from '../src/shared/terrain';
import { wave } from '../src/sim/expedpressure';
import { special } from '../src/sim/expedwave';
import { dropPickups, type Pickup } from '../src/sim/pickups';
import { newEnemy } from '../src/sim/enemies';

const job = (day: number) => expedition(day);
/** A room on day `day`'s map with one hero who can't be hurt, standing at (x, y). */
function room(day: number, at?: { x: number; y: number }) {
  const run = newRun(job(day)), r = runRoom(run), h = r.join('a');
  Object.assign(h, { safeT: 1e9 }, at ?? {});
  r.setIntent('a', NO_INTENT);
  return { run, r, h };
}
/** `secs` of play; `fight`: every goblin that gets within 8 of a hero is cut down (the party fighting). */
const steps = (r: ArenaRoom, secs: number, fight = false) => {
  for (let i = 0; i < secs * 30; i++) {
    r.step();
    if (fight) for (const e of r.enemies) if (e.act !== 'dead' && r.heroes.some((h) => Math.hypot(h.x - e.x, h.y - e.y) < 8)) Object.assign(e, { hp: 0, act: 'dead', actT: 0, actDur: 99, respawns: false });
  }
};
/** A day whose map has job `kind` among its pinned ones. */
const dayWith = (kind: string) => {
  for (let d = 1; d < 80; d++) if (expedPlan(job(d)).goals.some((g) => g.kind === kind)) return d;
  throw new Error('no day with ' + kind);
};

describe('an expedition: the Barrowfields', () => {
  it('is the same map from the same seed, a different one from another', () => {
    const a = expedPlan(job(3)), b = expedPlan(job(3)), c = expedPlan(job(4));
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
    expect(JSON.stringify(c.map)).not.toBe(JSON.stringify(a.map));
    expect([a.map.w, a.map.h]).toEqual([96, 72]);
    expect(a.nodes).toHaveLength(12);
  });

  it('pins two or three different jobs, each with its parts, and keeps the way in clear', () => {
    for (let d = 1; d <= 12; d++) {
      const p = expedPlan(job(d)), ins = p.map.hero;
      expect(p.goals.length).toBeGreaterThanOrEqual(2);
      expect(p.goals.length).toBeLessThanOrEqual(3);
      expect(new Set(p.goals.map((g) => g.kind)).size).toBe(p.goals.length);
      for (const g of p.goals) {
        if (g.kind === 'engine' || g.kind === 'dens') expect(g.blocks!.length).toBeGreaterThan(0);
        if (g.kind === 'prisoners') expect(g.cages).toHaveLength(3);
        if (g.kind === 'butcher') expect(p.foes[g.foe!].name).toBe(job(d).boss);
      }
      expect(p.sides.length).toBeGreaterThanOrEqual(1);
      expect(p.foes.length).toBeLessThanOrEqual(EXPED.goblins);
      expect(p.foes.every((f) => Math.hypot(f.x - ins.x, f.y - ins.y) >= 14)).toBe(true);
      expect(p.map.blocks.some((b) => b.kind === 'house' && b.door)).toBe(true);
      expect(p.camps.length).toBeGreaterThanOrEqual(p.goals.filter((g) => g.kind !== 'shrine').length);
    }
  });

  it('can be walked from the way in to every job, side job, the beacon and the way out', { timeout: 60000 }, () => {
    for (const d of [1, 2, 6]) {
      const p = expedPlan(job(d)), w = walkable(p);
      for (const g of [...p.goals, ...p.sides]) expect(w.reach(g.x, g.y, 2.2), `${d} ${g.kind}`).toBe(true);
      expect(w.reach(p.zone.x, p.zone.y, 1)).toBe(true);
      expect(w.reach(p.map.exit!.x + 1.5, 1.2, 1)).toBe(true);
    }
  });

  it('finishes every kind of job', { timeout: 60000 }, () => {
    for (const kind of GOALS) {
      const d = dayWith(kind), { r } = room(d), x = r.exped!, g = x.goals.find((q) => q.kind === kind) as XGoal, h = r.heroes[0];
      expect(g.done).toBe(false);
      if (kind === 'larder' || kind === 'shrine') {
        Object.assign(h, { x: g.x, y: g.y });
        steps(r, (kind === 'larder' ? EXPED.poison : EXPED.hold) + 1, true);
      } else if (kind === 'engine' || kind === 'dens') {
        for (const i of g.blocks!) Object.assign(r.map.blocks[i], { hp: 0, ruined: true });
        steps(r, 0.2);
      } else if (kind === 'prisoners') {
        for (const p of r.props) if (p.kind === 'cage' && g.cages!.some((c) => Math.hypot(c.x - p.x, c.y - p.y) < 0.6)) p.broken = true;
        steps(r, 0.2);
      } else {
        const b = r.allEnemies.find((e) => e.id === g.foe)!;
        Object.assign(b, { hp: 0, act: 'dead', actT: 0, actDur: 99, respawns: false });
        steps(r, 0.2);
      }
      expect(g.done, kind).toBe(true);
    }
  });

  it('pays into the pot for each job done', () => {
    const { run, r } = room(dayWith('engine')), g = r.exped!.goals.find((q) => q.kind === 'engine')!;
    for (const i of g.blocks!) r.map.blocks[i].ruined = true;
    r.step();
    tally(run, r, r.events, 'a');
    expect(run.gold).toBe(Math.round(run.job.reward * EXPED.goalPay));
  });

  it('opens the beacon only once the jobs are done, lights it, holds it (paused while nobody is there), then the watch', () => {
    const { run, r, h } = room(2), x = r.exped!;
    Object.assign(h, { x: x.zone.x, y: x.zone.y });
    steps(r, 3);
    expect(x.phase).toBe('shut');
    expect(goal(run, r).done).toBe(false);
    for (const g of x.goals) (g.done = true), (g.p = 1);
    steps(r, 0.5);
    expect(x.phase).toBe('open');
    steps(r, EXPED.call + 0.2);
    expect(x.phase).toBe('hold');
    // Away from the beacon the hold waits (after its grace).
    Object.assign(h, { x: x.zone.x + 12, y: x.zone.y + 12 });
    steps(r, EXPED.grace + 0.2);
    const held = x.held;
    steps(r, 5);
    expect(x.held).toBe(held);
    Object.assign(h, { x: x.zone.x, y: x.zone.y });
    steps(r, EXPED.extract + 1, true);
    expect(x.phase).toBe('leave');
    expect(goal(run, r).done).toBe(true);
  });

  it('fails when everyone is down', () => {
    const { run, r } = room(2), b = r.join('b');
    for (const h of r.heroes) Object.assign(h, { act: 'down', out: true, hp: 0 });
    tally(run, r, [], 'a');
    expect(run.failed).toBe(true);
    void b;
  });

  it('gets worse on time: a level every EXPED.escalate, and a camp that sees you blows its horn', { timeout: 60000 }, () => {
    const { r, h } = room(5), x = r.exped!;
    expect(x.level).toBe(0);
    Object.assign(h, { x: r.map.hero.x, y: r.map.hero.y });
    r.time = EXPED.escalate - 1;
    steps(r, 2);
    expect(x.level).toBe(1);
    r.time = EXPED.escalate * 3 + 0.5;
    steps(r, 0.5);
    expect(x.level).toBe(3);
    const c = x.camps[0];
    Object.assign(h, { x: c.x, y: c.y + 3 });
    steps(r, 1.5);
    expect(c.alerted).toBe(true);
    expect(c.known).toBe(true);
  });

  it('sends waves out of sight, never past the cap', { timeout: 60000 }, () => {
    const { r, h } = room(6), x = r.exped!;
    Object.assign(h, { x: 48, y: 50 });
    x.heat = 99;
    x.nextWave = 0;
    const before = r.allEnemies.length;
    r.step();
    const fresh = r.allEnemies.slice(before);
    expect(fresh.length).toBe(EXPED.waveSize[0]);
    for (const e of fresh) expect(Math.hypot(e.x - h.x, e.y - h.y)).toBeGreaterThan(17);
    Object.assign(EXPED, { cap: r.allEnemies.filter((e) => e.act !== 'dead').length });
    x.heat = 99;
    x.nextWave = 0;
    const n = r.allEnemies.length;
    r.step();
    expect(r.allEnemies.length).toBe(n);
    EXPED.cap = 200;
  });
});

const sortOf = (f: { kind: string; name?: string; variant?: string; bow?: boolean }) => (f.kind === 'butcher' ? (f.name ? 'named' : 'butcher') : f.variant ?? (f.bow ? 'archer' : 'small'));

describe('the Barrowfields as packs (Kyle: "just big guys and little guys")', () => {
  it('makes each camp, set piece and patrol one pack, specials capped, the new sorts where they belong', () => {
    const met = new Set<string>();
    let flocks = 0;
    for (let d = 1; d <= 12; d++) {
      const p = expedPlan(job(d)), packs = new Map<number, Foe[]>();
      for (const f of p.foes) if (f.pack !== undefined) packs.set(f.pack, [...(packs.get(f.pack) ?? []), f]);
      // Specials capped, and no special alone without its pack (a pack is laid whole, clear of the way in).
      for (const l of packs.values()) expect(l.filter(isSpecial).length).toBeLessThanOrEqual(EXPED_PACKS.specials.camp), expect(l.length).toBeGreaterThan(1);
      // Each camp is one fight; each patrol one pack; the north road's is the log-carriers.
      for (const c of p.camps) expect(new Set(c.foes.map((i) => p.foes[i].pack)).size).toBe(1);
      for (const pt of p.patrols) expect(new Set(pt.foes.map((i) => p.foes[i].pack)).size).toBe(1);
      expect(p.patrols[1].foes.some((i) => p.foes[i].variant === 'log')).toBe(true);
      for (const f of p.foes) {
        met.add(sortOf(f));
        // Blind hunters stay in the mines; a roof archer is up on a roof.
        expect(f.variant).not.toBe('blind');
        if (f.variant === 'roofer') expect(p.map.blocks.some((b) => b.kind === 'house' && f.x > b.x && f.x < b.x + b.w && f.y > b.y && f.y < b.y + b.h && (f.z ?? 0) > 0)).toBe(true);
      }
      flocks += p.map.flocks?.length ?? 0;
      expect(new Set(p.foes.filter(isSpecial).map(sortOf)).size, `day ${d}`).toBeGreaterThanOrEqual(5);
    }
    for (const s of ['wolf', 'keeper', 'netter', 'banner', 'oiler', 'torch', 'roofer', 'log', 'thief']) expect(met.has(s), s).toBe(true);
    expect(flocks).toBeGreaterThan(6);
  });

  it('a party meets more small ones and a tougher centrepiece, not more specials', () => {
    const one = runRoom(newRun(job(4))), four = (() => { const r = newRun(job(4)); r.party = 4; return runRoom(r); })();
    const sp = (r: ArenaRoom) => r.allEnemies.filter((e) => e.role && e.role !== 'fodder' && e.role !== 'wolf').length;
    expect(four.allEnemies.length).toBeGreaterThan(one.allEnemies.length);
    expect(sp(four) - sp(one)).toBeLessThanOrEqual(new Set(one.allEnemies.map((e) => e.pack)).size);
  });

  it('sends waves as packs: wolves and netters early, sappers late, no more specials than a fight can read', { timeout: 60000 }, () => {
    const { r, h } = room(6), x = r.exped!, seen = new Set<string>();
    Object.assign(h, { x: 48, y: 50 });
    for (const level of [0, 5]) for (let i = 0; i < 40; i++) {
      x.level = level;
      const before = r.allEnemies.length;
      wave(r, x, r.heroes, 48, 50, EXPED.waveSize[level]);
      const fresh = r.allEnemies.slice(before);
      expect(new Set(fresh.map((e) => e.pack)).size).toBeLessThanOrEqual(1);
      expect(fresh.filter((e) => special(e)).length).toBeLessThanOrEqual(EXPED_PACKS.specials.wave[level]);
      for (const e of fresh) seen.add(`${level}:${sortOf(e)}`), (e.hp = 0), (e.act = 'dead');
    }
    expect(seen.has('0:sapper')).toBe(false);
    expect(seen.has('5:sapper')).toBe(true);
    expect([...seen].filter((s) => s.startsWith('0:') && s !== '0:small').length).toBeGreaterThan(0);
    // Specials already about: the next wave brings none.
    for (let i = 0; i < EXPED_PACKS.near; i++) Object.assign(r.addFoe('scrapper', h.x + 3, h.y), { variant: 'heavy', role: 'heavy', alert: true });
    for (let i = 0; i < 10; i++) {
      const before = r.allEnemies.length;
      wave(r, x, r.heroes, 48, 50, EXPED.waveSize[5]);
      expect(r.allEnemies.slice(before).filter((e) => special(e)).length).toBe(0);
    }
  });
});

describe('the hold rings (Kyle: "I want the area you can hold to be larger")', () => {
  it('are big enough to roll and kite in, one size drawn and judged', () => {
    expect(EXPED.holdR).toBeGreaterThanOrEqual(6);
    expect(EXPED.extractR).toBeGreaterThanOrEqual(6);
    expect(ringOf('shrine')).toBe(EXPED.holdR);
    expect(ringOf('beacon')).toBe(EXPED.extractR);
    const { r } = room(2);
    expect(r.exped!.zone.r).toBe(ringOf('beacon'));
    // The beacon's ring is on the map, all of it.
    expect(r.exped!.zone.y - r.exped!.zone.r).toBeGreaterThan(0.9);
  });

  it('holds at the edge of the ring, through a short step out, and stops after the grace', { timeout: 60000 }, () => {
    const d = dayWith('shrine'), { r, h } = room(d), g = r.exped!.goals.find((q) => q.kind === 'shrine')!;
    // Nobody yet: nothing.
    Object.assign(h, { x: g.x + EXPED.holdR + 3, y: g.y });
    steps(r, 2);
    expect(g.p).toBe(0);
    // In at the edge (a Ranger kiting): it fills.
    Object.assign(h, { x: g.x + EXPED.holdR - 0.4, y: g.y });
    steps(r, 3, true);
    const p0 = g.p;
    expect(p0).toBeGreaterThan(2.5 / EXPED.hold);
    // A roll out of it: still filling for the grace.
    Object.assign(h, { x: g.x + EXPED.holdR + 3, y: g.y });
    steps(r, EXPED.grace - 0.3);
    expect(g.p).toBeGreaterThan(p0);
    // Out for longer: it stops.
    steps(r, 0.6);
    const p1 = g.p;
    steps(r, 4);
    expect(g.p).toBe(p1);
  });
});

describe('gold on the expedition (Kyle: "A tonnnn of gold drop")', () => {
  it('drops about half the coins of a job, in a fifth of the piles, bigger', () => {
    const rng = new Rng(7), dropped = (coins?: typeof EXPED_COINS) => {
      const ps: Pickup[] = [];
      for (let i = 0; i < 4000; i++) dropPickups({ ...newEnemy(i + 1, 'scrapper', 0, 0), respawns: false }, ps, rng, coins);
      const g = ps.filter((p) => p.gold);
      return { piles: g.length, coins: g.reduce((s, p) => s + p.gold!, 0) };
    };
    const job = dropped(), ex = dropped(EXPED_COINS);
    expect(ex.coins / job.coins).toBeGreaterThan(0.4);
    expect(ex.coins / job.coins).toBeLessThan(0.6);
    expect(ex.piles / job.piles).toBeLessThan(0.3);
    expect(ex.coins / ex.piles).toBeGreaterThan((2 * job.coins) / job.piles);
    // Wolves leave none.
    const ps: Pickup[] = [];
    for (let i = 0; i < 200; i++) dropPickups({ ...newEnemy(i + 1, 'scrapper', 0, 0), variant: 'wolf', respawns: false }, ps, rng, EXPED_COINS);
    expect(ps.filter((p) => p.gold).length).toBe(0);
  });

  it('is what an expedition room drops, and the jobs pay as before', { timeout: 60000 }, () => {
    const { r, h } = room(3), ids = new Set<number>();
    Object.assign(h, { x: 48, y: 50 });
    let seq = 0, kills = 0;
    for (let i = 0; i < 40; i++) {
      const e = r.addFoe('scrapper', h.x, h.y - 1);
      Object.assign(e, { hp: 1, maxHp: 1, alert: true });
      for (let t = 0; t < 60 && e.act !== 'dead'; t++) {
        r.setIntent('a', { ...NO_INTENT, ax: 0, ay: -1, attackSeq: t % 10 === 0 ? ++seq : seq });
        r.step();
        for (const p of r.pickups) if (p.gold) ids.add(p.id), expect(p.gold).toBeGreaterThanOrEqual(EXPED_COINS.scrapper.min);
      }
      if (e.act === 'dead') kills++;
      Object.assign(e, { x: 2, y: 2 });
    }
    expect(kills).toBeGreaterThan(30);
    expect(ids.size).toBeLessThan(kills * 0.45);
    expect(EXPED.goalPay).toBe(0.15);
  });
});
