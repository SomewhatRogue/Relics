/**
 * The old windlass in THE LEECHMAN's pool (docs/design/deep-layer-bosses.md section 2; numbers shared/leechtune.ts
 * `windlass`), the trick every class can use. A hero's GRAB within `reach` of it takes hold (a press, as the Haulier's
 * carts: sim/haulcarts.ts; the press is spent, so no "nothing to grab"); GRAB again, or walking off, lets go. Held, it
 * turns, filling over `turn` s (slipping back while nobody holds it). Full, the shallows drain for `dry` s (`map.drained`:
 * mud to walk; deep channels stay deep), THE LEECHMAN crawls in it and can't use THE LINE (sim/leechman.ts); then the
 * water comes back and the windlass is stuck for `again` s. The boss goes for the hero turning it (`turner`).
 * Notes are the book's own (a WeakMap on the BossBook), never sent; the events carry what the screen shows.
 */
import { currentMap } from '../shared/arena';
import { TICK, LEECHMAN as L } from '../shared/tuning';
import type { BossBook } from './bosskit';
import type { World } from './elements';
import type { Enemy, Hero } from './types';

const W = L.windlass;
export interface WindState { seen: Map<string, number>; by: string | null; at: number; p: number; quarter: number; dryUntil: number; againAt: number }

const states = new WeakMap<BossBook, WindState>();
export function windState(bk: BossBook): WindState {
  let s = states.get(bk);
  if (!s) states.set(bk, (s = { seen: new Map(), by: null, at: -9, p: 0, quarter: 0, dryUntil: -9, againAt: -9 }));
  return s;
}

const up = (h: Hero) => h.act !== 'down' && !h.out && h.id !== 'squire';

/** The hero turning it now, if any. */
export const turner = (bk: BossBook, heroes: Hero[]): Hero | undefined => {
  const by = windState(bk).by;
  return by ? heroes.find((h) => h.id === by && up(h)) : undefined;
};

/** The windlass once a tick: presses, the turning, the drain and the water's return. */
export function stepWindlass(bk: BossBook, e: Enemy, w: World): void {
  const m = currentMap(), s = m.windlass, st = windState(bk), now = w.now;
  if (!s) return;
  const near = (h: Hero, r: number) => Math.hypot(h.x - s.x, h.y - s.y) <= r;
  for (const h of w.heroes) {
    const prev = st.seen.get(h.id);
    st.seen.set(h.id, h.seen.grab);
    if (prev === undefined || prev === h.seen.grab || !up(h)) continue;
    if (st.by === h.id) {
      // (Not the press that took hold of it: a moment's grace.)
      if (now - st.at >= W.hold) (st.by = null), w.ev.push({ k: 'windlass', what: 'let', x: s.x, y: s.y, by: h.id });
      h.grabQueuedAt = -9;
      continue;
    }
    if (!near(h, W.reach)) continue;
    h.grabQueuedAt = -9;
    if (st.by || m.drained || now < st.againAt) {
      if (!st.by) w.ev.push({ k: 'windlass', what: 'stuck', x: s.x, y: s.y, by: h.id });
      continue;
    }
    Object.assign(st, { by: h.id, at: now });
    w.ev.push({ k: 'windlass', what: 'take', x: s.x, y: s.y, by: h.id });
  }
  // Let go: they fall, are knocked about, or walk off.
  const holder = st.by ? w.heroes.find((h) => h.id === st.by) : undefined;
  if (st.by && (!holder || !up(holder) || holder.act === 'stun' || holder.act === 'hurt' || !near(holder, W.reach + 0.8))) {
    w.ev.push({ k: 'windlass', what: 'let', x: s.x, y: s.y, by: st.by });
    st.by = null;
  }
  if (m.drained) {
    if (now >= st.dryUntil) (m.drained = false), (st.againAt = now + W.again), w.ev.push({ k: 'windlass', what: 'back', x: s.x, y: s.y });
  } else if (st.by) {
    st.p += TICK / W.turn;
    const q = Math.floor(st.p * 4);
    if (q > st.quarter && q < 4) (st.quarter = q), w.ev.push({ k: 'windlass', what: 'turn', x: s.x, y: s.y, by: st.by, p: q / 4 });
    if (st.p >= 1) drain(st, e, s, now, w);
  } else if (st.p > 0) {
    st.p = Math.max(0, st.p - (TICK / W.turn) * W.slip);
    st.quarter = Math.min(st.quarter, Math.floor(st.p * 4));
  }
}

/** Full: the shallows go to mud. THE LINE it was winding up is dropped (it can't use it while they're dry). */
function drain(st: WindState, e: Enemy, s: { x: number; y: number }, now: number, w: World): void {
  currentMap().drained = true;
  Object.assign(st, { by: null, p: 0, quarter: 0, dryUntil: now + W.dry });
  if (e.attack && (e.attack.boss as string | undefined) === 'line' && e.attack.t < e.attack.windup) (Object.assign(e, { attack: null, act: 'chase', actT: 0 }), (e.boss!.cmove = undefined));
  w.ev.push({ k: 'windlass', what: 'drained', x: s.x, y: s.y, time: W.dry });
}

/** The boss is gone: the water is back. */
export function endWindlass(bk: BossBook): void {
  const st = windState(bk);
  currentMap().drained = false;
  st.by = null;
}
