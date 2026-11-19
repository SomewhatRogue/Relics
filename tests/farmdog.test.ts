/**
 * Tollan's farm dog (client/farmdog.ts): it waits at a post watching, runs on when someone comes close, stays
 * ahead, stops at its last post, and every Tollan map says where it goes. And the barn's doors are hauled
 * (sim/stretches.ts): slowly by one, quickly by two, and they swing back if let go.
 */
import { describe, expect, it } from 'vitest';
import { collide, levelAt, useMap } from '../src/shared/arena';
import { landJob, territoryPlan } from '../src/shared/territory';
import { DOOR_HAUL } from '../src/shared/tollanyardland';
import { TICK } from '../src/shared/tuning';
import { DOG, farmDog, newDog, stepDog, type Post } from '../src/client/farmdog';
import { newRun, runRoom } from '../src/sim/run';
import { HAUL, stepStretches } from '../src/sim/stretches';
import { NO_INTENT } from '../src/sim/types';

const POSTS: Post[] = [[10, 50, 0.85], [10, 30], [20, 10]];

describe('the farm dog', () => {
  it('sits at its post, on the wall, facing whoever is nearest, while they keep off', () => {
    const s = newDog(POSTS);
    for (let i = 0; i < 60; i++) stepDog(s, POSTS, [{ x: 2, y: 58 }], 0.05);
    expect([s.i, s.x, s.y, s.up, s.moving, s.fx]).toEqual([0, 10, 50, 0.85, false, -1]);
  });

  it('runs on to the next post when someone comes close, comes down off the wall, and waits there', () => {
    const s = newDog(POSTS), hero = { x: 10, y: 50 + DOG.shy - 0.5 };
    stepDog(s, POSTS, [hero], 0.05);
    expect([s.i, s.moving, s.up]).toEqual([1, true, 0]);
    let ticks = 0;
    while (s.moving && ticks++ < 200) stepDog(s, POSTS, [hero], 0.05);
    expect([s.i, s.x, s.y, s.moving]).toEqual([1, 10, 30, false]);
    // Quick: twenty tiles in well under three seconds.
    expect(ticks * 0.05).toBeLessThan(3);
    // It doesn't go on while it's running, only once it has got there and you come up again.
    for (let i = 0; i < 20; i++) stepDog(s, POSTS, [hero], 0.05);
    expect(s.i).toBe(1);
  });

  it('stops at its last post however close you come', () => {
    const s = newDog(POSTS);
    for (let i = 0; i < 400; i++) stepDog(s, POSTS, [{ x: s.x + 1, y: s.y + 1 }], 0.05);
    expect([s.i, s.x, s.y, s.moving]).toEqual([2, 20, 10, false]);
  });

  it('is on each of Tollan`s maps, every post on open ground and each one further on than the last', () => {
    for (const index of [0, 1, 2]) {
      const m = territoryPlan(landJob('tollan', 3), index).map, posts = m.dog!.posts;
      useMap(m);
      for (const [x, y, up] of posts) {
        if (up) continue;
        const q = { x, y, z: levelAt(m, x, y) };
        collide(q, 0.25);
        expect(Math.hypot(q.x - x, q.y - y), `map ${index} post ${x},${y}`).toBeLessThan(0.05);
      }
      if (index < 2) expect(posts.length).toBe(4);
      if (index === 0) for (let i = 1; i < posts.length; i++) expect(posts[i][1]).toBeLessThan(posts[i - 1][1]);
    }
    // In the barn it isn't there while MAWL stands, and is at the doors after.
    const barn = territoryPlan(landJob('tollan', 3), 2).map;
    expect(farmDog(barn, [barn.hero], true, 1)).toBeNull();
    expect(farmDog(barn, [barn.hero], false, 1)).toMatchObject({ x: barn.dog!.posts[0][0], home: true });
  });
});

describe('the barn`s doors, hauled', () => {
  const yard = (heroes: number) => {
    const run = newRun(landJob('tollan', 3));
    Object.assign(run, { index: 1, party: heroes });
    const room = runRoom(run), st = room.map.stretches![0], at = st.at!;
    const hs = Array.from({ length: heroes }, (_, i) => room.join('h' + i));
    for (const h of hs) room.setIntent(h.id, NO_INTENT);
    for (const e of room.allEnemies) Object.assign(e, { hp: 0, act: 'dead' });
    const stand = (on: boolean) => hs.forEach((h, i) => Object.assign(h, { x: at.x + 1 + i, y: on ? at.y + 1 : at.y + 8, z: 2 }));
    // (The room's clock moved by hand: the haul goes by it.)
    const secs = (n: number) => { for (let t = 0; t <= Math.round(n / TICK); t++) stepStretches(run, room, []), (room.time += TICK); };
    return { run, room, gate: room.map.blocks[st.gate!], stand, secs };
  };

  it('take one hero four seconds, and are drawn as two leaves', () => {
    const y = yard(1);
    expect([y.room.map.stretches![0].haul, y.gate.look]).toEqual([DOOR_HAUL, 2]);
    y.stand(true), y.secs(DOOR_HAUL - 0.5);
    expect([y.gate.ruined ?? false, y.run.stretch ?? 0, (y.gate.open ?? 0) > 0.8]).toEqual([false, 0, true]);
    y.secs(0.7);
    expect([y.gate.ruined, y.run.stretch]).toEqual([true, 1]);
  });

  it('come open more than twice as fast for two', () => {
    const y = yard(2);
    y.stand(true), y.secs(DOOR_HAUL / HAUL.many + 0.2);
    expect([y.gate.ruined, y.run.stretch]).toEqual([true, 1]);
  });

  it('swing back if you let go', () => {
    const y = yard(1);
    y.stand(true), y.secs(2);
    const far = y.gate.open!;
    y.stand(false), y.secs(0.5);
    expect(y.gate.open!).toBeLessThan(far);
    y.secs(3);
    expect([y.gate.open, y.gate.ruined ?? false]).toEqual([0, false]);
  });
});
