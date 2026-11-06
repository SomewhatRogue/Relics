/**
 * Hangman's Wood's snares (numbers: shared/hangtune.ts SNARER, HOIST). The snarer lays ankle snares on
 * the ground in front of whoever it's after: each a faint striped mark (walk round it; nothing to block),
 * live a moment after it's down. Step in one and you're hoisted by the ankle: held, as in a netter's net
 * (sim/netter.ts keeps you held), but there's no struggling out of a snare: HOIST.hold seconds, or a friend's
 * GRAB by you (CUT FREE) cuts you down at once. Left to drop, you land hurt. Hempen's noose hoists the same.
 * The snares are the room's (`nooses`): plain data a friend's screen gets in the usual patch, only when one
 * is laid or sprung.
 */
import { HOIST, SNARER } from '../shared/tuning';
import { walk } from './enemies';
import type { Enemy, FightEvent, Hero } from './types';

/** `keep`: laid before you came (the snare line), never rotting away. */
export interface Noose { id: number; x: number; y: number; at: number; by: number; keep?: boolean }

/** Laid: a snarer's oldest goes once it has SNARER.max out. */
export function layNoose(list: Noose[], x: number, y: number, now: number, by: number): void {
  const mine = list.filter((n) => n.by === by);
  if (mine.length >= SNARER.max) list.splice(list.indexOf(mine[0]), 1);
  // (Its id from when and who: the same on every run of the same fight.)
  list.push({ id: Math.round(now * 100) * 1000 + (by % 1000), x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, at: now, by });
}

/** Hoisted by the ankle: held HOIST.hold seconds, no struggling out of it. */
export function hoist(h: Hero, now: number, ev: FightEvent[]): void {
  Object.assign(h, { netUntil: now + HOIST.hold, netAng: undefined, hoisted: true, act: 'stun', actT: 0, actDur: HOIST.hold, kvx: 0, kvy: 0 });
  ev.push({ k: 'hoisted', x: h.x, y: h.y, id: h.id });
}

const live = (n: Noose, now: number) => now - n.at >= SNARER.arm && (n.keep || now - n.at < SNARER.life);

/** Each tick: a hero stepping into a live snare is hoisted and the snare is sprung; old ones rot away. */
export function stepNooses(list: Noose[], heroes: Hero[], now: number, ev: FightEvent[]): Noose[] {
  return list.filter((n) => {
    if (!n.keep && now - n.at >= SNARER.life) return false;
    if (!live(n, now)) return true;
    const h = heroes.find((o) => o.id !== 'squire' && o.act !== 'down' && o.act !== 'roll' && !o.out && (o.z ?? 0) === 0 && !o.hoisted && Math.hypot(o.x - n.x, o.y - n.y) <= SNARER.r + 0.15);
    if (!h) return true;
    hoist(h, now, ev);
    return false;
  });
}

/** The snarer's turn once it's seen you: lay a snare in your way when it's time, else keep its distance. */
export function stepSnarer(e: Enemy, t: Hero, d: number, ux: number, uy: number, facing: number, speed: number, now: number, dt: number, ev: FightEvent[], list: Noose[]): void {
  if (e.cooldown <= 0 && d <= 8 && now - (e.snareAt ?? -99) >= SNARER.every) {
    // Between you and it, a step in front of you: walk at it and you're in it.
    const l = Math.max(0.01, d), x = t.x - (ux * SNARER.ahead * d) / l, y = t.y - (uy * SNARER.ahead * d) / l;
    // Kneeling to it a moment (stood still, its blows put off): the snare is its telegraph.
    Object.assign(e, { fx: ux, fy: uy, act: 'stunned', actT: 0, actDur: SNARER.set.windup, cooldown: SNARER.set.windup + SNARER.set.recover, snareAt: now });
    layNoose(list, x, y, now, e.id);
    return void ev.push({ k: 'snarelaid', x, y });
  }
  if (d < SNARER.keep) {
    const side = Math.sin(now * 0.7 + e.id) > 0 ? 1 : -1;
    return walk(e, -ux - uy * side * 0.6, -uy + ux * side * 0.6, speed * SNARER.flee, dt);
  }
  if (d > SNARER.keep + 2.5) walk(e, ux, uy, speed * Math.max(0.2, facing) * 0.8, dt);
}
