/**
 * The Cleric's guard is a holy ward, not a block (Kyle, 2026-11-05: "a ward round you, like the Mage's
 * magic shield, that soaks hits and is fed by the censer's coals"; numbers: shared/cleric.ts HOLY_GUARD).
 * Held, it meets a blow from any side (combat.ts asks `roundGuard`) and costs breath for what it holds,
 * as a block does. Standing in your own coals while you hold it gives breath back. With SHARED WARD it
 * covers the nearest friend as well and drains breath while it does (sim/ladderhealer.ts).
 */
import { HERO, HOLY_GUARD, WEAPONS } from '../shared/tuning';
import { ALLY_WARD } from '../shared/ladder';
import { wardedFriend } from './ladderhealer';
import type { Coal } from './lantern';
import type { Hero } from './types';

/** A Cleric holding their guard: it's round them, not just in front. */
export const roundGuard = (h: Hero) => h.blocking && WEAPONS[h.weapon]?.cls === 'HEALER';

/** Each tick: a guarding Cleric in their own coals gets breath back; one covering a friend pays for it. */
export function stepHolyGuard(heroes: Hero[], coals: Coal[], now: number, dt: number): void {
  for (const h of heroes) {
    if (!roundGuard(h) || h.act === 'down') {
      h.wardFor = undefined;
      continue;
    }
    // Who the ward covers is kept on the Cleric, so a guest's screen draws the same tether.
    const f = wardedFriend(h, heroes);
    h.wardFor = f?.id;
    if (f) (h.stamina -= ALLY_WARD.drain * dt), (h.staminaAt = now);
    if (coals.some((c) => c.owner === h.id && Math.hypot(c.x - h.x, c.y - h.y) <= HOLY_GUARD.coalReach)) h.stamina = Math.min(HERO.stamina, h.stamina + HOLY_GUARD.coals * dt);
  }
}
