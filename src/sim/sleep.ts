/**
 * Dozing on a big map: a goblin farther than SLEEP.wake from every hero holds where it stands and
 * isn't stepped at all (no thinking, moving, colliding, pushing or being looked at by bolts). The room
 * runs each tick on the awake ones only and puts the dozers back, in their places, after. Plain data
 * (`dozing` on the goblin), so a saved or handed-on room keeps it.
 */
import { SLEEP } from '../shared/tuning';
import type { Enemy, Hero } from './types';

/** Mark who dozes this tick and return the awake ones (in the room's order). `at`: the room's own distances (an instance's area). */
export function awake(all: Enemy[], heroes: Hero[], at: { wake: number; doze: number } = SLEEP): Enemy[] {
  const out: Enemy[] = [], w2 = at.wake * at.wake, d2 = at.doze * at.doze;
  for (const e of all) {
    // A guard driving prisoners never dozes: the line walks only while it's driven (sim/scenes.ts), and a dozing one would read as dead.
    if (e.task?.k === 'escort') {
      e.dozing = false;
      out.push(e);
      continue;
    }
    let near = Infinity;
    for (const h of heroes) {
      const dx = h.x - e.x, dy = h.y - e.y, q = dx * dx + dy * dy;
      if (q < near) near = q;
    }
    // Inside `wake` it wakes; past `doze` it dozes; in between it keeps what it was.
    e.dozing = e.dozing ? near > w2 : near > d2;
    if (!e.dozing) out.push(e);
  }
  return out;
}

/** After the tick: every goblin back in the room's order, with anything new that came in this tick. */
export function merge(all: Enemy[], stepped: Enemy[]): Enemy[] {
  const now = new Set(stepped), had = new Set(all), out: Enemy[] = [];
  for (const e of all) if (e.dozing || now.has(e)) out.push(e);
  for (const e of stepped) if (!had.has(e)) out.push(e);
  return out;
}
