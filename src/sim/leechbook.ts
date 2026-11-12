/**
 * THE LEECHMAN's pool once a tick, before the goblins move (docs/design/deep-layer-bosses.md section 2; numbers
 * shared/leechtune.ts): the fight begins when it sees you; the rest it takes between blows (LEECHMAN.pauseBetween,
 * quicker in phase 2, the punish straight after a haul); the LEECHES on a hero drain LEECHMAN.leech.dmg every
 * LEECHMAN.leech.every s (never the last point) until the hero rolls, and fall off a hero who goes down or when it
 * dies; the PEAT bank's mud is laid along its lane as the blow lands (`map.mud`, circles that slow a body: wadeAt)
 * and worn away LEECHMAN.mud.time s on; and below LEECHMAN.phase2 of its health, phase 2: a roar (nothing landing
 * either way), `boss.flood` set (the water rises, logs: sim/leechlog.ts), and small ones wading in from the reeds twice as
 * often. Small ones come every LEECHMAN.adds.every s, never more than LEECHMAN.adds.most up at once.
 */
import { BOSS, LEECHMAN as L } from '../shared/tuning';
import { currentMap } from '../shared/arena';
import { reedSpawns } from '../shared/fenarena';
import { count } from './score';
import { downIfDead } from './combat';
import { isDead } from './damage';
import { forget, type BossBook } from './bosskit';
import { leechState, type LeechState } from './leechhook';
import { riseWater, stepLogs } from './leechlog';
import { endWindlass, stepWindlass } from './leechwind';
import type { World } from './elements';
import type { Enemy, FightEvent, Hero } from './types';

export function stepLeechBook(bk: BossBook, w: World, spawn: (x: number, y: number) => Enemy): void {
  const now = w.now, e = w.enemies.find((x) => x.boss?.who === 'leechman'), st = leechState(bk), m = currentMap();
  if (m.mud?.length) m.mud = m.mud.filter((c) => c.until > now);
  if (!e || isDead(e)) return void (st.leeched.clear(), endWindlass(bk));
  const b = e.boss!;
  forget(bk, now);
  if (bk.started < 0 && e.alert) {
    bk.started = now;
    b.rotAt = now;
    st.nextAdds = now + L.adds.every[1];
    // (Its first blow when it has seen you, not a goblin's slow start.)
    e.cooldown = Math.min(e.cooldown, 0.6);
  }
  drain(st, w.heroes, e, now, w.ev);
  peat(e, st, now, w.ev);
  stepWindlass(bk, e, w);
  stepLogs(bk, e, w);
  // Its rest between blows is its own: straight on after a haul (the punish), else LEECHMAN.pauseBetween.
  if (e.attack) st.was = true;
  else if (st.was) (st.was = false), (e.cooldown = st.punish && st.punish.until > now ? L.chainPause : L.pauseBetween / (b.phase === 2 ? L.faster : 1));
  // Below the line: phase 2 (not through a stagger, a knock down, nor as a blow lands).
  if (b.phase === 1 && e.hp <= e.maxHp * L.phase2 && b.stagUntil <= now && b.downUntil <= now && !(e.attack && e.attack.t >= e.attack.windup)) {
    bk.phase = 2;
    Object.assign(e, { attack: null, act: 'chase', actT: 0, kvx: 0, kvy: 0 });
    Object.assign(b, { phase: 2, rot: 0, rotAt: now + BOSS.roar, roarUntil: now + BOSS.roar, flood: true, cmove: undefined });
    st.punish = null;
    w.ev.push({ k: 'roar', x: e.x, y: e.y });
    riseWater(w.ev);
    adds(st, w, spawn, now, 2);
  }
  if (now >= st.nextAdds && b.roarUntil <= now) adds(st, w, spawn, now, b.phase);
}

/** Leeches on a hero: a roll shakes them off, a downed hero is let go, else a little drain on the beat. */
function drain(st: LeechState, heroes: Hero[], e: Enemy, now: number, ev: FightEvent[]): void {
  for (const [id, next] of st.leeched) {
    const h = heroes.find((x) => x.id === id);
    if (!h || h.act === 'down' || h.out) {
      st.leeched.delete(id);
    } else if (h.act === 'roll') {
      st.leeched.delete(id);
      ev.push({ k: 'leech', what: 'shake', x: h.x, y: h.y, id });
    } else if (now >= next) {
      // (Never the last point: they drain, they don't kill. Harder on a harder floor, as every blow.)
      const n = Math.min(Math.max(1, Math.round(L.leech.dmg * (e.harm ?? 1))), Math.max(0, h.hp - 1));
      st.leeched.set(id, next + L.leech.every);
      if (n <= 0) continue;
      h.hp -= n;
      count(id, 'taken', n);
      ev.push({ k: 'leech', what: 'drain', x: h.x, y: h.y, id });
      downIfDead(h, ev);
    }
  }
}

/** A peat bank's blow landing: mud in circles along its lane, once. */
function peat(e: Enemy, st: LeechState, now: number, ev: FightEvent[]): void {
  const a = e.attack;
  if ((a?.boss as string | undefined) !== 'peat') return void (st.mudDone = false);
  if (!a || st.mudDone || a.t < a.windup) return;
  st.mudDone = true;
  const m = currentMap(), M = L.mud;
  m.mud ??= [];
  for (let s = M.step; s <= a.range; s += M.step) {
    const x = a.ox + a.dx * s, y = a.oy + a.dy * s;
    if (x < 0.3 || y < 0.3 || x > m.w - 0.3 || y > m.h - 0.3) break;
    m.mud.push({ x, y, r: M.r, until: now + M.time });
    ev.push({ k: 'mud', x, y, r: M.r, time: M.time });
  }
}

/** LEECHMAN.adds.n small ones wading in from the reed beds (the furthest from the middle first), and the next batch on. */
function adds(st: LeechState, w: World, spawn: (x: number, y: number) => Enemy, now: number, phase: 1 | 2): void {
  st.nextAdds = now + L.adds.every[phase];
  const live = w.enemies.filter((o) => !o.boss && !isDead(o)).length, room = Math.max(0, L.adds.most - live), spots = reedSpawns();
  for (let i = 0; i < Math.min(L.adds.n, room); i++) {
    const p = spots[(Math.floor(now) + i * 2) % spots.length], s = spawn(p.x, p.y);
    s.alert = true;
  }
}
