/**
 * The camp's watch (sim/campguard.ts): crossbows at the posts fell goblins that follow a hero in, pay nothing, and only on a roaming land.
 */
import { describe, expect, it } from 'vitest';
import { landJob } from '../src/shared/territory';
import { TICK } from '../src/shared/tuning';
import { newRun, runRoom, tally, type Run } from '../src/sim/run';
import type { ArenaRoom } from '../src/sim/room';
import { NO_INTENT, type Enemy, type FightEvent } from '../src/sim/types';

type World = { run: Run; room: ArenaRoom; e: Enemy; log: FightEvent[]; ticks: number };

/** The north fields, every goblin put out of the way but one, set down at (x, y) awake and chasing. */
function camp(x: number, y: number, id: 'gatefields' | 'knoll' = 'gatefields'): World {
  const run = { ...newRun(landJob(id, 3)), index: 0 }, room = runRoom(run);
  room.join('me');
  room.setIntent('me', NO_INTENT);
  for (const o of room.allEnemies) Object.assign(o, { hp: 0, act: 'dead', respawns: false });
  const e = room.allEnemies.find((o) => !o.boss && o.kind !== 'nest') ?? room.allEnemies[0];
  Object.assign(e, { hp: e.maxHp, act: 'chase', alert: true, dozing: false, x, y, home: { x, y }, attack: null, respawns: false, boss: false });
  return { run, room, e, log: [], ticks: 0 };
}
/** Step `s` seconds, tallying every `every` ticks (a screen tallies each frame, a test each tick). */
function stepFor(w: World, s: number, every = 1) {
  for (let n = 0; n < Math.round(s / TICK); n++) {
    w.room.step();
    if (++w.ticks % every) continue;
    const ev: FightEvent[] = [];
    tally(w.run, w.room, ev, 'me');
    w.log.push(...ev);
  }
}
const hurt = (w: World) => w.log.some((v) => v.k === 'hit' && v.on === 'enemy');

describe('the camp guards', () => {
  it('lays three posts with a guard standing at each', () => {
    const m = camp(28, 88).room.map;
    expect(m.guards).toHaveLength(3);
    for (const p of m.guards!) expect(m.npcs!.some((n) => n.x === p.x && n.y === p.y && n.look === 'guard' && n.mute)).toBe(true);
  });

  for (const every of [1, 4]) {
    it(`fell a goblin in the middle of the camp within 6 seconds, tallied every ${every === 1 ? 'tick' : 'fourth tick'}`, () => {
      const w = camp(28, 88);
      stepFor(w, 6, every);
      expect(w.e.act).toBe('dead');
      expect(w.log.some((v) => v.k === 'shoot' && v.kind === 'bolt')).toBe(true);
    });
  }

  it('pays the party nothing for it', () => {
    const w = camp(28, 88);
    stepFor(w, 6);
    expect(w.e.act).toBe('dead');
    expect(w.run.xp).toBe(0);
    expect(w.run.kills).toBe(0);
    expect(w.run.gold).toBe(0);
    expect(w.room.drops).toHaveLength(0);
    expect(w.room.pickups).toHaveLength(0);
    expect(Object.values(w.run.board ?? {}).every((s) => s.kills === 0 && s.dealt === 0)).toBe(true);
  });

  it('leave a goblin far from every post alone', () => {
    const w = camp(28, 60);
    Object.assign(w.room.heroes[0], { x: 28, y: 40 });
    stepFor(w, 10);
    expect(hurt(w)).toBe(false);
    expect(w.e.hp).toBe(w.e.maxHp);
  });

  it('never shoot a boss or a nest', () => {
    for (const how of [{ boss: true }, { kind: 'nest' as const }]) {
      const w = camp(28, 88);
      Object.assign(w.e, how, { act: 'idle', alert: false });
      stepFor(w, 6);
      expect(w.e.unpaid).toBeFalsy();
      expect(w.e.hp).toBe(w.e.maxHp);
    }
  });

  it('are silent on a land that does not roam, even with posts added by hand', () => {
    const w = camp(28, 88, 'knoll');
    expect(w.run.job.roam).toBeFalsy();
    w.room.map.guards = [{ x: w.e.x, y: w.e.y, r: 9 }];
    stepFor(w, 6);
    expect(w.log.some((v) => v.k === 'shoot')).toBe(false);
    expect(w.e.hp).toBe(w.e.maxHp);
  });
});
