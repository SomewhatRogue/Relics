/**
 * The Mage's movement ladder, the blink (numbers: shared/ladder.ts). BLINK BURST: a burst of the element
 * the Mage is in, round where they blinked from, judged at once and drawn at that size (a zone the
 * client paints). BLINK THROUGH: a blink at a goblin goes through it and comes out at its back. PERFECT
 * BLINK: a blink just after a PERFECT hold costs half.
 */
import { HERO, TICK, WEAPONS } from '../shared/tuning';
import { BLINK_BURST, BLINK_THROUGH, HALF_BLINK, knowsRung } from '../shared/ladder';
import { castElement } from './channel';
import { damage, isDead, isDummy } from './damage';
import { afflict, chill, type World } from './elements';
import { dodgeReach } from './knacks';
import type { Enemy, FightEvent, Hero, Zone } from './types';

const isMage = (h: Hero) => WEAPONS[h.weapon]?.cls === 'MAGE';

/** What a blink costs now: PERFECT BLINK halves it just after a PERFECT (and says so). */
export function blinkCost(h: Hero, now: number, ev?: FightEvent[]): number {
  if (!isMage(h) || !knowsRung(h, 'halfblink') || now - (h.perfectAt ?? -99) > HALF_BLINK.within) return 1;
  if (ev) ev.push({ k: 'halfblink', x: h.x, y: h.y });
  return HALF_BLINK.cost;
}

/** BLINK BURST: everything within reach of where the Mage stood takes the burst and the element. */
export function blinkBurst(h: Hero, zones: Zone[], w: World): void {
  if (!isMage(h) || !knowsRung(h, 'blinkburst')) return;
  const el = castElement(h), x = h.rollX, y = h.rollY;
  zones.push({ kind: 'blinkburst', x, y, r: BLINK_BURST.r, at: w.now, until: w.now + BLINK_BURST.show, next: 0, owner: h.id, el });
  w.ev.push({ k: 'blinkburst', x, y, r: BLINK_BURST.r, el });
  for (const e of w.enemies) {
    if (isDead(e) || isDummy(e) || e.kind === 'nest' || (e.z ?? 0) !== (h.z ?? 0) || Math.hypot(e.x - x, e.y - y) > BLINK_BURST.r + e.radius) continue;
    e.lastBy = h.id;
    if (damage(e, BLINK_BURST.dmg, w.now, w.ev, { el, how: 'burst', dx: e.x - x, dy: e.y - y })) continue;
    // Frost only chills (a burst is a tap's size); storm hits and stops there.
    if (el === 'frost') chill(w, e);
    else afflict(w, e, el, BLINK_BURST.dmg);
  }
}

/**
 * BLINK THROUGH, as the blink starts: the nearest goblin on its line within its reach is gone through,
 * the blink running on to just past its back (a little further than its own reach at most).
 */
export function blinkThrough(h: Hero, enemies: Enemy[]): void {
  h.throughId = undefined;
  if (!isMage(h) || !knowsRung(h, 'blinkthrough')) return;
  const reach = dodgeReach(h), dx = h.rollDx, dy = h.rollDy;
  let best: Enemy | null = null, along = Infinity;
  for (const e of enemies) {
    if (isDead(e) || isDummy(e) || e.kind === 'nest' || (e.z ?? 0) !== (h.z ?? 0)) continue;
    const ex = e.x - h.x, ey = e.y - h.y, a = ex * dx + ey * dy, off = Math.abs(ex * dy - ey * dx);
    if (a <= 0.2 || a - e.radius > reach || off > e.radius + BLINK_THROUGH.aim || a >= along) continue;
    (best = e), (along = a);
  }
  if (!best) return;
  // (A dodge runs whole ticks, so it goes a touch past its time: the reach is set so it stops just there.)
  const time = WEAPONS[h.weapon].dodge.time, ticks = Math.ceil(time / TICK - 1e-6) * TICK;
  h.rollReach = (Math.min(reach + BLINK_THROUGH.extra, along + best.radius + HERO.radius + BLINK_THROUGH.gap) * time) / ticks;
  h.throughId = best.id;
}

/** Out the far side: turned to face the goblin's back. */
export function cameThrough(h: Hero, enemies: Enemy[], ev: FightEvent[]): void {
  const e = h.throughId !== undefined ? enemies.find((o) => o.id === h.throughId) : undefined;
  h.throughId = undefined;
  if (!e || isDead(e)) return;
  const dx = e.x - h.x, dy = e.y - h.y, l = Math.hypot(dx, dy) || 1;
  (h.fx = dx / l), (h.fy = dy / l);
  ev.push({ k: 'blinkthrough', x: h.x, y: h.y, x2: e.x, y2: e.y });
}
