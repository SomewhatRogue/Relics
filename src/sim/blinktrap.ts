/**
 * A Mage's blink trap (Kyle, 2026-11-16: "mage blink to leave behind the selected element in a little
 * trap"): the trainer's lesson at level 5 (shared/drills.ts LEAVES). A blink leaves a small trap of the
 * Mage's element where they stood (a room zone of kind 'trap'), for `life` s (and LONG TRAP's more), at
 * most `max` of one Mage's at once, no sooner than every `cooldown` s. The first goblin to step in
 * springs it: everything within `burst` takes `dmg` and the element: fire burns, frost freezes solid,
 * storm stuns the small ones `stun` s. Friends never.
 */
import { BLINK_TRAP } from '../shared/tuning';
import { castElement } from './channel';
import { damage, frozen, isDead, small } from './damage';
import { afflict, chilled, type World } from './elements';
import { knack } from './gearstats';
import { stun } from './stuns';
import type { Enemy, Hero, Zone } from './types';

const live = (e: Enemy) => !isDead(e) && e.act !== 'carried';

/** A blink just begun: lay the trap where they stood, if they know the lesson and it's ready. */
export function layTrap(h: Hero, zones: Zone[], now: number, w: World): void {
  if (now < (h.trapReady ?? 0)) return;
  h.trapReady = now + BLINK_TRAP.cooldown;
  const mine = zones.filter((z) => z.kind === 'trap' && z.owner === h.id && now < z.until);
  if (mine.length >= BLINK_TRAP.max) zones.splice(zones.indexOf(mine[0]), 1);
  const el = castElement(h);
  zones.push({ kind: 'trap', x: h.x, y: h.y, r: BLINK_TRAP.r, at: now, until: now + BLINK_TRAP.life + knack(h, 'image'), next: 0, owner: h.id, el });
  w.ev.push({ k: 'snareset', x: h.x, y: h.y });
}

/** Each tick: a goblin in a trap springs it. */
export function stepTraps(zones: Zone[], w: World): void {
  for (const z of zones) {
    if (z.kind !== 'trap' || w.now >= z.until) continue;
    if (!w.enemies.some((e) => live(e) && Math.hypot(e.x - z.x, e.y - z.y) <= z.r + e.radius)) continue;
    z.until = w.now;
    w.ev.push({ k: 'spell', what: 'trap', x: z.x, y: z.y, dx: 0, dy: 0, r: BLINK_TRAP.burst, el: z.el, big: false });
    for (const e of w.enemies) {
      if (!live(e) || Math.hypot(e.x - z.x, e.y - z.y) > BLINK_TRAP.burst + e.radius) continue;
      e.lastBy = z.owner;
      if (z.el === 'frost') {
        afflict(w, e, 'frost', BLINK_TRAP.dmg);
        if (!frozen(e, w.now) && chilled(e, w.now)) afflict(w, e, 'frost', BLINK_TRAP.dmg);
      } else afflict(w, e, z.el, BLINK_TRAP.dmg);
      if (z.el === 'storm' && small(e)) stun(e, z.owner, w.now, BLINK_TRAP.stun, w.ev);
      damage(e, BLINK_TRAP.dmg, w.now, w.ev, { el: z.el || undefined, src: 'spark' });
    }
  }
}
