/**
 * What each weapon does, in one table (Kyle: "just say what the tap does, what the hold does and what
 * the perfect does"): TAP, HOLD, PERFECT, and ALSO for a bonus beyond the perfect, a few words each.
 * Used by the weapon card (card.ts), the BUTTONS legend's ATTACK row (legend.ts) and the laptop's hint
 * line (main.ts). A Mage's TAP, HOLD and PERFECT are its element's (MAGE_KIT). Facts from the sim: every perfect is the hold let go on the white flash
 * (sim/hero.ts), except the crossbow's, which is the glint (sim/crossbow.ts).
 */
import { ELEMENT_NAME, SHORTBOW, SPELL, WEAPONS, type Element, type MageKit, type WeaponId } from '../shared/tuning';

export interface KitRow { tap: string; hold: string; perfect: string; also?: string }

export const KIT: Record<WeaponId, KitRow> = {
  // Warrior (shared/warrior.ts): the bash stuns every goblin in front on the flash; the charge pin is a bonus (the sword's riposte went with parry).
  sword: { tap: 'Three quick cuts', hold: 'Shield bash', perfect: 'Stuns all in front' },
  greatsword: { tap: 'Wide, slow sweeps', hold: 'Overhead', perfect: 'Shockwave, knocks flat' },
  spear: { tap: 'Long thrusts', hold: 'Lunge through three', perfect: 'Pins all it runs through', also: 'Pins a charging goblin' },
  // Ranger (shared/ranger.ts): the short sword on a tap, the bow on a hold.
  longbow: { tap: 'Short sword', hold: 'Draw bow', perfect: 'Blinds, critical hit' },
  shortbow: { tap: 'Short sword', hold: 'Quick shot, walking', perfect: `${SHORTBOW.perfect}x damage` },
  crossbow: { tap: 'Short sword', hold: 'Aim and fire', perfect: 'Glint: 1.5x damage, whole line', also: 'RELOAD winds it' },
  // Rogue (shared/venom.ts): the daggers' thrown knife is a drawn shot, so its flash is simply full power.
  daggers: { tap: 'Fast stabs', hold: 'Throw a dagger', perfect: 'Full-power throw', also: '2.5x damage from behind' },
  rapier: { tap: 'Long thrusts', hold: 'Lunge through two', perfect: 'Skewers, bleeds' },
  poisoner: { tap: 'Short sword, hits two', hold: 'Poison dart', perfect: 'Stuns, stronger poison' },
  // Mage (shared/mage.ts): what a tap and a hold are, the element decides (MAGE_KIT below); these are fire's.
  wand: { tap: 'Firebolt, burns', hold: 'Fireball, burns a crowd', perfect: 'Bigger, interrupts any blow' },
  // The wall of fire burns friends too (sim/firewall.ts): said once on the card: fire's ALSO (MAGE_KIT) and the book card's (BOOK_ALSO).
  staff: { tap: 'Flame sweep, burns', hold: 'Rolling wall of fire', perfect: 'Wider, burns longer' },
  spellblade: { tap: 'Cuts burn', hold: 'Burning lunge', perfect: 'Longer, costs nothing', also: 'Magic shields, blinks top up' },
  // Cleric (shared/cleric.ts): every perfect shields friends near you.
  mace: { tap: 'Short blows, 3rd heals', hold: 'Smite, stuns', perfect: 'Harder, shields friends', also: 'Holding a smite costs faith' },
  censer: { tap: 'Two cuts, healing swing', hold: 'Whirl, burns', perfect: 'Coals flare, shields friends' },
  flail: { tap: 'Wide shoves, 2nd heals', hold: 'Spin up, sweep', perfect: 'Stuns, shields friends' },
};

/** A Mage's kits in each element (the element is the spellbook, shared/spellbook.ts): the weapon sets the
 *  range, the element the spell. The ALSO rows are the kit's own (KIT above) unless the element has its
 *  own (the wand's storm stream doesn't break blows, so it says what's true of storm instead). Storm's
 *  wet rule is said once, on the class card's SPELLS note (shared/classes.ts). */
export const MAGE_KIT: Record<MageKit, Record<Element, KitRow>> = {
  wand: {
    fire: KIT.wand,
    frost: { tap: 'Three icicles, chill', hold: 'Cold blast, freezes', perfect: 'Wider, interrupts any blow' },
    storm: { tap: 'Lightning stream, tap to build', hold: 'Lightning strike, stuns', perfect: 'Bigger, longer stun', also: 'Ignores shields, spares friends' },
  },
  staff: {
    fire: { ...KIT.staff, also: 'Burns you and friends too' },
    frost: { tap: 'Frost sweep, chills', hold: 'Hard frost, freezes all round', perfect: 'Bigger' },
    storm: { tap: 'Crackling sweep, ignores shields', hold: 'Charged ring, jolts', perfect: 'Bigger, jolts stun' },
  },
  spellblade: {
    fire: KIT.spellblade,
    frost: { tap: 'Cuts chill', hold: 'Shatter the frozen', perfect: 'Wider, costs nothing' },
    storm: { tap: 'Cuts ignore shields', hold: 'Lightning rush through', perfect: 'Longer, stuns, costs nothing' },
  },
};

/** A Mage's spellbook by element, for a weapon card that isn't in anyone's hand: "Tap firebolt, hold fireball". */
const BOOK: Record<MageKit, Record<Element, string>> = {
  wand: { fire: 'Tap firebolt, hold fireball', frost: 'Tap icicles, hold cold blast', storm: 'Tap lightning stream, hold lightning strike' },
  staff: { fire: 'Tap flame sweep, hold wall of fire', frost: 'Tap frost sweep, hold hard frost', storm: 'Tap crackling sweep, hold charged ring' },
  spellblade: { fire: 'Cuts burn, hold burning lunge', frost: 'Cuts chill, hold shatter', storm: 'Cuts ignore shields, hold lightning rush' },
};
const COST: Record<MageKit, string> = { wand: `${SPELL.wand} magic a hold`, staff: `${SPELL.staff} magic a hold`, spellblade: `${SPELL.spellblade} magic a hold` };
/** The ALSO row of a kit's card with no element in hand, where the book needs one: the staff's wall of
 *  fire burns friends, so the card says so once. */
const BOOK_ALSO: Partial<Record<MageKit, string>> = { staff: 'Wall of fire burns you and friends too' };
const isMage = (w: WeaponId): w is MageKit => w in MAGE_KIT;

/** The rows in order, labelled, for a card or a legend (ALSO only where there is one). A Mage's kit in
 *  element `el` shows that element's spells and what a hold costs; with no element, a row for each. */
export const kitRows = (w: WeaponId, el?: Element | ''): [string, string][] => {
  if (isMage(w) && !el) {
    const also = BOOK_ALSO[w] ?? KIT[w].also;
    return [...(['fire', 'frost', 'storm'] as Element[]).map((e) => [ELEMENT_NAME[e], BOOK[w][e]] as [string, string]), ['PERFECT', 'The bigger spell'], ['LET GO EARLY', early(w)], ['COST', COST[w]], ...(also ? [['ALSO', also] as [string, string]] : [])];
  }
  const k = isMage(w) ? { ...MAGE_KIT[w][el as Element], also: MAGE_KIT[w][el as Element].also ?? KIT[w].also } : KIT[w];
  return [['TAP', k.tap], ['HOLD', k.hold], ['PERFECT', k.perfect], ['LET GO EARLY', early(w)], ...(isMage(w) ? [['COST', COST[w]] as [string, string]] : []), ...(k.also ? [['ALSO', k.also] as [string, string]] : [])];
};

/** What a hold let go before its full draw does (shared/weapons.ts `early`). */
const early = (w: WeaponId): string => {
  const e = WEAPONS[w].early;
  return e === 'full' ? EARLYW.full : e === 'fizzle' ? (w === 'crossbow' ? EARLYW.bolt : w === 'mace' ? EARLYW.smite : EARLYW.spell) : EARLYW.weaker;
};
/** The LET GO EARLY row's words. */
export const EARLYW = { weaker: 'Still goes, weaker', full: 'Still a full shot', spell: 'Fizzles, costs no magic', bolt: 'No shot', smite: 'No smite' };

/** The laptop's hint line: "TAP: ...  HOLD: ...  PERFECT: ..." (a Mage's in the element it's in). */
export const kitLine = (w: WeaponId, el: Element | '' = 'fire'): string => kitRows(w, el).filter(([l]) => l !== 'ALSO' && l !== 'COST' && l !== 'LET GO EARLY').map(([l, v]) => `${l}: ${v.toUpperCase()}`).join('  ');
