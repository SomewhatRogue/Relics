/**
 * What a job owes its players (api/owed.ts), kept by the job's leader: writes, reads, drops, and only
 * sane runs get through. And a hero's kit (client/keepkit.ts): the room's changes go into the save,
 * and a restored hero is dressed from it.
 */
import { Readable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import handler from '../api/owed';
import { newRun } from '../src/sim/run';
import { board } from '../src/shared/jobs';
import { newProfile } from '../src/shared/progress';
import { dressKit, keepKit } from '../src/client/keepkit';
import { ArenaRoom } from '../src/sim/room';

async function api(method: string, url: string, body?: unknown): Promise<{ status: number; body: Record<string, unknown> }> {
  const raw = body === undefined ? '' : JSON.stringify(body);
  const req = Object.assign(Readable.from(raw ? [raw] : []), { method, url });
  let status = 0, out = '';
  const res = { writeHead: (s: number) => void (status = s), end: (s: string) => void (out = s) };
  await handler(req as never, res as never);
  return { status, body: JSON.parse(out) };
}

describe('what a job owes', () => {
  const run = { ...newRun(board(1)[0]), gold: 40, xp: 120 };
  it('the leader writes each member their share; they read it, and drop it once paid', async () => {
    expect((await api('POST', '/api/owed', { job: 'PABC123', owed: { habcdefghjk: run, hbbbbbbbbbb: { ...run, end: 'won' } } })).status).toBe(200);
    const got = await api('GET', '/api/owed?hero=habcdefghjk');
    expect(got.body.owed).toEqual([{ job: 'PABC123', run }]);
    // Written again as the job goes: the newest word stands.
    await api('POST', '/api/owed', { job: 'PABC123', owed: { habcdefghjk: { ...run, gold: 55 } } });
    expect(((await api('GET', '/api/owed?hero=habcdefghjk')).body.owed as { run: { gold: number } }[])[0].run.gold).toBe(55);
    await api('POST', '/api/owed', { job: 'PABC123', hero: 'habcdefghjk', drop: 1 });
    expect((await api('GET', '/api/owed?hero=habcdefghjk')).body.owed).toEqual([]);
    expect(((await api('GET', '/api/owed?hero=hbbbbbbbbbb')).body.owed as { run: { end: string } }[])[0].run.end).toBe('won');
  });
  it('turns away nonsense: bad ids, absurd gold, no job', async () => {
    expect((await api('POST', '/api/owed', { job: 'PABC123', owed: { habcdefghjk: { ...run, gold: 99999 } } })).status).toBe(400);
    expect((await api('POST', '/api/owed', { job: 'x', owed: { habcdefghjk: run } })).status).toBe(400);
    expect((await api('POST', '/api/owed', { job: 'PABC123', owed: { nope: run } })).status).toBe(400);
    expect((await api('GET', '/api/owed?hero=../x')).status).toBe(400);
  });
});

describe("a hero's kit is theirs", () => {
  it('a pickup and a weapon swapped from the pack go into the save; a restored hero gets them back', () => {
    const p = newProfile('RANGER', 'WREN'), room = new ArenaRoom(1), h = room.join('me');
    Object.assign(h, { weapon: p.weapon, arms: { ...p.arms }, bag: [...p.bag], armor: p.armor, rings: [], belt: [...p.belt], glow: 0, relics: ['volley'], augments: {} });
    expect(keepKit(p, h, true)).toBe(false);
    const bow = { slot: 'weapon', kit: 'crossbow', quality: 'fine', traits: [], mods: [], level: 0 } as never;
    h.weapon = 'crossbow';
    h.arms = { crossbow: bow };
    expect(keepKit(p, h, true)).toBe(true);
    expect(p.weapon).toBe('crossbow');
    expect(p.arms.crossbow).toEqual(bow);
    // The room comes back from an older save: the kit is the save's.
    Object.assign(h, { weapon: 'longbow', arms: {} });
    dressKit(h, p);
    expect(h.weapon).toBe('crossbow');
    expect(h.arms.crossbow).toEqual(bow);
  });
});
