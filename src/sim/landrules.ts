/**
 * Falling and resting on a roaming land (docs/design/outside-the-gate.md, "Falling, and way stations"). Only a job with
 * `roam` runs these (sim/run.ts); nothing here is stepped for any other.
 *
 * - One self revive a trip: the first fall, a hero is up by themselves after HERO.respawn at PARTY.upHp of their health, and
 *   that get-up is spent (`selfUp`). Down again, they stay down till a friend lifts them (friends lift without limit).
 * - Nobody left: everyone down with no get-up left, and after INSTANCE.regroup the party is up whole at the last station
 *   rested at (`run.rest`) or the way in, their get-ups back, the goblins still standing put back whole. No count, never lost.
 * - Resting: LAND.rest seconds inside a station's ring, not down: it is the rest point, and everyone inside has their
 *   get-up back; said once (`rested`) while they stay.
 * - Safe ground: no goblin enters a ring (stopped at its edge); one pressing at a hero inside gives up after LAND.giveUp and
 *   goes home (sim/homing.ts). Shots already in the air are left alone.
 */
import { INSTANCE, HERO, LAND, PARTY } from '../shared/tuning';
import { settle, upAtGate } from './checkpoint';
import { isDead } from './damage';
import { players } from './party';
import type { ArenaRoom } from './room';
import type { Run } from './run';
import type { FightEvent, Hero } from './types';

type Station = { name: string; x: number; y: number; r: number };
const inside = (s: Station, b: { x: number; y: number }) => Math.hypot(b.x - s.x, b.y - s.y) <= s.r;

/** Where hero `i` of `n` wakes: a short row across the rest point (or the way in). */
export function wakeSpot(room: ArenaRoom, run: Run, i: number, n: number): { x: number; y: number } {
  const g = run.rest ?? room.map.hero, x = g.x + (i - (n - 1) / 2) * 0.9;
  return { x: Math.max(0.6, Math.min(room.map.w - 0.6, x)), y: g.y };
}

/** Nobody standing, and none with a get-up left. */
export const spent = (ps: Hero[]) => ps.length > 0 && ps.every((h) => h.act === 'down' && (h.selfUp || h.out));

/** The one get-up of a trip: after the lone hero's wait, at a friend's lift's health. */
function selfRevive(h: Hero, ev: FightEvent[]): void {
  Object.assign(h, { act: 'idle', actT: 0, actDur: 0, hp: Math.round(h.maxHp * PARTY.upHp), stamina: HERO.stamina, bleeding: false, pickT: 0, raiser: undefined, selfUp: true });
  ev.push({ k: 'gotup', x: h.x, y: h.y, id: h.id });
}

/** Resting in a ring: the clock, the rest point, the get-up back. */
function rest(run: Run, ps: Hero[], stations: Station[], ev: FightEvent[], now: number): void {
  for (const h of ps) {
    const s = stations.find((q) => inside(q, h));
    if (!s) {
      if (h.restT !== undefined || h.restAt) (h.restT = undefined), (h.restAt = undefined);
      continue;
    }
    if (h.act === 'down') {
      h.restT = undefined;
      continue;
    }
    // (By the room's clock, not a count of calls: the run is tallied a frame at a time on a screen, a tick at a time in a test.)
    h.restT ??= now;
    if (now - h.restT < LAND.rest || h.restAt === s.name) continue;
    h.restAt = s.name;
    run.rest = { x: h.x, y: h.y };
    for (const o of ps) if (inside(s, o)) o.selfUp = false;
    ev.push({ k: 'rested', x: h.x, y: h.y, id: h.id, station: s.name });
  }
}

/** The ring is safe ground: goblins stop at its edge, and one pressing at a hero inside gives up and goes home. */
function guard(room: ArenaRoom, ps: Hero[], stations: Station[], now: number): void {
  for (const e of room.allEnemies) {
    if (isDead(e) || e.kind === 'nest') continue;
    for (const s of stations) {
      const dx = e.x - s.x, dy = e.y - s.y, d = Math.hypot(dx, dy);
      if (d >= s.r) continue;
      const k = (s.r + 0.001) / (d || 1);
      e.x = d ? s.x + dx * k : s.x + s.r + 0.001;
      e.y = d ? s.y + dy * k : s.y;
    }
    if (e.boss || e.homing || !e.alert || e.dozing) {
      if (!e.homing && e.giveT !== undefined) e.giveT = undefined;
      continue;
    }
    let near: Hero | undefined, best = Infinity;
    for (const h of ps) {
      const d = Math.hypot(h.x - e.x, h.y - e.y);
      if (h.act !== 'down' && d < best) (best = d), (near = h);
    }
    if (!near || !stations.some((s) => inside(s, near!))) {
      if (e.giveT !== undefined) e.giveT = undefined;
      continue;
    }
    e.giveT ??= now;
    if (now - e.giveT >= LAND.giveUp) Object.assign(e, { alert: false, act: 'idle', actT: 0, attack: null, homing: true, giveT: undefined });
  }
}

/** Once a tick, after the room's step (sim/run.ts tally). */
export function stepLand(run: Run, room: ArenaRoom, ev: FightEvent[]): void {
  const ps = players(room.heroes), stations: Station[] = room.map.stations ?? [];
  // Down, a hero stays down till they are lifted or the self revive's wait is over (not the lone stand-up's full health).
  for (const h of ps) if (h.act === 'down') h.actDur = Infinity;
  if (run.wipeAt !== undefined) {
    if (run.wipeAt > room.time) return void (run.wipeAt = undefined);
    if (room.time - run.wipeAt < INSTANCE.regroup) return;
    run.wipeAt = undefined;
    ps.forEach((h, i) => upAtGate(room, h, wakeSpot(room, run, i, ps.length), ev));
    for (const e of room.allEnemies) if (!isDead(e) && !e.boss) settle(room, e), Object.assign(e, { homing: false, giveT: undefined });
    return;
  }
  for (const h of ps) if (h.act === 'down' && !h.selfUp && !h.out && h.actT >= HERO.respawn) selfRevive(h, ev);
  if (spent(ps)) return void (run.wipeAt = room.time);
  if (stations.length) rest(run, ps, stations, ev, room.time), guard(room, ps, stations, room.time);
}
