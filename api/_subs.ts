/**
 * The relay's subscriptions to its rooms' channels, kept true whatever the subscriber connection does.
 *
 * Seen live (2026-11-05, Kyle in San Francisco, the leader in Florida): the first SUBSCRIBE of a job's
 * room on the leader's instance was never answered (its connection to Redis had gone half-open; PUBLISH
 * and GET on the other connection worked). The relay waited on it forever, the room on that instance
 * never heard the bus again, and the leader's messages stayed home for the rest of the night (its meter
 * line: 20 published, 11,216 kept). Every friend on another instance heard nothing.
 *
 * So:
 * - A SUBSCRIBE not answered in SUB_MS means the connection is dead: it's reset (a fresh one) and every
 *   room this instance has players in is subscribed again. Nobody waits on it longer than SUB_MS.
 * - The instance hears its own word: each 'here' it publishes comes back to it on its own subscription
 *   (it costs nothing more: the 'here' goes out anyway). Not back in ECHO_MS, and it's reset the same way.
 * - Subscribing and unsubscribing a room go one at a time, in order, and a room is only unsubscribed if
 *   nobody here is in it by then: a player leaving as another arrives can't leave the room deaf (an
 *   UNSUBSCRIBE that landed after the newcomer's SUBSCRIBE used to drop it).
 * Resets are at most one per RESET_GAP_MS.
 */
import type { Bus } from './_backends.js';

export const SUB_MS = 2500;
export const ECHO_MS = 5000;
export const RESET_GAP_MS = 10_000;

const within = <T>(p: Promise<T>, ms: number): Promise<boolean> =>
  new Promise((res) => {
    const t = setTimeout(() => res(false), ms);
    p.then(
      () => (clearTimeout(t), res(true)),
      () => (clearTimeout(t), res(false)),
    );
  });

export class Subs {
  /** Rooms whose channel this instance is subscribed to (as far as it knows). */
  private have = new Set<string>();
  private chain = new Map<string, Promise<unknown>>();
  /** One listener per room, so a subscription made twice never delivers twice. */
  private fns = new Map<string, (raw: string) => void>();
  /** Rooms whose own 'here' is on its way back, and since when. */
  private echo = new Map<string, number>();
  private resetAt = -Infinity;
  private resetting: Promise<void> | null = null;
  /** How many times the connection was reset (tests, the meter line). */
  resets = 0;

  /**
   * `wanted(room)`: does this instance still have players in it. `onMsg`: what came in on its channel.
   * `onFresh(room)`: subscribed again after a reset (say 'here', so the others answer).
   */
  constructor(
    private bus: Bus,
    private chan: (room: string) => string,
    private wanted: (room: string) => boolean,
    private onMsg: (room: string, raw: string) => void,
    private onFresh: (room: string) => void,
    private log: (o: Record<string, unknown>) => void,
  ) {}

  /** Be subscribed to the room's channel. Resolves within SUB_MS whatever happens (a reset follows a failure). */
  ensure(room: string): Promise<void> {
    return this.queue(room, async () => {
      if (this.have.has(room) || !this.wanted(room)) return;
      let fn = this.fns.get(room);
      if (!fn) this.fns.set(room, (fn = (raw) => this.onMsg(room, raw)));
      if (await within(this.bus.subscribe(this.chan(room), fn), SUB_MS)) return void this.have.add(room);
      this.log({ ev: 'subslow', room });
      void this.reset('subscribe');
    });
  }

  /** Nobody here is in the room any more: unsubscribe, unless someone came back meanwhile. True if it did. */
  release(room: string): Promise<boolean> {
    return this.queue(room, async () => {
      if (this.wanted(room) || !this.have.has(room)) return false;
      this.have.delete(room);
      this.fns.delete(room);
      this.echo.delete(room);
      await this.bus.unsubscribe(this.chan(room));
      return true;
    });
  }

  /** Our own 'here' is going out on the room's channel: it should come back. */
  expect(room: string, now = Date.now()): void {
    if (this.have.has(room) && !this.echo.has(room)) this.echo.set(room, now);
  }

  /** Our own 'here' came back: the subscription is alive. */
  heard(room: string): void {
    this.echo.delete(room);
  }

  /** Now and then: an echo overdue means the connection is dead. */
  check(now = Date.now()): void {
    for (const [room, at] of this.echo) {
      if (!this.wanted(room)) this.echo.delete(room);
      else if (now - at > ECHO_MS) {
        this.echo.clear();
        this.log({ ev: 'deaf', room });
        void this.reset('echo');
        return;
      }
    }
  }

  /** A fresh subscriber connection, and every room with players here subscribed on it again. */
  reset(why: string): Promise<void> {
    const now = Date.now();
    if (this.resetting) return this.resetting;
    if (now - this.resetAt < RESET_GAP_MS) return Promise.resolve();
    this.resetAt = now;
    this.resets++;
    const rooms = [...new Set([...this.have, ...this.fns.keys()])];
    this.have.clear();
    this.echo.clear();
    this.log({ ev: 'busreset', why, rooms: rooms.length });
    this.resetting = within(this.bus.reset(), SUB_MS * 2)
      .then(() => Promise.all(rooms.filter((r) => this.wanted(r)).map((r) => this.ensure(r).then(() => this.have.has(r) && this.onFresh(r)))))
      .then(() => undefined)
      .finally(() => (this.resetting = null));
    return this.resetting;
  }

  /** (Tests.) Is the room's channel subscribed, as far as this instance knows? */
  has(room: string): boolean {
    return this.have.has(room);
  }

  private queue<T>(room: string, f: () => Promise<T>): Promise<T> {
    const p = (this.chain.get(room) ?? Promise.resolve()).then(f, f);
    const tail = p.catch(() => undefined);
    this.chain.set(room, tail);
    void tail.then(() => this.chain.get(room) === tail && this.chain.delete(room));
    return p;
  }
}
