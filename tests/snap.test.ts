/** The party's view of the leader's fight: patches rebuild the room exactly (to two places). */
import { describe, expect, it } from 'vitest';
import { board } from '../src/shared/jobs';
import { newRun, runRoom } from '../src/sim/run';
import { NO_INTENT } from '../src/sim/types';
import { Decoder, Encoder, stateOf } from '../src/client/snap';

const round = (o: unknown) => JSON.parse(JSON.stringify(o, (_k, v) => (typeof v === 'number' ? (Number.isFinite(v) ? Math.round(v * 100) / 100 : v > 0 ? 1e9 : -1e9) : v)));

describe('snapshots', () => {
  it('a friend who has every patch sees the same room as the leader, and patches stay small', () => {
    const run = newRun(board(3)[1]);
    run.party = 2;
    const room = runRoom(run);
    room.join('me');
    room.join('h2friend000');
    const enc = new Encoder(), dec = new Decoder();
    let sizes = 0, n = 0, got = dec.apply(enc.encode(stateOf(room), true), true);
    for (let i = 0; i < 240; i++) {
      for (const h of room.heroes) room.setIntent(h.id, { ...NO_INTENT, mx: Math.sin(i / 15), my: -0.6, attackSeq: i >> 3 });
      room.step();
      if (i % 3) continue;
      const p = enc.encode(stateOf(room));
      sizes += JSON.stringify(p).length;
      n++;
      got = dec.apply(JSON.parse(JSON.stringify(p)));
    }
    got = dec.apply(JSON.parse(JSON.stringify(enc.encode(stateOf(room)))));
    const want = stateOf(room);
    expect(got.enemies.map((e) => [e.id, e.x, e.y, e.hp, e.act])).toEqual(round(want.enemies.map((e) => [e.id, e.x, e.y, e.hp, e.act])));
    expect(got.heroes.map((h) => [h.id, h.x, h.y, h.hp, h.act])).toEqual(round(want.heroes.map((h) => [h.id, h.x, h.y, h.hp, h.act])));
    expect(got.props.length).toBe(want.props.length);
    // A full room is ~14 KB; a patch should be a small fraction of it.
    expect(sizes / n).toBeLessThan(4000);
  });
});
