/**
 * A room's word to the other instances, coalesced: what this instance has for the bus waits up to
 * BATCH.ms and goes out as one PUBLISH, not one per message (Redis counts each PUBLISH; a party split
 * over two instances sent one per snapshot and per input, docs/DECISIONS.md 2026-11-04).
 *
 * - Leading edge: with nothing sent in the last BATCH.ms, a message goes at once (no wait for the
 *   sparse ones: the town, a hello); after that, what comes waits for the next slot, BATCH.ms on.
 * - In order: one queue per room, sent in the order it came; a batch is the envelopes in a list.
 * - Urgent (a goodbye, a new host, a press of a button): the queue goes at once, this with it.
 * - Never past BATCH.max characters: a message that would push it over sends what waits first.
 * One message alone goes as itself; two or more as `{"k":"b","o":origin,"e":[...]}`.
 */
export const BATCH = { ms: 100, max: 192_000 };

/** A batch's wire text from envelopes already in JSON. */
export const batchOf = (origin: string, list: string[]): string => (list.length === 1 ? list[0] : `{"k":"b","o":${JSON.stringify(origin)},"e":[${list.join(',')}]}`);

/** The envelopes in what came off the bus (a batch, or one alone), in order. */
export function unbatch(raw: string): { o?: string; k?: string }[] {
  let m: { k?: string; o?: string; e?: unknown };
  try {
    m = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!m || typeof m !== 'object') return [];
  return m.k === 'b' && Array.isArray(m.e) ? (m.e as { o?: string }[]).filter((x) => x && typeof x === 'object') : [m];
}

type Q = { list: string[]; size: number; timer: ReturnType<typeof setTimeout> | null };

export class Outbox {
  private q = new Map<string, Q>();
  /** When each room last went out. */
  private at = new Map<string, number>();

  /** `publish(room, text, count)`: one batch of `count` envelopes onto the room's channel. */
  constructor(private origin: () => string, private publish: (room: string, text: string, count: number) => Promise<void>, private opts = BATCH) {}

  /** Queue an envelope (as JSON). Resolves once it's gone out (or failed: the publisher says). */
  push(room: string, json: string, urgent = false): Promise<void> {
    const out: Promise<void>[] = [];
    let q = this.q.get(room);
    if (q?.list.length && q.size + json.length > this.opts.max) (out.push(this.flush(room)), (q = undefined));
    if (!q) this.q.set(room, (q = { list: [], size: 0, timer: null }));
    q.list.push(json);
    q.size += json.length;
    const wait = (this.at.get(room) ?? -Infinity) + this.opts.ms - Date.now();
    if (urgent || wait <= 0) out.push(this.flush(room));
    else q.timer ??= setTimeout(() => void this.flush(room), wait);
    return Promise.all(out).then(() => undefined);
  }

  /** Send what waits for this room now. */
  flush(room: string): Promise<void> {
    const q = this.q.get(room);
    if (!q || !q.list.length) return Promise.resolve();
    if (q.timer) clearTimeout(q.timer);
    const list = q.list;
    this.q.delete(room);
    this.at.set(room, Date.now());
    return this.publish(room, batchOf(this.origin(), list), list.length);
  }

  /** The room's gone from this instance: nothing more waits for it. */
  drop(room: string): void {
    const q = this.q.get(room);
    if (q?.timer) clearTimeout(q.timer);
    this.q.delete(room);
    this.at.delete(room);
  }

  /** How many envelopes wait for a room (tests). */
  waiting(room: string): number {
    return this.q.get(room)?.list.length ?? 0;
  }
}
