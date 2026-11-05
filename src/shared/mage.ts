/**
 * The Mage's kit rules (Kyle's weapons rework, 2026-11-04; the spellbook, the same day). Every hold is a
 * spell and costs magic (the bar); what spell it is, the element decides (shared/spellbook.ts). The wand
 * casts on the move and breaks blows off; the spellblade cuts, builds a charge that pays for its holds,
 * and its parry fills the blade. The room judges with these numbers and the client draws from the same ones.
 */
import type { Dodge, Weapon } from './weapons.js';

/** What a kit's hold costs in magic (the bar is 100), in any element. A spell you can't pay for, or cast
 *  winded, fizzles: nothing is spent. A spellblade's costs less the more its blade is charged. The blink
 *  costs its dodge's own (40 x DODGE.cost = 60). */
export const SPELL = { wand: 20, staff: 30, spellblade: 35 };

/** The wand. Its quick bolt is cast on the move at `walk` of your pace, turning to the aim as it comes
 *  up. Its holds let go on the white flash break off whatever the goblins they hit are doing and stagger
 *  them `stun` s (a butcher `big` as long). A bonus: any tap that lands on a goblin mid wind-up does the same. */
export const WAND = { walk: 0.9, stun: 0.6, big: 0.5 };

/** The spellblade's charge: each blow that lands adds `perHit` (full at 1) and the blade glows the more.
 *  A hold costs SPELL.spellblade times what's left to fill, so a full blade casts for nothing, and the
 *  charge is spent. Let go on the white flash, a hold costs nothing and the charge is kept. */
export const BLADE = { perHit: 0.15 };

/** Every Mage kit's dodge: the blink (it leaves an image behind once the trainer has taught it). */
export const BLINK: Dodge = { kind: 'blink', distance: 3.8, time: 0.12, iFrom: 0, iTo: 0.12, stamina: 40, cooldown: 2.6 };

/**
 * The spellblade (it replaced the lance rod, 2026-11-04; old saves: shared/oldkits.ts). A sword in three
 * cuts that carry the element. Held: the element's blade spell (a burning lunge, a shatter, a lightning
 * dash: shared/spellbook.ts). Block is a parry, like any parry-only weapon's, and a parry fills the blade.
 * Weakness: no range, it eats magic, and a lightly armoured Mage stands in among them with no block to hold.
 */
export const SPELLBLADE: Weapon = {
  name: 'SPELLBLADE',
  cls: 'MAGE',
  combo: [
    { windup: 0.1, active: 0.08, recover: 0.2, dmg: 10, range: 1.4, arc: 110, lunge: 0.35, knock: 3 },
    { windup: 0.09, active: 0.08, recover: 0.2, dmg: 10, range: 1.4, arc: 110, lunge: 0.35, knock: 3 },
    { windup: 0.15, active: 0.1, recover: 0.34, dmg: 16, range: 1.55, arc: 130, lunge: 0.55, knock: 6 },
  ],
  heavy: { windup: 0.08, active: 0.1, recover: 0.3, dmg: 14, dmgFull: 22, range: 1.55, arc: 150, lunge: 0.4, knock: 5, knockFull: 8, spell: true },
  draw: 0.5,
  chip: 0.5, blockSpeed: 0.5, chargeSpeed: 0.5, parryWindow: 0.22, guardArc: 120, guardCost: 2, speed: 0.86, parryOnly: true, spellblade: true,
  dodge: BLINK,
};
