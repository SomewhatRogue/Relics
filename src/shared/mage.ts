/**
 * The Mage's kit rules (Kyle's weapons rework, 2026-11-04; the spellbook, the same day). Every hold is a
 * spell and costs magic (the bar); what spell it is, the element decides (shared/spellbook.ts). The wand
 * casts on the move and breaks blows off; the spellblade cuts, its magic is a shield that hits drain
 * before your health, and a dodge through a blow refills it. The room judges with these numbers and the client draws from the same ones.
 */
import type { Dodge, Weapon } from './weapons.js';

/** What a kit's hold costs in magic (the bar is 100), in any element. A spell you can't pay for, or cast
 *  winded, fizzles: nothing is spent. The blink costs its dodge's own (40 x DODGE.cost = 60). */
export const SPELL = { wand: 20, staff: 30, spellblade: 35 };

/** The wand. Its quick bolt is cast on the move at `walk` of your pace, turning to the aim as it comes
 *  up. Its holds let go on the white flash break off whatever the goblins they hit are doing and stagger
 *  them `stun` s (a butcher `big` as long). A bonus: any tap that lands on a goblin mid wind-up does the same. */
export const WAND = { walk: 0.9, stun: 0.6, big: 0.5 };

/**
 * The spellblade's mana shield (Kyle, 2026-11-05: "Magic is your shield"). With it in hand, a blow, a
 * shot or fire underfoot comes off MAGIC first, `perDmg` magic a point; only what magic can't cover
 * reaches health. A striped blow (unblockable) goes straight to health. A shield hit starts the refill
 * wait over (HERO.magicDelay) as a cast does. Running dry doesn't wind you (`keep` is left): the blink that
 * refills it stays yours. A dodge through a blow (a last-second blink, sim/combat.ts slipped) gives back
 * `slip` magic (Kyle, 2026-11-05: parry is gone). Seen: the ward cracks for `crack` s off a hit, breaks for `broke` s.
 */
/** `perDmg`: magic a point of damage costs the shield. 3 (Kyle, 2026-11-05: at 1 "you're sort of invincible"). */
export const MANA_SHIELD = { perDmg: 3, keep: 0.01, slip: 25, crack: 0.35, broke: 0.6 };

/** Every Mage kit's dodge: the blink (it leaves an image behind once the trainer has taught it). */
export const BLINK: Dodge = { kind: 'blink', distance: 3.8, time: 0.12, iFrom: 0, iTo: 0.12, stamina: 40, cooldown: 2.6 };

/**
 * The spellblade (it replaced the lance rod, 2026-11-04; old saves: shared/oldkits.ts). A sword in three
 * cuts that carry the element. Held: the element's blade spell (a burning lunge, a shatter, a lightning
 * dash: shared/spellbook.ts). No block: it blinks like any Mage kit, and a blink through a blow refills
 * magic, which is its shield (MANA_SHIELD). Weakness: no range, getting hit costs your spells, and a lightly
 * armoured Mage stands in among them with no block to hold.
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
  draw: 0.5, early: 'fizzle',
  blockSpeed: 0.5, chargeSpeed: 0.5, guardArc: 120, guardCost: 2, speed: 0.86, spellblade: true,
  dodge: BLINK,
};
