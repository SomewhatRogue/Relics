/**
 * What a Mage's held spells cost, in the room (numbers: shared/mage.ts SPELL). A hold is refused at once
 * if you can't pay for it (it fizzles, nothing spent), and paid for at the release: the bar dips and says
 * by how much. A spellblade's costs its listed magic like any other (its magic is also its shield:
 * sim/manashield.ts); let go on the white flash it costs nothing. And the wand's breaking: a hold let go on the
 * flash breaks off whatever a goblin it hits is doing (the perfect); a tap landing mid wind-up breaks
 * that blow (a bonus). Lives on the hero and the goblin, so a guest sees the same.
 */
import { SPELL, WAND, WEAPONS, type MageKit } from '../shared/tuning';
import { isDead } from './damage';
import { stun } from './stuns';
import type { Enemy, FightEvent, Hero } from './types';
import { spellthief } from './techmage';
import { statsOf } from './gearstats';

const blade = (h: Hero) => !!WEAPONS[h.weapon]?.spellblade;

/** The magic this kit's hold costs (0: it isn't a spell). */
export function spellCost(h: Hero): number {
  if (!WEAPONS[h.weapon]?.heavy.spell) return 0;
  // SPELL COST on the focus (shared/mods.ts): a cheaper spell, never free.
  const base = SPELL[h.weapon as MageKit] ?? 0;
  return base ? Math.max(1, Math.round(base * (1 - statsOf(h).thrift))) : 0;
}

const short = (h: Hero) => spellCost(h) > 0 && (h.winded || h.stamina < spellCost(h));

/** A hold is about to begin: refuse it (a fizzle, the press spent) if the spell can't be paid for. */
export function refuseSpell(h: Hero, now: number, ev: FightEvent[]): boolean {
  if (!short(h)) return false;
  h.attackQueuedAt = -9;
  ev.push({ k: 'fizzle', x: h.x, y: h.y });
  return true;
}

/** The release: pay for the spell (false: it fizzled, nothing spent). Let go on the flash, a spellblade's is free. */
export function paySpell(h: Hero, now: number, ev: FightEvent[]): boolean {
  const cost = spellCost(h), free = blade(h) && h.perfect, n = free ? 0 : cost;
  if (!free && short(h)) return ev.push({ k: 'fizzle', x: h.x, y: h.y }), false;
  if (n > 0) Object.assign(h, { stamina: Math.max(0, h.stamina - n), staminaAt: now }), ev.push({ k: 'magic', x: h.x, y: h.y, n });
  // SPELLTHIEF: on the flash, half of it back (sim/techmage.ts).
  spellthief(h, cost, ev);
  return true;
}

/** Winding up a blow it hasn't let go of yet. */
export const windingUp = (e: Enemy) => !isDead(e) && e.kind !== 'nest' && e.act === 'attack' && !!e.attack && e.attack.t < e.attack.windup;

/** A wand's spell landed by hero `by`: `was` it was winding up before the tap hurt it (the bonus), or
 *  `breaks` it was a hold let go on the flash (the perfect, whatever it was doing). The blow is broken
 *  off and the goblin staggered, unless `by` has stopped it lately (sim/stuns.ts). */
export function interrupt(e: Enemy, was: boolean, breaks: boolean, by: string, now: number, ev: FightEvent[]): void {
  if ((!was && !breaks) || isDead(e) || e.kind === 'nest' || e.act === 'carried' || e.act === 'pinned') return;
  if (stun(e, by, now, WAND.stun * (e.kind === 'butcher' ? WAND.big : 1), ev, 'stunned', true)) ev.push({ k: 'interrupt', x: e.x, y: e.y });
}
