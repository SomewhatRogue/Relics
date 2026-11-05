/**
 * The spellblade's cuts and the staff's slash, in the room (numbers: shared/mage.ts, shared/spellbook.ts).
 * Every blow that lands carries the element (sim/spellbook.ts tapElement). Block is a parry, like any
 * parry-only weapon's (sim/combat.ts); its magic is a shield and a parry refills it (sim/manashield.ts).
 */
import { WEAPONS, type Swing } from '../shared/tuning';
import { castElement } from './channel';
import { isDead } from './damage';
import { newCast, type World } from './elements';
import { tapElement } from './spellbook';
import type { Enemy, Hero } from './types';

const mageCut = (h: Hero, s: Swing) => !!s.slash || (!!WEAPONS[h.weapon]?.spellblade && !h.heavy);

/** A Mage's melee tap at its moment of release: the staff's slash shows its element. True if it was one. */
export function looseBlade(h: Hero, s: Swing, w: World): boolean {
  // Each swing is one storm cast: a wet goblin is jumped to once a swing.
  if (s.slash || (WEAPONS[h.weapon]?.spellblade && !h.heavy)) h.swingCast = newCast();
  if (s.slash) return w.ev.push({ k: 'slash', x: h.x, y: h.y, dx: h.fx, dy: h.fy, el: castElement(h) }), true;
  return !!WEAPONS[h.weapon]?.spellblade && !h.heavy;
}

/** A Mage's blow landed for `n`: the element comes with it. */
export function bladeStruck(h: Hero, s: Swing, e: Enemy, n: number, w: World): void {
  // (One sent skidding by a staff's tap keeps its ice: no steam, no shatter in place. sim/iceslide.ts.)
  if (mageCut(h, s) && !isDead(e) && !e.sled) tapElement(w, h, e, castElement(h), n);
}
