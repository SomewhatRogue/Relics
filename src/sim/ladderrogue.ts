/**
 * The Rogue's movement ladder, the dash (numbers: shared/ladder.ts). CALTROPS: a dash drops a patch
 * where it began (a zone, judged and drawn at one size), slowing and bleeding goblins on it. THROUGH THE
 * LEGS: dash through a goblin and the next hit soon after counts as from behind. SHAKE IT OFF: a dash
 * clears poison, and fire underfoot can't burn you a moment after.
 */
import { SKEWER, WEAPONS } from '../shared/tuning';
import { CALTROPS, LEGS, SHAKE_OFF, knowsRung } from '../shared/ladder';
import { isDead, isDummy } from './damage';
import { cure } from './poison';
import { bleeding } from './venom';
import type { World } from './elements';
import type { Enemy, FightEvent, Hero, Zone } from './types';

const isRogue = (h: Hero) => WEAPONS[h.weapon]?.cls === 'ROGUE';
const onFoot = (e: Enemy) => !isDead(e) && !isDummy(e) && e.kind !== 'nest' && (e.z ?? 0) === 0;

/** A dash begins: caltrops where it began (when they're ready), and poison shaken off. */
export function dashStart(h: Hero, zones: Zone[], w: World): void {
  if (!isRogue(h)) return;
  if (knowsRung(h, 'shakeoff')) {
    h.fireproofUntil = w.now + SHAKE_OFF.fireproof;
    if (cure(h, true, [])) w.ev.push({ k: 'shakeoff', x: h.x, y: h.y });
  }
  if (!knowsRung(h, 'caltrops') || w.now < (h.caltropReady ?? 0)) return;
  h.caltropReady = w.now + CALTROPS.every;
  const mine = zones.filter((z) => z.kind === 'caltrops' && z.owner === h.id);
  if (mine.length >= CALTROPS.most) zones.splice(zones.indexOf(mine[0]), 1);
  zones.push({ kind: 'caltrops', x: h.rollX, y: h.rollY, r: CALTROPS.r, at: w.now, until: w.now + CALTROPS.life, next: 0, owner: h.id, el: '' });
  w.ev.push({ k: 'caltrops', x: h.rollX, y: h.rollY, r: CALTROPS.r });
}

/** Mid-dash, from (px, py) to where the Rogue is now: through a goblin's legs (once a dash). */
export function dashThrough(h: Hero, px: number, py: number, enemies: Enemy[], now: number, ev: FightEvent[]): void {
  if (!isRogue(h) || !knowsRung(h, 'underlegs') || (h.legsUntil ?? -9) > h.lastRollAt + LEGS.within - 1e-6) return;
  const sx = h.x - px, sy = h.y - py, l2 = sx * sx + sy * sy || 1e-9;
  for (const e of enemies) {
    if (!onFoot(e)) continue;
    // The nearest point of this tick's stretch of the dash to the goblin.
    const t = Math.max(0, Math.min(1, ((e.x - px) * sx + (e.y - py) * sy) / l2));
    if (Math.hypot(px + sx * t - e.x, py + sy * t - e.y) > e.radius) continue;
    h.legsUntil = h.lastRollAt + LEGS.within;
    return void ev.push({ k: 'underlegs', x: e.x, y: e.y });
  }
}

/** THROUGH THE LEGS: this hit is the one that counts as a backstab (spent on it). `mark`: a blade's, so
 *  the room's backstab techniques know it (sim/techrogue.ts rogueStruck); a thrown one calls them itself. */
export function legStab(h: Hero, e: Enemy, now: number, ev: FightEvent[], mark = true): boolean {
  if ((h.legsUntil ?? -9) <= now) return false;
  h.legsUntil = -9;
  if (mark) h.legsStab = e.id;
  ev.push({ k: 'legstab', x: e.x, y: e.y });
  return true;
}

/** SHAKE IT OFF: fire underfoot doesn't burn this hero now. */
export const fireproof = (h: Hero, now: number) => (h.fireproofUntil ?? -9) > now;

/** The caltrops, each tick: goblins on them slowed and bleeding. */
export function stepCaltrops(zones: Zone[], w: World): void {
  for (const z of zones) {
    if (z.kind !== 'caltrops' || w.now >= z.until) continue;
    for (const e of w.enemies) {
      if (!onFoot(e) || Math.hypot(e.x - z.x, e.y - z.y) > z.r + e.radius * 0.5) continue;
      if ((e.caltropUntil ?? -9) <= w.now) w.ev.push({ k: 'caltrops', x: e.x, y: e.y });
      e.caltropUntil = w.now + 0.25;
      if (!bleeding(e, w.now)) e.bleedNext = w.now + SKEWER.every;
      e.bleedUntil = Math.max(e.bleedUntil ?? 0, w.now + CALTROPS.bleed);
      e.lastBy = z.owner;
    }
  }
}
