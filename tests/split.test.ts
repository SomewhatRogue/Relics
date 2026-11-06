/**
 * A party split between the street and its houses: each player goes in and out on their own, the
 * leader's game runs every room someone's in, the ones outside see who went in where, the small
 * goblins follow whoever went in, and the way on waits for everyone to come out.
 */
import { describe, expect, it } from 'vitest';
import { doorAt, inArea, type Area, type Block } from '../src/shared/arena';
import { PLACES, board, type Job } from '../src/shared/jobs';
import { TICK } from '../src/shared/tuning';
import { Game, ME } from '../src/client/game';
import { loadRoom } from '../src/client/coop';
import { JobRooms } from '../src/client/jobrooms';
import { Followers } from '../src/client/followers';
import { newEnemy } from '../src/sim/enemies';
import { damageProp } from '../src/sim/props';
import { undoDoors } from './undoors';
import { NO_INTENT, type Intent } from '../src/sim/types';
import type { ArenaRoom } from '../src/sim/room';

const job = (seed = 7): Job => ({ ...board(1)[0], layout: undefined, rooms: 3, place: PLACES.find((p) => p.kind === 'village')!, objective: 'hunt', boss: 'SKARN', seed, deep: false });
const mid = (a: Area) => ({ x: a.x + a.w / 2, y: a.y + a.h / 2 });
const SAM = 'sam-00001', ANA = 'ana-00001';

/** A leader on a village job with friends (their input set by `say`), the street's goblins gone. */
function party(...ids: string[]) {
  const g = new Game();
  g.startJob(job());
  const friends = new Map(ids.map((id) => [id, { name: id.slice(0, 3).toUpperCase(), profile: null, intent: { ...NO_INTENT } as Intent, heard: 0, fresh: false, gone: false }]));
  (g as unknown as { coop: unknown }).coop = { friends, away: () => false, members: [] };
  const street = g.room;
  street.enemies.length = 0;
  for (const id of ids) Object.assign(street.join(id), { x: street.map.hero.x + 1, y: street.map.hero.y });
  // (These are about each player's own house, so the street gets back the doors the doors rule shut: shared/doors.ts.)
  undoDoors(street.map.blocks);
  const doors = street.map.blocks.filter((b) => b.door && !b.ruined && !b.locked);
  const say = (id: string, i: Partial<Intent>) => Object.assign(friends.get(id)!.intent, i);
  return { g, street, doors, say, friends };
}
const heroIn = (r: ArenaRoom, id: string) => r.heroes.find((h) => h.id === id);
/** Stand a player at a door's foot and walk them up into it for a few ticks. */
function walkIn(g: Game, street: ArenaRoom, say: (id: string, i: Partial<Intent>) => void, id: string, b: Block) {
  Object.assign(heroIn(street, id)!, doorAt(b));
  say(id, { my: -1 });
  for (let i = 0; i < 4 && heroIn(street, id); i++) g.step(TICK, NO_INTENT);
  say(id, { my: 0 });
}
const run = (g: Game, s: number) => {
  for (let i = 0; i < s / TICK; i++) g.step(TICK, NO_INTENT);
};

describe('going indoors on your own', () => {
  it("a friend goes in alone: the leader stays out, sees their name over that door, and the house runs with them in it", () => {
    const { g, street, doors, say } = party(SAM);
    const b = doors[0];
    walkIn(g, street, say, SAM, b);
    const house = g.rooms.houses.get(b)!;
    expect(heroIn(house, SAM)).toBeTruthy();
    expect(g.room).toBe(street);
    expect(heroIn(street, ME)).toBeTruthy();
    expect(g.doorMarks()).toEqual([{ ...doorAt(b), who: [{ name: 'SAM', cls: expect.any(String) }] }]);
    // The house keeps its own time while the leader's outside.
    const t0 = house.time;
    run(g, 1);
    expect(house.time).toBeGreaterThan(t0 + 0.9);
    // A goblin in there goes for Sam.
    const e = newEnemy(99, 'scrapper', heroIn(house, SAM)!.x + 3, heroIn(house, SAM)!.y);
    Object.assign(e, { alert: true, respawns: false });
    house.enemies.push(e);
    const d0 = Math.hypot(e.x - heroIn(house, SAM)!.x, e.y - heroIn(house, SAM)!.y);
    run(g, 1);
    expect(Math.hypot(e.x - heroIn(house, SAM)!.x, e.y - heroIn(house, SAM)!.y)).toBeLessThan(d0);
  });

  it('the leader goes in alone: the friend stays out in the street, still playing', () => {
    const { g, street, doors } = party(SAM);
    const b = doors[0];
    Object.assign(g.hero, doorAt(b));
    g.enter(b);
    expect(g.outside?.room).toBe(street);
    expect(heroIn(g.room, ME)).toBeTruthy();
    expect(heroIn(g.room, SAM)).toBeFalsy();
    expect(heroIn(street, SAM)).toBeTruthy();
    // The street runs on with Sam in it; he walks.
    const x0 = heroIn(street, SAM)!.x, t0 = street.time;
    g.coop!.friends.get(SAM)!.intent.mx = 1;
    run(g, 0.5);
    expect(street.time).toBeGreaterThan(t0);
    expect(heroIn(street, SAM)!.x).toBeGreaterThan(x0);
  });

  it('two friends in two houses at once, each house running', () => {
    const { g, street, doors, say } = party(SAM, ANA);
    walkIn(g, street, say, SAM, doors[0]);
    walkIn(g, street, say, ANA, doors[1]);
    const a = g.rooms.houses.get(doors[0])!, c = g.rooms.houses.get(doors[1])!;
    expect(heroIn(a, SAM) && heroIn(c, ANA)).toBeTruthy();
    expect(g.doorMarks()).toHaveLength(2);
    const [ta, tc] = [a.time, c.time];
    run(g, 0.5);
    expect(a.time).toBeGreaterThan(ta);
    expect(c.time).toBeGreaterThan(tc);
  });

  it('a small goblin after a friend follows them in; a butcher does not', () => {
    const { g, street, doors, say } = party(SAM);
    const b = doors[0], d = doorAt(b);
    const small = Object.assign(newEnemy(50, 'scrapper', d.x + 1.5, d.y + 1), { alert: true, respawns: false });
    const big = Object.assign(newEnemy(51, 'butcher', d.x - 1.5, d.y + 1), { alert: true, respawns: false });
    street.enemies.push(small, big);
    walkIn(g, street, say, SAM, b);
    const house = g.rooms.houses.get(b)!;
    run(g, 2.5);
    expect(house.enemies).toContain(small);
    expect(house.enemies).not.toContain(big);
    expect(street.enemies).toContain(big);
  });

  it('a friend brings someone freed out of a house: home, and counted', () => {
    const { g, street, doors, say } = party(SAM);
    for (const b of doors) {
      walkIn(g, street, say, SAM, b);
      const house = g.rooms.houses.get(b)!, cage = house.props.find((p) => p.kind === 'cage');
      if (!cage) {
        Object.assign(heroIn(house, SAM)!, mid(house.map.exit!));
        g.step(TICK, NO_INTENT);
        continue;
      }
      for (const e of house.enemies) (e.hp = 0), (e.act = 'dead');
      Object.assign(heroIn(house, SAM)!, { x: cage.x, y: cage.y + 1 });
      damageProp(cage, 999, { heroes: house.heroes, enemies: house.enemies, javelins: house.javelins, props: house.props, survivors: house.survivors, now: house.time, ev: house.events });
      run(g, 1.6);
      expect(house.survivors).toHaveLength(1);
      // Sam walks out the bottom: the freed come with him; the leader never went in.
      Object.assign(heroIn(house, SAM)!, { x: mid(house.map.exit!).x, y: house.map.exit!.y + 0.1 });
      g.step(TICK, NO_INTENT);
      expect(heroIn(street, SAM)).toBeTruthy();
      run(g, 0.2);
      expect(house.survivors).toHaveLength(0);
      expect(street.survivors).toHaveLength(1);
      expect(g.run!.rescued).toBe(1);
      return;
    }
    throw new Error('no house with a cage');
  });

  it("the way on waits for a friend who's indoors", () => {
    const { g, street, doors, say } = party(SAM);
    walkIn(g, street, say, SAM, doors[0]);
    const exit = street.map.exit ?? street.map.roads![0].area;
    street.exitOpen = true;
    Object.assign(g.hero, mid(exit));
    expect(inArea(exit, g.hero.x, g.hero.y)).toBe(true);
    expect(g.together(exit)).toBe(false);
    // Out he comes, over to the way on: now they go together.
    const house = g.rooms.houses.get(doors[0])!;
    Object.assign(heroIn(house, SAM)!, { x: mid(house.map.exit!).x, y: house.map.exit!.y + 0.1 });
    g.step(TICK, NO_INTENT);
    Object.assign(heroIn(street, SAM)!, mid(exit));
    expect(g.together(exit)).toBe(true);
  });

  it('the whole job hands on with the houses in it: a friend indoors is still indoors', () => {
    const { g, street, doors, say } = party(SAM);
    walkIn(g, street, say, SAM, doors[0]);
    const save = JSON.parse(JSON.stringify(g.jobSave()));
    const rooms = new JobRooms(new Followers());
    rooms.load(loadRoom(save.room), save.houses);
    const back = rooms.roomOf(SAM)!;
    expect(back.indoors).toBe(true);
    expect(rooms.doorOf(back)).toBe(rooms.street!.map.blocks[street.map.blocks.indexOf(doors[0])]);
    expect(heroIn(rooms.street!, ME)).toBeTruthy();
  });
});
