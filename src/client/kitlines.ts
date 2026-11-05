/**
 * What each weapon does, in one table (Kyle: "just say what the tap does, what the hold does and what
 * the perfect does"): TAP, HOLD, PERFECT, and ALSO for a bonus beyond the perfect, a few words each.
 * Used by the weapon card (card.ts), the BUTTONS legend's ATTACK row (legend.ts) and the laptop's hint
 * line (main.ts). A Mage's TAP, HOLD and PERFECT are its element's (MAGE_KIT). Facts from the sim: every perfect is the hold let go on the white flash
 * (sim/hero.ts), except the crossbow's, which is the glint (sim/crossbow.ts).
 */
import { ELEMENT_NAME, SPELL, type Element, type MageKit, type WeaponId } from '../shared/tuning';

export interface KitRow { tap: string; hold: string; perfect: string; also?: string }

export const KIT: Record<WeaponId, KitRow> = {
  // Warrior (shared/warrior.ts): the bash stuns every goblin in front on the flash; the riposte and the charge pin are bonuses.
  sword: { tap: 'Three quick cuts', hold: 'Shield bash', perfect: 'Stuns all in front', also: 'Riposte after a parry' },
  greatsword: { tap: 'Wide, slow sweeps', hold: 'Overhead', perfect: 'Shockwave, knocks flat' },
  spear: { tap: 'Long thrusts', hold: 'Lunge through three', perfect: 'Pins all it runs through', also: 'Pins a charging goblin' },
  // Ranger (shared/ranger.ts): the short sword on a tap, the bow on a hold.
  longbow: { tap: 'Short sword', hold: 'Draw bow', perfect: 'Blinds, critical hit' },
  shortbow: { tap: 'Short sword', hold: 'Quick shot, walking', perfect: 'Full-power shot' },
  crossbow: { tap: 'Short sword', hold: 'Aim and fire', perfect: 'Glint: 1.5x damage, whole line', also: 'RELOAD winds it' },
  // Rogue (shared/venom.ts): the daggers' thrown knife is a drawn shot, so its flash is simply full power.
  daggers: { tap: 'Fast stabs', hold: 'Throw a dagger', perfect: 'Full-power throw', also: '2.5x damage from behind' },
  rapier: { tap: 'Long thrusts', hold: 'Lunge through two', perfect: 'Skewers, bleeds' },
  poisoner: { tap: 'Short sword, hits two', hold: 'Poison dart', perfect: 'Stuns, stronger poison' },
  // Mage (shared/mage.ts): what a tap and a hold are, the element decides (MAGE_KIT below); these are fire's.
  wand: { tap: 'Firebolt, burns', hold: 'Fireball, spreads fire', perfect: 'Bigger, interrupts any attack', also: 'Tap interrupts a wind-up' },
  staff: { tap: 'Flame sweep, burns', hold: 'Ring of fire round you', perfect: 'Bigger, lasts longer' },
  spellblade: { tap: 'Cuts set goblins alight', hold: 'Burning lunge', perfect: 'Longer, costs nothing', also: 'Parry fills the blade' },
  // Cleric (shared/cleric.ts): every perfect shields friends near you.
  mace: { tap: 'Short blows, 3rd heals', hold: 'Smite, stuns', perfect: 'Harder, shields friends' },
  censer: { tap: 'Two cuts, healing swing', hold: 'Whirl, sets alight', perfect: 'Coals flare, shields friends' },
  flail: { tap: 'Wide shoves, 2nd heals', hold: 'Spin up, sweep', perfect: 'Stuns, shields friends' },
};

/** A Mage's kits in each element (the element is the spellbook, shared/spellbook.ts): the weapon sets the
 *  range, the element the spell. The ALSO rows are the kit's own (KIT above). */
export const MAGE_KIT: Record<MageKit, Record<Element, KitRow>> = {
  wand: {
    fire: KIT.wand,
    frost: { tap: 'Three icicles, slow', hold: 'Cold blast, freezes', perfect: 'Wider, interrupts any attack' },
    storm: { tap: 'Arc, jumps to two more', hold: 'Lightning strike, stuns', perfect: 'Bigger, longer stun' },
  },
  staff: {
    fire: KIT.staff,
    frost: { tap: 'Frost slash, slows', hold: 'Frost nova, freezes', perfect: 'Bigger nova' },
    storm: { tap: 'Crackling sweep, jumps', hold: 'Charged ring, zaps', perfect: 'Bigger, zaps stun' },
  },
  spellblade: {
    fire: KIT.spellblade,
    frost: { tap: 'Cuts chill', hold: 'Shatter the frozen', perfect: 'Wider, costs nothing' },
    storm: { tap: 'Cuts arc to one more', hold: 'Lightning dash through', perfect: 'Longer, stuns, costs nothing' },
  },
};

/** A Mage's spellbook by element, for a weapon card that isn't in anyone's hand: "Tap firebolt, hold fireball". */
const BOOK: Record<MageKit, Record<Element, string>> = {
  wand: { fire: 'Tap firebolt, hold fireball', frost: 'Tap icicles, hold cold blast', storm: 'Tap arc, hold lightning strike' },
  staff: { fire: 'Tap flame sweep, hold ring of fire', frost: 'Tap frost slash, hold frost nova', storm: 'Tap crackling sweep, hold charged ring' },
  spellblade: { fire: 'Cuts burn, hold burning lunge', frost: 'Cuts chill, hold shatter', storm: 'Cuts arc, hold lightning dash' },
};
const COST: Record<MageKit, string> = { wand: `${SPELL.wand} magic a hold`, staff: `${SPELL.staff} magic a hold`, spellblade: `${SPELL.spellblade} magic a hold, less charged` };
const isMage = (w: WeaponId): w is MageKit => w in MAGE_KIT;

/** The rows in order, labelled, for a card or a legend (ALSO only where there is one). A Mage's kit in
 *  element `el` shows that element's spells and what a hold costs; with no element, a row for each. */
export const kitRows = (w: WeaponId, el?: Element | ''): [string, string][] => {
  if (isMage(w) && !el) {
    const k = KIT[w];
    return [...(['fire', 'frost', 'storm'] as Element[]).map((e) => [ELEMENT_NAME[e], BOOK[w][e]] as [string, string]), ['PERFECT', 'The bigger spell'], ['COST', COST[w]], ...(k.also ? [['ALSO', k.also] as [string, string]] : [])];
  }
  const k = isMage(w) ? { ...MAGE_KIT[w][el as Element], also: KIT[w].also } : KIT[w];
  return [['TAP', k.tap], ['HOLD', k.hold], ['PERFECT', k.perfect], ...(isMage(w) ? [['COST', COST[w]] as [string, string]] : []), ...(k.also ? [['ALSO', k.also] as [string, string]] : [])];
};

/** The laptop's hint line: "TAP: ...  HOLD: ...  PERFECT: ..." (a Mage's in the element it's in). */
export const kitLine = (w: WeaponId, el: Element | '' = 'fire'): string => kitRows(w, el).filter(([l]) => l !== 'ALSO' && l !== 'COST').map(([l, v]) => `${l}: ${v.toUpperCase()}`).join('  ');
