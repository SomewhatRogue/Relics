/**
 * The dropper (numbers: shared/hangtune.ts DROPPER): a goblin up in the branches over a path (a perch task
 * and level 1, out of reach of a blade below; an arrow may still find it). When a hero comes within
 * DROPPER.sense it swings down on its rope onto the spot they stood on: a shadow circle with a striped edge
 * (nothing blocks a body from above; walk out of it), DROPPER.fall seconds, then it lands, hurting and
 * knocking whoever's still under it, and it's a goblin on the ground like the rest. The perch is plain data
 * on the goblin's task (`at`, `tx`, `ty`; `at` -1 once down), so a friend's screen draws the same circle.
 */
import { DROPPER } from '../shared/tuning';
import { downIfDead } from './combat';
import { count } from './score';
import type { Enemy, FightEvent, Hero } from './types';

const up = (h: Hero) => h.id !== 'squire' && h.act !== 'down' && !h.out && (h.z ?? 0) === 0;

/** A blow from the world on a hero (no blocking it): a roll gets out from under, as from any blow. */
export function strike(h: Hero, n: number, x: number, y: number, knock: number, ev: FightEvent[], src: string): void {
  if (!up(h) || h.act === 'roll' || h.safeT) return;
  const dx = h.x - x, dy = h.y - y, l = Math.hypot(dx, dy) || 1;
  h.hp -= n;
  count(h.id, 'taken', n);
  ev.push({ k: 'hit', x: h.x, y: h.y, n, heavy: n >= 12, on: 'hero', src });
  (h.kvx += (dx / l) * knock), (h.kvy += (dy / l) * knock);
  downIfDead(h, ev);
}

/** Its perch's turn (true: nothing else for it this tick). */
export function stepPerch(e: Enemy, heroes: Hero[], now: number, ev: FightEvent[]): boolean {
  const t = e.task;
  if (t?.k !== 'perch' || t.at === -1) return false;
  if (t.at === undefined) {
    const h = heroes.find((o) => up(o) && Math.hypot(o.x - e.x, o.y - e.y) <= DROPPER.sense);
    if (!h) return true;
    Object.assign(t, { at: Math.round((now + DROPPER.fall) * 100) / 100, tx: Math.round(h.x * 100) / 100, ty: Math.round(h.y * 100) / 100 });
    ev.push({ k: 'perchdrop', x: h.x, y: h.y });
    return true;
  }
  if (now < t.at) return true;
  // Down: on the spot, hurting whoever didn't get out from under it, and a moment getting up.
  const x = t.tx ?? e.x, y = t.ty ?? e.y;
  t.at = -1;
  Object.assign(e, { x, y, z: 0, alert: true, feeding: false, attack: null, act: 'stunned', actT: 0, actDur: DROPPER.stun, kvx: 0, kvy: 0 });
  for (const h of heroes) if (Math.hypot(h.x - x, h.y - y) <= DROPPER.r) strike(h, DROPPER.dmg, x, y, DROPPER.knock, ev, 'dropper');
  ev.push({ k: 'perchland', x, y });
  return true;
}
