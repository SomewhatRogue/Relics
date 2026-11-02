/** The quest marks' list (sim/targets.ts): what the goal is about, by objective, and nothing else. */
import { describe, expect, it } from 'vitest';
import { PLACES, board, type Job } from '../src/shared/jobs';
import { Game } from '../src/client/game';
import { damageProp, newProp } from '../src/sim/props';
import { freeSurvivor } from '../src/sim/survivors';
import { goal, newRun, runRoom } from '../src/sim/run';
import type { ArenaRoom } from '../src/sim/room';
import { targets } from '../src/sim/targets';


const job = (objective: Job['objective'], kind: Job['place']['kind'] = 'village', seed = 99): Job =>
  ({ ...board(1)[0], rooms: 3, place: PLACES.find((p) => p.kind === kind)!, objective, boss: 'SKARN', seed, deep: false });
const kinds = (list: { kind: string }[]) => list.map((t) => t.kind).sort();

/** The last room of a job of `objective`, as the game builds it. */
function lastRoom(objective: Job['objective'], kind: Job['place']['kind'] = 'field') {
  const g = new Game(), j = job(objective, kind);
  g.startJob(j);
  g.run!.index = j.rooms - 1;
  (g as unknown as { place: (r: ArenaRoom) => void }).place(runRoom(g.run!));
  return { g, run: g.run!, room: g.room };
}
const world = (r: Game['room']) => ({ heroes: r.heroes, enemies: r.enemies, javelins: r.javelins, props: r.props, survivors: r.survivors, now: r.time, ev: r.events });

describe('quest marks', () => {
  it('a larder job marks each rack, and a smashed one goes', () => {
    const { run, room } = lastRoom('larder');
    const racks = targets(run, room).filter((t) => t.kind === 'larder');
    expect(racks.length).toBe(room.props.filter((p) => p.kind === 'larder').length);
    expect(racks.length).toBeGreaterThan(0);
    // The banner says what a larder is.
    expect(goal(run, room).text).toContain('Smash the larder racks');
    damageProp(room.props.find((p) => p.kind === 'larder')!, 999, world(room));
    expect(targets(run, room).filter((t) => t.kind === 'larder').length).toBe(racks.length - 1);
    expect(goal(run, room).text).toContain(`(${racks.length - 1} left)`);
  });

  it('a dens job marks each den not burned down', () => {
    const { run, room } = lastRoom('burn');
    const dens = room.map.blocks.filter((b) => b.kind === 'den');
    expect(kinds(targets(run, room).filter((t) => t.kind === 'den'))).toEqual(dens.map(() => 'den'));
    expect(goal(run, room).text).toContain('Burn out the dens');
    dens[0].ruined = true;
    expect(targets(run, room).filter((t) => t.kind === 'den').length).toBe(dens.length - 1);
  });

  it('a hunt marks the named butcher, and only while it lives', () => {
    const { run, room } = lastRoom('hunt');
    const boss = room.enemies.find((e) => e.name)!, marked = targets(run, room).filter((t) => t.kind === 'boss');
    expect(marked).toEqual([{ kind: 'boss', x: boss.x, y: boss.y, id: boss.id }]);
    // A plain butcher or goblin is never marked.
    expect(targets(run, room).every((t) => t.kind !== 'boss' || t.id === boss.id)).toBe(true);
    boss.hp = 0;
    boss.act = 'dead';
    expect(targets(run, room).some((t) => t.kind === 'boss')).toBe(false);
  });

  it('a rescue marks the cages, then the way back in with whoever is freed, and the doors with folk inside', () => {
    const { run, room } = lastRoom('rescue');
    room.props = [5, 10].map((x) => newProp('cage', x, 6, false));
    expect(kinds(targets(run, room))).toEqual(['cage', 'cage']);
    damageProp(room.props[0], 999, world(room));
    const t = targets(run, room);
    expect(kinds(t)).toEqual(['cage', 'out']);
    expect(t.find((x) => x.kind === 'out')).toMatchObject(room.map.hero);
    for (const s of room.survivors) s.home = 1;
    damageProp(room.props[1], 999, world(room));
    for (const s of room.survivors) s.home = 1;
    expect(targets(run, room)).toEqual([]);
    // Someone caged or freed in a house: its door; an empty house, nothing.
    const houses = [{ x: 3, y: 4, caged: 1, waiting: 0 }, { x: 8, y: 4, caged: 0, waiting: 1 }, { x: 12, y: 4, caged: 0, waiting: 0 }];
    expect(targets(run, room, houses)).toEqual([{ kind: 'door', x: 3, y: 4 }, { kind: 'door', x: 8, y: 4 }]);
  });

  it('indoors: the cages, then the door out with whoever is freed', () => {
    const { run, room } = lastRoom('rescue');
    room.indoors = true;
    room.props = [newProp('cage', 5, 3, false)];
    // A house's own doors outside don't show in here.
    expect(kinds(targets(run, room, [{ x: 3, y: 4, caged: 1, waiting: 0 }]))).toEqual(['cage']);
    freeSurvivor(room.survivors, 5, 3, 0);
    room.props[0].broken = true;
    expect(kinds(targets(run, room))).toEqual(['out']);
  });

  it('a middle room marks its nests, not the job; off a job, nothing', () => {
    const { run, room } = lastRoom('larder');
    run.index = 0;
    expect(targets(run, room).some((t) => t.kind === 'larder')).toBe(false);
    const nest = { ...room.enemies[0], id: 999, kind: 'nest' as const, hp: 30, act: 'idle' as const };
    room.enemies.push(nest);
    expect(targets(run, room).filter((t) => t.kind === 'nest')).toEqual([{ kind: 'nest', x: nest.x, y: nest.y, id: 999 }]);
    expect(targets(null, room)).toEqual([]);
    expect(newRun(job('rescue')).index).toBe(0);
  });
});
