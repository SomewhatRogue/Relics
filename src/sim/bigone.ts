/**
 * A BIG ONE (Kyle, 2026-11-05: "mini bosses also work. Things that require a few hits"; numbers
 * shared/threat.ts BIG): a brute or an ironhide grown big, fighting as its sort does with one move more.
 * The stomp: with a hero within BIG.stompFrom and its blow ready, every BIG.every seconds it stamps, a
 * striped ring round itself (walk or dodge out; nothing blocks it). Its body (bigger, heavier) is set as
 * it's made; its sure drop is the room's (sim/pickups.ts, sim/loot.ts).
 */
import { BIG } from '../shared/tuning';
import { begin } from './enemies';
import type { Enemy, FightEvent, Hero } from './types';

/** A BIG ONE's body: bigger and heavier than its sort's. */
export function shapeBig(e: Enemy): void {
  if (!e.big) return;
  e.radius = +(e.radius * BIG.size).toFixed(3);
  e.weight = +(e.weight * BIG.weight).toFixed(3);
}

/** Its stomp, when it's due (true: it's stamping). */
export function stomp(e: Enemy, t: Hero, d: number, level: boolean, now: number, ev: FightEvent[]): boolean {
  if (!e.big || !level || e.cooldown > 0 || d > BIG.stompFrom || now - (e.stompAt ?? -99) < BIG.every) return false;
  e.stompAt = now;
  begin(e, 'slam', BIG.stomp, t, ev);
  // Round itself, whichever way it faces.
  if (e.attack) (e.attack.cx = e.x), (e.attack.cy = e.y);
  return true;
}
