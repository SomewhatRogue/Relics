/** The Rogue's long cut (shared/cuttune.ts, sim/samuraicut.ts): the stance and its line, the slash through
 *  everything on it, the wait while the blade goes away, then the cut landing all at once. */
import { describe, expect, it } from 'vitest';
import { CUT, CUT_TOTAL } from '../src/shared/cuttune';
import { TICK } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { lineEnd, offLine } from '../src/sim/samuraicut';
import { NO_INTENT, type FightEvent, type Intent } from '../src/sim/types';

/** A Rogue taught the cut at (9, 12) facing up; goblins at each spot, idle. */
function yard(at: [number, number][]) {
  const room = new ArenaRoom(1, { scrappers: false, props: false });
  const h = room.join('me');
  Object.assign(h, { weapon: 'daggers', x: 9, y: 12, fx: 0, fy: -1, safeT: 0, deepSkill: 'cut' });
  room.enemies = at.map(([x, y], i) => Object.assign(newEnemy(10 + i, 'scrapper', x, y), { cooldown: 99, hp: 140, maxHp: 140, alert: true, respawns: false }));
  const run = (s: number, i: Partial<Intent> = {}): FightEvent[] => {
    const out: FightEvent[] = [];
    room.setIntent('me', { ...NO_INTENT, ...i });
    for (let k = 0; k < Math.round(s / TICK); k++) {
      room.step();
      out.push(...room.events);
      for (const e of room.enemies) e.cooldown = 99;
    }
    return out;
  };
  return { room, h, es: room.enemies, run };
}

describe('the long cut', () => {
  it('the line stops at a wall, and a point is on it by its distance', () => {
    const end = lineEnd(9, 12, 0, -1, 50);
    expect(end.y).toBeGreaterThan(0);
    expect(end.y).toBeLessThan(12);
    expect(offLine(10, 5, 9, 12, 9, 2)).toBeCloseTo(1);
    expect(offLine(9, 14, 9, 12, 9, 2)).toBeCloseTo(2);
  });

  it('stance, then the slash crosses the line; nothing lands till the blade is away, then all at once', () => {
    const y = yard([[9, 10], [9.4, 8], [9, 6], [13, 8]]);
    let ev = y.run(0.1, { deepSeq: 1 });
    expect(ev.some((e) => e.k === 'cutstance')).toBe(true);
    expect(y.h.act).toBe('cut');
    expect(y.h.cutLine).toBeDefined();
    const startY = y.h.y;
    ev = y.run(CUT.stance + CUT.dash, { deepSeq: 1 });
    const slash = ev.find((e) => e.k === 'cutslash');
    expect(slash && slash.k === 'cutslash' && slash.n).toBe(3);
    expect(y.h.y).toBeLessThan(startY - 5);
    // Cut but not yet hurt, and standing still.
    expect(y.es.slice(0, 3).every((e) => e.hp === 140 && e.longCut && e.act === 'stunned')).toBe(true);
    expect(y.es[3].longCut).toBeUndefined();
    ev = y.run(CUT_TOTAL - CUT.stance - CUT.dash, { deepSeq: 1 });
    expect(ev.filter((e) => e.k === 'cutfall')).toHaveLength(3);
    expect(y.es.slice(0, 3).every((e) => e.hp < 140 - CUT.dmg + 20)).toBe(true);
    expect(y.es[3].hp).toBe(140);
    expect(y.h.act).toBe('idle');
  });

  it('waits its long cooldown; a press in the wait does nothing', () => {
    const y = yard([[9, 9]]);
    y.run(CUT_TOTAL + 0.2, { deepSeq: 1 });
    expect(y.h.deepReady).toBeGreaterThan(y.room.time + CUT.cooldown - CUT_TOTAL - 1);
    const ev = y.run(0.5, { deepSeq: 2 });
    expect(ev.some((e) => e.k === 'cutstance')).toBe(false);
  });

  it('untaught, the press does nothing', () => {
    const y = yard([[9, 9]]);
    y.h.deepSkill = undefined;
    expect(y.run(0.5, { deepSeq: 1 }).some((e) => e.k === 'cutstance')).toBe(false);
  });

  it('the aim swings the line during the stance', () => {
    const y = yard([[9, 9]]);
    y.run(0.1, { deepSeq: 1 });
    y.run(0.2, { deepSeq: 1, ax: 1, ay: 0 });
    const c = y.h.cutLine!;
    expect(c.x1 - c.x0).toBeGreaterThan(1);
    expect(Math.abs(c.y1 - c.y0)).toBeLessThan(0.5);
  });
});
