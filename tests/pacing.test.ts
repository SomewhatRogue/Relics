import { describe, expect, it } from 'vitest';
import { PLACES, board, type Job } from '../src/shared/jobs';
import { ROOM, planRoom } from '../src/shared/terrain';
import { TICK } from '../src/shared/tuning';
import { newEnemy } from '../src/sim/enemies';
import { ArenaRoom } from '../src/sim/room';
import { NO_INTENT } from '../src/sim/types';
import { rollGear } from '../src/shared/gear';
import { Rng } from '../src/shared/rng';

const job = (kind: Job['place']['kind'], ruin = 1): Job => ({ ...board(1)[0], place: { ...PLACES.find((p) => p.kind === kind)!, ruin }, objective: 'hunt', boss: 'SKARN', seed: 21, rooms: 3 });
const steps = (room: ArenaRoom, secs: number) => {
  for (let i = 0; i < secs / TICK; i++) room.step();
};

describe('pacing', () => {
  it('rooms are big, the first is all small goblins in bands, and butchers wait deeper in', () => {
    const first = planRoom(job('village', 2), 0), deeper = planRoom(job('village', 2), 1);
    expect(first.map.w).toBe(ROOM.w);
    expect(first.foes.filter((f) => f.kind === 'butcher').length).toBe(0);
    expect(first.foes.length).toBeGreaterThanOrEqual(5);
    expect(deeper.foes.some((f) => f.kind === 'butcher')).toBe(true);
  });

  it("goblins at rest don't come until one sees you, then it shouts the band awake", () => {
    const plan = planRoom(job('forest'), 0);
    const room = new ArenaRoom(3, { map: plan.map, foes: plan.foes, furniture: [] }), h = room.join('me');
    const start = room.enemies.map((e) => ({ x: e.home.x, y: e.home.y }));
    steps(room, 2);
    // Far off at the bottom: nobody has come.
    expect(room.enemies.every((e) => e.alert === false)).toBe(true);
    room.enemies.forEach((e, i) => expect(Math.hypot(e.x - start[i].x, e.y - start[i].y)).toBeLessThan(2.6));
    // Walk up to the first band.
    const g = room.enemies[0];
    Object.assign(h, { x: g.x + g.fx * 3, y: g.y + g.fy * 3 });
    room.setIntent('me', NO_INTENT);
    steps(room, 0.2);
    expect(g.alert).toBe(true);
    const near = room.enemies.filter((e) => Math.hypot(e.home.x - g.home.x, e.home.y - g.home.y) < 2);
    expect(near.every((e) => e.alert)).toBe(true);
  });

  it('an archer runs when you get close on its level', () => {
    const room = new ArenaRoom(3, { map: planRoom(job('field'), 0).map, foes: [], furniture: [] }), h = room.join('me');
    const a = newEnemy(1, 'scrapper', 14, 10);
    Object.assign(a, { bow: true, respawns: false, cooldown: 9 });
    room.enemies.push(a);
    Object.assign(h, { x: 14, y: 12 });
    steps(room, 1);
    expect(Math.hypot(a.x - h.x, a.y - h.y)).toBeGreaterThan(3);
  });

  it('a weapon rolled for a kind is that kind, and always for the class', () => {
    const rng = new Rng(4);
    for (let i = 0; i < 20; i++) expect(rollGear(rng, 'MAGE', 'fine', 'weapon', 'wand').kit).toBe('wand');
    for (let i = 0; i < 20; i++) expect(['wand', 'staff', 'rod']).toContain(rollGear(rng, 'MAGE', 'forged').kit);
  });
});
