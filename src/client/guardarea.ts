/**
 * GUARD and DODGE as rated areas (Kyle: "If a thing gives guard we say low / med / high (high = less
 * stamina loss on hit, bigger area covered). Guard can be Block and Parry, or just Parry. Dodge can be
 * (none) if it's none."). Worked out from the kit's own numbers, so a card never says more than the room
 * does. Shown on the weapon card (card.ts) and the class card (title.ts), one small line each.
 */
import { guardOf, WEAPONS, dodgeName, dodgeOf, type WeaponId } from '../shared/tuning';

export type GuardRating = 'LOW' | 'MED' | 'HIGH';
export type GuardKind = 'BLOCK AND PARRY' | 'PARRY ONLY' | 'NONE';

/**
 * The rating, from where the guard reaches (`guardArc`, degrees in front), what a blocked blow costs in
 * stamina (`guardCost`) and what gets through a block (`chip`):
 *   HIGH  arc 150 or more, cost 1.1 or less, chip 0.2 or less   (sword and shield, mace, censer)
 *   MED   arc 120 or more, cost 1.5 or less, chip 0.3 or less   (spear, flail)
 *   LOW   anything less                                         (greatsword, the bows, the spellblade)
 */
export function guardRating(w: WeaponId): GuardRating {
  const k = WEAPONS[w];
  if (k.guardArc >= 150 && k.guardCost <= 1.1 && k.chip <= 0.2) return 'HIGH';
  if (k.guardArc >= 120 && k.guardCost <= 1.5 && k.chip <= 0.3) return 'MED';
  return 'LOW';
}

/** What the block button does with this kit: hold a block and parry, parry only (the spellblade too), or nothing. */
export function guardKind(w: WeaponId): GuardKind {
  const g = guardOf(WEAPONS[w]);
  return g === 'none' ? 'NONE' : g === 'parry' ? 'PARRY ONLY' : 'BLOCK AND PARRY';
}

/** The dodge button's name for this kit (ROLL, JUMP, DASH, BLINK), or NONE. */
export const dodgeOfKit = (w: WeaponId): string => (dodgeOf(WEAPONS[w]) ? dodgeName(WEAPONS[w].cls) : 'NONE');

const PIPS: Record<GuardRating, number> = { LOW: 1, MED: 2, HIGH: 3 };
const pips = (n: number, of: number) => `<i class="pips">${'<em class="on"></em>'.repeat(n)}${'<em></em>'.repeat(of - n)}</i>`;

/** The two lines: GUARD with three pips, its rating and kind; DODGE with one pip and its name. */
export function areas(w: WeaponId): string {
  const kind = guardKind(w), rate = kind === 'NONE' ? null : guardRating(w), dodge = dodgeOfKit(w);
  const guard = rate ? `${rate} <span>&middot; ${kind}</span>` : 'NONE';
  return `<div class="areas"><div class="area"><b>GUARD</b>${pips(rate ? PIPS[rate] : 0, 3)}<span class="v${rate ? '' : ' none'}">${guard}</span></div>` +
    `<div class="area"><b>DODGE</b>${pips(dodge === 'NONE' ? 0 : 1, 1)}<span class="v${dodge === 'NONE' ? ' none' : ''}">${dodge}</span></div></div>`;
}
