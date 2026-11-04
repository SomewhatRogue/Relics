import { describe, expect, it } from 'vitest';
import { expedPlan, GOALS } from '../src/shared/expedmap';
import { expedition } from '../src/shared/expedjob';
import { EXPED } from '../src/shared/tuning';
import { newRun, runRoom, tally, goal } from '../src/sim/run';
import { NO_INTENT } from '../src/sim/types';
import type { ArenaRoom } from '../src/sim/room';
import type { XGoal } from '../src/sim/exped';
import { walkable } from './walk';

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
    // Away from the beacon the hold waits.
    Object.assign(h, { x: x.zone.x + 12, y: x.zone.y + 12 });
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
