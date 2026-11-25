/**
 * A full fall on the north fields ends the trip as beaten (sim/landrules.ts) and the healer's fee is a quarter of the
 * purse, floored (shared/healfee.ts). Kyle, 2026-11-25.
 */
import { describe, expect, it } from 'vitest';
import { healFee } from '../src/shared/healfee';
import { landJob } from '../src/shared/territory';
import { HERO, INSTANCE, TICK } from '../src/shared/tuning';
import { newRun, runRoom, tally } from '../src/sim/run';
import { NO_INTENT, type FightEvent } from '../src/sim/types';

function party(ids: string[]) {
  const run = { ...newRun(landJob('gatefields', 3)), index: 0 }, room = runRoom(run), hs = ids.map((id) => room.join(id));
  for (const id of ids) room.setIntent(id, NO_INTENT);
  for (const e of room.allEnemies) Object.assign(e, { hp: 0, act: 'dead', respawns: false });
  const step = (s: number) => {
    for (let n = 0; n < Math.round(s / TICK); n++) (room.step(), tally(run, room, [] as FightEvent[], ids[0]));
  };
  return { run, hs, step };
}
const spentDown = (h: ReturnType<typeof party>['hs'][number]) => Object.assign(h, { hp: 0, act: 'down', actT: 0, actDur: HERO.respawn, selfUp: true });

describe('a full fall', () => {
  it('ends the trip as beaten after the wait, not waking anyone at the rest point', () => {
    const { run, hs, step } = party(['a', 'b']);
    hs.forEach(spentDown);
    step(INSTANCE.regroup - 0.5);
    expect(run.failed).toBe(false);
    step(1);
    expect(run.failed).toBe(true);
    expect(hs.every((h) => h.act === 'down')).toBe(true);
  });

  it('does not end while one of the party still stands', () => {
    const { run, hs, step } = party(['a', 'b']);
    spentDown(hs[0]);
    step(INSTANCE.regroup + 2);
    expect(run.failed).toBe(false);
    expect(hs[1].act).not.toBe('down');
  });
});

describe('the healer\'s fee', () => {
  it('is a quarter of the purse, floored, and nothing for nothing', () => {
    expect(healFee(1000)).toBe(250);
    expect(healFee(999)).toBe(249);
    expect(healFee(3)).toBe(0);
    expect(healFee(0)).toBe(0);
  });
});
