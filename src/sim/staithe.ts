/**
 * The Staithe's rules (shared/staithe.ts lays it out; numbers shared/staithetune.ts STAITHE). You come in
 * on it mid-raid:
 *  1. the log-carriers are laying their log across the gap to the jetty (a clock, not a blow: it's
 *     across when it's across). Kill them first, or once it's across, SHOVE it into the river (GRAB at
 *     its bank end). Across and left there, the goblins go over it and take folk off the jetty: LOST.
 *  2. the gaffer is hooking folk off the jetty's end into nets on the bank: GRAB (CUT FREE) by them.
 *  3. with the log dealt with, stand in the jetty's ring on the bank and hold it STAITHE.hold seconds
 *     while the punt takes them over (in STAITHE.trips trips, goblins coming along the bank at each turn).
 * Each one brought over pays (the NETS way: shared/waypay.ts reads the room's `survivorhome`s).
 *
 * What a friend's screen needs is on the blocks (the log's and the hold's clocks as times, set when they
 * start or stop, never ticked) and the survivors: nothing new is sent every tick. Rolls nothing.
 */
import { inArea, type Block, type GameMap } from '../shared/arena';
import { STAITHE } from '../shared/tuning';
import { isDead } from './damage';
import type { World } from './elements';
import { players } from './party';
import { freeSurvivor } from './survivors';
import type { Enemy, FightEvent, Hero, Survivor } from './types';

export const jettyOf = (m: GameMap) => m.blocks.find((b) => b.kind === 'jetty');
export const logOf = (m: GameMap) => m.blocks.find((b) => b.kind === 'gangway');
export const smokehouseOf = (m: GameMap) => m.blocks.find((b) => b.kind === 'smokehouse');
const up = (h: Hero) => h.act !== 'down' && !h.out && h.id !== 'squire';

/** The folk as the room begins: standing on the jetty, and netted on the bank. */
export function initStaithe(map: GameMap, survivors: Survivor[], now: number): void {
  const st = map.staithe;
  if (!st) return;
  for (const [x, y] of st.folk) freeSurvivor(survivors, x, y, now).stay = true;
  for (const [x, y] of st.netted) freeSurvivor(survivors, x, y, now).netted = true;
}

/** Still on the jetty, netted on the bank (neither saved nor lost yet). */
export const onJetty = (s: Survivor) => !!s.stay && !s.dead && !s.gone && !s.taken;
export const isNetted = (s: Survivor) => !!s.netted && !s.dead && !s.gone && !s.taken;

/** The log dealt with: never laid and its carriers dead, or shoved in. */
export function logDone(m: GameMap, foes: Enemy[]): boolean {
  const g = logOf(m);
  if (!g) return true;
  if (g.ruined) return true;
  return !g.deck && !foes.some((e) => e.variant === 'log' && !isDead(e));
}

/** A clock set (a time or seconds left): -1 or never set is none. Never deleted, so a friend's patches carry its going too. */
export const set = (v: number | undefined): v is number => v !== undefined && v >= 0;

/** The log's laying, as both screens show it (0 to 1). */
export function laidK(g: Block, now: number): number {
  if (g.deck) return 1;
  const left = set(g.layAt) ? Math.max(0, g.layAt - now) : set(g.layLeft) ? g.layLeft : STAITHE.lay * (1 - STAITHE.staged);
  return 1 - left / STAITHE.lay;
}

/** The hold, as both screens show it (0 to 1). */
export function heldK(j: Block, now: number): number {
  if (j.over) return 1;
  const span = STAITHE.hold / (j.quick ? STAITHE.clear : 1);
  const left = set(j.holdAt) ? Math.max(0, j.holdAt - now) : set(j.holdLeft) ? j.holdLeft : STAITHE.hold;
  return Math.max(0, Math.min(1, 1 - left / (set(j.holdAt) ? span : STAITHE.hold)));
}

/** One survivor gone over on the punt: home, counted. */
function over(s: Survivor, now: number, ev: FightEvent[]): void {
  Object.assign(s, { home: now, gone: true, moving: false, stay: false });
  ev.push({ k: 'survivorhome', x: s.x, y: s.y, id: s.id });
}

/**
 * Each tick: the log's clock, the log across (its carriers set it down and go over), and the hold.
 * `spawn` puts a goblin down awake (the room's).
 */
export function stepStaithe(w: World, map: GameMap, spawn: (x: number, y: number) => Enemy): void {
  const st = map.staithe, j = jettyOf(map), g = logOf(map);
  if (!st || !j) return;
  const now = w.now, ev = w.ev, list = w.survivors ?? [];
  if (g && !g.deck && !g.ruined) {
    const carriers = w.enemies.find((e) => e.variant === 'log' && !isDead(e) && e.task?.k === 'lay' && !e.task.quit);
    if (carriers && !set(g.layAt)) (g.layAt = now + (set(g.layLeft) ? g.layLeft : STAITHE.lay * (1 - STAITHE.staged))), (g.layLeft = -1);
    else if (!carriers && set(g.layAt)) (g.layLeft = Math.max(0, g.layAt - now)), (g.layAt = -1);
    if (carriers && set(g.layAt) && now >= g.layAt) {
      // Across: the two of them set it down and go over it, the band after them.
      Object.assign(g, { deck: true, soft: false, layAt: -1 });
      Object.assign(carriers, { act: 'dead', actT: 99, hp: 0, attack: null, escaped: true, respawns: false, death: '' });
      ev.push({ k: 'logacross', x: g.x + g.w / 2, y: g.y + g.h / 2 });
      for (const sd of [-0.5, 0.5]) spawn(carriers.x + st.down[0] * sd, carriers.y + st.down[1] * sd).task = { k: 'board' };
    }
  }
  // Someone took on the jetty by the goblins on it (one each STAITHE.take seconds a goblin).
  for (const e of w.enemies) {
    const t = e.task;
    if (isDead(e) || t?.k !== 'board' || !inArea(j, e.x, e.y)) continue;
    if (t.at === undefined) t.at = now + STAITHE.take;
    if (now < t.at) continue;
    t.at = now + STAITHE.take;
    const s = list.filter(onJetty).sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y))[0];
    if (s) lose(j, s, ev);
  }
  // Killed where they waited (burned on the jetty, struck in their net): lost all the same.
  for (const s of list) if (s.dead && (s.stay || s.netted)) Object.assign(s, { stay: false, netted: false }), (j.lost = (j.lost ?? 0) + 1), ev.push({ k: 'folklost', x: s.x, y: s.y });
  hold(w, map, j, spawn);
}

/** Lost: taken off by them, or (the big map) left too long. */
export function lose(j: Block, s: Survivor, ev: FightEvent[]): void {
  Object.assign(s, { taken: true, gone: true, moving: false, stay: false, netted: false });
  j.lost = (j.lost ?? 0) + 1;
  ev.push({ k: 'folklost', x: s.x, y: s.y });
}

/** The jetty ring: held while anyone's in it (and a moment after), the punt making its trips. */
function hold(w: World, map: GameMap, j: Block, spawn: (x: number, y: number) => Enemy): void {
  const st = map.staithe!, now = w.now, ev = w.ev, list = w.survivors ?? [];
  if (j.over || !logDone(map, w.enemies)) return;
  // Nobody left on the jetty, in a net or by the ring to take over: it's done with.
  const byRing = (s: Survivor) => !s.dead && !s.gone && !s.taken && s.home < 0 && !s.stay && !s.netted && Math.hypot(s.x - st.ring.x, s.y - st.ring.y) <= STAITHE.ring + 2;
  if (!list.some(onJetty) && !list.some(isNetted) && !list.some(byRing)) return void (j.over = true);
  const inside = players(w.heroes).some((h) => up(h) && Math.hypot(h.x - st.ring.x, h.y - st.ring.y) <= STAITHE.ring);
  const clear = !w.enemies.some((e) => !isDead(e));
  if (inside && set(j.outAt)) j.outAt = -1;
  else if (!inside && set(j.holdAt) && !set(j.outAt)) j.outAt = now;
  if (inside && !set(j.holdAt)) (j.holdAt = now + (set(j.holdLeft) ? j.holdLeft : STAITHE.hold) / (clear ? STAITHE.clear : 1)), (j.quick = clear), (j.holdLeft = -1);
  else if (set(j.holdAt) && set(j.outAt) && now - j.outAt > STAITHE.grace) {
    j.holdLeft = Math.max(0, (j.holdAt - now) * (j.quick ? STAITHE.clear : 1));
    Object.assign(j, { holdAt: -1, outAt: -1, quick: false });
  }
  // The bank cleared mid-hold: the punt needn't wait on anyone.
  if (set(j.holdAt) && clear && !j.quick) (j.holdAt = now + (j.holdAt - now) / STAITHE.clear), (j.quick = true);
  const k = heldK(j, now), due = Math.min(STAITHE.trips, Math.floor(k * STAITHE.trips + 1e-6));
  while ((j.trips ?? 0) < due) {
    j.trips = (j.trips ?? 0) + 1;
    const last = j.trips >= STAITHE.trips, near = list.filter(byRing);
    const deck = list.filter(onJetty), n = last ? deck.length : Math.ceil(deck.length / (STAITHE.trips - j.trips + 1));
    for (const s of [...deck.slice(0, n), ...near]) over(s, now, ev);
    j.saved = (j.saved ?? 0) + n + near.length;
    ev.push({ k: 'trip', x: st.ring.x, y: st.ring.y });
    if (last) {
      Object.assign(j, { over: true, holdAt: -1, holdLeft: -1 });
      ev.push({ k: 'puntover', x: st.ring.x, y: st.ring.y });
      break;
    }
    // Along the bank at them: from upstream and down.
    for (let i = 0; i < STAITHE.holdWave; i++) {
      const sd = i % 2 ? 1 : -1, p = edgeAlong(map, st.ring.x, st.ring.y, st.down[0] * sd, st.down[1] * sd);
      const e = spawn(p.x - st.across[0] * 0.5 * i, p.y - st.across[1] * 0.5 * i);
      e.alert = true;
    }
  }
}

/** Walk from (x, y) along (dx, dy) to a tile in from the map's edge. */
function edgeAlong(m: GameMap, x: number, y: number, dx: number, dy: number): { x: number; y: number } {
  let px = x, py = y;
  while (px + dx > 1.2 && px + dx < m.w - 1.2 && py + dy > 1.2 && py + dy < m.h - 1.2) (px += dx), (py += dy);
  return { x: px, y: py };
}
