/**
 * No message over the relay's limit, ever (DECISIONS 2026-11-03: past 64 KiB the socket closes, and
 * 64,000 to 65,536 characters are dropped without a word). RelaySocket.send splits anything bigger than
 * `max` into parts of `part` characters of its JSON, each well under the limit even with every character
 * escaped, and the far end's Joiner puts them back together before anyone sees the message.
 */
export const SPLIT = { max: 48_000, part: 22_000 };

/** The wire text for `d` to `to`: one message, or its parts. */
export function splitMsg(to: string, d: unknown, id: number, max = SPLIT.max, part = SPLIT.part): string[] {
  const one = JSON.stringify({ to, d });
  if (one.length <= max) return [one];
  const body = JSON.stringify(d), n = Math.ceil(body.length / part), out: string[] = [];
  for (let i = 0; i < n; i++) out.push(JSON.stringify({ to, d: { part: id, i, n, c: body.slice(i * part, (i + 1) * part) } }));
  return out;
}

type Part = { part: number; i: number; n: number; c: string };
export const isPart = (d: unknown): d is Part => !!d && typeof d === 'object' && typeof (d as Part).part === 'number' && typeof (d as Part).c === 'string';

/** The far end: parts in, whole messages out (an unfinished one is let go when a newer one starts). */
export class Joiner {
  private open = new Map<string, { id: number; got: string[]; left: number }>();

  /** A part from `from`: the whole message once its last part is in, else undefined. */
  add(from: string, p: Part): unknown {
    let o = this.open.get(from);
    if (!o || o.id !== p.part) this.open.set(from, (o = { id: p.part, got: new Array(p.n).fill(''), left: p.n }));
    if (p.i < 0 || p.i >= o.got.length || o.got[p.i]) return undefined;
    o.got[p.i] = p.c;
    if (--o.left > 0) return undefined;
    this.open.delete(from);
    try {
      return JSON.parse(o.got.join(''));
    } catch {
      return undefined;
    }
  }
}
