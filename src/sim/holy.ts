/**
 * A Cleric's light on friends: mending those near a spot, and the holy shield every Cleric perfect gives
 * (shared/cleric.ts HOLY_SHIELD). The shield soaks damage until it's spent or its time is up, and it's
 * on the hero, so a guest's screen draws it from the room's own state.
 */
import { HOLY_SHIELD, HERO, technique } from '../shared/tuning';
import { heals } from './hungry';
import { healMult } from './lantern';
import { cure } from './poison';
import type { World } from './elements';
import type { Bolt, FightEvent, Hero } from './types';

/** Friends standing, within `r` of (x, y) (the squire too: a training partner to heal). */
export const friendsNear = (heroes: Hero[], x: number, y: number, r: number) => heroes.filter((o) => o.act !== 'down' && Math.hypot(o.x - x, o.y - y) <= r + HERO.radius);

/** `by` mends `o` by `n` (grown by the censer's coals and the healer's training, as every heal); it draws a stack of poison. */
export function mend(by: Hero | undefined, o: Hero, n: number, ev: FightEvent[]): void {
  cure(o, false, ev);
  const got = Math.min(o.maxHp - o.hp, Math.round(heals(o, by, n * healMult(by) * (1 + (by ? technique(by.drills, 'HEALER') : 0)))));
  if (got <= 0) return;
  o.hp += got;
  ev.push({ k: 'heal', x: o.x, y: o.y, n: got });
}

/** A holy shield on `o`: soaks HOLY_SHIELD.hp, lasts HOLY_SHIELD.time; a fresh one tops up an old one. */
export function shield(o: Hero, now: number, ev: FightEvent[]): void {
  if (o.act === 'down') return;
  o.shieldUntil = now + HOLY_SHIELD.time;
  o.shieldHp = HOLY_SHIELD.hp;
  ev.push({ k: 'holyshield', x: o.x, y: o.y });
}

/** Shield the Cleric and every friend near them (the censer's and flail's perfects; `heroes` holds the Cleric). */
export function shieldNear(h: Hero, heroes: Hero[], r: number, now: number, ev: FightEvent[]): void {
  for (const o of friendsNear(heroes, h.x, h.y, r)) shield(o, now, ev);
}

/** A blow of `n` lands on `o`: what's left after the shield soaks its share. */
export function soak(o: Hero, n: number, now: number, ev: FightEvent[]): number {
  if (!o.shieldHp || (o.shieldUntil ?? 0) <= now || n <= 0) return n;
  const took = Math.min(o.shieldHp, n);
  o.shieldHp -= took;
  ev.push({ k: o.shieldHp > 0 ? 'shieldsoak' : 'shieldgone', x: o.x, y: o.y });
  if (o.shieldHp <= 0) (o.shieldHp = 0), (o.shieldUntil = -9);
  return n - took;
}

/** True while `o` carries a holy shield. */
export const shielded = (o: Hero, now: number) => (o.shieldHp ?? 0) > 0 && (o.shieldUntil ?? 0) > now;

/** A mace's smite has fallen at (x, y): its light mends every friend in the burst; let go on the flash
 *  (`holy`) it shields them and the Cleric who called it down. */
export function smiteLight(w: World, b: Bolt, x: number, y: number): void {
  const by = w.heroes.find((o) => o.id === b.owner), near = friendsNear(w.heroes, x, y, b.burst);
  if (b.heal) for (const o of near) mend(by, o, b.heal, w.ev);
  if (!b.holy) return;
  w.ev.push({ k: 'holysmite', x, y });
  for (const o of new Set([...near, ...(by ? [by] : [])])) shield(o, w.now, w.ev);
}
