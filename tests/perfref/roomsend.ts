// REFERENCE COPY, do not edit: src/client/roomsend.ts as it stood on commit 1dbfcd3 (roomsend.ts: as first cut out of coop.ts,
// the same lines). tests/perfparity.wire.test.ts holds the live file to this one's bytes. See docs/design/perf-sweep.md.
/**
 * The leader's sending for an ordinary room (a street, a house): one message for everyone in it, a patch
 * of what changed since the last (snap.ts) with quiet clocks (interest.ts), whole every FULL_EVERY seconds
 * and whenever someone in it needs it whole. The run, the banner, names and the houses' counts go only
 * when they change (or with a whole room): a friend keeps what it last heard. A big room is bigsend.ts.
 * CoopHost.frame asks here; this file only builds the text, so it can be measured and held to its bytes
 * (tests/perfparity.wire.test.ts).
 */
import type { ArenaRoom } from '../../src/sim/room';
import type { FightEvent } from '../../src/sim/types';
import { quiet } from './interest';
import { Encoder, stateOf } from './snap';

export const FULL_EVERY = 4;
interface Per { enc: Encoder; fullAt: number; said: Record<string, string> }
/** The rest of a room's message: its number, the leader's send clock, what goes only when it changes, events, acks. */
export interface RoomRest { k: number; w: number; slow: Record<string, unknown>; ev: FightEvent[]; acks: Record<string, number> }

export class RoomSend {
  private per = new Map<ArenaRoom, Per>();

  /** `room`'s message (a JSON string, as CoopHost sends it) and whether it's whole. `whole`: someone needs it whole now. */
  body(room: ArenaRoom, now: number, whole: boolean, rest: RoomRest): { s: string; full: boolean } {
    const st = this.per.get(room) ?? { enc: new Encoder(), fullAt: -99, said: {} };
    this.per.set(room, st);
    const full = now - st.fullAt > FULL_EVERY || whole;
    // (Quiet clocks, as a big room's: a goblin's act and its blow go as when they began, interest.ts.)
    const p = st.enc.encode(quiet(stateOf(room), room.time), full);
    const slow: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(rest.slow)) {
      const j = JSON.stringify(v);
      if (full || st.said[key] !== j) (slow[key] = v), (st.said[key] = j);
    }
    const body = { p, f: full ? 1 : 0, k: rest.k, map: full ? { ...room.map, blocks: [] } : undefined, t: room.time, w: rest.w, x: room.exitOpen ? 1 : 0, in: room.indoors ? 1 : 0, ...slow, ev: rest.ev, acks: rest.acks };
    if (full) st.fullAt = now;
    return { s: JSON.stringify(body), full };
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
