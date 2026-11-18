/**
 * The second wire format (2026-11-17), both its ends. Used for a message only when every friend it goes to
 * has said in their hello that they speak it (`v: 2`); everyone else gets the first, byte for byte as before.
 *
 * - The body goes as an object (`{ b: body }`), not as JSON text inside the relay's JSON (`{ s }`), whose
 *   escaped quotes were about a fifth of every byte.
 * - A hero's act clock (`actT`, which goes up every tick) goes as `a0`, the room time its act began, to the
 *   millisecond: the same from patch to patch while the clock simply runs. The friend works `actT` out as
 *   each patch is applied (heroClocks), as goblins' clocks already were (interest.ts).
 * - A whole room carries the map only when it is news (roomsend.ts).
 */
import { plain, rnd, type Snap } from './snap';

type Ent = Record<string, unknown>;
/** The format this page's sending and reading speak at most (said in a friend's hello). */
export const WIRE = 2;

/** A hero as format 2 sends it into `into`: as snapOf reads it, but `actT` as `a0`, in its place. */
export function heroInto(e: Ent, t: number, skip: Set<string> | null, into: Snap): Snap {
  const { keys, vals } = into, o: Ent = plain(e) ? e : { ...e };
  let n = 0;
  for (const f in o) {
    if (skip?.has(f)) continue;
    const v = o[f];
    if (f === 'actT' && typeof v === 'number') (keys[n] = 'a0'), (vals[n++] = Math.round((t - v) * 1000) / 1000);
    else (keys[n] = f), (vals[n++] = typeof v === 'number' ? rnd(v) : v);
  }
  keys.length = vals.length = n;
  return into;
}

/** A friend's end, as a patch is applied: each hero's act clock from its `a0` at the patch's time `t`. */
export function heroClocks(heroes: Ent[] | undefined, t: number): void {
  for (const h of heroes ?? []) if (typeof h.a0 === 'number') h.actT = Math.max(0, Math.round((t - h.a0) * 100) / 100);
}

/**
 * What a patch said of my hero, for ownhero.ts: in format 2 it carries the clock worked out (as format 1's
 * would have, its clock having moved), whenever my hero is in the room.
 */
export function withClock(mine: Ent | undefined, meNow: Ent | undefined): Ent | undefined {
  return meNow && typeof meNow.a0 === 'number' ? { ...mine, actT: meNow.actT } : mine;
}

/**
 * The leader's ids as a friend has them: the leader's own `me` becomes `@lead`, and mine (`id`) becomes
 * `me`, in every key and every string, at once. What format 1's text swap did, without touching a string
 * that only has `"me"` inside it.
 */
export function swapIds(v: unknown, id: string): unknown {
  if (typeof v === 'string') return v === 'me' ? '@lead' : v === id ? 'me' : v;
  if (!v || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map((x) => swapIds(x, id));
  const out: Ent = {};
  for (const k of Object.keys(v)) out[k === 'me' ? '@lead' : k === id ? 'me' : k] = swapIds((v as Ent)[k], id);
  return out;
}

/** A message from the leader as a body (ids swapped), in either format; null for anything else. */
export function readBody(d: { s?: unknown; b?: unknown }, id: string): unknown {
  if (typeof d.s === 'string') {
    try {
      return JSON.parse(d.s.split('"me"').join('"@lead"').split(`"${id}"`).join('"me"'));
    } catch {
      return null;
    }
  }
  const b = d.b as { p?: unknown } | undefined;
  return b && typeof b === 'object' && !Array.isArray(b) && b.p && typeof b.p === 'object' ? swapIds(b, id) : null;
}

/** The map as a whole room carries it (its blocks go in the patch), as text to tell whether it changed. */
export const mapText = (map: object): string => JSON.stringify({ ...map, blocks: [] });
