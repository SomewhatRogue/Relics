/** The job's recap counts (client/recaptally.ts): each player's own, from the run and what they carry. */
import { describe, expect, it } from 'vitest';
import { kitOf, recapOf } from '../src/client/recaptally';
import { newProfile } from '../src/shared/progress';
import { board } from '../src/shared/jobs';
import { expedition } from '../src/shared/expedjob';
import { newRun, tally } from '../src/sim/run';
import { ArenaRoom } from '../src/sim/room';
import type { Item } from '../src/shared/tuning';

const sword = (q: Item['quality']): Item => ({ kit: 'sword', quality: q, traits: [] } as unknown as Item);

describe('the recap', () => {
  it('counts rooms, goblins, own downs and what was picked up', () => {
    const job = board(3)[0], run = newRun(job), p = newProfile('WARRIOR');
    p.bag = [sword('plain')];
    const start = kitOf(p);
    Object.assign(run, { kills: 9, dens: 1, index: job.rooms - 1, falls: { me: 2, friend: 5 } });
    p.bag.push(sword('fine'));
    const r = recapOf(run, null, p, start, true, 'me');
    expect(r.rooms).toEqual([job.rooms, job.rooms]);
    expect([r.kills, r.dens, r.downs]).toEqual([9, 1, 2]);
    expect(r.found).toHaveLength(1);
    expect(r.jobs).toBeUndefined();
  });

  it('a job not won counts the rooms got through', () => {
    const job = { ...board(3)[0], rooms: 4 }, run = newRun(job);
    run.index = 2;
    expect(recapOf(run, null, newProfile(), null, false, 'me').rooms).toEqual([2, 4]);
  });

  it("an expedition counts its pinned jobs and side jobs as they're done", () => {
    const run = newRun(expedition(4)), room = new ArenaRoom(1);
    tally(run, room, [{ k: 'exped', x: 0, y: 0, what: 'goal', i: 0 }, { k: 'exped', x: 0, y: 0, what: 'side', i: 0 }, { k: 'exped', x: 0, y: 0, what: 'goal', i: 1 }] as never, 'me');
    const r = recapOf(run, null, newProfile(), null, true, 'me');
    expect(r.jobs?.[0]).toBe(2);
    expect(r.sides).toBe(1);
    expect(r.rooms).toBeUndefined();
  });

  it('gives a time only when the job set out lately', () => {
    const run = newRun(board(3)[0]);
    run.began = Date.now() - 400_000;
    expect(recapOf(run, null, newProfile(), null, true, 'me').secs).toBeCloseTo(400, -1);
    run.began = Date.now() - 9 * 3600_000;
    expect(recapOf(run, null, newProfile(), null, true, 'me').secs).toBeUndefined();
  });
});
