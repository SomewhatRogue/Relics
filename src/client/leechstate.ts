/**
 * What the screen remembers about THE LEECHMAN's pool (cosmetic only, never sent, never the room's): when each moment
 * last happened (stamped on the wall clock the drawing reads), who has leeches latched on them, and a guess at how far the
 * windlass has been turned (the room's own count is the book's, sim/leechwind.ts; the events say take, turn, let, drained,
 * back). Events (client/fxleech.ts) queue here; `leechTick` stamps them once a frame, before anything is drawn.
 */
import { LEECHMAN } from '../shared/leechtune';
import type { GameMap } from '../shared/arena';
import type { ArenaRoom } from '../sim/room';
import type { Enemy, FightEvent } from '../sim/types';

const W = LEECHMAN.windlass;
const fresh = () => ({
  /** Where it is (tiles), and the pool being drawn. */
  at: null as null | { x: number; y: number },
  map: null as GameMap | null,
  /** The windlass: who has hold, how far round (0..1), when the water went and came back, until when it is stuck, the last stuck rattle, and the last turn. */
  wind: { by: null as string | null, p: 0, drainedAt: -9, backAt: -9, stuckUntil: -9, rattle: -9, turnAt: -9, takeAt: -9 },
  /** Heroes with leeches on them: when they latched, and the last drain tick. */
  latched: new Map<string, { since: number; drip: number }>(),
  /** The last time of: a log laid, a log knocked in, THE LEECHMAN hauling out (and where), the water rising, a hero hooked (and where they were put). */
  lay: -9, fall: -9, out: -9, outAt: { x: 0, y: 0 }, flood: -9, hooked: -9, hookTo: { x: 0, y: 0 }, fallAt: { x: 0, y: 0 },
  /** Events not yet stamped, and the blow (an attack object) already given its cast sound. */
  q: [] as FightEvent[],
  last: 0,
});

export const LEECH = fresh();
export const isFen = (m: GameMap) => !!m.windlass;
export const leechmanOf = (room: ArenaRoom): Enemy | undefined => room.enemies.find((e) => e.boss?.who === 'leechman');

/** Once a frame: stamp the queued events, keep the windlass guess, forget leeches on those who are down. */
export function leechTick(room: ArenaRoom, now: number): void {
  const m = room.map;
  if (!isFen(m)) return;
  if (LEECH.map !== m) Object.assign(LEECH, fresh(), { map: m, last: now });
  const dt = Math.min(0.1, Math.max(0, now - LEECH.last)), w = LEECH.wind, e = leechmanOf(room);
  LEECH.last = now;
  LEECH.at = e ? { x: e.x, y: e.y } : null;
  for (const ev of LEECH.q.splice(0)) stamp(ev, now);
  if (m.drained) w.p = 0;
  else if (w.by) w.p = Math.min(1, w.p + dt / W.turn);
  else w.p = Math.max(0, w.p - (dt / W.turn) * W.slip);
  for (const id of [...LEECH.latched.keys()]) {
    const h = room.heroes.find((x) => x.id === id);
    if (!h || h.act === 'down' || h.out || !e || e.act === 'dead') LEECH.latched.delete(id);
  }
}

function stamp(ev: FightEvent, now: number): void {
  const w = LEECH.wind;
  if (ev.k === 'leech' && ev.id) {
    if (ev.what === 'latch') LEECH.latched.set(ev.id, { since: now, drip: -9 });
    else if (ev.what === 'shake') LEECH.latched.delete(ev.id);
    else if (ev.what === 'drain') { const l = LEECH.latched.get(ev.id); if (l) l.drip = now; }
  } else if (ev.k === 'windlass') {
    if (ev.what === 'take') (w.by = ev.by ?? null), (w.takeAt = now);
    else if (ev.what === 'let') w.by = null;
    else if (ev.what === 'turn') (w.p = ev.p ?? w.p), (w.turnAt = now);
    else if (ev.what === 'drained') (w.by = null), (w.p = 0), (w.drainedAt = now);
    else if (ev.what === 'back') (w.backAt = now), (w.stuckUntil = now + W.again);
    else if (ev.what === 'stuck') w.rattle = now;
  } else if (ev.k === 'log') {
    if (ev.what === 'lay') LEECH.lay = now;
    else if (ev.what === 'fall') (LEECH.fall = now), (LEECH.fallAt = { x: ev.x, y: ev.y });
    else if (ev.what === 'out') (LEECH.out = now), (LEECH.outAt = { x: ev.x, y: ev.y });
  } else if (ev.k === 'flood') LEECH.flood = now;
  else if (ev.k === 'hooked') (LEECH.hooked = now), (LEECH.hookTo = { x: ev.x2, y: ev.y2 });
}

/** 0 dry, 1 shallow, 2 deep, at a spot in tiles (the pool as it is now: drained shallows are mud, not water). */
export function wetAt(m: GameMap, x: number, y: number): 0 | 1 | 2 {
  let lv: 0 | 1 | 2 = 0;
  for (const w of m.water ?? []) if (x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h) lv = w.deep ? 2 : lv === 2 ? 2 : m.drained ? 0 : 1;
  return lv;
}
