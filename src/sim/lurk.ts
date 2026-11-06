/**
 * Goblins lying in Fenmere's reeds (numbers: shared/fentune.ts LURK): crouched in the water with nothing
 * showing but their eyes. A hero within LURK.spring, a blow on one, or its pack waking (a pack mate seeing
 * you, a fight near) springs it, and every lurker of its pack with it: they stand up out of the reeds
 * together over LURK.rise seconds, doing nothing that lands until they're up, then fight as any goblin.
 * The rise is one room time on the task (`up`), set once, so a friend's screen draws the same stand-up and
 * nothing is sent while they lie there. From LURK.tell tiles the reeds round one shiver (client/fenlurk.ts).
 */
import { LURK } from '../shared/tuning';
import { samePack } from './packs';
import type { Enemy, FightEvent, Hero } from './types';

type Lurk = { k: 'lurk'; up?: number };
const up = (h: Hero) => h.id !== 'squire' && h.act !== 'down' && !h.out;

/** Still lying hidden in the reeds. */
export const lurking = (e: Pick<Enemy, 'task'>) => e.task?.k === 'lurk' && e.task.up === undefined;
/** Standing up out of them (0 to 1 of the way), or null. */
export function rising(e: Pick<Enemy, 'task'>, t: number): number | null {
  const k = e.task;
  if (k?.k !== 'lurk' || k.up === undefined || k.up === -1 || t >= k.up) return null;
  return Math.max(0, Math.min(1, 1 - (k.up - t) / LURK.rise));
}

/** Its turn (true: nothing else for it this tick). */
export function stepLurk(e: Enemy, heroes: Hero[], others: Enemy[], now: number, ev: FightEvent[]): boolean {
  const t = e.task as Lurk;
  if (t.up === -1) return false;
  if (t.up === undefined) {
    const near = heroes.some((h) => up(h) && Math.hypot(h.x - e.x, h.y - e.y) <= LURK.spring);
    if (!near && now - e.hitAt >= 0.3 && e.alert !== true) return (e.alert = false), true;
    const at = Math.round((now + LURK.rise) * 100) / 100;
    for (const o of [e, ...others]) {
      if (o !== e && !(samePack(o, e) && lurking(o))) continue;
      (o.task as Lurk).up = at;
      Object.assign(o, { alert: true, feeding: false });
    }
    ev.push({ k: 'lurkrise', x: e.x, y: e.y });
    return true;
  }
  if (now < t.up) {
    // Up out of the water, turning to the nearest of you.
    const h = heroes.filter(up).sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y))[0];
    if (h) {
      const l = Math.hypot(h.x - e.x, h.y - e.y) || 1;
      (e.fx = (h.x - e.x) / l), (e.fy = (h.y - e.y) / l);
    }
    return true;
  }
  t.up = -1;
  return false;
}
