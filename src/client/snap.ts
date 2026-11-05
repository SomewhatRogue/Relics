/**
 * The leader's fight, sent to the party: everything in the room that moves or changes, as patches
 * that carry only what changed since the last one (a full one now and then, and to anyone new).
 * A WebSocket keeps messages in order and never drops one, so patches build on each other safely.
 *
 * Every collection is a list of plain objects (the room is plain data: docs/ONLINE.md), keyed by
 * `id` where it has one, else by position. Numbers go out to two places.
 */
import type { ArenaRoom } from '../sim/room';

export const COLLS = ['heroes', 'enemies', 'javelins', 'snares', 'hooks', 'bolts', 'drops', 'coals', 'zones', 'pickups', 'smokes', 'chests', 'props', 'survivors', 'puddles', 'slicks', 'crows', 'strikes', 'blocks'] as const;
type Coll = (typeof COLLS)[number];
type Ent = Record<string, unknown>;
/** Per collection: the order of keys (only when it changed), and each changed entity's changed fields. */
export type Patch = Partial<Record<Coll, { o?: string[]; u: [string, Ent][] }>>;
/**
 * Hero fields a friend's screen never needs (counters). The pack goes: what a friend picks up comes
 * home with them. So do the relics they own (`found`): their pack lists them and carries one by its
 * place in the list, and a charge spent or a relic won on the job is theirs to keep.
 */
const SKIP = new Set(['seen', 'hitIds', 'hitAllies', 'grudges', 'stats']);

const round = (v: unknown): unknown =>
  typeof v === 'number' ? (Number.isFinite(v) ? Math.round(v * 100) / 100 : v > 0 ? 1e9 : -1e9) : Array.isArray(v) ? v.map(round) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, round(x)])) : v;
const keyOf = (e: Ent, i: number) => (e.id === undefined ? '#' + i : String(e.id));

export function stateOf(room: ArenaRoom): Record<Coll, Ent[]> {
  const r = room as unknown as Record<string, Ent[]>;
  return Object.fromEntries(COLLS.map((c) => [c, c === 'blocks' ? (room.map.blocks as unknown as Ent[]) : r[c]])) as Record<Coll, Ent[]>;
}

/** The leader's end: what changed since the last patch. */
export class Encoder {
  private last = new Map<string, Map<string, Map<string, string>>>();
  private order = new Map<string, string>();

  encode(state: Record<Coll, Ent[]>, full = false): Patch {
    if (full) (this.last.clear(), this.order.clear());
    const out: Patch = {};
    for (const c of COLLS) {
      const list = state[c] ?? [], keys = list.map(keyOf), was = this.last.get(c) ?? new Map<string, Map<string, string>>(), now = new Map<string, Map<string, string>>();
      const u: [string, Ent][] = [];
      list.forEach((e, i) => {
        const k = keys[i], prev = was.get(k), seen = new Map<string, string>(), diff: Ent = {};
        let any = false;
        for (const [f, v] of Object.entries(e)) {
          if (c === 'heroes' && SKIP.has(f)) continue;
          const r = round(v), s = JSON.stringify(r) ?? 'null';
          seen.set(f, s);
          if (prev?.get(f) !== s) (diff[f] = r), (any = true);
        }
        now.set(k, seen);
        if (any) u.push([k, diff]);
      });
      const ord = keys.join('|'), moved = this.order.get(c) !== ord;
      this.last.set(c, now);
      this.order.set(c, ord);
      if (u.length || moved) out[c] = moved ? { o: keys, u } : { u };
    }
    return out;
  }
}

/** A friend's end: the room as the leader last described it. */
export class Decoder {
  private ents = new Map<string, Map<string, Ent>>();
  private order = new Map<string, string[]>();

  /** Apply a patch (`full`: forget everything first); returns every collection, in order. */
  apply(p: Patch, full = false): Record<Coll, Ent[]> {
    if (full) (this.ents.clear(), this.order.clear());
    for (const c of COLLS) {
      const q = p[c], m = this.ents.get(c) ?? new Map<string, Ent>();
      this.ents.set(c, m);
      if (!q) continue;
      if (q.o) {
        for (const k of [...m.keys()]) if (!q.o.includes(k)) m.delete(k);
        this.order.set(c, q.o);
      }
      for (const [k, d] of q.u) Object.assign(m.get(k) ?? (m.set(k, {}), m.get(k)!), d);
    }
    return Object.fromEntries(COLLS.map((c) => [c, (this.order.get(c) ?? []).map((k) => this.ents.get(c)!.get(k) ?? {})])) as Record<Coll, Ent[]>;
  }
}
