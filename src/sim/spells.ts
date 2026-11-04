/**
 * What a Mage's big spells cost, in the room (numbers: shared/mage.ts SPELL). A hold that would be a big
 * spell is refused at once if you can't pay for it (it fizzles, nothing spent), and paid for at the
 * release: the bar dips and says by how much. A spellblade's wreathe let go on the white flash is free
 * and leaves the blade full. And the wand's breaking: its burst let go on the flash breaks off whatever
 * a goblin it hits is doing (the perfect); any spark landing mid wind-up breaks that blow (a bonus).
 * Lives on the hero and the goblin, so a guest sees the same.
 */
import { BLADE, SPELL, WAND, WEAPONS, WREATHE } from '../shared/tuning';
import { castElement } from './channel';
import { isDead } from './damage';
import { stun } from './stuns';
import type { Enemy, FightEvent, Hero } from './types';

/** The magic this kit's held spell costs now (0: it isn't one). A charged blade wreathes for less. */
export function spellCost(h: Hero): number {
  const hv = WEAPONS[h.weapon].heavy;
  if (hv.wall) return SPELL.wall;
  if (hv.wreathes) return Math.round(SPELL.wreathe * (1 - Math.min(1, h.bladeCharge ?? 0)));
  return WEAPONS[h.weapon].cls === 'MAGE' && hv.shot ? SPELL.burst : 0;
}

const short = (h: Hero) => spellCost(h) > 0 && (h.winded || h.stamina < spellCost(h));
/** A spellblade's wreathe let go on the white flash: free, and the blade left full. */
const freeWreathe = (h: Hero) => !!WEAPONS[h.weapon].heavy.wreathes && h.perfect;

/** A hold is about to begin: refuse it (a fizzle, the press spent) if the spell can't be paid for. */
export function refuseSpell(h: Hero, now: number, ev: FightEvent[]): boolean {
  if (!short(h)) return false;
  h.attackQueuedAt = -9;
  ev.push({ k: 'fizzle', x: h.x, y: h.y });
  return true;
}

/** The release: pay for the spell (false: it fizzled, nothing spent). A spellblade's is wreathed here. */
export function paySpell(h: Hero, now: number, ev: FightEvent[]): boolean {
  const free = freeWreathe(h), n = free ? 0 : spellCost(h);
  if (!free && short(h)) return ev.push({ k: 'fizzle', x: h.x, y: h.y }), false;
  if (n > 0) Object.assign(h, { stamina: Math.max(0, h.stamina - n), staminaAt: now }), ev.push({ k: 'magic', x: h.x, y: h.y, n });
  if (WEAPONS[h.weapon].heavy.wreathes) {
    // The release cut is the first wreathed swing; the last of the rest throws the wave.
    Object.assign(h, { bladeCharge: free ? 1 : 0, wreathe: WREATHE.swings + 1, wreatheUntil: now + WREATHE.time, wreatheEl: castElement(h) });
    ev.push({ k: 'wreathe', x: h.x, y: h.y, el: h.wreatheEl! });
    if (free) ev.push({ k: 'bladefull', x: h.x, y: h.y });
  }
  return true;
}

/** Winding up a blow it hasn't let go of yet. */
export const windingUp = (e: Enemy) => !isDead(e) && e.kind !== 'nest' && e.act === 'attack' && !!e.attack && e.attack.t < e.attack.windup;

/** A wand's spark landed by hero `by`: `was` it was winding up before the spark hurt it (the bonus), or
 *  `breaks` it was the burst let go on the flash (the perfect, whatever it was doing). The blow is broken
 *  off and the goblin staggered, unless `by` has stopped it lately (sim/stuns.ts). */
export function interrupt(e: Enemy, was: boolean, breaks: boolean, by: string, now: number, ev: FightEvent[]): void {
  if ((!was && !breaks) || isDead(e) || e.kind === 'nest' || e.act === 'carried' || e.act === 'pinned') return;
  if (stun(e, by, now, WAND.stun * (e.kind === 'butcher' ? WAND.big : 1), ev, 'stunned', true)) ev.push({ k: 'interrupt', x: e.x, y: e.y });
}

/** A blade blow landed: a little more charge (and the blade says when it's full). */
export function buildCharge(h: Hero, ev: FightEvent[]): void {
  const was = h.bladeCharge ?? 0;
  h.bladeCharge = Math.min(1, was + BLADE.perHit);
  if (was < 1 && h.bladeCharge >= 1) ev.push({ k: 'bladefull', x: h.x, y: h.y });
}
