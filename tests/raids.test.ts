/**
 * Raiding parties on a roaming land (sim/raids.ts): timed on the room's own stream, formed out of sight and clear of the
 * shelters and the camp, awake on the march, one pack of 900 up, closing on the hero, leaving when left alone; none off a
 * roaming land.
 */
import { describe, expect, it } from 'vitest';
import { landJob } from '../src/shared/territory';
import { RAID, TICK } from '../src/shared/tuning';
import { newRun, runRoom, tally, type Run } from '../src/sim/run';
import { raidNow } from '../src/sim/raids';
import { nearestPt, roadsOf } from '../src/sim/raidroads';
import { jobJson, loadRoom, saveRoom } from '../src/client/coop';
import type { ArenaRoom } from '../src/sim/room';
import { NO_INTENT, type Enemy, type FightEvent, type Hero } from '../src/sim/types';

type World = { run: Run; room: ArenaRoom; h: Hero; log: FightEvent[] };
const ROAD = { x: 37, y: 64 };

/** One hero on the north fields' road in the pasture, every planned goblin dead (only raids walk). */
function land(id: 'gatefields' | 'knoll' | 'fenroam' = 'gatefields', seed = 3, at = ROAD): World {
  const run = { ...newRun(landJob(id, seed)), index: 0 }, room = runRoom(run), h = room.join('me');
  room.setIntent('me', NO_INTENT);
  for (const e of room.allEnemies) Object.assign(e, { hp: 0, act: 'dead', respawns: false });
  Object.assign(h, at);
  return { run, room, h, log: [] };
}
const stepFor = (w: World, s: number, each?: () => boolean | void) => {
  for (let n = 0; n < Math.round(s / TICK); n++) {
    w.room.step();
    w.log.push(...w.room.events);
    const ev: FightEvent[] = [];
    tally(w.run, w.room, ev, 'me');
    if (each?.()) return;
  }
};
const calls = (w: World) => w.log.filter((e): e is Extract<FightEvent, { k: 'raid' }> => e.k === 'raid');
const raiders = (w: World): Enemy[] => w.room.allEnemies.filter((e) => e.pack !== undefined && e.pack >= RAID.pack0 && e.act !== 'dead');
const far = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
/** Hold the hero still where they stand (the land's falls aside). */
const hold = (w: World, at: { x: number; y: number }) => () => void Object.assign(w.h, { x: at.x, y: at.y, hp: w.h.maxHp });

describe('raiding parties', () => {
  it('none before the first time; one after it, of 4 to 7, out of sight, awake, one pack of 900 up', () => {
    const w = land();
    stepFor(w, RAID.first[0] - 1, hold(w, ROAD));
    expect(calls(w)).toHaveLength(0);
    stepFor(w, RAID.first[1] - RAID.first[0] + 2, () => (hold(w, ROAD)(), calls(w).length > 0));
    expect(calls(w)).toHaveLength(1);
    const rs = raiders(w), c = calls(w)[0];
    expect(rs.length).toBeGreaterThanOrEqual(4);
    expect(rs.length).toBeLessThanOrEqual(7);
    expect(new Set(rs.map((e) => e.pack)).size).toBe(1);
    expect(rs[0].pack).toBeGreaterThanOrEqual(900);
    expect(far(c, w.h)).toBeGreaterThanOrEqual(RAID.from[0]);
    for (const e of rs) expect(far(e, w.h)).toBeGreaterThan(18);
    stepFor(w, 2, hold(w, ROAD));
    for (const e of raiders(w)) expect(e.dozing).toBe(false), expect(e.alert).toBe(false);
  });

  it('closes on the hero over time, and fights them as a pack', () => {
    const w = land();
    raidNow(w.room);
    stepFor(w, 0.2, hold(w, ROAD));
    const d0 = Math.min(...raiders(w).map((e) => far(e, w.h)));
    // (Along the road: it may turn away a moment where a path joins it.)
    stepFor(w, 25, () => (hold(w, ROAD)(), raiders(w).some((e) => e.alert === true)));
    const d1 = Math.min(...raiders(w).map((e) => far(e, w.h)));
    expect(d1).toBeLessThan(d0 - 6);
    stepFor(w, 40, () => (hold(w, ROAD)(), raiders(w).some((e) => e.alert === true)));
    expect(raiders(w).every((e) => e.alert === true)).toBe(true);
  });

  it('never forms within 20 of a shelter or the camp', () => {
    const w = land(), m = w.room.map;
    // Wherever the hero waits on the road (by the barn, the hut, the camp), it forms well clear of all of them.
    for (const at of [{ x: 41, y: 84 }, { x: 38, y: 38 }, { x: 42, y: 127 }, { x: 45, y: 20 }, { x: 35, y: 115 }, ROAD]) {
      for (const e of raiders(w)) Object.assign(e, { hp: 0, act: 'dead', escaped: true });
      raidNow(w.room);
      stepFor(w, 0.1, hold(w, at));
    }
    expect(calls(w).length).toBeGreaterThanOrEqual(5);
    for (const c of calls(w)) {
      for (const s of m.stations!) expect(far(c, s)).toBeGreaterThanOrEqual(20 + s.r);
      for (const g of m.guards!) expect(far(c, g)).toBeGreaterThanOrEqual(20);
    }
  });

  it('the same seed gives the same raids', () => {
    const go = () => {
      const w = land();
      stepFor(w, RAID.first[1] + 1, hold(w, ROAD));
      raidNow(w.room);
      stepFor(w, 1, hold(w, ROAD));
      return { at: calls(w).map((c) => [c.x, c.y]), who: raiders(w).map((e) => [e.id, e.variant ?? '', e.bow ?? false, Math.round(e.x * 100)]) };
    };
    const a = go(), b = go();
    expect(a.at.length).toBe(2);
    expect(a).toEqual(b);
  });

  it('left alone (its hero safe in a shelter, or its time up), it marches off and is gone', () => {
    const w = land(), barn = w.room.map.stations![0];
    raidNow(w.room);
    stepFor(w, 0.1, hold(w, ROAD));
    expect(raiders(w).length).toBeGreaterThan(0);
    stepFor(w, 90, () => (hold(w, { x: barn.x, y: barn.y })(), raiders(w).length === 0));
    expect(raiders(w)).toHaveLength(0);
    expect(w.room.raids!.live).toHaveLength(0);
    // Its time up before it meets anyone: away, never nearer.
    Object.assign(w.h, ROAD);
    raidNow(w.room);
    stepFor(w, 0.1, hold(w, ROAD));
    const d0 = Math.min(...raiders(w).map((e) => far(e, w.h)));
    w.room.raids!.live[0].t0 -= RAID.life;
    let near = Infinity;
    stepFor(w, 60, () => (hold(w, ROAD)(), (near = Math.min(near, ...raiders(w).map((e) => far(e, w.h)))), raiders(w).length === 0));
    expect(raiders(w)).toHaveLength(0);
    expect(near).toBeGreaterThanOrEqual(d0 - 1);
  });

  it('on the fen it forms on the track, of Fenmere kinds, and comes on', () => {
    const at = { x: 46.1, y: 59 }, w = land('fenroam', 3, at);
    raidNow(w.room);
    stepFor(w, 0.1, hold(w, at));
    const rs = raiders(w), d0 = Math.min(...rs.map((e) => far(e, w.h)));
    expect(rs.length).toBeGreaterThanOrEqual(4);
    expect(rs.some((e) => e.role === 'keeper' || e.role === 'wolf')).toBe(false);
    stepFor(w, 25, () => (hold(w, at)(), raiders(w).some((e) => e.alert === true)));
    expect(Math.min(...raiders(w).map((e) => far(e, w.h)))).toBeLessThan(d0 - 6);
  });

  it('a room handed on keeps its raid marching, on its own stream', () => {
    const w = land();
    raidNow(w.room);
    stepFor(w, 1, hold(w, ROAD));
    const room = loadRoom(JSON.parse(jobJson(saveRoom(w.room))));
    room.roam = w.room.roam;
    expect(room.raids!.live).toHaveLength(1);
    const e0 = room.allEnemies.find((e) => e.raid !== undefined)!, x0 = e0.x, y0 = e0.y;
    for (let n = 0; n < 60; n++) room.step();
    const e1 = room.allEnemies.find((e) => e.id === e0.id)!;
    expect(Math.hypot(e1.x - x0, e1.y - y0)).toBeGreaterThan(0.5);
  });

  it('a room off the roaming lands has none', () => {
    const w = land('knoll');
    expect(w.run.job.roam).toBeFalsy();
    raidNow(w.room);
    stepFor(w, 2);
    expect(calls(w)).toHaveLength(0);
    expect(w.room.raids?.live ?? []).toHaveLength(0);
  });

  it("goes round a shelter's ring rather than stopping at it (the fen's staithe no longer cuts the track)", () => {
    const w = land('fenroam'), r = roadsOf(w.room.map)!, rings = w.room.map.stations ?? [], track = w.room.map.trails![0];
    const [a, b] = [track[0], track[track.length - 1]].map((p) => r.part[nearestPt(r, p)]);
    expect(a).toBe(b);
    for (const p of r.pts) for (const s of rings) expect(far(p, s)).toBeGreaterThan(s.r + 1);
  });
});
