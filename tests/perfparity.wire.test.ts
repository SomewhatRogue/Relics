/**
 * What the leader sends is byte for byte what it sent before the performance sweep (docs/design/perf-sweep.md).
 * tests/perfref/ holds the sending code as it stood on commit 1dbfcd3; the live code is run beside it over the
 * same seeded fights (tests/perfparity.scenes.ts) at the leader's own pace (a message every 0.05 s, whole every
 * 4 s and to anyone new), and every message must be the same text: an ordinary room's one message for everyone
 * (roomsend.ts), a big room's message for each friend (bigsend.ts), and the bare encoder under both (snap.ts,
 * interest.ts). Only the cost may change. The second wire format (slice D) has its own tests; this one is the
 * first format, which pages that don't speak the second still get.
 */
import { describe, expect, it } from 'vitest';
import { BigSend } from '../src/client/bigsend';
import { eventsFor, isBig, quiet, stateFor } from '../src/client/interest';
import { RoomSend } from '../src/client/roomsend';
import { Encoder, stateOf } from '../src/client/snap';
import type { FightEvent } from '../src/sim/types';
import { BigSend as RefBig } from './perfref/bigsend';
import { eventsFor as refEventsFor, quiet as refQuiet, stateFor as refStateFor } from './perfref/interest';
import { RoomSend as RefRoom } from './perfref/roomsend';
import { Encoder as RefEncoder, stateOf as refStateOf } from './perfref/snap';
import { IDS, newPress, scenes, stepScene, type Scene } from './perfparity.scenes';

const GUESTS = IDS.slice(1), NAMES = { me: 'A', b2: 'B', b3: 'C', b4: 'D' };
/** Where the two first differ, with a little of each, or '' if they're the same. */
function diff(a: string, b: string): string {
  if (a === b) return '';
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  return `at ${i}: live "${a.slice(Math.max(0, i - 40), i + 60)}" ref "${b.slice(Math.max(0, i - 40), i + 60)}"`;
}

/** A scene played for `ticks`, a send every 3 ticks (0.05 s at 60 frames a second, two frames a tick); returns the first difference. */
function run(s: Scene, ticks: number): string {
  const press = newPress(), big = isBig(s.room), evs: FightEvent[] = [];
  const live = { room: new RoomSend(), big: new BigSend(), enc: new Encoder(), each: new Map(GUESTS.map((g) => [g, new Encoder()])) };
  const ref = { room: new RefRoom(), big: new RefBig(), enc: new RefEncoder(), each: new Map(GUESTS.map((g) => [g, new RefEncoder()])) };
  let now = 0, sends = 0, fullAt = -99;
  for (let t = 1; t <= ticks; t++) {
    stepScene(s, press);
    evs.push(...s.room.events);
    now += 1 / 30;
    if (t % 3) continue;
    const room = s.room, w = Math.round(now * 1000) / 1000, acks = { b2: now - 0.1 };
    // A friend new to the room now and then (and at the start): the whole of it, at once.
    const whole = sends === 0 || sends % 53 === 0;
    const slow = { hc: [], dm: [], run: s.run ? { ...s.run, board: undefined } : null, goal: sends % 40 < 20 ? 'Free the captives' : 'Find the way on', names: NAMES };
    if (big) {
      const common = { k: 1, t: room.time, w, x: room.exitOpen ? 1 : 0, in: room.indoors ? 1 : 0, ...slow, acks };
      for (const g of GUESTS) {
        const a = live.big.body(room, g, now, whole, common, evs), b = ref.big.body(room, g, now, whole, common, evs);
        const d = diff(a.s, b.s) || (a.full === b.full ? '' : 'full differs');
        if (d) return `${s.name} big ${g} send ${sends}: ${d}`;
      }
    } else {
      const rest = { k: 1, w, slow, ev: evs, acks };
      const a = live.room.body(room, now, whole, rest), b = ref.room.body(room, now, whole, rest);
      const d = diff(a.s, b.s) || (a.full === b.full ? '' : 'full differs');
      if (d) return `${s.name} room send ${sends}: ${d}`;
    }
    // The bare encoder and filters, the whole room and each friend's ring, on their own clock of fulls.
    const full = now - fullAt > 4;
    if (full) fullAt = now;
    const d0 = diff(JSON.stringify(live.enc.encode(quiet(stateOf(room), room.time), full)), JSON.stringify(ref.enc.encode(refQuiet(refStateOf(room), room.time), full)));
    if (d0) return `${s.name} encoder send ${sends}: ${d0}`;
    for (const g of GUESTS) {
      const d1 = diff(JSON.stringify(live.each.get(g)!.encode(quiet(stateFor(room, g), room.time), full)), JSON.stringify(ref.each.get(g)!.encode(refQuiet(refStateFor(room, g), room.time), full)));
      if (d1) return `${s.name} encoder ${g} send ${sends}: ${d1}`;
      const d2 = diff(JSON.stringify(eventsFor(room, g, evs)), JSON.stringify(refEventsFor(room, g, evs)));
      if (d2) return `${s.name} events ${g} send ${sends}: ${d2}`;
    }
    evs.length = 0;
    sends++;
  }
  return '';
}

describe('the performance sweep changes no byte the leader sends', () => {
  for (const s of scenes()) it(`${s.name}: every message is the text it was`, () => expect(run(s, Math.min(s.ticks, 450))).toBe(''));
});
