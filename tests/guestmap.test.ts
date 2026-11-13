/** A guest's map for a big room is the leader's (shared/guestmap.ts; Kyle, 2026-11-12: a guest off the map in an Instance). */
import { describe, expect, it } from 'vitest';
import { guestMap } from '../src/shared/guestmap';
import { openCut } from '../src/shared/instances';
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
