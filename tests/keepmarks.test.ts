// A gate's guards marked wherever they've got to (sim/targets.ts; Kyle 2026-11-27, Lowfurrow's drain gate).
import { describe, expect, it } from 'vitest';
import { landJob } from '../src/shared/territory';
import { kill } from '../src/sim/damage';
import { newRun, runRoom } from '../src/sim/run';
import { keepers, stretchOf } from '../src/sim/stretches';
import { targets } from '../src/sim/targets';

describe("a gate's guards", () => {
  it('each one still standing has a mark; none once they are all dead', () => {
    const run = newRun(landJob('lowfurrow', 1)), room = runRoom(run, 1);
    room.join('me');
    const s = stretchOf(run, room.map)!, left = keepers(s, room);
    expect(left.length).toBeGreaterThan(0);
    for (const e of left.slice(1)) kill(e, []);
    expect(targets(run, room).filter((t) => t.kind === 'keep').map((t) => t.id)).toEqual([left[0].id]);
    kill(left[0], []);
    expect(targets(run, room).some((t) => t.kind === 'keep')).toBe(false);
  });
});
