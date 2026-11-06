/**
 * The Warrior's guard ladder (numbers: shared/ladder.ts TAUNT_GUARD, IRON_STANCE, STAND_FAST; Kyle,
 * 2026-11-05/06: the guard grows like the dodge does, and it takes the roar's place). TAUNT GUARD:
 * while the block is held, goblins near come for the Warrior (sim/enemies.ts asks `tauntTarget`), and
 * stay on them a moment after it drops. IRON STANCE: a blocked blow costs a flat burst of breath, throws
 * the goblin back and leaves the Warrior untouchable a moment (combat.ts asks `ironStance`, `ironHeld`).
 * STAND FAST: the goblins the guard turned hit softer, and a block shoves the Warrior nowhere.
 * The taunt's ring is a zone the client draws at the reach it was judged at.
 */
import { GUARD, WEAPONS } from '../shared/tuning';
import { IRON_STANCE, STAND_FAST, TAUNT_GUARD, knowsRung } from '../shared/ladder';
import { shove } from './bodies';
import { isDead, isDummy } from './damage';
import { stun } from './stuns';
import type { Enemy, FightEvent, Hero, Zone } from './types';

const warrior = (h: Hero) => WEAPONS[h.weapon]?.cls === 'WARRIOR';

/** A Warrior with TAUNT GUARD: holding block turns goblins on them. */
export const taunts = (h: Hero) => warrior(h) && knowsRung(h, 'tauntguard');

/** Each tick: a Warrior holding block with TAUNT GUARD turns the goblins near on themselves. */
export function stepTaunt(h: Hero, enemies: Enemy[], zones: Zone[], now: number, ev: FightEvent[]): void {
  if (!h.blocking || h.act === 'down' || !taunts(h)) return;
  const soft = knowsRung(h, 'standfast');
  // The block just went up: the ring shows (not more than once a second, so a held block isn't a strobe).
  if (now - (h.tauntRingAt ?? -9) >= TAUNT_GUARD.every && now - (h.blockUpAt ?? -9) < 0.05) {
    h.tauntRingAt = now;
    zones.push({ kind: 'taunt', x: h.x, y: h.y, r: TAUNT_GUARD.reach, at: now, until: now + TAUNT_GUARD.show, next: 0, owner: h.id, el: '' });
    ev.push({ k: 'taunt', x: h.x, y: h.y, r: TAUNT_GUARD.reach });
  }
  for (const e of enemies) {
    if (isDead(e) || isDummy(e) || e.kind === 'nest' || Math.hypot(e.x - h.x, e.y - h.y) > TAUNT_GUARD.reach + e.radius) continue;
    // Newly turned: a mark over it.
    if (e.tauntBy !== h.id || (e.tauntUntil ?? -9) <= now) ev.push({ k: 'taunted', x: e.x, y: e.y });
    Object.assign(e, { tauntBy: h.id, tauntUntil: now + TAUNT_GUARD.linger, tauntSoft: soft, alert: true, feeding: false });
  }
}

/** Who a taunted goblin goes for: its taunter, while it lasts and they're on their feet. */
export function tauntTarget(e: Enemy, heroes: Hero[], now: number): Hero | null {
  if ((e.tauntUntil ?? -9) <= now || !e.tauntBy) return null;
  return heroes.find((h) => h.id === e.tauntBy && h.act !== 'down') ?? null;
}

/** STAND FAST: what a taunted goblin's blow is worth (1: as it is). */
export const softer = (e: Enemy, now: number) => (e.tauntSoft && (e.tauntUntil ?? -9) > now ? STAND_FAST.soft : 1);

/** STAND FAST: a Warrior holding block is shoved nowhere by what hits them. */
export const braced = (h: Hero, _now: number) => h.blocking && warrior(h) && knowsRung(h, 'standfast');

/** IRON STANCE's moment after a block: nothing lands. */
export const ironHeld = (h: Hero, now: number) => (h.ironUntil ?? -9) > now;

/**
 * IRON STANCE: `e`'s blow met by this Warrior's block. A flat burst of breath (the guard breaks if
 * there isn't that much), the goblin thrown back and staggered, the Warrior untouchable a moment.
 * False if the Warrior doesn't know it (the plain block is judged instead).
 */
export function ironStance(h: Hero, e: Enemy, now: number, ev: FightEvent[]): boolean {
  if (!warrior(h) || !knowsRung(h, 'ironstance')) return false;
  h.stamina -= IRON_STANCE.cost;
  h.staminaAt = now;
  if (h.stamina <= 0) {
    Object.assign(h, { stamina: 0, winded: true, act: 'stun', actT: 0, actDur: GUARD.guardBreakStun });
    ev.push({ k: 'guardbreak', x: h.x, y: h.y });
    return true;
  }
  h.ironUntil = now + IRON_STANCE.untouchable;
  const dx = e.x - h.x, dy = e.y - h.y, l = Math.hypot(dx, dy) || 1;
  e.attack = null;
  shove(e, dx / l, dy / l, IRON_STANCE.knock, e.weight);
  stun(e, h.id, now, IRON_STANCE.stagger, ev, 'flinch');
  ev.push({ k: 'block', x: h.x, y: h.y }, { k: 'ironstance', x: h.x, y: h.y, x2: e.x, y2: e.y });
  return true;
}
