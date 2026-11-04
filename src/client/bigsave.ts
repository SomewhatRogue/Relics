/**
 * A big room's save, compact (DECISIONS 2026-11-03: the whole room as JSON is about 0.8 KB a goblin and
 * over the relay's limit at 100). The map goes as a mark and what changed of its buildings (whoever
 * takes the job on builds it from the job's seed, shared/expedmap.ts); each goblin and prop only as it
 * differs from a fresh one of its kind where it stands; numbers to two places. What's still too big
 * goes in parts (split.ts). A room that isn't big is left as it is.
 */
import { expedPlan } from '../shared/expedmap';
import type { Job } from '../shared/jobs';
import { newEnemy } from '../sim/enemies';
import { newProp } from '../sim/props';
import type { Enemy, Prop } from '../sim/types';

type O = Record<string, unknown>;
const r2 = (v: unknown): unknown =>
  typeof v === 'number' ? (Number.isFinite(v) ? Math.round(v * 100) / 100 : v) : Array.isArray(v) ? v.map(r2) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, r2(x)])) : v;
const same = (a: unknown, b: unknown) => JSON.stringify(r2(a)) === JSON.stringify(r2(b));

/** Only the fields of `o` that differ from `fresh` (and always `keep`). */
function diff(o: O, fresh: O, keep: string[]): O {
  const out: O = {};
  for (const [k, v] of Object.entries(o)) if (keep.includes(k) || !same(v, fresh[k])) out[k] = r2(v);
  return out;
}

/** A saved room (coop.ts saveRoom), made small if it's an expedition's. */
export function packRoom(o: O, job: Job | undefined): O {
  if (!o.exped || !job?.exped) return o;
  const map = o.map as { blocks: O[]; blaze?: unknown };
  const fresh = expedPlan(job).map.blocks as unknown as O[];
  const blocks: [number, O][] = [];
  map.blocks.forEach((b, i) => !same(b, fresh[i]) && blocks.push([i, r2(b) as O]));
  const enemies = (o.enemies as Enemy[]).map((e) => diff(e as unknown as O, newEnemy(e.id, e.kind, e.x, e.y) as unknown as O, ['id', 'kind', 'x', 'y']));
  const props = (o.props as Prop[]).map((p) => diff(p as unknown as O, { ...newProp(p.kind, p.x, p.y, false), id: p.id } as unknown as O, ['id', 'kind', 'x', 'y']));
  return { ...o, map: { big: 1, blocks, blaze: map.blaze }, enemies, props };
}

/** A packed room back to what loadRoom takes. */
export function unpackRoom(o: O, job: Job): O {
  const m = o.map as { big?: number; blocks: [number, O][]; blaze?: unknown };
  if (!m?.big) return o;
  const map = expedPlan(job).map;
  for (const [i, b] of m.blocks) if (map.blocks[i]) map.blocks[i] = b as unknown as (typeof map.blocks)[number];
  if (m.blaze) map.blaze = m.blaze as typeof map.blaze;
  const enemies = (o.enemies as O[]).map((e) => Object.assign(newEnemy(e.id as number, e.kind as Enemy['kind'], e.x as number, e.y as number), e));
  const props = (o.props as O[]).map((p) => Object.assign(newProp(p.kind as Prop['kind'], p.x as number, p.y as number, false), p));
  return { ...o, map, enemies, props };
}
