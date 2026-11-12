/** Out of bounds: the dread's stages and times, stepping back in, the body put back, town's set back, the holes shut. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ARENA, type GameMap } from '../src/shared/arena';
import { board, PLACES, type Job } from '../src/shared/jobs';
import { outOfBounds } from '../src/shared/reach';
import { DREAD, TICK } from '../src/shared/tuning';
import { safeSpot, type DreadRule } from '../src/sim/dread';
import { dreadFor } from '../src/sim/dreadplace';
import { ArenaRoom } from '../src/sim/room';
import { newRun, runRoom, tally } from '../src/sim/run';
import { NO_INTENT, type FightEvent, type Hero } from '../src/sim/types';
import { Decoder, Encoder, stateOf } from '../src/client/snap';

/** The yard with nobody to fight, a corner of it forbidden (out of bounds by the room's say). */
const FORBID = { x: 13, y: 9, w: 4, h: 5 };
function yard(by: DreadRule['by'], players = 1) {
  const room = new ArenaRoom(1, { scrappers: false, props: false });
  room.enemies = [];
  room.dread = { by, forbid: [FORBID] };
  const hs = Array.from({ length: players }, (_, i) => room.join(i ? 'p' + i : 'me'));
  return { room, h: hs[0], hs };
}
/** Step for `s` seconds, keeping every event. */
function run(room: ArenaRoom, s: number, ev: FightEvent[] = []): FightEvent[] {
  for (let i = 0; i < Math.round(s / TICK); i++) room.step(), ev.push(...room.events);
  return ev;
}
const dreads = (ev: FightEvent[]) => ev.filter((e): e is Extract<FightEvent, { k: 'dread' }> => e.k === 'dread').map((e) => e.n);
const outThere = (h: Hero) => Object.assign(h, { x: 15, y: 11.5 });

// (Switched off in the game for now, shared/tuning.ts DREAD.off: these test it as it was, ready to come back.)
beforeAll(() => void (DREAD.off = false));
afterAll(() => void (DREAD.off = true));

describe('the dread', () => {
  it('warns at once, worsens at 4 s, seizes at 8 s, and crushes and downs the hero 1.1 s later', () => {
    const { room, h } = yard('shadow');
    run(room, 0.5);
    outThere(h);
    const ev = run(room, 0.1);
    expect(dreads(ev)).toEqual([1]);
    expect(h.dread).toBeGreaterThan(0);
    run(room, DREAD.late - 0.3, ev);
    expect(dreads(ev)).toEqual([1]);
    run(room, 0.4, ev);
    expect(dreads(ev)).toEqual([1, 2]);
    run(room, DREAD.take - DREAD.late - 0.1, ev);
    expect(dreads(ev)).toEqual([1, 2, 3]);
    expect(h.takenT).toBeGreaterThanOrEqual(0);
    expect(h.act).toBe('stun');
    // Seized: nothing pressed moves them.
    room.setIntent('me', { ...NO_INTENT, mx: -1 });
    const x = h.x;
    run(room, DREAD.crush - 0.2, ev);
    expect(h.x).toBe(x);
    expect(h.act).not.toBe('down');
    run(room, 0.3, ev);
    expect(dreads(ev)).toEqual([1, 2, 3, 4]);
    expect(h.act).toBe('down');
    expect(h.hp).toBe(0);
    // Crushed where they stood; the body put back where they last stood in bounds.
    const crush = ev.find((e) => e.k === 'dread' && e.n === 4)!;
    expect(crush.x).toBeCloseTo(15, 1);
    expect(h.x).toBeCloseTo(ARENA.hero.x, 1);
    expect(h.y).toBeCloseTo(ARENA.hero.y, 1);
    expect(outOfBounds(room.map, h.x, h.y)).toBe(false);
    expect(ev.some((e) => e.k === 'down' && Math.abs(e.x - h.x) < 0.01)).toBe(true);
  });

  it('stepping back in lifts it, quickly, and nothing comes', () => {
    const { room, h } = yard('swarm');
    run(room, 0.2);
    outThere(h);
    const ev = run(room, 6);
    expect(dreads(ev)).toEqual([1, 2]);
    Object.assign(h, { x: 9, y: 12 });
    run(room, (6 / DREAD.lift) + 0.2, ev);
    expect(h.dread).toBe(0);
    expect(dreads(ev)).toEqual([1, 2, 0]);
    run(room, 10, ev);
    expect(h.act).not.toBe('down');
    expect(dreads(ev)).not.toContain(3);
  });

  it('the body goes back to the last spot it stood in bounds, wherever that was', () => {
    const { room, h } = yard('swarm');
    Object.assign(h, { x: 12.2, y: 11.5 });
    run(room, 0.2);
    expect(safeSpot(h)?.x).toBeCloseTo(12.2, 1);
    outThere(h);
    run(room, DREAD.take + DREAD.crush + 0.1);
    expect(h.act).toBe('down');
    expect(h.x).toBeCloseTo(12.2, 1);
  });

  it('in town and the yard nothing kills: a moment out and you are set back, unhurt', () => {
    const { room, h } = yard('setback');
    Object.assign(h, { x: 10, y: 12 });
    run(room, 0.2);
    outThere(h);
    const ev = run(room, DREAD.setback + 0.1);
    expect(dreads(ev)).toEqual([1, 5]);
    expect(h.x).toBeCloseTo(10, 1);
    expect(h.hp).toBe(h.maxHp);
    expect(h.act).not.toBe('down');
    run(room, 10, ev);
    expect(dreads(ev)).toEqual([1, 5]);
  });

  it('a party: the taken hero is down under the party rules, and a friend can get them up', () => {
    const { room, h, hs } = yard('shadow', 2);
    run(room, 0.2);
    outThere(h);
    run(room, DREAD.take + DREAD.crush + 0.2);
    expect(h.act).toBe('down');
    expect(h.bleeding).toBe(true);
    expect(hs[1].act).not.toBe('down');
  });

  it('alone on a job, being taken is one of your three downs', () => {
    const job: Job = { ...board(2)[1], rooms: 3, place: PLACES.find((p) => p.name === "Hangman's Wood")!, objective: 'rescue', seed: 5 };
    const r = newRun(job), room = runRoom(r);
    room.enemies = [];
    expect(room.dread?.by).toBe('shadow');
    const h = room.join('me');
    run(room, 0.2);
    // (Out by the room's say: a body can no longer get anywhere out of bounds on its own.)
    room.dread!.forbid = [{ x: h.x - 0.5, y: h.y - 0.5, w: 1, h: 1 }];
    for (let i = 0; i < Math.round((DREAD.take + DREAD.crush + 0.2) / TICK); i++) room.step(), tally(r, room, room.events, 'me');
    expect(r.downs).toBe(1);
    expect(r.failed).toBe(false);
  });

  it('wild places send the shadow, settled ones the hungry', () => {
    const at = (name: string) => dreadFor({ ...board(2)[1], place: PLACES.find((p) => p.name === name)! });
    expect(at("Hangman's Wood")).toBe('shadow');
    expect(at('The Copperdeep Shafts')).toBe('shadow');
    expect(at('Sallow Carr')).toBe('shadow');
    expect(at('Barrowby')).toBe('swarm');
    expect(at("Tollan's Farm")).toBe('swarm');
    expect(at('Brokenbridge')).toBe('swarm');
  });

  it('is in what the leader sends: a friend sees the dread on the hero', () => {
    const { room, h } = yard('shadow');
    run(room, 0.2);
    outThere(h);
    run(room, DREAD.take + 0.2);
    const got = new Decoder().apply(new Encoder().encode(stateOf(room), true), true).heroes[0] as Partial<Hero>;
    expect(got.dread).toBeGreaterThan(DREAD.take - 0.1);
    expect(got.dreadBy).toBe('shadow');
    expect(got.takenT).toBeGreaterThanOrEqual(0);
  });
});

describe('the holes', () => {
  /** A strip of ground with a thin fence across it, a shut pen past it. */
  const pen: GameMap = { ...ARENA, name: 'PEN', rounds: [], braziers: [], blocks: [{ x: 10, y: 0, w: 0.35, h: 16, kind: 'fence' }], hero: { x: 5, y: 8 }, exit: null } as GameMap;
  it('a far blink at a fence stops at it, never through it', () => {
    const room = new ArenaRoom(1, { map: pen, foes: [] });
    room.dread = { by: 'shadow' };
    const h = room.join('me');
    Object.assign(h, { x: 9.3, y: 8, weapon: 'wand', perks: ['m_leap'], fx: 1, fy: 0 });
    expect(outOfBounds(pen, 11, 8)).toBe(true);
    room.setIntent('me', { ...NO_INTENT, mx: 1, my: 0, rollSeq: 1 });
    run(room, 0.5);
    expect(h.x).toBeLessThan(10);
    expect(outOfBounds(pen, h.x, h.y)).toBe(false);
  });
  it('a shadowstep with nobody to step behind stops at the fence too', async () => {
    const { shadowstep } = await import('../src/sim/relics');
    const room = new ArenaRoom(1, { map: pen, foes: [] });
    const h = room.join('me');
    Object.assign(h, { x: 8.5, y: 8, fx: 1, fy: 0 });
    shadowstep(h, [], [], 0);
    expect(h.x).toBeLessThan(10);
  });
  it('a body squeezed between a bed and the wall is never pushed out past the edge', () => {
    const tight: GameMap = { ...ARENA, rounds: [], braziers: [], blocks: [{ x: 16.7, y: 5, w: 1, h: 2.2, kind: 'bed' }] } as GameMap;
    const room = new ArenaRoom(1, { map: tight, foes: [] });
    const h = room.join('me');
    Object.assign(h, { x: 17.9, y: 6 });
    room.step();
    expect(h.x).toBeLessThanOrEqual(tight.w);
  });
});
