/**
 * The leader's sending for a big room (an expedition): each friend their own patch of only what's near
 * them (interest.ts), on their own Encoder, with quiet clocks; the map never sent (the friend builds it
 * from the job's seed: `ms` on a whole one); the expedition's view (sim/exped.ts expedView) only when it
 * changes. CoopHost.frame asks here for each friend in a big room; everything else it sends as before.
 */
import type { ArenaRoom } from '../sim/room';
import type { FightEvent } from '../sim/types';
import { expedView } from '../sim/exped';
import { eventsFor, quiet, stateFor } from './interest';
import { Encoder } from './snap';

const FULL_EVERY = 4;
/**
 * Friends' periodic whole rooms (40 KB or so with a swarm about) go at least this far apart, so they
 * don't all leave the leader in one moment (they'd all started together, as the job did). A friend
 * who needs the room whole now (new, or just come in) gets it at once all the same.
 */
const FULL_GAP = 1;
/** What's sent only when it changes. */
const SLOW = new Set(['run', 'goal', 'names', 'hc', 'dm']);
interface Per { enc: Encoder; fullAt: number; room: ArenaRoom | null; xs: string; said: Record<string, string> }

export class BigSend {
  private per = new Map<string, Per>();
  private fullAt = -99;

  /**
   * Friend `id`'s message for `room` (a JSON string, as CoopHost sends it) and whether it's whole.
   * `whole`: they need the room whole now (new, or just come into it). `common`: the rest of the body.
   */
  body(room: ArenaRoom, id: string, now: number, whole: boolean, common: Record<string, unknown>, ev: FightEvent[]): { s: string; full: boolean } {
    let st = this.per.get(id);
    if (!st || st.room !== room) this.per.set(id, (st = { enc: new Encoder(), fullAt: -99, room, xs: '', said: {} }));
    const full = whole || (now - st.fullAt > FULL_EVERY && now - this.fullAt >= FULL_GAP);
    if (full && !whole) this.fullAt = now;
    const p = st.enc.encode(quiet(stateFor(room, id), room.time), full);
    const view = room.exped ? JSON.stringify(expedView(room.exped)) : '';
    const xs = full || view !== st.xs ? view : '';
    st.xs = view;
    if (full) st.fullAt = now;
    // The run, the banner, names and the houses' counts only when they change (the run alone was a
    // third of every message): a friend keeps what it last heard.
    const rest: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(common)) {
      const j = JSON.stringify(v);
      if (!SLOW.has(key) || full || st.said[key] !== j) (rest[key] = v), (st.said[key] = j);
    }
    const body = { ...rest, p, f: full ? 1 : 0, ms: full ? 1 : undefined, blaze: full ? room.map.blaze : undefined, ev: eventsFor(room, id, ev), xs: xs ? JSON.parse(xs) : undefined };
    return { s: JSON.stringify(body), full };
  }

  /** Start this room afresh for everyone (its map changed under it). */
  reset(room: ArenaRoom): void {
    for (const [id, st] of this.per) if (st.room === room) this.per.delete(id);
  }

  drop(id: string): void {
    this.per.delete(id);
  }
}
