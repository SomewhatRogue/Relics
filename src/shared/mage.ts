/**
 * The Mage's kit rules (Kyle's weapons rework, 2026-11-04). Big spells cost magic (the stamina bar):
 * the wand's held burst, the staff's wall, the spellblade's wreathing, and the blink as before. The
 * wand casts on the move and its flash burst breaks blows off; the staff slashes close in its element and
 * raises a wall of it; the spellblade cuts, builds a charge, wreathes itself in the element and catches
 * a blow on the blade. The room judges with these numbers and the client draws from the same ones.
 */
import type { Dodge, Weapon } from './weapons.js';

/** What a big spell costs in magic (stamina; the bar is 100). A spell you can't pay for, or cast
 *  winded, fizzles: nothing is spent. The blink costs its dodge's own (40 x DODGE.cost = 60). */
export const SPELL = { burst: 20, wall: 30, wreathe: 35 };

/** The wand. Its quick bolt is cast on the move at `walk` of your pace, turning to the aim as it comes
 *  up. Its perfect: the burst let go on the white flash breaks off whatever the goblins it hits are
 *  doing and staggers them `stun` s (a butcher `big` as long). A bonus: any spark that lands on a
 *  goblin mid wind-up does the same. */
export const WAND = { walk: 0.9, stun: 0.6, big: 0.5 };

/**
 * The staff's wall, raised `ahead` tiles in front across where you face: `len` tiles long from the
 * shortest hold to `lenFull` at a full one, `thick` deep, standing `life` s. Let go on the white flash
 * and it's the big wall: `bigLen` long, `bigThick` deep, `bigLife` s. Every `every` s: fire sets what's
 * in it burning and scorches it `fire`; frost chills what touches it and holds back anything no heavier
 * than `holds` (a scrapper, a spider: not a butcher); storm shocks what's in it for `shock`, a flinch.
 */
export const WALL = { ahead: 1.7, len: 2.4, lenFull: 3.6, thick: 0.5, life: 5, bigLen: 5.6, bigThick: 0.8, bigLife: 7, every: 0.5, fire: 5, shock: 9, flinch: 0.4, holds: 1 };

/** The spellblade's charge: each blow that lands adds `perHit` (full at 1) and the blade glows the more.
 *  Wreathing costs SPELL.wreathe times what's left to fill, so a full blade wreathes for nothing. Its
 *  perfect: wreathe let go on the white flash costs nothing and leaves the blade full. */
export const BLADE = { perHit: 0.15 };

/**
 * Wreathed: the release cut and the next `swings` swings carry the element, for `time` s at most. Fire
 * burns, frost chills (slows), storm jumps from the goblin struck to the nearest other within `jump` for
 * `share` of the blow. The last of them throws a wave of the element `reach` tiles ahead, across `arc`
 * degrees, for `waveDmg` and a shove.
 */
export const WREATHE = { swings: 3, time: 6, jump: 3, share: 0.6, reach: 2.2, arc: 100, waveDmg: 14, waveKnock: 7 };

/** Every Mage kit's dodge: the blink (it leaves an image behind once the trainer has taught it). */
export const BLINK: Dodge = { kind: 'blink', distance: 3.8, time: 0.12, iFrom: 0, iTo: 0.12, stamina: 40, cooldown: 2.6 };

/**
 * The spellblade (it replaced the lance rod, 2026-11-04; old saves: shared/oldkits.ts). A plain sword in
 * three cuts. Held: magic spent to wreathe the blade (the release is a cut of its own); let go on the
 * flash, it's free and the blade stays full. A bonus: block pressed as a blow lands catches it on the
 * blade, no damage, and the blade is fully charged. Weakness:
 * no range, it eats magic, and a lightly armoured Mage stands in among them with no guard to hold.
 */
export const SPELLBLADE: Weapon = {
  name: 'SPELLBLADE',
  cls: 'MAGE',
  combo: [
    { windup: 0.1, active: 0.08, recover: 0.2, dmg: 10, range: 1.4, arc: 110, lunge: 0.35, knock: 3 },
    { windup: 0.09, active: 0.08, recover: 0.2, dmg: 10, range: 1.4, arc: 110, lunge: 0.35, knock: 3 },
    { windup: 0.15, active: 0.1, recover: 0.34, dmg: 16, range: 1.55, arc: 130, lunge: 0.55, knock: 6 },
  ],
  heavy: { windup: 0.08, active: 0.1, recover: 0.3, dmg: 14, dmgFull: 22, range: 1.55, arc: 150, lunge: 0.4, knock: 5, knockFull: 8, wreathes: true },
  draw: 0.5,
  chip: 0.5, blockSpeed: 0.5, chargeSpeed: 0.5, parryWindow: 0.22, guardArc: 120, guardCost: 2, speed: 0.86, catches: true,
  dodge: BLINK,
};
