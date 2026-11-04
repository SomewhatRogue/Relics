/** Finding your way on a job: the freed come out of houses with you, the goal counts them, the way out is plain. */
import { describe, expect, it } from 'vitest';
import { collide, doorAt, inArea, useMap, type Area, type GameMap } from '../src/shared/arena';
import { PLACES, board, type Job } from '../src/shared/jobs';
import { planRoom } from '../src/shared/terrain';
import { HERO, TICK } from '../src/shared/tuning';
import { Game } from '../src/client/game';
import { damageProp, newProp } from '../src/sim/props';
import { freeSurvivor } from '../src/sim/survivors';
import { goal, newRun } from '../src/sim/run';
import { NO_INTENT } from '../src/sim/types';
import type { ArenaRoom } from '../src/sim/room';
import { WayWatch, wayTarget } from '../src/client/wayfind';

const job = (kind: Job['place']['kind'] = 'village', objective: Job['objective'] = 'rescue', seed = 99): Job =>
  ({ ...board(1)[0], layout: undefined, rooms: 3, place: PLACES.find((p) => p.kind === kind)!, objective, boss: 'SKARN', seed, deep: false });
const world = (r: ArenaRoom) => ({ heroes: r.heroes, enemies: r.enemies, javelins: r.javelins, props: r.props, survivors: r.survivors, now: r.time, ev: r.events });
const mid = (a: Area) => ({ x: a.x + a.w / 2, y: a.y + a.h / 2 });

/** Walk the player toward (x, y) a tick at a time until there (or `max` seconds), the game running. */
function walkTo(g: Game, p: { x: number; y: number }, max = 8, stop = () => false): void {
  for (let i = 0; i < max / TICK && !stop(); i++) {
    const dx = p.x - g.hero.x, dy = p.y - g.hero.y, d = Math.hypot(dx, dy);
    if (d < 0.15) break;
    g.step(TICK, { ...NO_INTENT, mx: dx / d, my: dy / d });
  }
}

/** On a job, into the first house with someone caged in it, the goblins in it dead, the cage broken. */
function freedInAHouse(g: Game): { door: { x: number; y: number } } {
  g.startJob(job('village', 'hunt', 7));
  for (const b of g.room.map.blocks.filter((x) => x.door && !x.ruined)) {
    Object.assign(g.hero, doorAt(b));
    g.enter(b);
    const cage = g.room.props.find((p) => p.kind === 'cage');
    if (!cage) {
      walkTo(g, mid(g.room.map.exit!), 8, () => !g.outside);
      continue;
    }
    for (const e of g.room.enemies) (e.hp = 0), (e.act = 'dead');
    Object.assign(g.hero, { x: cage.x, y: cage.y + 1 });
    damageProp(cage, 999, world(g.room));
    return { door: doorAt(b) };
  }
  throw new Error('no house with a cage');
}

describe('the freed come out of houses with you', () => {
  it('alone: break the cage, walk out the door, and they come out behind you and count', () => {
    const g = new Game(), { door } = freedInAHouse(g), inside = g.room;
    expect(inside.survivors).toHaveLength(1);
    // Give them a moment to stand, then walk out.
    for (let i = 0; i < 1.6 / TICK; i++) g.step(TICK, NO_INTENT);
    walkTo(g, { x: mid(inside.map.exit!).x, y: inside.map.h }, 10, () => !g.outside);
    expect(g.outside).toBe(null);
    g.step(TICK, NO_INTENT);
    const s = g.room.survivors[0];
    expect(s).toBeTruthy();
    // Out by the door they were brought through, not somewhere else on the street.
    expect(Math.hypot(s.x - door.x, s.y - door.y)).toBeLessThan(2);
    expect(s.home).toBeGreaterThan(0);
    expect(g.run!.rescued).toBe(1);
    expect(inside.survivors).toHaveLength(0);
  });

  it('leading a party: someone following a friend in the house comes out when the party does', () => {
    const g = new Game(), { door } = freedInAHouse(g), inside = g.room;
    const friend = inside.join('sam-00001');
    const s = inside.survivors[0];
    Object.assign(friend, { x: s.x + 1, y: s.y });
    Object.assign(g.hero, { x: mid(inside.map.exit!).x, y: inside.map.h - 0.4 });
    g.step(TICK, NO_INTENT);
    expect(g.outside).toBe(null);
    g.step(TICK, NO_INTENT);
    expect(g.room.survivors).toHaveLength(1);
    expect(Math.hypot(g.room.survivors[0].x - door.x, g.room.survivors[0].y - door.y)).toBeLessThan(2);
    expect(g.run!.rescued).toBe(1);
  });

  it("the arrow points at the cage, then out of the door once they're freed", () => {
    const g = new Game();
    g.startJob(job('village', 'hunt', 7));
    for (const b of g.room.map.blocks.filter((x) => x.door && !x.ruined)) {
      Object.assign(g.hero, doorAt(b));
      g.enter(b);
      const cage = g.room.props.find((p) => p.kind === 'cage');
      if (!cage) {
        walkTo(g, mid(g.room.map.exit!), 8, () => !g.outside);
        continue;
      }
      Object.assign(g.hero, { x: cage.x + 4, y: cage.y + 0.5 });
      expect(wayTarget(g)).toMatchObject({ x: cage.x, y: cage.y });
      damageProp(cage, 999, world(g.room));
      Object.assign(g.hero, { x: 1, y: 1 });
      expect(wayTarget(g)).toEqual(mid(g.room.map.exit!));
      return;
    }
    throw new Error('no house with a cage');
  });
});

describe('the goal says how many are left', () => {
  it('a rescue counts the caged and the freed, and opens the way home only when everyone is out', () => {
    const g = new Game(), j = job('field');
    g.startJob(j);
    const room = g.room;
    room.enemies.length = 0;
    room.props = [];
    const run = newRun(j);
    run.index = 2;
    // Two cages out in the open.
    room.props.push(...[5, 10].map((x) => newProp('cage', x, 6, false)));
    expect(goal(run, room)).toEqual({ text: '2 to free', done: false });
    damageProp(room.props[0], 999, world(room));
    expect(goal(run, room).text).toBe('1 to free, 1 to bring out');
    damageProp(room.props.find((p) => p.kind === 'cage' && !p.broken)!, 999, world(room));
    expect(goal(run, room).text).toBe('2 to bring out');
    // Someone freed in a house still to bring out counts too; caged in houses are extra.
    for (const s of room.survivors) s.home = 1;
    expect(goal(run, room, { caged: 3, waiting: 1 })).toEqual({ text: '1 to bring out. 3 more in the houses', done: false });
    expect(goal(run, room, { caged: 3, waiting: 0 })).toEqual({ text: "Everyone's out. Way home: north. 3 more in the houses", done: true });
    // A middle room names the way on, and anyone caged there.
    run.index = 0;
    expect(goal(run, room).text).toBe('Way on: north');
    freeSurvivor(room.survivors, 4, 4, 0);
    expect(goal(run, room).text).toBe('Way on: north. 1 to bring out');
  });

  it('says which way the moment the way opens, once', () => {
    const g = new Game(), w = new WayWatch();
    g.startJob(job('forest', 'hunt'));
    g.room.exitOpen = false;
    expect(w.check(g)).toBe(null);
    g.room.exitOpen = true;
    expect(w.check(g)).toBe('WAY ON: NORTH');
    expect(w.check(g)).toBe(null);
  });
});

/** Where a hero can walk from the way in (the houses test's flood, on a run room's plan). */
function reachable(map: GameMap): (x: number, y: number) => boolean {
  useMap(map);
  const step = 0.25, cols = Math.floor(map.w / step), rows = Math.floor(map.h / step), seen = new Set<number>();
  const open = (x: number, y: number) => {
    const q = { x, y, z: 0 };
    collide(q, HERO.radius);
    return Math.hypot(q.x - x, q.y - y) < 1e-6;
  };
  const start = [Math.floor(map.hero.x / step), Math.floor(map.hero.y / step)], todo = [start];
  seen.add(start[0] * 1000 + start[1]);
  while (todo.length) {
    const [i, j] = todo.pop()!;
    for (const [a, c] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
      if (a < 0 || c < 0 || a >= cols || c >= rows || seen.has(a * 1000 + c)) continue;
      if (open((a + 0.5) * step, (c + 0.5) * step) || inArea({ x: 0, y: 0, w: map.w, h: 1.2 }, (a + 0.5) * step, (c + 0.5) * step)) seen.add(a * 1000 + c), todo.push([a, c]);
    }
  }
  return (x, y) => [...seen].some((k) => Math.hypot((Math.floor(k / 1000) + 0.5) * step - x, ((k % 1000) + 0.5) * step - y) < 0.4);
}

describe('every room has a way out you can see and reach', () => {
  it('a gap in the north wall, clear in front, reachable from the way in, for every kind of place', () => {
    for (const p of PLACES) for (const seed of [3, 11]) for (let i = 0; i < 3; i++) {
      const plan = planRoom({ ...job(p.kind, 'rescue', seed), place: p }, i), m = plan.map;
      const ways = m.exit ? [m.exit] : (m.roads ?? []).map((r) => r.area);
      expect(ways.length, `${p.kind} ${seed} ${i}`).toBeGreaterThan(0);
      const can = reachable(m);
      for (const a of ways) {
        // Nothing standing in front of it to hide it.
        const front = { x: a.x - 0.5, y: 0, w: a.w + 1, h: 2.2 };
        const hidden = m.blocks.filter((b) => !b.ruined && b.x < front.x + front.w && b.x + b.w > front.x && b.y < front.y + front.h);
        expect(hidden, `${p.kind} ${seed} room ${i}: in front of the way out`).toEqual([]);
        expect(can(mid(a).x, a.y + a.h + 0.3), `${p.kind} ${seed} room ${i}: reach the way out`).toBe(true);
      }
    }
  }, 60000);
});
