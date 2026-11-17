/**
 * The Mage's movement ladder, the blink (numbers: shared/ladder.ts). BLINK BURST: a burst of the element
 * the Mage is in, round where they blinked from, judged at once and drawn at that size (a zone the
 * client paints). RECALL: a dodge press soon after snaps you back to where the blink began. PERFECT
 * BLINK: a blink just after a PERFECT hold costs half.
 */
import { WEAPONS } from '../shared/tuning';
import { BLINK_BURST, HALF_BLINK, RECALL, knowsRung } from '../shared/ladder';
import { castElement } from './channel';
import { damage, isDead, isDummy } from './damage';
import { afflict, chill, type World } from './elements';
import type { FightEvent, Hero, Zone } from './types';

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

/** RECALL, as a blink starts: where it began is kept, to snap back to (sim/hero.ts recall). */
export function markRecall(h: Hero, now: number): void {
  if (!isMage(h) || !knowsRung(h, 'blinkthrough')) return;
  h.recall = { x: h.rollX, y: h.rollY, z: h.z ?? 0, until: now + RECALL.window };
}

/** RECALL: a dodge pressed within its window, once the blink's done: back where it began, at once, for nothing. */
export function recall(h: Hero, now: number, ev: FightEvent[]): boolean {
  const r = h.recall;
  if (!r || now >= r.until || h.act === 'roll' || h.act === 'down') return false;
  h.recall = undefined;
  ev.push({ k: 'recall', x: r.x, y: r.y, x2: h.x, y2: h.y });
  Object.assign(h, { x: r.x, y: r.y, z: r.z, kvx: 0, kvy: 0, act: 'idle', actT: 0, safeT: Math.max(h.safeT ?? 0, RECALL.safe), rollQueuedAt: -9 });
  return true;
}
