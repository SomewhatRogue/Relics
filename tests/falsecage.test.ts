/** False prisoners (sim/falsecage.ts): 1 in 20 cages out in the open, never in a house, never counted as freed. */
import { describe, expect, it } from 'vitest';
import { ArenaRoom } from '../src/sim/room';
import { damageProp, newProp } from '../src/sim/props';
import { rollFalse } from '../src/sim/falsecage';
import { goal, interiorRoom, newRun, runRoom, tally } from '../src/sim/run';
import { targets } from '../src/sim/targets';
import { FALSE_CAGE, TICK } from '../src/shared/tuning';
import { Rng } from '../src/shared/rng';
import { PLACES, board, type Job } from '../src/shared/jobs';
import { Decoder, Encoder, stateOf } from '../src/client/snap';
import { NO_INTENT, type FightEvent } from '../src/sim/types';
import type { World } from '../src/sim/elements';

const ticks = (s: number) => Math.round(s / TICK);
const stream = (room: ArenaRoom) => (room as unknown as { cageRng: Rng }).cageRng;
const world = (room: ArenaRoom, cages?: Rng): World => ({ heroes: room.heroes, enemies: room.enemies, javelins: room.javelins, props: room.props, survivors: room.survivors, now: room.time, ev: room.events, cages });
const job = (objective: Job['objective'], seed = 99): Job => ({ ...board(1)[0], rooms: 3, place: PLACES.find((p) => p.kind === 'village')!, objective, boss: 'SKARN', seed, deep: false });
/** A stream whose next roll is false. */
const falseRoll = { next: () => 0 } as unknown as Rng;

/** An empty yard with one hero facing a cage on its last splinter; `falseCages` as an outdoor job room. */
function yard(seed: number, outdoors = true) {
  const room = new ArenaRoom(seed, { scrappers: false, props: false });
  room.enemies.length = 0;
  room.falseCages = outdoors;
  const h = room.join('kyle-0001');
  Object.assign(h, { x: 9, y: 8, fx: 1, fy: 0 });
  const cage = newProp('cage', 10, 8, false);
  cage.hp = 1;
  room.props.push(cage);
  return { room, h, cage };
}
/** The hero swings and breaks the cage; then `more` seconds pass. Returns every event. */
function breakAndWait(room: ArenaRoom, more: number): FightEvent[] {
  const ev: FightEvent[] = [];
  room.setIntent('kyle-0001', { ...NO_INTENT, attackSeq: 1 });
  for (let i = 0; i < ticks(0.6 + more); i++) room.step(), ev.push(...room.events);
  return ev;
}
/** The first seed whose first cage roll is false. */
const falseSeed = () => {
  for (let s = 1; ; s++) if (rollFalse(stream(new ArenaRoom(s, { scrappers: false, props: false })))) return s;
};

describe('false prisoners', () => {
  it('about 1 in 20 cages, over many seeded rooms', () => {
    let n = 0, hits = 0;
    for (let seed = 1; seed <= 500; seed++) {
      const r = stream(new ArenaRoom(seed, { scrappers: false, props: false }));
      for (let i = 0; i < 10; i++, n++) if (rollFalse(r)) hits++;
    }
    expect(hits / n).toBeGreaterThan(0.04);
    expect(hits / n).toBeLessThan(0.06);
    // No stream (a house, the yard, a world without one): never.
    expect(Array.from({ length: 100 }, () => rollFalse(undefined)).some(Boolean)).toBe(false);
  });

  it('it lurches, tears open, and two goblins come out held a beat, then attack', () => {
    const { room, h } = yard(falseSeed());
    const ev = breakAndWait(room, 0);
    const s = room.survivors[0];
    expect(s.tearAt).toBeCloseTo(s.at + FALSE_CAGE.lurch, 5);
    expect(room.enemies).toHaveLength(0);
    // Step to the moment it tears open.
    while (!ev.some((e) => e.k === 'torn')) room.step(), ev.push(...room.events);
    expect(room.time).toBeGreaterThanOrEqual(s.tearAt!);
    expect(room.time).toBeLessThan(s.tearAt! + TICK * 1.01);
    expect(ev).toContainEqual(expect.objectContaining({ k: 'torn' }));
    expect(ev.filter((e) => e.k === 'spotted')).toHaveLength(FALSE_CAGE.goblins);
    expect(s.gone).toBe(true);
    const gobs = room.enemies.filter((e) => e.kind === 'scrapper' && e.act !== 'dead');
    expect(gobs).toHaveLength(2);
    expect(gobs.every((e) => e.alert && !e.respawns)).toBe(true);
    // The beat: nothing swung while it lasts.
    const after: FightEvent[] = [];
    for (let i = 0; i < ticks(FALSE_CAGE.beat - 0.1); i++) room.step(), after.push(...room.events);
    expect(after.some((e) => e.k === 'windup')).toBe(false);
    for (let i = 0; i < ticks(2); i++) room.step(), after.push(...room.events);
    expect(after.some((e) => e.k === 'windup')).toBe(true);
    expect(h.hp < h.maxHp || after.some((e) => e.k === 'block' || e.k === 'hit')).toBe(true);
  });

  it("a rescue still finishes: a false one counts neither way, and the goal's numbers leave it out", () => {
    const run = newRun(job('rescue'));
    run.index = run.job.rooms - 1;
    const room = runRoom(run);
    expect(room.falseCages).toBe(true);
    room.enemies.length = 0;
    const cages = (room.props = [5, 10].map((x) => newProp('cage', x, 6, false)));
    expect(goal(run, room).text).toBe('2 to free');
    damageProp(cages[0], 999, world(room, falseRoll));
    expect(room.survivors[0].tearAt).toBeDefined();
    expect(goal(run, room)).toEqual({ text: '1 to free', done: false });
    expect(targets(run, room).map((t) => t.kind)).toEqual(['cage']);
    // It tears open; its goblins die; the other cage is someone real, brought home.
    room.join('kyle-0001');
    for (let i = 0; i < ticks(FALSE_CAGE.lurch + 0.1); i++) room.step(), tally(run, room, room.events, 'kyle-0001');
    for (const e of room.enemies) (e.hp = 0), (e.act = 'dead');
    damageProp(cages[1], 999, world(room));
    expect(goal(run, room)).toEqual({ text: '1 to bring out', done: false });
    const real = room.survivors.find((s) => s.tearAt === undefined)!;
    Object.assign(real, { x: room.map.hero.x, y: room.map.hero.y, at: -9 });
    for (let i = 0; i < 3; i++) room.step(), tally(run, room, room.events, 'kyle-0001');
    expect(run.rescued).toBe(1);
    expect(goal(run, room).done).toBe(true);
  });

  it("a captive in a house is never false: the house's room has no stream, even on a seed that would roll it", () => {
    const run = newRun(job('rescue'));
    run.index = run.job.rooms - 1;
    const street = runRoom(run), i = street.map.blocks.findIndex((b) => b.door && (b.kind === 'house' || b.kind === 'barn'));
    expect(i).toBeGreaterThanOrEqual(0);
    const inside = interiorRoom(run, i, street.map.blocks[i].door!);
    expect(inside.indoors).toBe(true);
    expect(inside.falseCages).toBe(false);
    // Even marked as an outdoor room, a room indoors never rolls one.
    const { room } = yard(falseSeed());
    room.indoors = true;
    breakAndWait(room, FALSE_CAGE.lurch + 1);
    expect(room.survivors[0].tearAt).toBeUndefined();
    expect(room.enemies).toHaveLength(0);
    // And the yard (no job) never.
    const y = yard(falseSeed(), false);
    breakAndWait(y.room, 0.2);
    expect(y.room.survivors[0].tearAt).toBeUndefined();
  });

  it('the same seed and the same blows give the same reveal; a friend is sent it', () => {
    const play = () => {
      const { room } = yard(falseSeed());
      const ev = breakAndWait(room, FALSE_CAGE.lurch + 1.5);
      return { room, out: JSON.stringify({ ev, enemies: room.enemies, survivors: room.survivors }) };
    };
    const a = play(), b = play();
    expect(a.out).toBe(b.out);
    // Online: the survivor list goes to friends whole, `tearAt` with it.
    const { room } = yard(falseSeed());
    breakAndWait(room, 0.1);
    const got = new Decoder().apply(new Encoder().encode(stateOf(room), true), true);
    expect(got.survivors[0].tearAt).toBe(Math.round(room.survivors[0].tearAt! * 100) / 100);
  });
});
