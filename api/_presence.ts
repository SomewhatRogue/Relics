/**
 * Which rooms need the bus. Redis's free plan is 500K commands a month (docs/REALTIME-REDIS-BUDGET.md)
 * and players usually share one instance, so a room's messages go out on the bus only while another
 * instance has players in it too.
 *
 * Instances find each other by saying so, never by trusting PUBLISH's count to close a room: an
 * instance that gets its first player in a room says 'here' at once (and sends everything while the
 * others answer), any instance hearing a newcomer answers 'here', each says 'here' again when it has
 * said nothing else for HERE_MS, and 'away' when its last player goes. A count above one can open a
 * room (someone else is listening), but a count of one never shuts it: an answer heard is the proof.
 */

/** Say 'here' when nothing else has gone out on the bus for this long. */
export const HERE_MS = 15_000;
/** Another instance heard within this long is still there (two beats can go missing). */
export const REMOTE_MS = 40_000;
/** A room just joined: everything goes out this long, while the instances already there answer. */
export const ANSWER_MS = 500;

export class Presence {
  private since = new Map<string, number>();
  private spoke = new Map<string, number>();
  /** Per room: the other instances there, and when each was last heard. */
  private others = new Map<string, Map<string, number>>();

  /** This instance has its first player in the room. */
  joined(room: string, now: number): void {
    this.since.set(room, now);
    this.spoke.set(room, now);
    this.others.set(room, new Map());
  }

  /** Its last player gone. */
  left(room: string): void {
    this.since.delete(room);
    this.spoke.delete(room);
    this.others.delete(room);
  }

  /** Heard another instance in the room. True when it's new here (not heard lately): answer it. */
  heard(room: string, origin: string, now: number): boolean {
    const m = this.others.get(room);
    if (!m) return false;
    const was = m.get(origin);
    m.set(origin, now);
    return was === undefined || now - was > REMOTE_MS;
  }

  /** Another instance's last player went. */
  away(room: string, origin: string): void {
    this.others.get(room)?.delete(origin);
  }

  /** Something went out on the bus; `count` is PUBLISH's reply (this instance included). */
  sent(room: string, now: number, count: number): void {
    if (this.since.has(room)) this.spoke.set(room, now);
    if (count > 1) this.others.get(room)?.set('?', now);
  }

  /** Does a message in this room need the bus? */
  shared(room: string, now: number): boolean {
    if (now - (this.since.get(room) ?? -Infinity) < ANSWER_MS) return true;
    const m = this.others.get(room);
    for (const [o, t] of m ?? []) {
      if (now - t < REMOTE_MS) return true;
      m!.delete(o);
    }
    return false;
  }

  /** Rooms that have said nothing on the bus for HERE_MS. */
  due(now: number): string[] {
    return [...this.spoke].filter(([, t]) => now - t >= HERE_MS).map(([r]) => r);
  }
}
