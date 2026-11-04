import { describe, expect, it } from 'vitest';
import { BigSend } from '../src/client/bigsend';
import { packRoom, unpackRoom } from '../src/client/bigsave';
import { loadRoom, saveRoom } from '../src/client/coop';
import { INTEREST, loud, mergeBlocks, quiet, stateFor } from '../src/client/interest';
import { Decoder, Encoder } from '../src/client/snap';
import { Joiner, splitMsg, SPLIT } from '../src/client/split';
import { expedPlan } from '../src/shared/expedmap';
import { expedition } from '../src/shared/expedjob';
import { EXPED } from '../src/shared/tuning';
import { drive, newBot } from '../src/sim/bots';
import { newRun, runRoom } from '../src/sim/run';
import type { ArenaRoom } from '../src/sim/room';

/** An expedition room with four heroes (bots walking it) after `secs` of play. */
function played(day: number, secs: number, goblins = EXPED.goblins) {
  const was = { ...EXPED };
  Object.assign(EXPED, { goblins, cap: goblins + 50 });
  const job = expedition(day), r = newRun(job), room = runRoom(r);
  Object.assign(EXPED, was);
  const ins = room.map.hero, ids = ['me', 'b2', 'b3', 'b4'];
  const bots = ids.map((id, i) => {
    const h = room.join(id);
    Object.assign(h, { x: ins.x + i * 0.8, y: ins.y - 3, safeT: 1e9 });
    const b = newBot(id, { x: h.x, y: h.y }, 50 + i);
    b.home = i % 2 ? { x: 30, y: 20 } : { x: 70, y: 50 };
    return b;
  });
  for (let t = 0; t < secs * 30; t++) {
    for (const b of bots) room.setIntent(b.id, drive(b, room, 20));
    room.step();
  }
  return { job, run: r, room };
}

describe('an expedition online', () => {
  it('sends a friend everything near them, all the heroes, and nothing far', () => {
    const { room } = played(3, 8), h = room.heroes.find((x) => x.id === 'b2')!, s = stateFor(room, 'b2'), r = INTEREST.radius;
    expect(s.heroes).toHaveLength(room.heroes.length);
    const ids = new Set(s.enemies.map((e) => e.id));
    for (const e of room.enemies) expect(ids.has(e.id)).toBe(Math.hypot(e.x - h.x, e.y - h.y) <= r);
    for (const p of s.props) expect(Math.hypot((p.x as number) - h.x, (p.y as number) - h.y)).toBeLessThanOrEqual(r);
  });

  it("drops a goblin from a friend's copy once it's out of their ring, and works its clock out from when its act began", () => {
    const { room } = played(4, 6), enc = new Encoder(), dec = new Decoder(), h = room.heroes.find((x) => x.id === 'b3')!;
    dec.apply(enc.encode(quiet(stateFor(room, 'b3'), room.time), true), true);
    const e = room.enemies.find((x) => x.act !== 'dead' && Math.hypot(x.x - h.x, x.y - h.y) < 10) ?? room.enemies[0];
    Object.assign(e, { x: h.x + 2, y: h.y });
    let got = dec.apply(enc.encode(quiet(stateFor(room, 'b3'), room.time)));
    const mine = got.enemies.find((x) => x.id === e.id)!;
    expect(mine).toBeTruthy();
    loud([mine], room.time);
    expect(Math.abs((mine.actT as number) - e.actT)).toBeLessThan(0.05);
    expect(mine.cooldown).toBeUndefined();
    Object.assign(e, { x: h.x + INTEREST.radius + 5, y: h.y });
    got = dec.apply(enc.encode(quiet(stateFor(room, 'b3'), room.time)));
    expect(got.enemies.some((x) => x.id === e.id)).toBe(false);
  });

  it("keeps a friend's buildings: the seed's, with what changed near them", () => {
    const { job, room } = played(2, 1), base = expedPlan(job).map.blocks, h = room.heroes.find((x) => x.id === 'b2')!;
    const i = room.map.blocks.findIndex((b) => Math.hypot(b.x - h.x, b.y - h.y) < INTEREST.blocks - 4);
    const near = stateFor(room, 'b2').blocks as unknown as Record<string, unknown>[], known = new Map();
    if (i >= 0) room.map.blocks[i].ruined = true;
    const merged = mergeBlocks(base, stateFor(room, 'b2').blocks as unknown as Record<string, unknown>[], known);
    expect(merged).toHaveLength(base.length);
    if (i >= 0) expect(merged[i].ruined).toBe(true);
    expect(near.length).toBeLessThan(base.length + 1);
  });

  it('never sends a friend a message over the limit, even at 300 goblins, and the map never goes', { timeout: 60000 }, () => {
    const { room, run } = played(5, 20, 300), send = new BigSend();
    const common = { k: 1, t: room.time, x: 0, in: 0, hc: [], dm: [], run, goal: '', names: {}, acks: {} };
    let biggest = 0;
    for (let i = 0; i < 40; i++) {
      for (const id of ['b2', 'b3', 'b4']) {
        const m = send.body(room, id, i * 0.05, i === 0, common, room.events);
        expect(m.s.includes('"rounds"')).toBe(false);
        for (const w of splitMsg(id, { s: m.s }, i)) (biggest = Math.max(biggest, w.length)), expect(w.length).toBeLessThan(SPLIT.max + 4000);
      }
      room.step();
    }
    expect(biggest).toBeLessThan(64000);
  });

  it('splits anything too big for the relay into parts that each fit, and puts them back together', () => {
    const big = { save: 'x"\\'.repeat(60000), n: [1, 2, 3] }, parts = splitMsg('*', big, 7), j = new Joiner();
    expect(parts.length).toBeGreaterThan(1);
    let whole: unknown;
    for (const p of parts) {
      expect(p.length).toBeLessThan(64000);
      whole = j.add('lead', JSON.parse(p).d) ?? whole;
    }
    expect(whole).toEqual(big);
    expect(splitMsg('*', { s: 'small' }, 1)).toEqual([JSON.stringify({ to: '*', d: { s: 'small' } })]);
  });

  it('saves compact (well under the whole room) and takes back the same goblins, props and buildings', { timeout: 60000 }, () => {
    const { job, room } = played(6, 10);
    room.map.blocks.find((b) => b.kind === 'house')!.ruined = true;
    const whole = JSON.stringify(saveRoom(room)), packed = JSON.stringify(packRoom(saveRoom(room), job));
    expect(packed.length).toBeLessThan(whole.length / 2);
    const back: ArenaRoom = loadRoom(unpackRoom(JSON.parse(packed), job));
    // (Numbers go to two places, as every patch does.)
    const key = (r: ArenaRoom) => JSON.stringify(r.allEnemies.map((e) => [e.id, e.kind, Math.round(e.hp), e.act, e.alert ?? null]));
    expect(key(back)).toBe(key(room));
    back.allEnemies.forEach((e, i) => expect(Math.hypot(e.x - room.allEnemies[i].x, e.y - room.allEnemies[i].y)).toBeLessThan(0.01));
    expect(back.map.blocks.map((b) => !!b.ruined)).toEqual(room.map.blocks.map((b) => !!b.ruined));
    expect(back.props.map((p) => [p.kind, p.broken])).toEqual(room.props.map((p) => [p.kind, p.broken]));
    expect(back.exped!.goals).toEqual(room.exped!.goals);
  });
});
