/** A guest's map for a big room is the leader's (shared/guestmap.ts; Kyle, 2026-11-12: a guest off the map in an Instance). */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { guestMap } from '../src/shared/guestmap';
import { expedition } from '../src/shared/expedjob';
import { openCut } from '../src/shared/instances';
import { LANDS, landJob, mapsOf } from '../src/shared/territory';
import { newRun, runRoom } from '../src/sim/run';

describe('a guest`s map in an Instance', () => {
  it('is the one the leader built, in every area and on either way at the fork', () => {
    for (const [index, way] of [[0, undefined], [1, 0], [1, 1]] as const) {
      const run = newRun(openCut(7));
      Object.assign(run, { index, way });
      const room = runRoom(run), mine = guestMap(run);
      expect(room.sleepFar).toBe(true);
      expect([mine.w, mine.h, mine.name]).toEqual([room.map.w, room.map.h, room.map.name]);
      expect(mine.blocks.length).toBe(room.map.blocks.length);
      expect(JSON.stringify(mine.stretches)).toBe(JSON.stringify(room.map.stretches));
    }
  });
});

/**
 * The same for every kind of room whose map is never sent (one whose far goblins doze: client/interest.ts isBig).
 * (Kyle, 2026-11-18: "the other person is in a different spot on their screen", in a raid or an instance. A
 * territory's room was big and guestMap didn't know of territories: a friend built an expedition's map and stood
 * on that, where the leader had them on Lowfurrow's.)
 */
describe('a guest`s map in any big room', () => {
  const same = (run: ReturnType<typeof newRun>, what: string) => {
    const room = runRoom(run), mine = guestMap(run);
    expect(room.sleepFar, what).toBe(true);
    expect([mine.w, mine.h, mine.name], what).toEqual([room.map.w, room.map.h, room.map.name]);
    expect(mine.blocks.map((b) => [b.x, b.y, b.w, b.h]), what).toEqual(room.map.blocks.map((b) => [b.x, b.y, b.w, b.h]));
    expect(JSON.stringify([mine.hero, mine.ledges ?? [], mine.water ?? [], mine.stretches ?? []]), what).toBe(JSON.stringify([room.map.hero, room.map.ledges ?? [], room.map.water ?? [], room.map.stretches ?? []]));
  };

  it('a territory: every map of every one', () => {
    for (const land of LANDS) for (let index = 0; index < mapsOf(land); index++) {
      const run = newRun(landJob(land, 3));
      Object.assign(run, { index, party: 2 });
      same(run, `${land} map ${index}`);
    }
  });

  it('no kind of big room that this file has not been taught', () => {
    // Every room made with `sleep: true` is one a friend builds the map of. A new one: teach shared/guestmap.ts
    // its map, add a test for it above, then add its file here.
    const dir = new URL('../src/sim/', import.meta.url);
    const big = readdirSync(dir).filter((f) => f.endsWith('.ts') && /sleep: true/.test(readFileSync(new URL(f, dir), 'utf8'))).sort();
    expect(big).toEqual(['expedroom.ts', 'instanceroom.ts', 'landroom.ts']);
  });

  it('an expedition', () => {
    const run = newRun(expedition(4));
    run.party = 2;
    same(run, 'expedition');
  });
});
