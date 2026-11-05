/**
 * Layout 4's scenes (Kyle: "they can be staged, or you arrive as a scene is occurring"): each sets up
 * what it says; prisoners led off reach the far way out unless their guards are killed; torch-bearers
 * get a house going unless they're stopped, and someone can still be dragged out of its door; a patrol
 * walks its round; two haul a body to their fire and drop it when they see you.
 */
import { describe, expect, it } from 'vitest';
import { doorAt } from '../src/shared/arena';
import { PLACES, SEWERS, board, type Job } from '../src/shared/jobs';
import type { Piece } from '../src/shared/nodes';
import { routeOf } from '../src/shared/route';
import { SCENE, TICK } from '../src/shared/tuning';
import { planRoom, type RoadId } from '../src/shared/terrain';
import { isDead } from '../src/sim/damage';
import { ArenaRoom } from '../src/sim/room';
import { newRun, runRoom, tally, type Run } from '../src/sim/run';
import { waiting } from '../src/sim/survivors';
import { NO_INTENT, type FightEvent } from '../src/sim/types';

const ALL = [...PLACES, SEWERS];
const job = (place: (typeof ALL)[number], seed: number): Job => ({ ...board(1)[1], place, rooms: 5, seed, objective: 'hunt', layout: 4 });

/** The first room (down the high road) of some job with this scene, and its run. */
function find(piece: Piece): { j: Job; i: number; taken: Record<number, RoadId> } {
  for (let s = 1; s < 400; s++) for (const place of ALL) {
    const j = job(place, s * 17 + 3), r = routeOf(j, 'h'), f = r.findIndex((x) => x.outs!.length === 2), i = r.findIndex((x) => !x.heart && x.piece === piece);
    if (i >= 0) return { j, i, taken: f >= 0 && i > f ? { [f + 1]: 'high' } : {} };
  }
  throw new Error('no ' + piece);
}
function roomWith(piece: Piece): { run: Run; room: ArenaRoom } {
  const { j, i, taken } = find(piece), run = newRun(j);
  Object.assign(run, { index: i, roads: taken });
  const room = runRoom(run), h = room.join('me');
  Object.assign(h, { hp: 9999, maxHp: 9999 });
  room.setIntent('me', NO_INTENT);
  return { run, room };
}
const step = (room: ArenaRoom, s: number, run?: Run, each?: () => boolean | void) => {
  const out: FightEvent[] = [];
  for (let n = 0; n < Math.round(s / TICK); n++) {
    room.step(), out.push(...room.events);
    if (run) tally(run, room, room.events, 'me');
    if (each?.()) break;
  }
  return out;
};
const park = (room: ArenaRoom) => Object.assign(room.heroes[0], { x: room.map.hero.x, y: room.map.hero.y });
const kill = (room: ArenaRoom, k: string) => room.enemies.filter((e) => e.task?.k === k).forEach((e) => Object.assign(e, { hp: 0, act: 'dead', actT: 99 }));
/** Only the scene's own goblins (the rest of the room's would come for the hero and muddy it). */
const only = (room: ArenaRoom) => (room.enemies = room.enemies.filter((e) => e.task));

describe('layout 4: each scene sets up its scene', () => {
  it('burning, dragging, prisoners, a patrol, the hanging tree, a fallen tree, the well, drums, webs, the ford', () => {
    const plan = (p: Piece) => { const { j, i, taken } = find(p); return planRoom(j, i, taken[i], taken); };
    let p = plan('burning');
    const house = p.map.blocks.find((b) => b.held)!;
    expect(house.door).toBe('cottage:held');
    expect(house.torched).toBeCloseTo(SCENE.staged);
    expect(p.foes.filter((f) => f.variant === 'torch' && f.task?.k === 'kindle')).toHaveLength(2);
    p = plan('drag');
    expect(p.foes.filter((f) => f.task?.k === 'haul')).toHaveLength(2);
    expect(p.foes.some((f) => f.haul)).toBe(true);
    expect(p.map.grim?.some((g) => g.kind === 'trail')).toBe(true);
    p = plan('prisoners');
    expect(p.map.led!.n).toBeGreaterThanOrEqual(2);
    expect(p.foes.filter((f) => f.task?.k === 'escort')).toHaveLength(2);
    p = plan('patrol');
    const pat = p.foes.filter((f) => f.task?.k === 'patrol');
    expect(pat).toHaveLength(3);
    expect((pat[0].task as { pts: unknown[] }).pts).toHaveLength(4);
    p = plan('hanging');
    expect(p.map.rounds.some((r) => r.kind === 'hangtree')).toBe(true);
    expect(p.map.grim!.filter((g) => g.kind === 'hung')).toHaveLength(2);
    expect(p.map.flocks?.length).toBeGreaterThan(0);
    p = plan('fallen');
    expect(p.map.blocks.some((b) => b.kind === 'log')).toBe(true);
    p = plan('cache');
    const well = p.map.rounds.find((r) => r.kind === 'well')!;
    expect(p.chests.some((c) => Math.hypot(c.x - well.x, c.y - well.y) < 1.4)).toBe(true);
    p = plan('drums');
    expect(p.foes.some((f) => f.variant === 'drummer')).toBe(true);
    expect(p.map.blocks.filter((b) => b.kind === 'stakes').length).toBeGreaterThan(4);
    expect(p.chests.length).toBeGreaterThan(0);
    p = plan('webs');
    expect(p.foes.filter((f) => f.kind === 'nest').length).toBeGreaterThan(0);
    expect(p.chests.length).toBeGreaterThan(0);
    p = plan('wading');
    expect(p.foes.filter((f) => f.bow).length).toBeGreaterThan(0);
  });
});

describe('layout 4: prisoners led off', () => {
  it('reach the far way out and are gone if nobody stops them, their guards with them', () => {
    const { run, room } = roomWith('prisoners');
    only(room), park(room);
    const n = room.map.led!.n;
    expect(room.survivors.filter((s) => s.led)).toHaveLength(n);
    const ev = step(room, 120, run, () => room.survivors.every((s) => s.gone) && room.enemies.every((e) => isDead(e)));
    expect(room.survivors.every((s) => s.taken && s.gone)).toBe(true);
    expect(ev.filter((e) => e.k === 'ledoff')).toHaveLength(n);
    expect(run.ledoff).toBe(n);
    expect(room.enemies.filter((e) => e.task?.k === 'escort').every((e) => e.escaped)).toBe(true);
    expect(room.survivors.filter(waiting)).toHaveLength(0);
  });

  it('kill the guards and they are freed, to be brought out like anyone', () => {
    const { room } = roomWith('prisoners');
    only(room), park(room);
    step(room, 2);
    kill(room, 'escort');
    step(room, 0.2);
    expect(room.survivors.every((s) => !s.led && !s.taken && waiting(s))).toBe(true);
  });

  it('come close and the guards stop to fight: the column stops', () => {
    const { room } = roomWith('prisoners');
    only(room);
    const g = room.enemies.find((e) => e.task?.k === 'escort')!;
    Object.assign(room.heroes[0], { x: g.x + 1, y: g.y });
    step(room, 0.3);
    for (const e of room.enemies) Object.assign(room.heroes[0], {}), e.task?.k === 'escort' && Object.assign(e.task, { quit: true });
    const at = room.survivors.map((s) => s.led!.s);
    step(room, 2);
    expect(room.survivors.map((s) => s.led?.s)).toEqual(at);
  });
});

describe('layout 4: burning a house', () => {
  it('the torch-bearers set it alight if left at it; the ring is how far', () => {
    const { room } = roomWith('burning');
    only(room), park(room);
    const b = room.map.blocks.find((q) => q.held)!;
    step(room, 3);
    expect(b.torched!).toBeGreaterThan(SCENE.staged);
    step(room, SCENE.kindle * (1 - SCENE.staged) + 1, undefined, () => (b.burning ?? -1) >= 0);
    expect(b.burning).toBeGreaterThanOrEqual(0);
    expect(b.torched).toBeUndefined();
  });

  it('kill them first and it never catches', () => {
    const { room } = roomWith('burning');
    only(room), park(room);
    const b = room.map.blocks.find((q) => q.held)!;
    kill(room, 'kindle');
    step(room, SCENE.kindle + 2);
    expect(b.burning ?? -1).toBeLessThan(0);
    expect(b.torched).toBeCloseTo(SCENE.staged);
  });

  it('once it burns, someone inside can still be dragged out of its door, alight', () => {
    const { room } = roomWith('burning');
    only(room), kill(room, 'kindle');
    const b = room.map.blocks.find((q) => q.held)!, d = doorAt(b);
    b.burning = room.time;
    Object.assign(room.heroes[0], { x: d.x, y: d.y + 0.2 });
    const ev = step(room, SCENE.pull + 0.3);
    expect(ev.some((e) => e.k === 'pulled')).toBe(true);
    expect(b.pulled).toBe(1);
    const s = room.survivors.find((q) => !q.led)!;
    expect(Math.hypot(s.x - d.x, s.y - d.y)).toBeLessThan(1.5);
    // Nobody left in there: nothing more comes out.
    step(room, SCENE.pull + 0.3);
    expect(room.survivors).toHaveLength(1);
  });
});

describe('layout 4: a patrol and a body hauled', () => {
  it('the patrol walks its round', () => {
    const { room } = roomWith('patrol');
    only(room);
    Object.assign(room.heroes[0], { x: 0.6, y: room.map.h - 0.6 });
    const pat = room.enemies.filter((e) => e.task?.k === 'patrol'), start = pat.map((e) => [e.x, e.y]);
    step(room, 14);
    pat.forEach((e, k) => expect(Math.hypot(e.x - start[k][0], e.y - start[k][1])).toBeGreaterThan(1));
    expect(pat.some((e) => (e.task as { i: number }).i !== 1)).toBe(true);
  });

  it('two haul a body toward their fire, and drop it when they see you', () => {
    const { room } = roomWith('drag');
    only(room);
    Object.assign(room.heroes[0], { x: 0.6, y: room.map.h - 0.6 });
    const e = room.enemies.find((q) => q.haul)!, at = { ...e.haul! };
    step(room, 4);
    expect(Math.hypot(e.haul!.x - at.x, e.haul!.y - at.y)).toBeGreaterThan(0.8);
    Object.assign(room.heroes[0], { x: e.x + e.fx * 2.5, y: e.y + e.fy * 2.5 });
    step(room, 0.5);
    const dropped = { ...e.haul! };
    step(room, 2);
    expect(e.haul).toEqual(dropped);
    expect(e.task?.k === 'haul' && e.task.quit).toBe(true);
    expect(isDead(e)).toBe(false);
  });
});
