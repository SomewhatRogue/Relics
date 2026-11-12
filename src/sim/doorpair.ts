/**
 * The Doorkeepers together, once a tick before the goblins move (docs/plans/bosses.md; numbers
 * shared/bosstune.ts DOORKEEPERS, BOSS): the fight begins when either sees you (both wake, and from three
 * players the small ones come in at the side doors); they swap jobs every DOORKEEPERS.swap seconds; within
 * DOORKEEPERS.lockIn of each other they lock doors and shove together (the mover's blow, its partner carried
 * with it, both stood open after); over DOORKEEPERS.apart apart for DOORKEEPERS.apartFor, the mover walks back
 * to its partner with its back open; in a party of two the wall swings at a second hero just after the
 * mover's blow begins. One down: phase 2, the survivor roars (nothing lands either way), carries both
 * doors and spins.
 */
import { leapLand } from './bossleap';
import { inQuake, quakeAt } from './quakeshape';
import { downIfDead, hitHero } from './combat';
import { TICK } from '../shared/tuning';
import { BOSS, DOORKEEPERS } from '../shared/tuning';
import { BARN_SPOTS } from '../shared/barnarena';
import { isDead } from './damage';
import { bossBegin, bossTarget, clocked, forget, type BossBook } from './bosskit';
import type { World } from './elements';
import type { Enemy, Hero } from './types';
import { currentMap } from '../shared/arena';

const D = DOORKEEPERS;
const free = (e: Enemy, now: number) => !e.attack && e.act !== 'stunned' && e.act !== 'flinch' && e.boss!.backUntil <= now && e.boss!.openUntil <= now && e.boss!.roarUntil <= now;
const up = (h: Hero) => h.act !== 'down' && !h.out && h.id !== 'squire';

export function stepPair(bk: BossBook, w: World, spawn: (x: number, y: number) => Enemy): void {
  const now = w.now, keepers = w.enemies.filter((e) => e.boss);
  if (!keepers.length) return;
  forget(bk, now);
  const live = keepers.filter((e) => !isDead(e));
  // A vault coming down, a quake's crack running (boss-threat.md step 3).
  for (const e of live) leapLand(e, 'vault', w.ev), quake(e, w);
  if (bk.started < 0) {
    if (!live.some((e) => e.alert !== false)) return;
    bk.started = now;
    bk.swapAt = now + D.swap;
    for (const e of live) (e.alert = true), (e.boss!.rotAt = now);
    adds(bk, spawn);
  }
  if (live.length === 1 && bk.phase === 1 && keepers.length > 1) return phaseTwo(bk, live[0], w, spawn);
  if (live.length < 2) return;
  const mover = live.find((e) => e.boss!.job === 'move') ?? live[0], wall = live.find((e) => e !== mover)!;
  carry(bk, mover, wall, now);
  const d = Math.hypot(mover.x - wall.x, mover.y - wall.y);
  // The swap, once neither is mid-blow.
  if (now >= bk.swapAt && !mover.attack && !wall.attack && bk.lockBy < 0) {
    mover.boss!.job = 'wall';
    wall.boss!.job = 'move';
    wall.boss!.rotAt = now;
    bk.swapAt = now + D.swap;
    w.ev.push({ k: 'doorswap', x: (mover.x + wall.x) / 2, y: (mover.y + wall.y) / 2 });
    return;
  }
  // Prised apart too long: the mover goes back to its partner, its back to you.
  if (d > D.apart) {
    if (bk.apartAt < 0) bk.apartAt = now;
    else if (now - bk.apartAt >= D.apartFor && free(mover, now)) (mover.boss!.backUntil = now + D.back), (bk.apartAt = -1);
  } else bk.apartAt = -1;
  if (d <= D.lockIn) lock(bk, mover, wall, w.heroes, w.enemies, now, w.ev);
  splitSwing(bk, wall, w.heroes, w.enemies, now, w.ev);
}

/** Locked Doors: side by side, a shove 3 wide at the mover's hero, from between them. */
function lock(bk: BossBook, m: Enemy, p: Enemy, heroes: Hero[], foes: Enemy[], now: number, ev: World['ev']): void {
  if (bk.lockBy >= 0 || now < bk.lockCool || !free(m, now) || !free(p, now) || m.boss!.downUntil > now || p.boss!.downUntil > now) return;
  const t = bossTarget(m, heroes, now);
  if (!t || clocked(t.id, foes)) return;
  const cx = (m.x + p.x) / 2, cy = (m.y + p.y) / 2, dt = Math.hypot(t.x - cx, t.y - cy);
  if (dt < 1 || dt > D.lock.range! + 0.5 || !bossBegin(m, 'lock', t, ev)) return;
  const a = m.attack!, ux = (t.x - cx) / dt, uy = (t.y - cy) / dt;
  // From between the two of them, straight at the hero.
  Object.assign(a, { dx: ux, dy: uy, ox: cx, oy: cy, mid: [cx - m.x, cy - m.y] });
  (m.fx = p.fx = ux), (m.fy = p.fy = uy);
  bk.lockBy = m.id;
  bk.lockUntil = now + a.windup + a.active;
  bk.lockCool = bk.lockUntil + a.recover + D.lockCool;
}

/** The partner goes with the shove; once it's done, both stand open (the mover in its blow's recover). */
function carry(bk: BossBook, m: Enemy, p: Enemy, now: number): void {
  if (bk.lockBy < 0) return;
  const by = bk.lockBy === m.id ? m : p, other = by === m ? p : m;
  if (now >= bk.lockUntil || by.attack?.boss !== 'lock') {
    bk.lockBy = -1;
    other.boss!.openUntil = now + D.lock.recover;
    return;
  }
  if (by.attack.t >= by.attack.windup) (other.kvx = by.kvx), (other.kvy = by.kvy);
}

/** A party of two: the wall swings at the other hero, if one's in reach. */
function splitSwing(bk: BossBook, wall: Enemy, heroes: Hero[], foes: Enemy[], now: number, ev: World['ev']): void {
  const s = bk.split;
  if (!s || now < s.at) return;
  bk.split = null;
  if (!free(wall, now) || bk.lockBy >= 0) return;
  const near = heroes.filter((h) => up(h) && h.id !== s.not && !clocked(h.id, foes) && Math.hypot(h.x - wall.x, h.y - wall.y) <= D.sweep.range! + 0.2);
  const t = near.sort((a, b) => Math.hypot(a.x - wall.x, a.y - wall.y) - Math.hypot(b.x - wall.x, b.y - wall.y))[0];
  if (t) bossBegin(wall, 'sweep', t, ev);
}

/** One down: the survivor roars, takes up both doors, and fights on alone. */
function phaseTwo(bk: BossBook, s: Enemy, w: World, spawn: (x: number, y: number) => Enemy): void {
  bk.phase = 2;
  bk.lockBy = -1;
  bk.split = null;
  Object.assign(s, { attack: null, act: 'chase', actT: 0, kvx: 0, kvy: 0 });
  Object.assign(s.boss!, { phase: 2, job: 'move', rot: 0, rotAt: w.now + BOSS.roar, roarUntil: w.now + BOSS.roar, backUntil: -9, openUntil: -9, downUntil: -9, straps: 0 });
  w.ev.push({ k: 'roar', x: s.x, y: s.y });
  // Its partner's death feeds its rage: some health back (Kyle, 2026-11-11: "the other should heal a little when they berserk").
  const n = Math.min(s.maxHp - s.hp, Math.round(s.maxHp * D.enrage.heal));
  if (n > 0) (s.hp += n), w.ev.push({ k: 'heal', x: s.x, y: s.y, n });
  adds(bk, spawn);
}

/** From three players, small ones in at the side doors each phase (BOSS.adds); in the Deep, out of the side tunnels. */
function adds(bk: BossBook, spawn: (x: number, y: number) => Enemy): void {
  const n = BOSS.adds[Math.min(BOSS.adds.length, bk.party) - 1] ?? 0;
  for (let i = 0; i < n; i++) {
    const sides = currentMap().adits ?? BARN_SPOTS.sides, at = sides[i % sides.length], e = spawn(at.x, at.y + Math.floor(i / 2) * 0.8);
    e.alert = true;
  }
}

/** A quake's circles landing in turn, each catching whoever's in it (a striped blow: roll or step out). */
function quake(e: Enemy, w: World): void {
  const a = e.attack;
  if (!a || (a.boss as string | undefined) !== 'quake') return;
  for (let i = 0; i < D.quakeN; i++) {
    const q = quakeAt(e, i), tag = 'q' + i;
    if (a.t + TICK * 1.5 < q.at || a.hit?.includes(tag)) continue;
    (a.hit ??= []).push(tag);
    for (const h of w.heroes) {
      if (h.act === 'down' || h.out || (h.z ?? 0) !== 0 || !inQuake(q, h)) continue;
      hitHero(e, { ...a, kind: 'slam', aimed: h.id, ox: q.x, oy: q.y, cx: q.x, cy: q.y, radius: D.quake.radius!, hit: [], done: true }, h, w.now, w.ev, w.heroes);
      downIfDead(h, w.ev);
    }
    w.ev.push({ k: 'quake', x: q.x, y: q.y });
  }
}
