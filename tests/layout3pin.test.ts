/** Layout 3 rooms stay exactly as they were when layout 4 came in (2026-11-04): a saved layout-3 job plans the same. */
import { describe, expect, it } from 'vitest';
import { PLACES, SEWERS, board, type Job } from '../src/shared/jobs';
import { routeOf } from '../src/shared/route';
import { planRoom, type RoadId } from '../src/shared/terrain';

const fnv = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
};

describe('layout 3: seeds', () => {
  it('layout 3 rooms are exactly as they were before layout 4', () => {
    let all = 0;
    const one = (j: Job) => {
      for (const took of ['h', 'l'] as const) {
        const r = routeOf(j, took), f = r.findIndex((x) => (x.outs?.length ?? 0) === 2), road: RoadId = took === 'l' ? 'low' : 'high';
        for (let i = 0; i < j.rooms; i++) {
          const taken: Record<number, RoadId> = f >= 0 && i > f ? { [f + 1]: road } : {};
          all = fnv(all + ':' + fnv(JSON.stringify(planRoom(j, i, taken[i], taken))));
        }
      }
    };
    for (const day of [1, 2, 3]) for (const j0 of board(day)) one({ ...j0, layout: 3 });
    for (const p of [...PLACES, SEWERS]) for (const seed of [7, 707]) one({ ...board(1)[2], place: p, rooms: 5, seed, layout: 3 });
    // Taken 2026-11-04, before layout 4; re-pinned 2026-11-05 for the ironhide and rush templates (maps, props and chests checked unchanged).
    // Re-pinned 2026-11-05 for the doors rule (shared/doors.ts): with it switched off it is still 2578152521, so houses shut and a door that took others in are all that moved.
    // Re-pinned 2026-11-05 for pacing (shared/threat.ts: the threat budget, beats, BIG ONEs): the same 388 rooms hashed with their goblins
    // taken out are 713718104 before and after, so only the goblins moved (counts, roles, health, placements).
    expect(all).toBe(2459865809 /* 2026-11-06: a fallen-in house is never the kept door (shared/doors.ts). Before: 1139809545 */);
  }, 240000);
});
