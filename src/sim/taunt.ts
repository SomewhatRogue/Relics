/**
 * The Warrior's TAUNT (numbers: shared/ladder.ts TAUNT), on the dodge button a Warrior has no dodge for:
 * the dodge press (Intent `rollSeq`, a counter, so a guest's press reaches the leader's room) roars when
 * it's ready. Goblins within reach come for the Warrior a while (sim/enemies.ts asks `tauntTarget`);
 * STAND FAST makes their blows softer and the Warrior unshakeable meanwhile; COWING ROAR staggers the
 * small ones. The roar's ring is a zone the client draws at the reach it was judged at.
 */
import { INPUT_BUFFER, WEAPONS } from '../shared/tuning';
import { TAUNT, knowsRung } from '../shared/ladder';
import { held, isDead, isDummy, small } from './damage';
import { stun } from './stuns';
import type { Enemy, FightEvent, Hero, Zone } from './types';

/** A Warrior with the TAUNT rung: the dodge button is the taunt. */
export const taunts = (h: Hero) => WEAPONS[h.weapon]?.cls === 'WARRIOR' && knowsRung(h, 'taunt');

/** Seconds till the taunt is ready again (0: ready). */
export const tauntLeft = (h: Hero, now: number) => Math.max(0, (h.tauntReady ?? 0) - now);

/** The dodge press, each tick: a Warrior on their feet roars when the taunt is ready (a press waits the
 *  input buffer for it, as a dodge's does). */
export function stepTaunt(h: Hero, enemies: Enemy[], zones: Zone[], now: number, ev: FightEvent[]): void {
  if (now - h.rollQueuedAt >= INPUT_BUFFER || !taunts(h)) return;
  if (h.act === 'down' || h.act === 'hurt' || h.act === 'stun' || tauntLeft(h, now) > 0) return;
  h.rollQueuedAt = -9;
  h.tauntReady = now + TAUNT.cooldown;
  h.tauntUntil = now + TAUNT.time;
  const soft = knowsRung(h, 'standfast'), cow = knowsRung(h, 'cowing');
  zones.push({ kind: 'taunt', x: h.x, y: h.y, r: TAUNT.reach, at: now, until: now + TAUNT.show, next: 0, owner: h.id, el: '' });
  ev.push({ k: 'taunt', x: h.x, y: h.y, r: TAUNT.reach });
  for (const e of enemies) {
    if (isDead(e) || isDummy(e) || e.kind === 'nest' || Math.hypot(e.x - h.x, e.y - h.y) > TAUNT.reach + e.radius) continue;
    Object.assign(e, { tauntBy: h.id, tauntUntil: now + TAUNT.time, tauntSoft: soft, alert: true, feeding: false });
    // COWING ROAR: the small ones stagger (once in the stun cap, as any stagger a hero causes).
    if (cow && small(e) && !held(e, now)) stun(e, h.id, now, TAUNT.stagger, ev, 'flinch');
    ev.push({ k: 'taunted', x: e.x, y: e.y });
  }
}

/** Who a taunted goblin goes for: its taunter, while it lasts and they're on their feet. */
export function tauntTarget(e: Enemy, heroes: Hero[], now: number): Hero | null {
  if ((e.tauntUntil ?? -9) <= now || !e.tauntBy) return null;
  return heroes.find((h) => h.id === e.tauntBy && h.act !== 'down') ?? null;
}

/** STAND FAST: what a taunted goblin's blow is worth (1: as it is). */
export const softer = (e: Enemy, now: number) => (e.tauntSoft && (e.tauntUntil ?? -9) > now ? TAUNT.soft : 1);

/** STAND FAST: while the roar lasts, nothing shoves or staggers this Warrior. */
export const braced = (h: Hero, now: number) => (h.tauntUntil ?? -9) > now && knowsRung(h, 'standfast');
