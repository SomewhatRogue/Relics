import { describe, expect, it } from 'vitest';
import { TICK, gainXp, newProfile, xpFor } from '../src/shared/tuning';
import { dueLevels, jobXp } from '../src/shared/pace';
import { ArenaRoom } from '../src/sim/room';
import { NO_INTENT, type FightEvent, type Intent } from '../src/sim/types';

const intent = (o: Partial<Intent> = {}): Intent => ({ ...NO_INTENT, ...o });
const run = (room: ArenaRoom, s: number) => {
  const out: FightEvent[] = [];
  for (let i = 0; i < Math.round(s / TICK); i++) room.step(), out.push(...room.events);
  return out;
};

describe('growing a level', () => {
  it('the room fills your health and lights you up in your class colour, once a level', () => {
    const room = new ArenaRoom(1, { scrappers: false });
    const h = room.join('me');
    Object.assign(h, { weapon: 'daggers', hp: 12 });
    room.setIntent('me', intent({ levelSeq: 1 }));
    let ev = run(room, 0.1);
    expect(h.hp).toBe(h.maxHp);
    expect(ev.filter((e) => e.k === 'levelup')).toEqual([expect.objectContaining({ id: 'me', cls: 'ROGUE' })]);
    h.hp = 12;
    ev = run(room, 0.2);
    expect(h.hp).toBe(12);
    expect(ev.some((e) => e.k === 'levelup')).toBe(false);
  });

  it("a friend's level up is the room's too: everyone gets the event, only they are healed", () => {
    const room = new ArenaRoom(1, { scrappers: false });
    const me = room.join('me'), you = room.join('you');
    Object.assign(me, { hp: 20 });
    Object.assign(you, { hp: 20, weapon: 'sword', x: me.x + 3 });
    room.setIntent('you', intent({ levelSeq: 4 }));
    const ev = run(room, 0.1);
    expect(you.hp).toBe(you.maxHp);
    expect(me.hp).toBe(20);
    expect(ev.find((e) => e.k === 'levelup')).toMatchObject({ id: 'you', cls: 'WARRIOR' });
  });

  it('a hero down stays down, but the level still shows', () => {
    const room = new ArenaRoom(1, { scrappers: false });
    const h = room.join('me');
    Object.assign(h, { act: 'down', hp: 0, actDur: 99 });
    room.setIntent('me', intent({ levelSeq: 1 }));
    const ev = run(room, 0.1);
    expect(h.hp).toBe(0);
    expect(ev.some((e) => e.k === 'levelup')).toBe(true);
  });

  it('on a job, a level is lit only once it is sure: what a lost job would still pay', () => {
    const p = newProfile('RANGER');
    p.xp = xpFor(2) - 30;
    expect(dueLevels(p, 20, 1)).toBe(0);
    expect(dueLevels(p, 30, 1)).toBe(1);
    // Never more than the job then pays, won or lost.
    for (const won of [false, true]) {
      const q = { ...p, stats: { ...p.stats } };
      expect(gainXp(q, jobXp(30, won, 1))).toBeGreaterThanOrEqual(dueLevels(p, 30, 1));
    }
  });
});
