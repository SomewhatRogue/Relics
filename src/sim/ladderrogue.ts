/**
 * The Rogue's movement ladder, the dash (numbers: shared/ladder.ts). CALTROPS: a dash drops a patch
 * where it began (a zone, judged and drawn at one size), slowing and bleeding goblins on it. SHADOW
 * SMOKE (the rung still called 'underlegs' in saves): the dash's shadow bursts into smoke as it fades. SHAKE IT OFF: a dash
 * clears poison, and fire underfoot can't burn you a moment after.
 */
import { afoot } from './afoot';
import { SKEWER, WEAPONS } from '../shared/tuning';
import { CALTROPS, SHADOW_SMOKE, SHAKE_OFF, knowsRung } from '../shared/ladder';
import { isDead, isDummy } from './damage';
import { cure } from './poison';
import { bleeding } from './venom';
import type { World } from './elements';
import type { Smoke } from './flasks';
import type { Enemy, FightEvent, Hero, Zone } from './types';

const isRogue = (h: Hero) => WEAPONS[h.weapon]?.cls === 'ROGUE';
const onFoot = (e: Enemy) => !isDead(e) && !isDummy(e) && e.kind !== 'nest' && afoot(e);

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

/** SHADOW SMOKE: a Rogue's shadow (the dash's decoy) gone, it bursts into smoke where it stood. Once a shadow. */
export function shadowSmoke(h: Hero, smokes: Smoke[], now: number, ev: FightEvent[]): void {
  if (!isRogue(h) || !knowsRung(h, 'underlegs')) return;
  if (h.decoyUntil > now) return void (h.shadowSmoke = h.decoyUntil);
  if (h.shadowSmoke === undefined || h.shadowSmoke > now) return;
  h.shadowSmoke = undefined;
  smokes.push({ x: h.decoyX, y: h.decoyY, until: now + SHADOW_SMOKE.time, r: SHADOW_SMOKE.r });
  ev.push({ k: 'vanish', x: h.decoyX, y: h.decoyY });
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
