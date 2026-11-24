/**
 * Falling and resting on a roaming land (sim/landrules.ts): one self revive a trip, a wipe that is never a loss and wakes at
 * the last way station rested at, safe ground at a station's ring. A job without `roam` is left as it was.
 */
import { describe, expect, it } from 'vitest';
import { landJob } from '../src/shared/territory';
import { HERO, INSTANCE, LAND, PARTY, TICK } from '../src/shared/tuning';
import { newRun, runRoom, tally, type Run } from '../src/sim/run';
import type { ArenaRoom } from '../src/sim/room';
import { NO_INTENT, type FightEvent, type Hero } from '../src/sim/types';

type World = { run: Run; room: ArenaRoom; h: Hero; log: FightEvent[] };

/** One hero on the land, every goblin put out of the way (the rules are what's under test, not the fight). */
function land(id: 'gatefields' | 'knoll'): World {
  const run = { ...newRun(landJob(id, 3)), index: 0 }, room = runRoom(run), h = room.join('me');
  room.setIntent('me', NO_INTENT);
  for (const e of room.allEnemies) Object.assign(e, { hp: 0, act: 'dead', respawns: false });
  return { run, room, h, log: [] };
}
const stepFor = (w: World, s: number, each?: () => void) => {
  for (let n = 0; n < Math.round(s / TICK); n++) {
    w.room.step();
    const ev: FightEvent[] = [];
    tally(w.run, w.room, ev, 'me');
    w.log.push(...ev);
    each?.();
  }
};
const fall = (h: Hero) => Object.assign(h, { hp: 0, act: 'down', actT: 0, actDur: HERO.respawn });
const station = (w: World) => w.room.map.stations![0];
const into = (w: World, h: Hero) => Object.assign(h, { x: station(w).x, y: station(w).y - 1.5 });

describe('falling on the land', () => {
  it('has a station and is a roaming job', () => {
    const w = land('gatefields');
    expect(w.run.job.roam).toBe(true);
    expect(station(w).r).toBeGreaterThan(1);
  });

  it('gets a lone hero up once by themselves; the second time they stay down till the wipe wakes them at the way in', () => {
    const w = land('gatefields'), { h, run, room } = w;
    fall(h);
    stepFor(w, HERO.respawn - 0.3);
    expect(h.act).toBe('down');
    stepFor(w, 0.6);
    expect(h.act).toBe('idle');
    expect(h.hp).toBe(Math.round(h.maxHp * PARTY.upHp));
    expect(h.selfUp).toBe(true);
    expect(run.downs).toBe(0);
    // Down again: no get-up left; the wipe's beat holds them, then they wake whole at the way in with it back.
    fall(h);
    stepFor(w, INSTANCE.regroup - 0.5);
    expect(h.act).toBe('down');
    stepFor(w, 1);
    expect(h.act).toBe('idle');
    expect(h.hp).toBe(h.maxHp);
    expect(h.selfUp).toBe(false);
    expect(Math.hypot(h.x - room.map.hero.x, h.y - room.map.hero.y)).toBeLessThan(1);
    expect(run.failed).toBe(false);
    expect(run.downs).toBe(0);
  });

  it('never loses the trip, however many times the party wipes', () => {
    const w = land('gatefields');
    for (let i = 0; i < 5; i++) {
      w.h.selfUp = true;
      fall(w.h);
      stepFor(w, INSTANCE.regroup + 0.5);
      expect(w.h.act).toBe('idle');
    }
    expect(w.run.failed).toBe(false);
  });
});

describe('resting at a way station', () => {
  it('makes it the rest point, restores the self revive, and says so once', () => {
    const w = land('gatefields'), { h, run } = w;
    h.selfUp = true;
    into(w, h);
    stepFor(w, LAND.rest - 0.5);
    expect(w.log.filter((e) => e.k === 'rested')).toHaveLength(0);
    expect(h.selfUp).toBe(true);
    stepFor(w, 1);
    expect(h.selfUp).toBe(false);
    expect(run.rest).toEqual({ x: h.x, y: h.y });
    stepFor(w, 4);
    expect(w.log.filter((e) => e.k === 'rested')).toEqual([{ k: 'rested', x: h.x, y: h.y, id: 'me', station: station(w).name }]);
  });

  it('wakes a wipe at the station rested at', () => {
    const w = land('gatefields'), { h, run, room } = w;
    into(w, h);
    stepFor(w, LAND.rest + 0.5);
    expect(run.rest).toBeDefined();
    Object.assign(h, { x: 20, y: 20, selfUp: true });
    fall(h);
    stepFor(w, INSTANCE.regroup + 0.5);
    expect(h.act).toBe('idle');
    expect(Math.hypot(h.x - station(w).x, h.y - station(w).y)).toBeLessThanOrEqual(station(w).r);
    expect(Math.hypot(h.x - room.map.hero.x, h.y - room.map.hero.y)).toBeGreaterThan(5);
  });
});

describe('safe ground', () => {
  it('keeps a chasing goblin out of the ring, and it gives the hero up and goes home', () => {
    const w = land('gatefields'), { h, room } = w, s = station(w);
    const e = room.allEnemies.find((x) => x.kind === 'butcher' || !x.boss && !x.name) ?? room.allEnemies[0];
    const home = { x: s.x, y: s.y - s.r - 4.5 };
    Object.assign(e, { hp: e.maxHp, act: 'chase', alert: true, dozing: false, x: home.x, y: home.y, home, attack: null, respawns: true });
    into(w, h);
    h.safeT = 999;
    let gave = false, nearest = Infinity;
    stepFor(w, 10, () => {
      nearest = Math.min(nearest, Math.hypot(e.x - s.x, e.y - s.y));
      if (e.homing && !e.alert) gave = true;
    });
    expect(nearest).toBeGreaterThanOrEqual(s.r - 1e-6);
    expect(gave).toBe(true);
    expect(Math.hypot(e.x - home.x, e.y - home.y)).toBeLessThan(1);
  });

  it('stops a goblin whose step would take it inside at the ring`s edge', () => {
    const w = land('gatefields'), { h, room } = w, s = station(w), e = room.allEnemies[0];
    Object.assign(e, { hp: e.maxHp, act: 'idle', alert: false, dozing: false, x: s.x + s.r - 1, y: s.y });
    h.x = s.x;
    h.y = s.y + 1;
    stepFor(w, TICK * 2);
    expect(Math.hypot(e.x - s.x, e.y - s.y)).toBeGreaterThanOrEqual(s.r - 1e-6);
  });
});

describe('any other job', () => {
  it('goes down the checkpoint way, no land rule run', () => {
    const w = land('knoll'), { h, run, room } = w;
    expect(run.job.roam).toBeFalsy();
    Object.assign(h, { x: room.map.hero.x + 5, y: room.map.hero.y });
    fall(h);
    stepFor(w, 0.2);
    expect(run.downs).toBe(1);
    expect(run.wipeAt).toBeDefined();
    stepFor(w, INSTANCE.regroup + 0.5);
    expect(h.act).toBe('idle');
    expect(h.hp).toBe(h.maxHp);
    expect(Math.hypot(h.x - room.map.hero.x, h.y - room.map.hero.y)).toBeLessThan(1);
    expect(h.restT).toBeUndefined();
    expect(run.rest).toBeUndefined();
  });
});
