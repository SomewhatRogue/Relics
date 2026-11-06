/**
 * The spellblade's mana shield, in the room (numbers: shared/mage.ts MANA_SHIELD; Kyle, 2026-11-05:
 * "Magic is your shield"). With the spellblade in hand, a blow, a shot or fire underfoot comes off MAGIC
 * first; only what magic can't cover reaches health. Striped blows (unblockable) skip it: the caller
 * doesn't ask. A shield hit starts the refill wait over, as a cast does. A dodge through a blow (a
 * last-second blink) gives magic back (Kyle, 2026-11-05: parry is gone). All of it lives on the hero (`stamina`, `wardAt`, `wardBrokeAt`), so a guest's screen
 * draws the ward the leader's room decided (client/blademark.ts).
 */
import { HERO, MANA_SHIELD as M, WEAPONS } from '../shared/tuning';
import type { FightEvent, Hero } from './types';

/** True while `h` is shielded by its magic (the spellblade in hand, standing). */
export const manaWard = (h: Hero) => !!WEAPONS[h.weapon]?.spellblade && h.act !== 'down';

/** The magic the shield can still spend, in whole points of damage. */
const cover = (h: Hero) => Math.floor(Math.max(0, h.stamina) / M.perDmg + 1e-9);

/**
 * `n` damage would reach `h` now: its magic takes what it can, `perDmg` a point. Returns what's left for
 * health (all of `n` without a ward, or with an empty one). Run dry, a sliver is left (`keep`), so an
 * empty shield doesn't wind you and the blink that refills it is still there.
 */
export function manaShield(h: Hero, n: number, now: number, ev: FightEvent[]): number {
  if (n <= 0 || !manaWard(h)) return n;
  const took = Math.min(n, cover(h));
  if (took <= 0) return n;
  const spent = took * M.perDmg;
  h.stamina = Math.max(M.keep, h.stamina - spent);
  h.staminaAt = now;
  h.wardAt = now;
  ev.push({ k: 'manaward', x: h.x, y: h.y, n: Math.round(spent) });
  // Ran out: the ward breaks (and what it couldn't take goes through to health).
  // (Broken, the odd bit of magic short of a whole point goes with it.)
  if (took < n || cover(h) < 1) (h.stamina = M.keep), (h.wardBrokeAt = now), ev.push({ k: 'manabreak', x: h.x, y: h.y });
  return n - took;
}

/** A spellblade's dodge through a blow (sim/combat.ts slipped): magic back, once an instant (a pack
 *  rush's blows all land together, and one blink through them is one refill). */
export function slipRefills(h: Hero, now: number, ev: FightEvent[]): void {
  if (!WEAPONS[h.weapon]?.spellblade || h.slipFillAt === now) return;
  h.slipFillAt = now;
  const n = Math.round(Math.max(0, Math.min(M.slip, HERO.stamina - h.stamina)));
  h.stamina += n;
  ev.push({ k: 'manaup', x: h.x, y: h.y, n });
}
