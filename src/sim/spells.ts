/**
 * What a Mage's big spells cost, in the room (numbers: shared/mage.ts SPELL). A hold that would be a big
 * spell is refused at once if you can't pay for it (it fizzles, nothing spent), and paid for at the
 * release: the bar dips and says by how much. And the wand's perfect: a spark that lands on a goblin
 * mid wind-up breaks the blow off. Lives on the hero and the goblin, so a guest sees the same.
 */
import { BLADE, SPELL, WAND, WEAPONS, WREATHE } from '../shared/tuning';
import { castElement } from './channel';
import { isDead } from './damage';
import type { Enemy, FightEvent, Hero } from './types';

/** The magic this kit's held spell costs now (0: it isn't one). A charged blade wreathes for less. */
export function spellCost(h: Hero): number {
  const hv = WEAPONS[h.weapon].heavy;
  if (hv.wall) return SPELL.wall;
  if (hv.wreathes) return Math.round(SPELL.wreathe * (1 - Math.min(1, h.bladeCharge ?? 0)));
  return WEAPONS[h.weapon].cls === 'MAGE' && hv.shot ? SPELL.burst : 0;
}

const short = (h: Hero) => spellCost(h) > 0 && (h.winded || h.stamina < spellCost(h));

/** A hold is about to begin: refuse it (a fizzle, the press spent) if the spell can't be paid for. */
export function refuseSpell(h: Hero, now: number, ev: FightEvent[]): boolean {
  if (!short(h)) return false;
  h.attackQueuedAt = -9;
  ev.push({ k: 'fizzle', x: h.x, y: h.y });
  return true;
}

/** The release: pay for the spell (false: it fizzled, nothing spent). A spellblade's is wreathed here. */
export function paySpell(h: Hero, now: number, ev: FightEvent[]): boolean {
  const n = spellCost(h);
  if (short(h)) return ev.push({ k: 'fizzle', x: h.x, y: h.y }), false;
  if (n > 0) Object.assign(h, { stamina: Math.max(0, h.stamina - n), staminaAt: now }), ev.push({ k: 'magic', x: h.x, y: h.y, n });
  if (WEAPONS[h.weapon].heavy.wreathes) {
    // The release cut is the first wreathed swing; the last of the rest throws the wave.
    Object.assign(h, { bladeCharge: 0, wreathe: WREATHE.swings + 1, wreatheUntil: now + WREATHE.time, wreatheEl: castElement(h) });
    ev.push({ k: 'wreathe', x: h.x, y: h.y, el: h.wreatheEl! });
  }
  return true;
}

/** Winding up a blow it hasn't let go of yet. */
export const windingUp = (e: Enemy) => !isDead(e) && e.kind !== 'nest' && e.act === 'attack' && !!e.attack && e.attack.t < e.attack.windup;

/** A wand's spark landed mid wind-up (`was`: it was winding up before the spark hurt it): the blow is
 *  broken off and the goblin staggered, PERFECT. */
export function interrupt(e: Enemy, was: boolean, by: Hero | undefined, ev: FightEvent[]): void {
  if (!was || isDead(e) || e.act === 'carried' || e.act === 'pinned') return;
  Object.assign(e, { attack: null, act: 'stunned', actT: 0, actDur: WAND.stun * (e.kind === 'butcher' ? WAND.big : 1), kvx: 0, kvy: 0 });
  ev.push({ k: 'perfect', x: by?.x ?? e.x, y: by?.y ?? e.y }, { k: 'interrupt', x: e.x, y: e.y });
}

/** A blade blow landed: a little more charge (and the blade says when it's full). */
export function buildCharge(h: Hero, ev: FightEvent[]): void {
  const was = h.bladeCharge ?? 0;
  h.bladeCharge = Math.min(1, was + BLADE.perHit);
  if (was < 1 && h.bladeCharge >= 1) ev.push({ k: 'bladefull', x: h.x, y: h.y });
}
