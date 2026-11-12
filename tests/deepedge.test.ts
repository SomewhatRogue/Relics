// The Deep is hard by how goblins hit, not how long they take to kill (sim/deepedge.ts; Kyle, 2026-11-11).
import { describe, expect, it } from 'vitest';
import { deepFloor } from '../src/shared/deep';
import { DEEP_BANDS, DEEP_EDGE } from '../src/shared/deepbands';
import { newRun, runRoom } from '../src/sim/run';
import { arenaRoom } from '../src/sim/arenaroom';
import { edgePause, edgeWind } from '../src/sim/deepedge';
import type { EnemyAttack } from '../src/sim/types';

const room = (n: number, floor = n) => runRoom(newRun({ ...deepFloor(n, 7, 'x'), floor }));

describe('the Deep edge', () => {
  it('every goblin hits harder and every band harder again, while health barely moves', () => {
    const r = room(2), e = r.enemies[0];
    expect(e.harm).toBeGreaterThanOrEqual(DEEP_BANDS[0].edge.harm);
    for (let i = 1; i < DEEP_BANDS.length; i++) expect(DEEP_BANDS[i].edge.harm).toBeGreaterThan(DEEP_BANDS[i - 1].edge.harm);
    for (const b of DEEP_BANDS) expect(b.edge.hp).toBeLessThanOrEqual(1);
    const a = room(17, 16), z = room(17, 26), hit = (x: typeof a) => Math.max(...x.enemies.map((g) => g.harm ?? 1));
    expect(hit(z)).toBeGreaterThan(hit(a));
  });

  it('wind-ups come quicker but never under the floors, and rests are shorter; bosses keep their clock', () => {
    const e = room(12).enemies.find((g) => !g.boss)!;
    const blow = (windup: number, unblockable = false) => ({ windup, unblockable }) as EnemyAttack;
    const long = blow(1.0), short = blow(0.42), striped = blow(1.0, true);
    edgeWind(e, long), edgeWind(e, short), edgeWind(e, striped);
    expect(long.windup).toBeLessThan(1.0);
    expect(short.windup).toBe(DEEP_EDGE.red);
    expect(striped.windup).toBeGreaterThanOrEqual(DEEP_EDGE.striped);
    expect(edgePause(e)).toBeLessThan(1);
    const off = room(12).enemies[0];
    delete off.edge;
    expect(edgePause(off)).toBe(1);
  });

  it("a boss floor's boss keeps its health (Kyle: big numbers, bigger health), hits harder, keeps its clock", () => {
    const job = deepFloor(5, 7, 'x'), run = newRun(job);
    run.index = run.job.rooms - 1;
    const boss = arenaRoom(run).enemies.find((g) => g.boss)!;
    const plain = arenaRoom({ ...run, job: { ...run.job, floor: undefined } }).enemies.find((g) => g.boss)!;
    expect(boss.maxHp).toBeGreaterThanOrEqual(Math.round(plain.maxHp * DEEP_BANDS[0].edge.hp));
    expect(boss.harm).toBeGreaterThan(plain.harm ?? 1);
    const b = { windup: 1.2, unblockable: false } as EnemyAttack;
    edgeWind(boss, b);
    expect(b.windup).toBe(1.2);
  });
});
