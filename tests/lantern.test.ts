import { describe, expect, it } from 'vitest';
import { LANTERN, TICK } from '../src/shared/tuning';
import { healMult, stepCoals } from '../src/sim/lantern';
import { ArenaRoom } from '../src/sim/room';
import { NO_INTENT, type FightEvent, type Intent } from '../src/sim/types';

const intent = (o: Partial<Intent> = {}): Intent => ({ ...NO_INTENT, ...o });
const run = (room: ArenaRoom, s: number) => {
  const out: FightEvent[] = [];
  for (let i = 0; i < Math.round(s / TICK); i++) room.step(), out.push(...room.events);
  return out;
};

describe("the Healer's coals", () => {
  it('a dead butcher leaves a coal; only a Healer can feed it to the censer, and it keeps', () => {
    const room = new ArenaRoom(1, { scrappers: false });
    const h = room.join('me');
    const b = room.enemies.find((e) => e.kind === 'butcher')!;
    Object.assign(b, { x: 9, y: 8, hp: 1, act: 'stunned', actDur: 99, cooldown: 99 });
    Object.assign(h, { x: 9, y: 9.1 });
    room.setIntent('me', intent({ attackSeq: 1, ay: -1 }));
    run(room, 0.6);
    expect(room.coals.length).toBe(1);
    const coal = room.coals[0];
    // A Warrior walks over it: nothing.
    Object.assign(h, { x: coal.x, y: coal.y });
    run(room, 0.2);
    expect(room.coals.length).toBe(1);
    expect(h.glow).toBe(0);
    // A Healer does.
    h.weapon = 'mace';
    const ev = run(room, 0.1);
    expect(room.coals.length).toBe(0);
    expect(h.glow).toBe(1);
    expect(ev.some((e) => e.k === 'coal')).toBe(true);
  });

  it('stops at the most a censer holds, and the coal fades if nobody takes it', () => {
    const room = new ArenaRoom(1, { scrappers: false });
    const h = room.join('me');
    Object.assign(h, { weapon: 'mace', glow: LANTERN.max });
    let coals = [{ id: 1, x: h.x, y: h.y, life: 1 }];
    coals = stepCoals(coals, room.heroes, [], 0.5);
    expect(h.glow).toBe(LANTERN.max);
    expect(stepCoals(coals, room.heroes, [], 0.6)).toEqual([]);
  });

  it('a fed censer heals harder', () => {
    const heal = (glow: number) => {
      const room = new ArenaRoom(1, { squire: true, scrappers: false });
      const h = room.join('me');
      const q = room.heroes.find((x) => x.id === 'squire')!;
      for (let i = 1; i <= 4; i++) room.setIntent('me', intent({ classSeq: i })), room.step();
      Object.assign(h, { x: q.x - 1, y: q.y, glow });
      q.hp = 20;
      room.setIntent('me', intent({ classSeq: 4, relicSeq: 1 }));
      run(room, 3);
      return q.hp - 20;
    };
    expect(healMult({ weapon: 'mace', glow: LANTERN.max } as never)).toBeCloseTo(1 + LANTERN.heal * LANTERN.max);
    expect(healMult({ weapon: 'sword', glow: LANTERN.max } as never)).toBe(1);
    expect(heal(LANTERN.max)).toBeGreaterThan(heal(0) * 1.5);
  });

  it('goblins go for a fed Healer over a nearer hero', () => {
    const chase = (glow: number) => {
      const room = new ArenaRoom(1, { scrappers: true });
      const a = room.join('me'), c = room.join('you');
      const g = room.enemies.find((e) => e.kind === 'scrapper')!;
      room.enemies.forEach((e) => e !== g && Object.assign(e, { x: 1, y: 1, act: 'stunned', actDur: 99 }));
      Object.assign(g, { x: 9, y: 8, alert: true, cooldown: 0, act: 'chase' });
      Object.assign(a, { x: 6.5, y: 8 });
      Object.assign(c, { x: 12.5, y: 8, weapon: 'mace', glow });
      run(room, 0.5);
      return g.x - 9;
    };
    expect(chase(0)).toBeLessThan(0);
    expect(chase(LANTERN.max)).toBeGreaterThan(0);
  });
});
