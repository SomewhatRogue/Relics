import { describe, expect, it } from 'vitest';
import { collide, onLedge, useMap, type GameMap } from '../src/shared/arena';
import { PLACES, board, type Job } from '../src/shared/jobs';
import { isFork, planRoom } from '../src/shared/terrain';
import { TICK } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { newRun, runRoom } from '../src/sim/run';
import { NO_INTENT } from '../src/sim/types';

const job = (kind: Job['place']['kind'], objective: Job['objective'] = 'hunt'): Job => ({ ...board(1)[0], place: PLACES.find((p) => p.kind === kind)!, objective, boss: 'SKARN', seed: 31, rooms: 3 });
/** The high road's room, empty but for what we put in. */
function high(): { room: ArenaRoom; map: GameMap } {
  const plan = planRoom(job('mine'), 2, 'high');
  const room = new ArenaRoom(3, { map: plan.map, foes: [], furniture: [] });
  return { room, map: plan.map };
}
const walk = (room: ArenaRoom, id: string, mx: number, my: number, secs: number) => {
  for (let i = 0; i < secs / TICK; i++) room.setIntent(id, { ...NO_INTENT, mx, my }), room.step();
};

describe('heights', () => {
  it('the high road has a ledge with archers up on it, and a ramp', () => {
    const plan = planRoom(job('mine'), 2, 'high');
    expect(plan.map.ledges!.length).toBe(1);
    const archers = plan.foes.filter((f) => f.bow);
    expect(archers.length).toBe(3);
    for (const a of archers) expect(onLedge(plan.map, a.x, a.y) && a.z === 1).toBe(true);
  });

  it("from the ground a ledge is a wall; up the ramp you're on it; step off and you drop", () => {
    const { room, map } = high(), l = map.ledges![0], r = l.ramps[0], h = room.join('me');
    useMap(map);
    const face = { x: l.x + l.w / 2, y: l.y + l.h + 0.1, z: 0 };
    face.y -= 0.6;
    collide(face, 0.32);
    expect(face.y).toBeGreaterThanOrEqual(l.y + l.h + 0.3);
    Object.assign(h, { x: r.x + r.w / 2, y: r.y + r.h - 0.3 });
    walk(room, 'me', 0, -1, 1.2);
    walk(room, 'me', r.x < l.x + 1 ? 1 : -1, 0, 0.6);
    expect(h.z).toBe(1);
    walk(room, 'me', 0, 1, 2);
    expect(h.z).toBe(0);
  });

  it("a blade doesn't reach between levels; an archer's arrow does", () => {
    const { room, map } = high(), l = map.ledges![0], h = room.join('me');
    const e = newEnemy(1, 'scrapper', l.x + l.w / 2, l.y + l.h - 0.4);
    Object.assign(e, { z: 1, respawns: false });
    room.enemies.push(e);
    Object.assign(h, { x: e.x, y: l.y + l.h + 0.4, fx: 0, fy: -1 });
    for (let i = 0; i < 30; i++) room.setIntent('me', { ...NO_INTENT, attackSeq: 1 + Math.floor(i / 10) }), room.step();
    expect(e.hp).toBe(e.maxHp);
    const a = newEnemy(2, 'scrapper', l.x + 2.5, 1.2);
    Object.assign(a, { z: 1, bow: true, cooldown: 0, fx: 0, fy: 1, respawns: false });
    room.enemies.push(a);
    Object.assign(h, { x: a.x, y: 7 });
    walk(room, 'me', 0, 0, 2.5);
    expect(h.hp).toBeLessThan(h.maxHp);
  });

  it('a goblin knocked off the ledge takes the fall', () => {
    const { room, map } = high(), l = map.ledges![0];
    const e = newEnemy(1, 'scrapper', l.x + 2, l.y + l.h - 0.5);
    Object.assign(e, { z: 1, respawns: false, kvy: 8, cooldown: 9 });
    room.enemies.push(e);
    room.join('me');
    for (let i = 0; i < 10; i++) room.step();
    expect(e.z).toBe(0);
    expect(e.hp).toBeLessThan(e.maxHp);
  });

  it('a goblin with a blade goes round by the ramp to reach you up high', () => {
    const { room, map } = high(), l = map.ledges![0], h = room.join('me');
    Object.assign(h, { x: l.x + l.w / 2, y: 1.2, z: 1 });
    const e = newEnemy(1, 'scrapper', 9, 9);
    Object.assign(e, { respawns: false });
    room.enemies.push(e);
    walk(room, 'me', 0, 0, 8);
    expect(e.z).toBe(1);
  });
});

describe('forks', () => {
  it("a three-room job forks in the middle; the road picked shapes the next room", () => {
    const j = job('village', 'hunt');
    expect(isFork(j, 1)).toBe(true);
    expect(planRoom(j, 1).map.roads!.map((r) => r.road)).toEqual(['high', 'low']);
    expect(planRoom(j, 1).map.exit).toBe(null);
    const run = newRun(j);
    run.index = 2;
    run.roads[2] = 'low';
    const low = runRoom(run);
    run.roads[2] = 'high';
    const hi = runRoom(run);
    expect(low.props.some((p) => p.kind === 'cage')).toBe(true);
    expect(low.enemies.filter((e) => !e.bow).length).toBeGreaterThan(hi.enemies.filter((e) => !e.bow).length);
    expect(hi.map.ledges?.length).toBe(1);
  });
});
