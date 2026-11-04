/**
 * False prisoners (Kyle, 2026-11-04): now and then what's in a cage out in the open isn't a captive at
 * all. It stands up like one, lurches, and tears open from inside, and two goblins come out of it,
 * cackling; they hold a beat so it reads, then go for you. Rolled on the room's own cage stream as the
 * cage breaks, so the leader's room decides and every friend sees what it sends.
 *
 * Never in a house: the cry at a house's woodpile always means someone real (the story bible), so only
 * an outdoor job room has the stream (ArenaRoom.falseCages). A false one never counts as freed, for or
 * against: the goal, the marks and the way-finding leave it out (survivors.ts `waiting`).
 */
import { collide } from '../shared/arena';
import { FALSE_CAGE } from '../shared/tuning';
import type { Rng } from '../shared/rng';
import type { Enemy, FightEvent, Survivor } from './types';

/** A cage broke: is what's in it false? Only where the room has a cage stream (one roll a cage). */
export const rollFalse = (rng: Rng | undefined) => !!rng && rng.next() < FALSE_CAGE.chance;

/** A false prisoner (standing, or already torn open). */
export const isFalse = (s: Survivor) => s.tearAt !== undefined;

/** Each tick: a false one whose time has come tears open, and its goblins come out held a beat. */
export function stepFalse(list: Survivor[], now: number, ev: FightEvent[], spawn: (x: number, y: number) => Enemy): void {
  for (const s of list) {
    if (s.gone || s.tearAt === undefined || now < s.tearAt) continue;
    Object.assign(s, { gone: true, dead: true, deadAt: now, moving: false });
    ev.push({ k: 'torn', x: s.x, y: s.y });
    for (let i = 0; i < FALSE_CAGE.goblins; i++) {
      // Out either side of where it stood, shoved apart, already knowing you're there.
      const side = i % 2 ? 1 : -1, e = spawn(s.x + side * FALSE_CAGE.spread, s.y + 0.1);
      Object.assign(e, { alert: true, act: 'flinch', actT: 0, actDur: FALSE_CAGE.beat, cooldown: 0, fx: side, fy: 0, kvx: side * 2, kvy: 0 });
      collide(e, e.radius);
      ev.push({ k: 'spotted', x: e.x, y: e.y });
    }
  }
}
