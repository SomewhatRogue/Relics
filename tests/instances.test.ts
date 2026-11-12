/**
 * Instances (docs/design/instances.md, open-cut-map.md): the frame (gates that open on their named ones and take
 * the whole party, checkpoints, goblins dozing till a hero is near) and the first one, the Open Cut
 * (shared/instances.ts): one map up through Rakehead's rows, the workings and the washing floor, then the Haulier.
 */
import { describe, expect, it } from 'vitest';
import { openCut, INSTANCES, areaOf, CUT_PLACES, OVER_PLACES, UNDER_PLACES } from '../src/shared/instances';
import { votes } from '../src/sim/fork';
import { FORK_WORDS } from '../src/shared/opencutwords';
import { cutMap } from '../src/shared/cutmap';
import { HAUL_NAME } from '../src/shared/bosswords';
import { CUT_NAMES } from '../src/shared/opencutwords';
import { BRAKE, DROVER, HERO, INSTANCE, PAIR, PARTY, TICK } from '../src/shared/tuning';
import { damage } from '../src/sim/damage';
import { ropedNear } from '../src/sim/drover';
import { newRun, runRoom, tally, type Run } from '../src/sim/run';
import { goal } from '../src/sim/goal';
import { stepCheckpoint, wiped } from '../src/sim/checkpoint';
import { isDead } from '../src/sim/damage';
import type { ArenaRoom } from '../src/sim/room';
import { NO_INTENT, type Hero } from '../src/sim/types';
import { walkable } from './walk';

const job = (d = 12) => openCut(d);
/**
 * A place of the Open Cut, the party at its foot: 0 the rows (act 1, Rakehead), 1 the workings (act 2, over the top),
 * 2 the washing floor (act 2, under the hill); 3, the Haulier's arena. `at` turns a place's own (x, y) into its map's.
 */
function area(i: number, ids = ['me'], d = 12): { run: Run; room: ArenaRoom; hs: Hero[]; at: (x: number, y: number) => { x: number; y: number } } {
  const run = newRun(job(d));
  Object.assign(run, { index: [0, 1, 1, 2][i], way: i === 2 ? 1 : i === 1 ? 0 : undefined, party: ids.length });
  const places = [CUT_PLACES, OVER_PLACES, UNDER_PLACES][Math.min(i, 2)];
  const fork = i === 0 ? { name: FORK_WORDS.yard, ways: [FORK_WORDS.over, FORK_WORDS.under] as [string, string] } : undefined;
  const room = runRoom(run), hs = ids.map((id) => room.join(id)), L = cutMap(job(d), places, fork).laid[0];
  for (const id of ids) room.setIntent(id, NO_INTENT);
  if (i < 3) hs.forEach((h, n) => Object.assign(h, { x: L.x0 + L.w / 2 + n * 0.8, y: L.y0 + L.h - 1.6 }));
  return { run, room, hs, at: (x, y) => ({ x: x + L.x0, y: y + L.y0 }) };
}
const step = (room: ArenaRoom, s: number) => {
  for (let n = 0; n < Math.round(s / TICK); n++) room.step();
};
const fall = (h: Hero, out = false) => Object.assign(h, { hp: 0, act: 'down', actT: out ? PARTY.bleed : 0, actDur: HERO.respawn, ...(out ? { out: true, bleeding: true, selfUp: true } : {}) });

describe('the Open Cut on the board', () => {
  it('is three acts: Rakehead, over the top or under the hill, then the Haulier in its working', () => {
    const j = job();
    expect(j.instance).toBe('opencut');
    expect(j.rooms).toBe(INSTANCES.opencut.areas.length);
    expect(j.rooms).toBe(3);
    expect(j.arena).toBe('haulier');
    expect(j.boss).toBe(HAUL_NAME);
    expect(areaOf(j, 1, 0).name).toBe(FORK_WORDS.over);
    expect(areaOf(j, 1, 1).name).toBe(FORK_WORDS.under);
    expect(areaOf(j, 2).plan).toBeUndefined();
  });
  it('is the same job, and the same map, for the same day', () => {
    expect(job(30)).toEqual(job(30));
    const a = INSTANCES.opencut.areas[0];
    expect(JSON.stringify(a.plan!(job(30)))).toBe(JSON.stringify(a.plan!(job(30))));
  });
});

describe('the map and its places', () => {
  const plans = CUT_PLACES.map((p) => p.plan);
  it('can be walked from the foot to the way out, gates open, every goblin, cage and chest, by every day', { timeout: 60000 }, () => {
    for (const d of [1, 12, 77]) for (const plan of [INSTANCES.opencut.areas[0].plan!, ...INSTANCES.opencut.areas[1].ways!.map((w) => w.plan!)]) {
      const p = plan(job(d)), m = p.map;
      for (const st of m.stretches!) if (st.gate !== undefined) m.blocks[st.gate].ruined = true;
      const w = walkable(p, [], true);
      expect(w.reach(m.exit!.x + m.exit!.w / 2, 1.2, 1.2), `${d} the way out`).toBe(true);
      for (const f of p.foes) expect(w.reach(f.x, f.y, 1.4), `${d} foe at ${f.x},${f.y}`).toBe(true);
      for (const c of [...p.props.filter((q) => q.kind === 'cage'), ...p.chests]) expect(w.reach(c.x, c.y, 1.6), `${d} at ${c.x},${c.y}`).toBe(true);
      for (const f of p.foes) expect(f.x > 0 && f.x < m.w && f.y > 0 && f.y < m.h).toBe(true);
    }
  });
  it('is its places in order, a gate shut between each two, the party at the rows` foot, the fork yard last', () => {
    const p = INSTANCES.opencut.areas[0].plan!(job()), m = p.map, st = m.stretches!;
    expect(st.map((s) => s.keep)).toEqual([...CUT_PLACES.map((c) => c.keep), []]);
    expect(st[st.length - 1].name).toBe(FORK_WORDS.yard);
    expect(m.roads!.map((r) => r.label)).toEqual([FORK_WORDS.over, FORK_WORDS.under]);
    expect(st.slice(0, -1).every((s) => m.blocks[s.gate!].kind === 'gate' && !m.blocks[s.gate!].ruined)).toBe(true);
    expect(st[st.length - 1].gate).toBeUndefined();
    expect(m.hero.y).toBeGreaterThan(m.h - 3);
    expect(m.exit!.y).toBe(0);
    // Places a lull apart: no goblin between a gate and the next place's foot.
    const laid = cutMap(job(), CUT_PLACES, { name: FORK_WORDS.yard, ways: [FORK_WORDS.over, FORK_WORDS.under] }).laid;
    for (let i = 1; i < laid.length; i++) expect(p.foes.some((f) => f.y > laid[i].y0 + laid[i].h && f.y < laid[i - 1].y0)).toBe(false);
  });
  it('has its named ones, none a butcher, THE DROVER driving the roped line, and runs bottom to top', () => {
    const names = [[CUT_NAMES.drover], [], [CUT_NAMES.brakesman], [CUT_NAMES.sluicer, CUT_NAMES.raker]];
    plans.forEach((plan, i) => {
      const p = plan(job());
      expect(p.foes.filter((f) => f.name).map((f) => f.name)).toEqual(names[i]);
      expect(p.foes.filter((f) => f.name).every((f) => f.kind !== 'butcher')).toBe(true);
      if (i === 0) expect(p.foes.find((f) => f.name)!.task?.k).toBe('escort');
      // (The reckoning house has no named one: its gate's kept by a pack, sim/stretches.ts.)
      if (i === 1) expect(p.foes.some((f) => f.variant === 'chalker')).toBe(true);
    });
  });
});

describe('the frame', () => {
  it('builds each map dozing beyond an area`s reach, the pacing rules on; then the Haulier`s arena', () => {
    for (const i of [0, 1, 2]) {
      const { room: map } = area(i);
      expect(map.sleepFar).toBe(true);
      expect(map.sleepAt).toEqual({ wake: INSTANCE.wake, doze: INSTANCE.doze });
    }
    const { room } = area(3);
    expect(room.enemies.some((e) => e.boss?.who === 'haulier')).toBe(true);
  });

  it('lets a pack far up the way doze till a hero comes near; the roped line`s guards never doze', () => {
    const { room, hs } = area(0);
    Object.assign(hs[0], { hp: 9999, maxHp: 9999 });
    step(room, 0.2);
    const far = room.enemies.find((e) => e.pack === 6)!;
    expect(far.dozing).toBe(true);
    expect(room.enemies.filter((e) => e.task?.k === 'escort').every((e) => !e.dozing)).toBe(true);
    Object.assign(hs[0], { x: far.x, y: far.y + 8 });
    step(room, 0.2);
    expect(far.dozing).toBe(false);
  });

  it('readies the gate when the place`s named one is dead, the rest and the cages left as they are', () => {
    const { run, room } = area(0);
    const before = goal(run, room);
    expect(before.done).toBe(false);
    expect(before.text).toContain(`kill ${CUT_NAMES.drover}`);
    const k = room.enemies.find((e) => e.name)!;
    Object.assign(k, { hp: 0, act: 'dead' });
    expect(isDead(k)).toBe(true);
    const after = goal(run, room);
    expect(after.done).toBe(false);
    expect(after.text).toContain('at the gate together');
    expect(room.enemies.filter((e) => !isDead(e)).length).toBeGreaterThan(5);
  });

  it('alone, going down is a wipe: a beat, then up at the gate whole, the goblins back where they were put', () => {
    const { run, room, hs, at } = area(0), h = hs[0], g = room.enemies.find((e) => !e.task && !e.name)!;
    Object.assign(g, { x: g.x + 3, hp: 1, alert: true });
    Object.assign(h, at(8, 20));
    fall(h);
    tally(run, room, [], 'me');
    expect(run.downs).toBe(1);
    expect(run.failed).toBe(false);
    expect(run.wipeAt).toBe(room.time);
    // Held down through the beat (alone you'd be up where you fell in HERO.respawn).
    step(room, INSTANCE.regroup - 0.2);
    tally(run, room, [], 'me');
    expect(h.act).toBe('down');
    step(room, 0.4);
    const ev: never[] = [];
    tally(run, room, ev, 'me');
    expect(h.act).toBe('idle');
    expect(h.hp).toBe(h.maxHp);
    expect(Math.hypot(h.x - room.map.hero.x, h.y - room.map.hero.y)).toBeLessThan(1);
    expect(h.safeT).toBeGreaterThan(0);
    expect([g.x, g.y, g.hp, g.alert]).toEqual([g.home.x, g.home.y, g.maxHp, false]);
    expect(run.wipeAt).toBeUndefined();
  });

  it('is built for three: the same goblins, as tough, for one or three; a fourth makes them tougher, never more', () => {
    const one = area(1, ['me']).room, three = area(1, ['a', 'b', 'c']).room, four = area(1, ['a', 'b', 'c', 'd']).room;
    const hp = (r: ArenaRoom) => r.enemies.map((e) => e.maxHp);
    expect(hp(one)).toEqual(hp(three));
    expect(four.enemies.length).toBe(three.enemies.length);
    four.enemies.forEach((e, i) => expect(e.maxHp).toBeGreaterThan(three.enemies[i].maxHp));
    expect(four.enemies.filter((e) => !e.name).every((e) => (e.harm ?? 1) > 1)).toBe(true);
    // The Haulier the same: at three heroes' health for one.
    const h1 = area(3, ['me']).room.enemies.find((e) => e.boss)!, h3 = area(3, ['a', 'b', 'c']).room.enemies.find((e) => e.boss)!;
    expect(h1.maxHp).toBe(h3.maxHp);
  });

  it('is fiercer than a job: every goblin winds up quicker, every pack led by an elite', () => {
    const { room } = area(0);
    expect(room.enemies.every((e) => e.fierce)).toBe(true);
    const plan = INSTANCES.opencut.areas[0].plan!(job());
    const packs = new Set(plan.foes.filter((f) => f.pack && !f.task && !f.name).map((f) => f.pack));
    for (const id of packs) {
      const fs = plan.foes.filter((f) => f.pack === id && !f.name);
      if (fs.length > 1) expect(fs.some((f) => f.elite?.length)).toBe(true);
    }
  });

  it('loses the run at the third wipe since the last gate', () => {
    const { run, room, hs } = area(1);
    run.downs = INSTANCE.wipes - 1;
    fall(hs[0]);
    stepCheckpoint(run, room, []);
    expect(run.failed).toBe(true);
  });

  it('in a party, a wipe is everyone down with nobody to get up on their own; one out walks back to the gate', () => {
    const { run, room, hs } = area(0, ['me', 'pal']);
    fall(hs[0]);
    expect(wiped(room)).toBe(false);
    fall(hs[1], true);
    // (`me` still has its one get-up of the job.)
    expect(wiped(room)).toBe(false);
    Object.assign(hs[0], { act: 'idle', hp: 50 });
    hs[1].actT = PARTY.bleed + INSTANCE.walkBack - 0.05;
    stepCheckpoint(run, room, []);
    expect(hs[1].act).toBe('down');
    hs[1].actT += 0.1;
    stepCheckpoint(run, room, []);
    expect(hs[1].act).toBe('idle');
    expect(hs[1].out).toBe(false);
    expect(Math.hypot(hs[1].x - room.map.hero.x, hs[1].y - room.map.hero.y)).toBeLessThan(1);
    fall(hs[0], true), fall(hs[1], true);
    expect(wiped(room)).toBe(true);
    stepCheckpoint(run, room, []);
    expect(run.downs).toBe(1);
    expect(run.failed).toBe(false);
  });
});

describe('THE DROVER', () => {
  const rows = () => {
    const a = area(0);
    Object.assign(a.hs[0], { hp: 9999, maxHp: 9999 });
    const drover = a.room.enemies.find((e) => e.name === CUT_NAMES.drover)!;
    return { ...a, drover, roped: () => a.room.survivors.filter((v) => v.led && !v.gone) };
  };

  it('takes every blow in full: nothing is ever cut down', () => {
    const { room, drover, roped } = rows();
    step(room, 0.1);
    expect(roped().length).toBe(3);
    const hp = drover.hp, ev: never[] = [];
    damage(drover, 80, room.time, ev);
    expect(hp - drover.hp).toBeGreaterThan(40);
    expect((ev as { k: string }[]).some((e) => e.k === 'deflect')).toBe(false);
  });

  it('CUT FREE (GRAB) by a roped digger cuts the whole line loose; the Drover leaves it, OPEN a while', () => {
    const { room, hs, drover, roped } = rows();
    step(room, 0.1);
    const d = roped()[0], h = hs[0], seen: string[] = [];
    // Kept by a digger: they don't walk on while it's being cut (the guards are drawn off to fight).
    const stand = () => Object.assign(h, { x: d.x + 0.6, y: d.y, act: 'idle', moving: false, kvx: 0, kvy: 0, safeT: 99 });
    // Standing by them does nothing by itself; the button does.
    for (let n = 0; n < Math.round((DROVER.cut + 0.3) / TICK); n++) stand(), room.step();
    expect(roped().length).toBe(3);
    expect(ropedNear(h, room.survivors)).toBe(true);
    room.setIntent(h.id, { ...NO_INTENT, grabSeq: 1 });
    for (let n = 0; n < Math.round((DROVER.cut + 0.3) / TICK) && roped().length; n++) stand(), room.step(), seen.push(...room.events.map((e) => e.k));
    expect(roped().length).toBe(0);
    expect(seen).toContain('cutloose');
    expect(seen).toContain('opened');
    expect(drover.task?.k === 'escort' && drover.task.quit).toBe(true);
    // OPEN: the same blow lands harder now than once it's over.
    let hp = drover.hp;
    damage(drover, 40, room.time, []);
    const open = hp - drover.hp;
    hp = drover.hp;
    damage(drover, 40, room.time + INSTANCE.open.time + 0.1, []);
    expect(open).toBeGreaterThan(hp - drover.hp);
  });

  it('keeps the line roped at the top if it gets there: never lost, so letting it walk is no way round it', () => {
    const { room, roped } = rows();
    step(room, 60);
    expect(roped().length).toBe(3);
    expect(room.survivors.some((v) => v.gone)).toBe(false);
    const drover = room.enemies.find((e) => e.name === CUT_NAMES.drover)!;
    expect(isDead(drover)).toBe(false);
  });
});

describe('THE BRAKESMAN', () => {
  const workings = () => {
    const a = area(1), R = a.room.map.rail!;
    const h = a.hs[0], bk = a.room.enemies.find((e) => e.name === CUT_NAMES.brakesman)!;
    // Out of its reach and out of the lane, but near enough to wake it; nobody else in the way.
    a.room.enemies = a.room.enemies.filter((e) => e === bk);
    Object.assign(h, { ...a.at(14, 12.4), hp: 9999, maxHp: 9999 });
    const carts = () => a.room.props.filter((p) => p.kind === 'cart' && Math.abs(p.y - R.y) < 0.01);
    return { ...a, h, bk, carts, R };
  };
  const hold = (room: ArenaRoom, h: Hero, at: { x: number; y: number }, s: number, seq: number) => {
    room.setIntent(h.id, { ...NO_INTENT, grabSeq: seq });
    for (let n = 0; n < Math.round(s / TICK); n++) Object.assign(h, { x: at.x + 0.9, y: at.y + 0.2, kvx: 0, kvy: 0, safeT: 99 }), room.step();
  };

  it('works its brake at the top of the rail', () => {
    const { room, bk } = workings();
    step(room, 0.2);
    expect(room.map.rail).toBeDefined();
    expect(Math.hypot(bk.x - bk.home.x, bk.y - bk.home.y)).toBeLessThan(0.05);
  });

  it('lets a cart go: its lane striped a moment, then down the rail, knocking flat whoever`s in it', () => {
    const { room, h, carts, R } = workings();
    step(room, BRAKE.warn + 0.1);
    const c = carts().find((p) => p.goAt !== undefined)!;
    expect(c.x).toBeCloseTo(R.x0);
    step(room, BRAKE.warn - 0.1);
    expect(c.roll ?? 0).toBe(0);
    Object.assign(h, { x: 10, y: R.y });
    const seen: { k: string; on?: string }[] = [];
    for (let n = 0; n < Math.round(3 / TICK); n++) room.step(), seen.push(...(room.events as { k: string; on?: string }[]));
    expect(seen.some((e) => e.k === 'cart' && e.on === h.id)).toBe(true);
    // At the bottom, a cart's length short of the one already there.
    expect(c.roll ?? 0).toBe(0);
    expect(c.x).toBeGreaterThan(R.x1 - 1.5);
  });

  it('a cart sent back up knocks it off its brake: stunned and OPEN, no carts; then it walks back to it', () => {
    const { room, h, bk, carts, at } = workings();
    step(room, 0.2);
    const bottom = carts().find((p) => !p.goAt && !p.roll)!;
    // (Wait out the first cart's run, out of its lane.)
    step(room, BRAKE.warn + 3);
    hold(room, h, bottom, BRAKE.grab + 0.2, 1);
    // (The head of the queue goes: the first cart had run down against this one.)
    expect(carts().some((p) => (p.roll ?? 0) < 0)).toBe(true);
    const hp = bk.hp;
    room.setIntent(h.id, { ...NO_INTENT, grabSeq: 1 });
    for (let n = 0; n < Math.round(3 / TICK) && bk.act !== 'stunned'; n++) Object.assign(h, at(14, 12.4)), room.step();
    expect(bk.act).toBe('stunned');
    expect(bk.hp).toBeLessThan(hp);
    expect(bk.takes).toBe(INSTANCE.open.mult);
    expect(bk.openUntil).toBeGreaterThan(room.time);
    expect(bk.brakes!.off).toBeGreaterThan(room.time + BRAKE.off - 0.5);
    // No new cart while it's off; back at its post and braced after.
    const top = Math.max(...carts().map((p) => p.id));
    step(room, BRAKE.off - 1);
    expect(Math.max(...carts().map((p) => p.id))).toBe(top);
    // (A hero standing close by: it walks back all the same.)
    step(room, 1.2);
    Object.assign(h, { x: bk.x + 1.2, y: bk.y + 0.6 });
    for (let n = 0; n < Math.round(8 / TICK); n++) Object.assign(h, { x: bk.home.x + 2.2, y: bk.home.y - 1.4, safeT: 99 }), room.step();
    expect(Math.hypot(bk.x - bk.home.x, bk.y - bk.home.y)).toBeLessThan(0.4);
  });
});

describe('THE SLUICER and THE RAKER', () => {
  const floor = () => {
    const a = area(2), h = a.hs[0], at = a.at;
    const sl = a.room.enemies.find((e) => e.name === CUT_NAMES.sluicer)!, rk = a.room.enemies.find((e) => e.name === CUT_NAMES.raker)!;
    a.room.enemies = [sl, rk];
    Object.assign(h, { ...at(12, 13), hp: 9999, maxHp: 9999, safeT: 999 });
    step(a.room, 0.1);
    const kos = (e: typeof sl) => {
      const ev: never[] = [];
      damage(e, 99999, a.room.time, ev);
      return ev as { k: string }[];
    };
    return { ...a, h, sl, rk, kos };
  };

  it('the Sluicer falls in the water while the Raker stands: not dead, and nothing lands on it', () => {
    const { room, sl, kos } = floor();
    expect(kos(sl).some((e) => e.k === 'pairfell')).toBe(true);
    expect(isDead(sl)).toBe(false);
    expect(sl.fallen).toBe(room.time);
    const hp = sl.hp;
    damage(sl, 500, room.time, []);
    expect(sl.hp).toBe(hp);
  });

  it('the Raker walks to it and stands it up again at half its health', () => {
    const { room, sl, rk, kos } = floor();
    kos(sl);
    const seen: string[] = [];
    for (let n = 0; n < Math.round(12 / TICK) && sl.fallen !== undefined; n++) room.step(), seen.push(...room.events.map((e) => e.k));
    expect(seen).toContain('pairup');
    expect(sl.fallen).toBeUndefined();
    expect(sl.hp).toBe(Math.round(sl.maxHp * PAIR.back));
    expect(Math.hypot(sl.x - rk.x, sl.y - rk.y)).toBeLessThan(sl.radius + rk.radius + PAIR.reach + 0.3);
  });

  it('a stun on the Raker starts its lift over', () => {
    const { room, sl, rk, kos } = floor();
    kos(sl);
    for (let n = 0; n < Math.round(10 / TICK) && (rk.lift ?? 0) < PAIR.lift / 2; n++) room.step();
    expect(rk.lift).toBeGreaterThan(0);
    Object.assign(rk, { act: 'stunned', actT: 0, actDur: 1 });
    room.step();
    expect(rk.lift).toBe(0);
    expect(sl.fallen).toBeDefined();
  });

  it('kill the Raker while it lies there and the Sluicer is dead too; the Raker first, and the Sluicer dies as any', () => {
    const a = floor();
    a.kos(a.sl);
    a.kos(a.rk);
    expect(isDead(a.rk)).toBe(true);
    a.room.step();
    expect(isDead(a.sl)).toBe(true);
    expect(goal(a.run, a.room).done).toBe(true);
    const b = floor();
    b.kos(b.rk);
    expect(b.kos(b.sl).some((e) => e.k === 'death')).toBe(true);
    expect(isDead(b.sl)).toBe(true);
  });

  it('says to kill them close together while both are about', () => {
    const { run, room } = floor();
    expect(goal(run, room).text).toContain('close together');
  });
});

describe('the fork yard', () => {
  const yard = (ids: string[]) => {
    const a = area(0, ids), m = a.room.map, st = m.stretches!;
    for (const s of st) if (s.gate !== undefined) m.blocks[s.gate].ruined = true;
    Object.assign(a.run, { stretch: st.length - 1 });
    for (const e of a.room.allEnemies) if (e.name) Object.assign(e, { hp: 0, act: 'dead' });
    const on = (h: Hero, way: number) => {
      const r = m.roads![way].area;
      Object.assign(h, { x: r.x + r.w / 2, y: r.y + r.h / 2, safeT: 99 });
    };
    const tick = () => (a.room.step(), tally(a.run, a.room, a.room.events, ids[0]));
    return { ...a, on, tick };
  };

  it('asks the party to pick a way, and decides nothing till everyone stands on one', () => {
    const { run, room, hs, on, tick } = yard(['a', 'b', 'c']);
    expect(goal(run, room).text).toContain(FORK_WORDS.vote);
    on(hs[0], 0), on(hs[1], 0);
    tick();
    expect(run.way).toBeUndefined();
    expect(votes(room).on).toEqual([2, 0]);
  });

  it('goes the way most of the party stands on, once all of it is lined up', () => {
    const { run, room, hs, on, tick } = yard(['a', 'b', 'c']);
    on(hs[0], 1), on(hs[1], 1), on(hs[2], 0);
    tick();
    expect(run.way).toBe(1);
    expect(goal(run, room)).toEqual({ text: expect.stringContaining(FORK_WORDS.on(FORK_WORDS.under)), done: true });
    // The next map is that way's.
    run.index = 1;
    expect(runRoom(run).map.stretches![0].keep).toEqual(UNDER_PLACES[0].keep);
  });

  it('a tie decides nothing; alone, your way is the way', () => {
    const two = yard(['a', 'b']);
    two.on(two.hs[0], 0), two.on(two.hs[1], 1);
    two.tick();
    expect(two.run.way).toBeUndefined();
    const one = yard(['me']);
    one.on(one.hs[0], 0);
    one.tick();
    expect(one.run.way).toBe(0);
  });
});

describe('the reckoning house', () => {
  it('its gate is kept by the pack at the back door: the goal says so, and it opens once they are dead', () => {
    const a = area(0), m = a.room.map, st = m.stretches!;
    m.blocks[st[0].gate!].ruined = true;
    Object.assign(a.run, { stretch: 1 });
    expect(st[1].name).toBe('THE RECKONING HOUSE');
    expect(goal(a.run, a.room).text).toContain('Kill the goblins keeping the gate');
    for (const e of a.room.allEnemies) if (st[1].packs!.includes(e.pack ?? -1)) Object.assign(e, { hp: 0, act: 'dead' });
    expect(goal(a.run, a.room).text).toContain('at the gate together');
  });
});
