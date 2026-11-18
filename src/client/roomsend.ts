/**
 * The leader's sending for an ordinary room (a street, a house): one message for everyone in it, a patch
 * of what changed since the last (snap.ts) with quiet clocks (interest.ts), whole every FULL_EVERY seconds
 * and whenever someone in it needs it whole. The run, the banner, names and the houses' counts go only
 * when they change (or with a whole room): a friend keeps what it last heard. A big room is bigsend.ts.
 * CoopHost.frame asks here; this file only builds the message, so it can be measured and held to its bytes
 * (tests/perfparity.wire.test.ts for the first format, tests/wire2.test.ts for the second).
 */
import type { ArenaRoom } from '../sim/room';
import type { FightEvent } from '../sim/types';
import { quietInto } from './interest';
import { Snaps } from './sendframe';
import { Encoder, stateOf } from './snap';
import { heroInto, mapText } from './wire2';

type Reader = (e: Record<string, unknown>, keys: string[], vals: unknown[]) => number;

export const FULL_EVERY = 4;
/** `v`: the wire format its encoder was fed (a change sends the room whole). `map`: the map's text last sent (format 2). */
interface Per { enc: Encoder; fullAt: number; said: Record<string, string>; v: number; map: string }
/** The rest of a room's message: its number, the leader's send clock, what goes only when it changes, events, acks. */
export interface RoomRest { k: number; w: number; slow: Record<string, unknown>; ev: FightEvent[]; acks: Record<string, number> }

export class RoomSend {
  private per = new Map<ArenaRoom, Per>();

  /** `room`'s message (a JSON string, as CoopHost sends it in the first format) and whether it's whole. `whole`: someone needs it whole now. */
  body(room: ArenaRoom, now: number, whole: boolean, rest: RoomRest): { s: string; full: boolean } {
    const { body, full } = this.make(room, now, whole, rest, 1);
    return { s: JSON.stringify(body), full };
  }

  /** What CoopHost sends for `room` in wire format `v`: `{ s }` (the first) or `{ b }` (the second: wire2.ts). */
  msg(room: ArenaRoom, now: number, whole: boolean, rest: RoomRest, v: number): { d: Record<string, unknown>; full: boolean } {
    const { body, full } = this.make(room, now, whole, rest, v);
    return { d: v >= 2 ? { b: body } : { s: JSON.stringify(body) }, full };
  }

  private make(room: ArenaRoom, now: number, whole: boolean, rest: RoomRest, v: number): { body: Record<string, unknown>; full: boolean } {
    const st = this.per.get(room) ?? { enc: new Encoder(), fullAt: -99, said: {}, v, map: '' };
    this.per.set(room, st);
    // (An encoder fed one format and then the other would patch against the wrong record: whole, with its map.)
    const turned = st.v !== v;
    st.v = v;
    const full = now - st.fullAt > FULL_EVERY || whole || turned;
    // (Quiet clocks, as a big room's: a goblin's act and its blow go as when they began, interest.ts.
    // Each goblin is read that way straight into the encoder rather than copied first; in format 2 each
    // hero's act the same, wire2.ts.)
    const t = room.time, foes: Reader = (e, keys, vals) => quietInto(e, t, keys, vals);
    const p = st.enc.encode(stateOf(room), full, v >= 2 ? new Snaps(false, foes, (e, skip, into) => heroInto(e, t, skip, into)) : new Snaps(false, foes));
    const slow: Record<string, unknown> = {};
    for (const [key, x] of Object.entries(rest.slow)) {
      const j = JSON.stringify(x);
      if (full || st.said[key] !== j) (slow[key] = x), (st.said[key] = j);
    }
    // (Format 2: the map only when it is news, someone new or come in, or it changed: a friend keeps theirs.)
    let map: ArenaRoom['map'] | undefined;
    if (full && v < 2) map = { ...room.map, blocks: [] };
    else if (full) {
      const m = mapText(room.map);
      if (whole || turned || m !== st.map) (map = { ...room.map, blocks: [] }), (st.map = m);
    }
    const body = { p, f: full ? 1 : 0, k: rest.k, map, t: room.time, w: rest.w, x: room.exitOpen ? 1 : 0, in: room.indoors ? 1 : 0, ...slow, ev: rest.ev, acks: rest.acks };
    if (full) st.fullAt = now;
    return { body, full };
  }

  /** Send this room whole next time (its map changed under it). */
  reset(room: ArenaRoom): void {
    this.per.delete(room);
  }

  /** A room nobody's in any more starts afresh if anyone goes back. */
  keep(has: (room: ArenaRoom) => boolean): void {
    for (const r of [...this.per.keys()]) if (!has(r)) this.per.delete(r);
  }
}
