// A goblin thrown (Kyle, 2026-11-27): far harder into a wall or another, and into deep water it struggles and drowns,
// or a pike takes it (sim/drown.ts, THROWN).
import { describe, expect, it } from 'vitest';
import { GRAB, KNOCK, THROWN, TICK } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { NO_INTENT, type FightEvent, type Intent } from '../src/sim/types';

const intent = (o: Partial<Intent> = {}): Intent => ({ ...NO_INTENT, ...o });
const run = (room: ArenaRoom, s: number) => { const ev: FightEvent[] = []; for (let i = 0; i < Math.round(s / TICK); i++) room.step(), ev.push(...room.events); return ev; };

/** A Warrior with a stunned goblin in front; the rest of the yard parked; `pool`: deep water north of them. */
function setup(pool: boolean) {
  const room = new ArenaRoom(1);
  const h = room.join('me');
  const corners = [[1, 15], [17, 15], [1, 13], [17, 13], [16, 15]];
  room.enemies.forEach((e, i) => Object.assign(e, { x: corners[i][0], y: corners[i][1], cooldown: 99, act: e.kind === 'butcher' || e.kind === 'scrapper' ? 'stunned' : e.act, actDur: 99 }));
  const t = room.enemies[3];
  Object.assign(t, { x: 9, y: 8, act: 'stunned', actDur: 99, fx: 0, fy: 1, hp: 200, maxHp: 200 });
  Object.assign(h, { x: 9, y: 9, fx: 0, fy: -1 });
  if (pool) room.map.water = [...(room.map.water ?? []), { x: 6, y: 3, w: 6, h: 2.5, deep: true }];
  else room.map.blocks.push({ x: 6, y: 4, w: 6, h: 1, kind: 'wall' } as never);
  room.setIntent('me', intent({ grabSeq: 1, ay: -1 }));
  run(room, 0.1);
  room.setIntent('me', intent({ grabSeq: 2, ay: -1 }));
  return { room, h, t };
}

describe('thrown', () => {
  it('reaches a hair further than it did', () => expect(GRAB.reach).toBeGreaterThan(1.3));

  it('into a wall: far more than a knock, and stunned', () => {
    const { room, t } = setup(false);
    const ev = run(room, 1.2);
    expect(ev.some((e) => e.k === 'wallhit')).toBe(true);
    expect(200 - t.hp).toBeGreaterThanOrEqual(THROWN.wall);
    expect(200 - t.hp).toBeGreaterThan(KNOCK.wallDmg * 2);
  });

  it('into deep water: it goes in, struggles, and goes under or is taken; a kill, no body', () => {
    const { room, t } = setup(true);
    const ev = run(room, 0.6);
    expect(ev.some((e) => e.k === 'splash')).toBe(true);
    expect(t.drownAt).toBeDefined();
    expect(t.y).toBeLessThan(5.5);
    const end = run(room, THROWN.drown + 0.2);
    expect(t.act).toBe('dead');
    expect(t.death).toBe('drown');
    expect(end.some((e) => e.k === 'splash' && ((e as { fish?: boolean }).fish || (e as { under?: boolean }).under))).toBe(true);
  });
});
