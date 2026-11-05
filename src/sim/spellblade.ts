/**
 * The spellblade's cuts and the staff's slash, in the room (numbers: shared/mage.ts, shared/spellbook.ts).
 * Every blow that lands carries the element (sim/spellbook.ts tapElement); every blade blow builds the
 * charge that pays for its held spells (sim/spells.ts). Block is a parry, like any parry-only weapon's
 * (sim/combat.ts), and a parry fills the blade. Kept on the hero, so a guest's blade glows too.
 */
import { WEAPONS, type Swing } from '../shared/tuning';
import { castElement } from './channel';
import { isDead } from './damage';
import { newCast, type World } from './elements';
import { buildCharge } from './spells';
import { tapElement } from './spellbook';
import type { Enemy, FightEvent, Hero } from './types';

const mageCut = (h: Hero, s: Swing) => !!s.slash || (!!WEAPONS[h.weapon]?.spellblade && !h.heavy);

/** A Mage's melee tap at its moment of release: the staff's slash shows its element. True if it was one. */
export function looseBlade(h: Hero, s: Swing, w: World): boolean {
  // Each swing is one storm cast: a wet goblin is jumped to once a swing.
  if (s.slash || (WEAPONS[h.weapon]?.spellblade && !h.heavy)) h.swingCast = newCast();
  if (s.slash) return w.ev.push({ k: 'slash', x: h.x, y: h.y, dx: h.fx, dy: h.fy, el: castElement(h) }), true;
  return !!WEAPONS[h.weapon]?.spellblade && !h.heavy;
}

/** A Mage's blow landed for `n`: the blade builds its charge; the element comes with it. */
export function bladeStruck(h: Hero, s: Swing, e: Enemy, n: number, w: World): void {
  if (!mageCut(h, s)) return;
  if (WEAPONS[h.weapon].spellblade) buildCharge(h, w.ev);
  if (!isDead(e)) tapElement(w, h, e, castElement(h), n);
}

/** A spellblade's parry fills the blade (the parry itself is any parry: sim/combat.ts). */
export function parryFills(h: Hero, ev: FightEvent[]): void {
  if (!WEAPONS[h.weapon].spellblade) return;
  const was = h.bladeCharge ?? 0;
  h.bladeCharge = 1;
  if (was < 1) ev.push({ k: 'bladefull', x: h.x, y: h.y });
}
