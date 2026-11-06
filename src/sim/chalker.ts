/**
 * The chalker (numbers: shared/chalk.ts CHALKER). It hangs back behind its pack and chalks strokes on one
 * hero: a stroke every CHALKER.every seconds of seeing them (the clock stands still while it can't). The
 * strokes are the hero's (`chalk`), so every screen draws them over that hero. At the fifth, every goblin
 * of its pack near that hero turns on them for CHALKER.turn seconds (`turnedOn`), and their blows on them
 * land CHALKER.dmg as hard; then the chalk is spent. Killing it stops new strokes; Vanish, smoke and
 * blessed ground wipe them, and end a turn already on. No dice: what it does is the clock and who it sees.
 */
import { CHALKER } from '../shared/tuning';
import { isDead } from './damage';
import { begin, walk } from './enemies';
import { visible } from './flasks';
import { samePack } from './packs';
import { vanished } from './rogue';
import { smokeBlind } from './smokebomb';
import type { Enemy, FightEvent, Hero } from './types';

const chalker = (e: Enemy) => e.variant === 'chalker';
export const chalkedNow = (h: Hero, now: number) => (h.chalkedUntil ?? -9) > now;

/** Can it see `h` to chalk them? */
function sees(e: Enemy, h: Hero, now: number): boolean {
  const d = Math.hypot(h.x - e.x, h.y - e.y);
  return h.act !== 'down' && d <= CHALKER.sight && visible(h, d, now) && !vanished(h, now) && !smokeBlind(e, d, now);
}

/** The fifth stroke: its pack near that hero turns on them. */
function turn(e: Enemy, q: Hero, others: Enemy[], now: number, ev: FightEvent[]): void {
  q.chalkedUntil = now + CHALKER.turn;
  for (const o of others) {
    if (isDead(o) || (o.kind !== 'scrapper' && o.kind !== 'butcher') || !samePack(o, e) || Math.hypot(o.x - q.x, o.y - q.y) > CHALKER.pack) continue;
    Object.assign(o, { turnedOn: q.id, turnedUntil: now + CHALKER.turn, alert: true });
  }
  // It rests its chalk while they go at it.
  Object.assign(e, { quarry: '', chalkT: -CHALKER.turn });
  ev.push({ k: 'chalked', x: q.x, y: q.y, on: q.id });
}

/** Its chalk at work on its quarry (picked as the nearest it sees, kept till the strokes are spent). */
function chalkOn(e: Enemy, t: Hero, heroes: Hero[], others: Enemy[], now: number, dt: number, ev: FightEvent[]): void {
  e.chalkT = (e.chalkT ?? 0) + (e.chalkT !== undefined && e.chalkT < 0 ? dt : 0);
  if ((e.chalkT ?? 0) < 0) return;
  let q = heroes.find((h) => h.id === e.quarry);
  if (!q || q.act === 'down' || chalkedNow(q, now)) (q = t), (e.quarry = t.id), (e.chalkT = 0);
  if (chalkedNow(q, now) || !sees(e, q, now)) return;
  e.chalkT += dt;
  if (e.chalkT < ((q.chalk ?? 0) ? CHALKER.every : CHALKER.first)) return;
  e.chalkT = 0;
  q.chalk = Math.min(CHALKER.five, (q.chalk ?? 0) + 1);
  q.chalkAt = e.chalkAt = now;
  ev.push({ k: 'chalk', x: q.x, y: q.y, n: q.chalk, on: q.id });
  if (q.chalk >= CHALKER.five) turn(e, q, others, now, ev);
}

/**
 * Its turn (like a banner-bearer's): cornered, a jab with the chalk hand; too close, it runs; otherwise
 * it keeps behind its pack and chalks.
 */
export function stepChalker(e: Enemy, t: Hero, d: number, ux: number, uy: number, facing: number, speed: number, heroes: Hero[], others: Enemy[], now: number, dt: number, ev: FightEvent[]): void {
  if (d <= CHALKER.poke.range! && e.cooldown <= 0 && facing > 0.75) return begin(e, 'stab', CHALKER.poke, t, ev);
  chalkOn(e, t, heroes, others, now, dt, ev);
  if (d < CHALKER.keep) {
    const side = Math.sin(now * 0.7 + e.id) > 0 ? 1 : -1;
    return walk(e, -ux - uy * side * 0.6, -uy + ux * side * 0.6, speed * CHALKER.flee, dt);
  }
  let px = 0, py = 0, n = 0;
  for (const o of others) {
    if (o === e || isDead(o) || o.alert === false || o.bow || chalker(o) || !samePack(o, e) || (o.z ?? 0) !== (e.z ?? 0) || Math.hypot(o.x - e.x, o.y - e.y) > CHALKER.pack) continue;
    (px += o.x), (py += o.y), n++;
  }
  // Behind its pack, or out of the hero's reach and still in sight of them.
  const back = n ? CHALKER.behind : CHALKER.keep + 1.5, gx = (n ? px / n : t.x) - ux * back, gy = (n ? py / n : t.y) - uy * back;
  const gd = Math.hypot(gx - e.x, gy - e.y);
  if (gd > 0.8) walk(e, gx - e.x, gy - e.y, speed * Math.min(1, gd / 2), dt);
  else (e.fx = ux), (e.fy = uy);
}

/** Wipe the strokes on `h` (Vanish, smoke, blessed ground), and call off a turn already on them. */
export function wipeChalk(h: Hero, enemies: Enemy[], now: number, ev: FightEvent[]): void {
  if (!(h.chalk ?? 0) && !chalkedNow(h, now)) return;
  Object.assign(h, { chalk: 0, chalkedUntil: -9 });
  for (const e of enemies) {
    if (e.turnedOn === h.id) Object.assign(e, { turnedOn: '', turnedUntil: -9 });
    // A chalker at them starts over.
    if (e.quarry === h.id && (e.chalkT ?? 0) > 0) e.chalkT = 0;
  }
  ev.push({ k: 'chalkwipe', x: h.x, y: h.y, on: h.id });
}

/** Once a tick, after the goblins move: strokes wiped by Vanish or smoke, spent after a turn, faded with no chalker at them. */
export function stepChalk(heroes: Hero[], enemies: Enemy[], now: number, ev: FightEvent[]): void {
  for (const h of heroes) {
    if (!(h.chalk ?? 0) && !chalkedNow(h, now)) continue;
    if (vanished(h, now) || h.hiddenUntil > now) wipeChalk(h, enemies, now, ev);
    else if ((h.chalk ?? 0) >= CHALKER.five && !chalkedNow(h, now)) h.chalk = 0;
    else if (!chalkedNow(h, now) && now - (h.chalkAt ?? -99) > CHALKER.linger && !enemies.some((e) => chalker(e) && !isDead(e) && e.quarry === h.id)) h.chalk = 0;
  }
}

/** A goblin turned on a hero by the chalk comes for them first (while it lasts and they're on their feet). */
export function chalkTarget(e: Enemy, heroes: Hero[], now: number): Hero | null {
  if (!e.turnedOn || (e.turnedUntil ?? -9) <= now) return null;
  const h = heroes.find((o) => o.id === e.turnedOn);
  return h && h.act !== 'down' && chalkedNow(h, now) && !vanished(h, now) ? h : null;
}

/** What a goblin's blow on `h` is multiplied by: CHALKER.dmg from one turned on them by the chalk. */
export const chalkTaken = (e: Enemy, h: Hero, now: number) => (e.turnedOn === h.id && (e.turnedUntil ?? -9) > now && chalkedNow(h, now) ? CHALKER.dmg : 1);
