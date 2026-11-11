/**
 * Instances (docs/design/instances.md): the frame (areas taken in turn, gates that open on their named ones
 * and take the whole party, checkpoints, goblins dozing till a hero is near) and the first one, the Open Cut
 * (shared/instances.ts): Rakehead's rows, the workings, the washing floor, the Haulier's working.
 */
import { describe, expect, it } from 'vitest';
import { openCut, INSTANCES, areaOf } from '../src/shared/instances';
import { HAUL_NAME } from '../src/shared/bosswords';
import { CUT_NAMES } from '../src/shared/opencutwords';
import { DROVER, HERO, INSTANCE, PARTY, TICK } from '../src/shared/tuning';
import { damage } from '../src/sim/damage';
import { newRun, runRoom, tally, type Run } from '../src/sim/run';
import { goal } from '../src/sim/goal';
import { stepCheckpoint, wiped } from '../src/sim/checkpoint';
import { isDead } from '../src/sim/damage';
import type { ArenaRoom } from '../src/sim/room';
import { NO_INTENT, type Hero } from '../src/sim/types';
import { walkable } from './walk';

const job = (d = 12) => openCut(d);
function area(i: number, ids = ['me'], d = 12): { run: Run; room: ArenaRoom; hs: Hero[] } {
  const run = newRun(job(d));
  Object.assign(run, { index: i, party: ids.length });
  const room = runRoom(run), hs = ids.map((id) => room.join(id));
  for (const id of ids) room.setIntent(id, NO_INTENT);
  return { run, room, hs };
}
const step = (room: ArenaRoom, s: number) => {
  for (let n = 0; n < Math.round(s / TICK); n++) room.step();
};
const fall = (h: Hero, out = false) => Object.assign(h, { hp: 0, act: 'down', actT: out ? PARTY.bleed : 0, actDur: HERO.respawn, ...(out ? { out: true, bleeding: true, selfUp: true } : {}) });

describe('the Open Cut on the board', () => {
  it('is four areas, the last the Haulier in its working', () => {
    const j = job();
    expect(j.instance).toBe('opencut');
    expect(j.rooms).toBe(INSTANCES.opencut.areas.length);
    expect(j.rooms).toBe(4);
    expect(j.arena).toBe('haulier');
    expect(j.boss).toBe(HAUL_NAME);
    expect(areaOf(j, 3).plan).toBeUndefined();
  });
  it('is the same job, and the same areas, for the same day', () => {
    expect(job(30)).toEqual(job(30));
    for (const a of INSTANCES.opencut.areas.slice(0, 3)) expect(JSON.stringify(a.plan!(job(30)))).toBe(JSON.stringify(a.plan!(job(30))));
  });
});

describe('each area', () => {
  const plans = INSTANCES.opencut.areas.slice(0, 3).map((a) => a.plan!);
  it('can be walked from the way in to its gate, every goblin, cage and chest, by every day', { timeout: 30000 }, () => {
    for (const d of [1, 12, 77]) plans.forEach((plan, i) => {
      const p = plan(job(d)), w = walkable(p, [], true), m = p.map;
      expect(w.reach(m.exit!.x + m.exit!.w / 2, 1.2, 1.2), `${d} area ${i} gate`).toBe(true);
      for (const f of p.foes) expect(w.reach(f.x, f.y, 1.4), `${d} area ${i} foe at ${f.x},${f.y}`).toBe(true);
      for (const c of [...p.props.filter((q) => q.kind === 'cage'), ...p.chests]) expect(w.reach(c.x, c.y, 1.6), `${d} area ${i} at ${c.x},${c.y}`).toBe(true);
      for (const f of p.foes) expect(f.x > 0 && f.x < m.w && f.y > 0 && f.y < m.h).toBe(true);
    });
  });
  it('has its named ones, none a butcher, THE DROVER driving the roped line, and runs bottom to top', () => {
    const names = [[CUT_NAMES.drover], [CUT_NAMES.brakesman], [CUT_NAMES.sluicer, CUT_NAMES.raker]];
    plans.forEach((plan, i) => {
      const p = plan(job());
      expect(p.foes.filter((f) => f.name).map((f) => f.name)).toEqual(names[i]);
      expect(p.foes.filter((f) => f.name).every((f) => f.kind !== 'butcher')).toBe(true);
      if (i === 0) expect(p.foes.find((f) => f.name)!.task?.k).toBe('escort');
      expect(p.map.hero.y).toBeGreaterThan(p.map.h - 3);
      expect(p.map.exit!.y).toBe(0);
    });
  });
});

describe('the frame', () => {
  it('builds each area dozing beyond an area`s reach, the pacing rules on; the last is the Haulier`s arena', () => {
    for (let i = 0; i < 3; i++) {
      const { room } = area(i);
      expect(room.sleepFar).toBe(true);
      expect(room.sleepAt).toEqual({ wake: INSTANCE.wake, doze: INSTANCE.doze });
      expect(room.pace).toEqual({ index: i });
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

  it('opens the gate when the area`s named one is dead, the rest and the cages left as they are', () => {
    const { run, room } = area(0);
    const before = goal(run, room);
    expect(before.done).toBe(false);
    expect(before.text).toContain(`Kill ${CUT_NAMES.drover}`);
    const k = room.enemies.find((e) => e.name)!;
    Object.assign(k, { hp: 0, act: 'dead' });
    expect(isDead(k)).toBe(true);
    const after = goal(run, room);
    expect(after.done).toBe(true);
    expect(after.text).toContain('Way on: north');
    expect(room.enemies.filter((e) => !isDead(e)).length).toBeGreaterThan(5);
  });

  it('alone, going down is a wipe: a beat, then up at the gate whole, the goblins back where they were put', () => {
    const { run, room, hs } = area(0), h = hs[0], g = room.enemies.find((e) => !e.task && !e.name)!;
    Object.assign(g, { x: g.x + 3, hp: 1, alert: true });
    Object.assign(h, { x: 11, y: 20 });
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

  it('stands behind its roped line: a blow lands at a quarter, and says so', () => {
    const { room, drover, roped } = rows();
    step(room, 0.1);
    expect(roped().length).toBe(3);
    expect(drover.screened).toBe(true);
    // (Against the same blow on it bare: the heavy's own toughness trims both alike.)
    drover.screened = false;
    let hp = drover.hp;
    damage(drover, 80, room.time, []);
    const full = hp - drover.hp, ev: never[] = [];
    drover.screened = true;
    hp = drover.hp;
    damage(drover, 80, room.time, ev);
    expect(hp - drover.hp).toBe(Math.max(1, Math.round(full * DROVER.screen)));
    expect((ev as { k: string }[]).some((e) => e.k === 'deflect')).toBe(true);
  });

  it('standing still by a roped digger cuts the whole line loose; the Drover leaves it and takes blows in full', () => {
    const { room, hs, drover, roped } = rows();
    step(room, 0.1);
    const d = roped()[0], h = hs[0], seen: string[] = [];
    // Kept by a digger: they don't walk on while it's being cut (the guards are drawn off to fight).
    const stand = () => Object.assign(h, { x: d.x + 0.6, y: d.y, act: 'idle', moving: false, kvx: 0, kvy: 0, safeT: 99 });
    for (let n = 0; n < Math.round((DROVER.cut + 0.3) / TICK) && roped().length; n++) stand(), room.step(), seen.push(...room.events.map((e) => e.k));
    expect(roped().length).toBe(0);
    expect(seen).toContain('cutloose');
    expect(drover.screened).toBe(false);
    expect(drover.task?.k === 'escort' && drover.task.quit).toBe(true);
    const hp = drover.hp, ev: never[] = [];
    damage(drover, 40, room.time, ev);
    expect(hp - drover.hp).toBeGreaterThan(Math.round(40 * DROVER.screen) + 5);
    expect((ev as { k: string }[]).some((e) => e.k === 'deflect')).toBe(false);
  });

  it('keeps the line roped at the top if it gets there: never lost, so letting it walk is no way round it', () => {
    const { room, roped } = rows();
    step(room, 60);
    expect(roped().length).toBe(3);
    expect(room.survivors.some((v) => v.gone)).toBe(false);
    const drover = room.enemies.find((e) => e.name === CUT_NAMES.drover)!;
    expect(isDead(drover)).toBe(false);
    expect(drover.screened).toBe(true);
  });
});
