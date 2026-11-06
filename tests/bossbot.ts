/**
 * A simulated boss fight (not a test on its own: tests/doorkeepers.test.ts uses it). Heroes who can't go
 * down (every point they lose is counted) fight a boss's arena by Intent, as a plain player would, walking
 * on their own feet (never ghosted): they read each boss floor as it shows (the room's own attacks), walk
 * out of a striped one, block a red one (a Warrior or Healer, facing it) or dodge it at the last moment (a
 * Rogue, Ranger or Mage), and otherwise go for a back or an open front: behind the wall, into the mover's
 * recovery, anything staggered or with its door down. Daggers tap; a sword taps, and lets a charged blow go
 * now and then; a staff slashes, and holds for its spell with both of the pair close. The room decides
 * everything else. On Hempen's ground (`hempenClear`) its ropes coming down on a friend are floors too,
 * and a friend hoisted close by is cut down (GRAB), as a plain player would.
 */
import { barnHunt } from '../src/shared/bossjobs';
import { hangmansWood } from '../src/shared/expedjob';
import { SPINE } from '../src/shared/hangwood';
import { expedRoom } from '../src/sim/expedroom';
import { ropeBlow } from '../src/sim/hempenbook';
import { HERO, SPELL, TICK, WEAPONS, CLASS_DODGES, guardOf, type WeaponId } from '../src/shared/tuning';
import { isDead } from '../src/sim/damage';
import { attackCovers } from '../src/sim/combat';
import { doorShut } from '../src/sim/doorwall';
import { newRun, runRoom } from '../src/sim/run';
import type { ArenaRoom } from '../src/sim/room';
import { NO_INTENT, isRound, type Enemy, type EnemyAttack, type Hero, type Intent } from '../src/sim/types';

export interface BossClear { secs: number; won: boolean; taken: number; staggers: number; blocks: number; dodges: number }

/** Is `h` on this attack's floor (a charge's whole lane, while it winds up)? */
export function onFloor(a: EnemyAttack, h: Hero, pad = 0.15): boolean {
  if (a.kind === 'charge' && a.t < a.windup) {
    const px = h.x - a.ox, py = h.y - a.oy, along = px * a.dx + py * a.dy, across = Math.abs(px * a.dy - py * a.dx);
    return along > -0.6 && along < a.range + 0.6 && across < a.radius + HERO.radius + pad;
  }
  return attackCovers(a, { ...h, x: h.x, y: h.y });
}

/** The way out of it: square off a lane or a sweep, straight out of a ring. */
function outOf(a: EnemyAttack, h: Hero): [number, number] {
  if (isRound(a.kind)) {
    const dx = h.x - a.cx, dy = h.y - a.cy, l = Math.hypot(dx, dy) || 1;
    return [dx / l, dy / l];
  }
  const px = h.x - a.ox, py = h.y - a.oy, side = px * a.dy - py * a.dx >= 0 ? 1 : -1;
  return [a.dy * side, -a.dx * side];
}

const fighter = (e: Enemy) => (e.kind === 'scrapper' || e.kind === 'butcher') && !isDead(e) && !e.escaped;

/** Fight `room` with these heroes (ids p0..) until every goblin's down or `most` seconds. */
export function fightBoss(room: ArenaRoom, kits: WeaponId[], most = 240, at = { x: room.map.hero.x, y: room.map.hero.y - 4 }): BossClear {
  room.dread = null;
  const hs = kits.map((k, i) => {
    const h = room.join('p' + i);
    Object.assign(h, { weapon: k, safeT: 0, x: at.x + (i - (kits.length - 1) / 2) * 1.2, y: at.y });
    return h;
  });
  const seq = new Map<string, Seq>();
  let taken = 0, staggers = 0, blocks = 0, dodges = 0, t = 0;
  for (; t < most / TICK; t++) {
    const foes = room.enemies.filter(fighter);
    if (!foes.length) break;
    for (const h of hs) {
      taken += h.maxHp - h.hp;
      h.hp = h.maxHp;
      if (h.act === 'down') Object.assign(h, { act: 'idle', actT: 0 });
      room.setIntent(h.id, think(room, h, foes, seq.get(h.id) ?? (seq.set(h.id, { a: 0, r: 0, g: 0, next: 0, hold: -1 }), seq.get(h.id)!)));
    }
    room.step();
    for (const ev of room.events) {
      if (ev.k === 'staggered') staggers++;
      if (ev.k === 'block' && !ev.more) blocks++;
      if (ev.k === 'dodge') dodges++;
    }
  }
  return { secs: +(t * TICK).toFixed(1), won: !room.enemies.some(fighter), taken, staggers, blocks, dodges };
}

type Seq = { a: number; r: number; g: number; next: number; hold: number };

/** Every boss floor showing now: its blows, and Hempen's ropes coming down (as the blows they'll be). */
function floors(foes: Enemy[], now: number): { e: Enemy; a: EnemyAttack }[] {
  const out: { e: Enemy; a: EnemyAttack }[] = [];
  for (const e of foes) {
    if (e.attack && e.attack.t >= (e.attack.tell ?? 0) && e.attack.t < e.attack.windup + 0.02) out.push({ e, a: e.attack });
    for (const r of e.boss?.ropes ?? []) {
      const a = ropeBlow(e, r);
      a.t = a.windup - (r.at - now);
      if (a.t >= (a.tell ?? 0)) out.push({ e, a });
    }
  }
  return out;
}

/** One hero's Intent this tick. */
function think(room: ArenaRoom, h: Hero, foes: Enemy[], s: Seq): Intent {
  const now = room.time, w = WEAPONS[h.weapon], dodger = CLASS_DODGES[w.cls], blocker = guardOf(w) === 'full';
  const d = (e: Enemy) => Math.hypot(e.x - h.x, e.y - h.y);
  const i: Intent = { ...NO_INTENT, attackSeq: s.a, rollSeq: s.r };
  // The floor first: any boss blow showing under me.
  const threats = floors(foes, now).filter((q) => onFloor(q.a, h));
  for (const { e, a } of threats) {
    const left = a.windup - a.t, [ox, oy] = outOf(a, h);
    (i.ax = e.x - h.x), (i.ay = e.y - h.y);
    if (!a.unblockable && blocker) return { ...i, block: true };
    // A dodger left it to the last moment: through it.
    if (dodger && left < w.dodge.iTo * 0.8 && h.act !== 'roll' && h.stamina >= w.dodge.stamina && !h.winded) return { ...i, mx: ox, my: oy, rollSeq: ++s.r };
    return { ...i, mx: ox, my: oy };
  }
  // A friend hoisted close by: cut them down.
  const hung = room.heroes.find((o) => o !== h && o.hoisted && Math.hypot(o.x - h.x, o.y - h.y) < 4);
  if (hung) {
    const dx = hung.x - h.x, dy = hung.y - h.y;
    return Math.hypot(dx, dy) <= 1.1 ? { ...i, grabSeq: ++s.g } : { ...i, mx: dx, my: dy };
  }
  // A target: anything open (staggered, its door down or swung aside), else the nearest from behind.
  const open = foes.filter((e) => !e.boss || !doorShut(e, now));
  const tgt = (open.length ? open : foes).reduce((a, b) => (d(b) < d(a) ? b : a));
  const reach = h.weapon === 'staff' ? 1.7 : h.weapon === 'sword' ? 1.4 : 1.05;
  let gx = tgt.x, gy = tgt.y;
  if (tgt.boss && doorShut(tgt, now)) (gx = tgt.x - tgt.fx * (tgt.radius + 0.7)), (gy = tgt.y - tgt.fy * (tgt.radius + 0.7));
  const gd = Math.hypot(gx - h.x, gy - h.y), td = d(tgt);
  // Go round wide of its front rather than through it.
  let mx = gx - h.x, my = gy - h.y;
  if (tgt.boss && doorShut(tgt, now) && ((h.x - tgt.x) * tgt.fx + (h.y - tgt.y) * tgt.fy) / (td || 1) > -0.2) (mx += -tgt.fy * 1.5), (my += tgt.fx * 1.5);
  (i.ax = tgt.x - h.x), (i.ay = tgt.y - h.y);
  if (gd > 0.35 && !(td <= reach && !(tgt.boss && doorShut(tgt, now) && ((h.x - tgt.x) * tgt.fx + (h.y - tgt.y) * tgt.fy) / (td || 1) > -0.2))) (i.mx = mx), (i.my = my);
  // Holding for a staff's spell, or a sword's charged blow.
  if (s.hold >= 0) {
    if (now - s.hold < (w.draw ?? 0.9) + 0.05) return { ...i, attack: true, mx: 0, my: 0 };
    s.hold = -1;
    return i;
  }
  if (td <= reach + 0.3 && now >= s.next && h.act !== 'roll') {
    s.a++;
    i.attackSeq = s.a;
    const both = foes.filter((e) => e.boss && d(e) < 2.6).length >= 2;
    if ((h.weapon === 'staff' && both && h.stamina >= SPELL.staff) || (h.weapon === 'sword' && s.a % 5 === 0)) (s.hold = now), (i.attack = true);
    s.next = now + (h.weapon === 'staff' ? 0.5 : h.weapon === 'sword' ? 0.4 : 0.22);
  }
  return i;
}

/** Hempen's ground in Hangman's Wood on day `day` with these kits: Hempen and its two snarers, the rest of the wood gone. */
export function hempenClear(day: number, kits: WeaponId[], most = 240): BossClear {
  const room = expedRoom(hangmansWood(day), kits.length), hm = room.enemies.find((e) => e.boss)!;
  room.enemies = room.enemies.filter((e) => e.pack === hm.pack);
  return fightBoss(room, kits, most, { x: SPINE.hempen.x - 1, y: SPINE.hempen.y + 4.5 });
}

/** The Doorkeepers' barn alone, on day `day`, with these kits. */
export function doorkeepersClear(day: number, kits: WeaponId[], most = 240): BossClear {
  const job = barnHunt(day, true), room = runRoom({ ...newRun(job), party: kits.length });
  return fightBoss(room, kits, most);
}
