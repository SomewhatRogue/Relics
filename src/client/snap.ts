/**
 * The leader's fight, sent to the party: everything in the room that moves or changes, as patches
 * that carry only what changed since the last one (a full one now and then, and to anyone new).
 * A WebSocket keeps messages in order and never drops one, so patches build on each other safely.
 *
 * Every collection is a list of plain objects (the room is plain data: docs/ONLINE.md), keyed by
 * `id` where it has one, else by position. Numbers go out to two places.
 *
 * A field has changed when its rounded value's JSON text would differ from last time's. That is worked
 * out on the values (`same`), not on text, and only what changed is rounded; each entity's record is
 * brought up to date in place. The friends of a big room share the reading of each entity for a send
 * (a `Source`: sendframe.ts), never what each was sent.
 */
import type { ArenaRoom } from '../sim/room';

export const COLLS = ['heroes', 'enemies', 'javelins', 'snares', 'hooks', 'bolts', 'drops', 'coals', 'zones', 'pickups', 'smokes', 'chests', 'props', 'rolls', 'survivors', 'puddles', 'slicks', 'crows', 'strikes', 'ices', 'nooses', 'blocks'] as const;
type Coll = (typeof COLLS)[number];
type Ent = Record<string, unknown>;
/** Per collection: the order of keys (only when it changed), and each changed entity's changed fields. */
export type Patch = Partial<Record<Coll, { o?: string[]; u: [string, Ent][] }>>;
/**
 * Hero fields a friend's screen never needs (counters). The pack goes: what a friend picks up comes
 * home with them. So do the relics they own (`found`): their pack lists them and carries one by its
 * place in the list, and a charge spent or a relic won on the job is theirs to keep. A friend's lag and
 * the moments their presses carried (sim/lagcomp.ts) are the leader's room's alone.
 */
const SKIP = new Set(['seen', 'hitIds', 'hitAllies', 'grudges', 'stats', 'lag', 'rollPressVt', 'rollVt', 'guardVt', 'guardOffVt']);

export const rnd = (v: number) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : v > 0 ? 1e9 : -1e9);
const round = (v: unknown): unknown =>
  typeof v === 'number' ? rnd(v) : Array.isArray(v) ? v.map(round) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, round(x)])) : v;
const keyOf = (e: Ent, i: number) => (e.id === undefined ? '#' + i : String(e.id));
/** Whether for-in (the fastest way through) reads `x`'s fields as Object.keys does: a plain object. */
export const plain = (x: object) => Object.getPrototypeOf(x) === Object.prototype;

export function stateOf(room: ArenaRoom): Record<Coll, Ent[]> {
  const r = room as unknown as Record<string, Ent[]>;
  return Object.fromEntries(COLLS.map((c) => [c, c === 'blocks' ? (room.map.blocks as unknown as Ent[]) : r[c]])) as Record<Coll, Ent[]>;
}

/** What JSON leaves out of an object; at a field or in a list it is written null. */
const omit = (x: unknown) => x === undefined || typeof x === 'function' || typeof x === 'symbol';
const nil = (x: unknown) => x === null || omit(x);
/** An object as kept from the last patch: the keys JSON would write, in order, and their kept values. */
class Obj {
  constructor(readonly keys: string[], readonly vals: unknown[]) {}
}
/** `v` rounded and kept to compare against (`same`): lists as lists, objects as Obj. Never sent. */
function keepOf(v: unknown): unknown {
  if (typeof v === 'number') return rnd(v);
  if (!v || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map(keepOf);
  const keys: string[] = [], vals: unknown[] = [];
  for (const [k, x] of Object.entries(v)) if (!omit(x)) keys.push(k), vals.push(keepOf(x));
  return new Obj(keys, vals);
}
/** Whether live value `a`, rounded, would be the same JSON text as `p` (keepOf): -0 is 0, undefined null, keys in order. */
function same(a: unknown, p: unknown): boolean {
  if (typeof a === 'number') return typeof p === 'number' && rnd(a) === p;
  if (typeof a === 'string' || typeof a === 'boolean') return a === p;
  if (a === null || typeof a !== 'object') return nil(p);
  if (Array.isArray(a)) {
    if (!Array.isArray(p) || p.length !== a.length) return false;
    for (let i = 0; i < a.length; i++) if (!same(a[i], p[i])) return false;
    return true;
  }
  if (!(p instanceof Obj)) return false;
  const o = a as Ent;
  let j = 0;
  if (plain(o)) {
    for (const k in o)
      if (!omit(o[k])) {
        if (p.keys[j] !== k || !same(o[k], p.vals[j])) return false;
        j++;
      }
  } else
    for (const k of Object.keys(o))
      if (!omit(o[k])) {
        if (p.keys[j] !== k || !same(o[k], p.vals[j])) return false;
        j++;
      }
  return j === p.keys.length;
}

/** An entity as it is now: its fields in order (a hero's without SKIP), numbers rounded, the rest as they are. */
export interface Snap { keys: string[]; vals: unknown[] }
/** Where an encoder reads entities from (sendframe.ts): a Snap of `e`, or null to read it itself (snapOf). */
export interface Source { of(e: Ent, c: Coll, skip: Set<string> | null): Snap | null }
/** An entity as last sent: its fields in order and each one's value as kept (keepOf: a copy of its own, never sent). */
interface Rec { keys: string[]; vals: unknown[] }
const NONE = Symbol('none');

/** `e` read into `into` as a Snap: for-in, the fastest way through, for a plain object, else a plain copy. */
export function snapOf(e: Ent, skip: Set<string> | null, into: Snap): Snap {
  const { keys, vals } = into, o: Ent = plain(e) ? e : { ...e };
  let n = 0;
  for (const f in o) {
    if (skip?.has(f)) continue;
    const v = o[f];
    keys[n] = f;
    vals[n++] = typeof v === 'number' ? rnd(v) : v;
  }
  keys.length = vals.length = n;
  return into;
}

/** An entity's changed fields (`s`, as it is now) against `rec` (what was sent of it, if `had`), bringing `rec` up to date; null if none changed. */
function step(s: Snap, rec: Rec, had: boolean): Ent | null {
  let keys = rec.keys, vals = rec.vals, diff: Ent | null = null, mine = true;
  const n = s.keys.length;
  for (let i = 0; i < n; i++) {
    const f = s.keys[i], v = s.vals[i];
    let pv: unknown = NONE;
    // (While the fields come in last time's order each is written over its own; after the first that
    // doesn't, the rest go to new lists, so last time's are still there to look up.)
    if (had) {
      if (mine && keys[i] === f) pv = vals[i];
      else {
        if (mine) (mine = false), (keys = keys.slice(0, i)), (vals = vals.slice(0, i));
        const j = rec.keys.indexOf(f);
        if (j >= 0) pv = rec.vals[j];
      }
    }
    let now: unknown, changed: boolean;
    if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') (now = v), (changed = v !== pv);
    else if (pv !== NONE && same(v, pv)) (now = pv), (changed = false);
    else (now = keepOf(v)), (changed = true);
    // (A changed object goes as its rounded copy, not the kept one: a patch may be changed in place by
    // whoever has it, Decoder and loud.)
    if (changed) (diff ??= {})[f] = typeof v === 'object' && v ? round(v) : now;
    // (A field unchanged in its own place is left as it is: the kept value is the same.)
    if (changed || !mine || !had) (keys[i] = f), (vals[i] = now);
  }
  keys.length = vals.length = n;
  (rec.keys = keys), (rec.vals = vals);
  return diff;
}

/** step, reading the live entity `e` itself (without `skip`) against `rec` (what was sent of it, if `had`), bringing `rec` up to date; null if none changed. */
function stepLive(e: Ent, skip: Set<string> | null, rec: Rec, had: boolean): Ent | null {
  let keys = rec.keys, vals = rec.vals, diff: Ent | null = null, mine = true;
  const o: Ent = plain(e) ? e : { ...e };
  let i = -1;
  for (const f in o) {
    if (skip?.has(f)) continue;
    i++;
    const raw = o[f], v = typeof raw === 'number' ? rnd(raw) : raw;
    let pv: unknown = NONE;
    // (While the fields come in last time's order each is written over its own; after the first that
    // doesn't, the rest go to new lists, so last time's are still there to look up.)
    if (had) {
      if (mine && keys[i] === f) pv = vals[i];
      else {
        if (mine) (mine = false), (keys = keys.slice(0, i)), (vals = vals.slice(0, i));
        const j = rec.keys.indexOf(f);
        if (j >= 0) pv = rec.vals[j];
      }
    }
    let now: unknown, changed: boolean;
    if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') (now = v), (changed = v !== pv);
    else if (pv !== NONE && same(v, pv)) (now = pv), (changed = false);
    else (now = keepOf(v)), (changed = true);
    // (A changed object goes as its rounded copy, not the kept one: a patch may be changed in place by
    // whoever has it, Decoder and loud.)
    if (changed) (diff ??= {})[f] = typeof v === 'object' && v ? round(v) : now;
    // (A field unchanged in its own place is left as it is: the kept value is the same.)
    if (changed || !mine || !had) (keys[i] = f), (vals[i] = now);
  }
  keys.length = vals.length = i + 1;
  (rec.keys = keys), (rec.vals = vals);
  return diff;
}

/** Whether two lists of keys are the same, as their text joined by '|' (what was compared before) is. */
function sameKeys(a: string[], b: string[] | undefined): boolean {
  if (!b) return false;
  if (a.length === b.length) {
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    if (i === a.length) return true;
  }
  return a.join('|') === b.join('|');
}

/** The leader's end: what changed since the last patch. `src`: where to read entities (else from `state` itself). */
export class Encoder {
  private last = new Map<string, Map<string, Rec>>();
  private order = new Map<string, string[]>();
  /** Collections whose keys, last time, had one twice. */
  private twice = new Set<string>();
  private scratch: Snap = { keys: [], vals: [] };

  encode(state: Record<Coll, Ent[]>, full = false, src?: Source): Patch {
    if (full) (this.last.clear(), this.order.clear(), this.twice.clear());
    const out: Patch = {};
    for (const c of COLLS) {
      const list = state[c] ?? [], keys = list.map(keyOf), was = this.last.get(c), skip = c === 'heroes' ? SKIP : null;
      const moved = !sameKeys(keys, this.order.get(c));
      // (Two with one key are each held to what that key was last time, so then each gets a copy to
      // change. The same keys in the same order as last time are the same map of them.)
      const dup = moved ? new Set(keys).size !== keys.length : this.twice.has(c), twice = was !== undefined && dup;
      const now = !was || moved || twice ? new Map<string, Rec>() : was;
      const u: [string, Ent][] = [];
      list.forEach((e, i) => {
        const k = keys[i], old = was?.get(k), rec = !old ? { keys: [], vals: [] } : twice ? { keys: old.keys.slice(), vals: old.vals.slice() } : old;
        const sn = src?.of(e, c, skip), had = old !== undefined, diff = sn ? step(sn, rec, had) : stepLive(e, skip, rec, had);
        if (now !== was) now.set(k, rec);
        if (diff) u.push([k, diff]);
      });
      this.last.set(c, now);
      // (A copy when it goes in the patch: what's sent may be changed by whoever has it.)
      this.order.set(c, moved ? keys.slice() : keys);
      if (dup) this.twice.add(c);
      else this.twice.delete(c);
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
