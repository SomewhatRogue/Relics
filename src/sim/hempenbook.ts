/**
 * Hempen's ground once a tick, before the goblins move (docs/plans/bosses.md "Hempen, brought into the
 * format"; numbers shared/hangtune.ts HEMPEN_BOSS, the kit's shared/bosstune.ts BOSS): the fight begins
 * when it sees you (from three players, small ones come in along the paths each phase); below half its
 * health, phase 2 (a roar, nothing landing either way); a haul whose hero was cut down is lost; in a party
 * of two or more, a moment after each blow begins a rope comes down out of the branches on a second hero
 * (a striped circle on their spot), and ropes that are due land, judged as any boss blow (sim/combat.ts
 * hitHero: the lag compensation and the grace with it). And how the wood's room takes Hempen on (`hempenOnto`).
 */
import { BOSS, HEMPEN_BOSS as H } from '../shared/tuning';
import { SPINE } from '../shared/hangwood';
import { Rng } from '../shared/rng';
import { isDead } from './damage';
import { hitHero } from './combat';
import { clocked, forget, newBoss, newBook, type BossBook, type BossOn, type Rope } from './bosskit';
import { haulLost, inPlay } from './hempenboss';
import type { World } from './elements';
import type { ArenaRoom } from './room';
import type { Enemy, EnemyAttack } from './types';

const r2 = (v: number) => Math.round(v * 100) / 100;

/** The wood's room takes Hempen into the format: its boss state, the room's notes on it, its hoard the sure chest. */
export function hempenOnto(room: ArenaRoom, party: number, seed: number): void {
  if (!H.on) return;
  const e = room.enemies.find((x) => x.noose && x.name);
  if (!e) return;
  e.boss = newBoss('hempen', party);
  const rng = new Rng(seed * 613 + 29);
  room.bosses = newBook(party, [rng.int(5), rng.int(5)], 'hempen');
  for (const c of room.chests) if (c.chained) Object.assign(c, { boss: (seed * 13 + 7) >>> 0, sure: 'hempen' as const });
}

export function stepHempenBook(bk: BossBook, w: World, spawn: (x: number, y: number) => Enemy): void {
  const now = w.now, e = w.enemies.find((x) => x.boss?.who === 'hempen');
  if (!e) return;
  const b = e.boss!;
  forget(bk, now);
  if (isDead(e)) return void ((bk.split = null), b.ropes?.length && (b.ropes = []));
  if (bk.started < 0) {
    if (e.alert === false) return;
    bk.started = now;
    b.rotAt = now;
    // (Its first blow when it's seen you, not a goblin's slow start: newEnemy staggers those by id.)
    e.cooldown = Math.min(e.cooldown, 0.6);
    adds(bk, spawn);
  }
  haulLost(e, w.heroes, w.ev);
  // Below half: phase 2 (not through a stagger, the party's payoff, nor as a blow lands).
  if (b.phase === 1 && e.hp <= e.maxHp * H.phase2 && b.stagUntil <= now && !(e.attack && e.attack.t >= e.attack.windup)) {
    bk.phase = 2;
    bk.split = null;
    Object.assign(e, { attack: null, act: 'chase', actT: 0, kvx: 0, kvy: 0 });
    Object.assign(b, { phase: 2, rot: 0, rotAt: now + BOSS.roar, roarUntil: now + BOSS.roar, ropes: [] });
    w.ev.push({ k: 'roar', x: e.x, y: e.y });
    adds(bk, spawn);
  }
  split(bk, e, b, w);
  land(e, b, w);
}

/** A party of two or more: a rope on a second hero (not the one its blow is at, not one already clocked). */
function split(bk: BossBook, e: Enemy, b: BossOn, w: World): void {
  const s = bk.split, now = w.now;
  if (!s || now < s.at) return;
  bk.split = null;
  if (b.roarUntil > now) return;
  const near = inPlay(e, w.heroes, now).filter((h) => h.id !== s.not && !h.hoisted && !clocked(h.id, w.enemies));
  const t = near.sort((p, q) => Math.hypot(p.x - e.x, p.y - e.y) - Math.hypot(q.x - e.x, q.y - e.y))[0];
  if (!t) return;
  b.ropes = [...(b.ropes ?? []), { x: r2(t.x), y: r2(t.y), at: r2(now + BOSS.tell + H.rope.fall), on: t.id }];
  w.ev.push({ k: 'windup', x: t.x, y: t.y, kind: 'slam' });
}

/** A rope as a blow: a striped circle (nothing blocks it), its floor's time the rope's fall. */
export function ropeBlow(e: Enemy, r: Rope): EnemyAttack {
  const wind = BOSS.tell + H.rope.fall;
  return {
    kind: 'slam', aimed: r.on, t: wind, windup: wind, active: 0.1, recover: 0, dmg: Math.round(H.rope.dmg * (e.harm ?? 1)), knock: H.rope.knock, unblockable: true,
    dx: 0, dy: 1, ox: r.x, oy: r.y, range: 0, arc: 0, cx: r.x, cy: r.y, radius: H.rope.r, done: true, boss: 'rain', tell: BOSS.tell,
  };
}

/** Ropes that are due come down on whoever's under them. */
function land(e: Enemy, b: BossOn, w: World): void {
  const now = w.now, due = (b.ropes ?? []).filter((r) => now >= r.at - 1e-6);
  if (!due.length) return;
  b.ropes = b.ropes!.filter((r) => now < r.at - 1e-6);
  for (const r of due) {
    w.ev.push({ k: 'impact', x: r.x, y: r.y, kind: 'slam' });
    const a = ropeBlow(e, r);
    for (const h of w.heroes) if ((h.z ?? 0) === 0) hitHero(e, a, h, now, w.ev, w.heroes);
  }
}

/** From three players, small ones in along the paths into its ground each phase (BOSS.adds). */
function adds(bk: BossBook, spawn: (x: number, y: number) => Enemy): void {
  const n = BOSS.adds[Math.min(BOSS.adds.length, bk.party) - 1] ?? 0;
  for (let i = 0; i < n; i++) {
    const [dx, dy] = H.adds[i % H.adds.length], e = spawn(SPINE.hempen.x + dx, SPINE.hempen.y + dy + Math.floor(i / 2) * 0.8);
    e.alert = true;
  }
}
