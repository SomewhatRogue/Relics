/**
 * What each weapon does, in one table (Kyle: "just say what the tap does, what the hold does and what
 * the perfect does"): TAP, HOLD, PERFECT, and ALSO for a bonus beyond the perfect, a few words each.
 * Used by the weapon card (card.ts), the BUTTONS legend's ATTACK row (legend.ts) and the laptop's hint
 * line (main.ts). Facts from the sim: every perfect is the hold let go on the white flash
 * (sim/hero.ts), except the crossbow's, which is the glint (sim/crossbow.ts).
 */
import type { WeaponId } from '../shared/tuning';

export interface KitRow { tap: string; hold: string; perfect: string; also?: string }

export const KIT: Record<WeaponId, KitRow> = {
  // Warrior (shared/warrior.ts): the bash stuns every goblin in front on the flash; the riposte and the charge pin are bonuses.
  sword: { tap: 'Three quick cuts', hold: 'Shield bash', perfect: 'Stuns all in front', also: 'Riposte after a parry' },
  greatsword: { tap: 'Wide, slow sweeps', hold: 'Overhead', perfect: 'Shockwave, knocks flat' },
  spear: { tap: 'Long thrusts', hold: 'Lunge through three', perfect: 'Pins all it runs through', also: 'Pins a charging goblin' },
  // Ranger (shared/ranger.ts): the short sword on a tap, the bow on a hold.
  longbow: { tap: 'Short sword', hold: 'Draw bow', perfect: 'Blinds and crits' },
  shortbow: { tap: 'Short sword', hold: 'Quick shot, walking', perfect: 'Full-power shot' },
  crossbow: { tap: 'Short sword', hold: 'Aim and fire', perfect: 'Glint: 1.5x, whole line', also: 'RELOAD winds it' },
  // Rogue (shared/venom.ts): the daggers' thrown knife is a drawn shot, so its flash is simply full power.
  daggers: { tap: 'Fast stabs', hold: 'Throw a dagger', perfect: 'Full-power throw', also: '2.5x from behind' },
  rapier: { tap: 'Long thrusts', hold: 'Lunge through two', perfect: 'Skewers, bleeds' },
  poisoner: { tap: 'Short sword, hits two', hold: 'Poison dart', perfect: 'Stuns, stronger poison' },
  // Mage (shared/mage.ts): the big spells cost magic (a Mage's bar, shared/barword.ts).
  wand: { tap: 'Sparks on the move', hold: 'Burst, costs magic', perfect: 'Interrupts any attack', also: 'Spark interrupts a wind-up' },
  staff: { tap: 'Close slash', hold: 'Raise a wall, costs magic', perfect: 'Bigger wall' },
  spellblade: { tap: 'Cuts charge the blade', hold: 'Wreathe the blade, costs magic', perfect: 'Free wreathe', also: 'Parry fills the blade' },
  // Cleric (shared/cleric.ts): every perfect shields friends near you.
  mace: { tap: 'Short blows, 3rd heals', hold: 'Smite, stuns', perfect: 'Harder, shields friends' },
  censer: { tap: 'Two cuts, healing swing', hold: 'Whirl, sets alight', perfect: 'Coals flare, shields friends' },
  flail: { tap: 'Wide shoves, 2nd heals', hold: 'Spin up, sweep', perfect: 'Stuns, shields friends' },
};

/** The rows in order, labelled, for a card or a legend (ALSO only where there is one). */
export const kitRows = (w: WeaponId): [string, string][] => {
  const k = KIT[w];
  return [['TAP', k.tap], ['HOLD', k.hold], ['PERFECT', k.perfect], ...(k.also ? [['ALSO', k.also] as [string, string]] : [])];
};

/** The laptop's hint line: "TAP: ...  HOLD: ...  PERFECT: ...". */
export const kitLine = (w: WeaponId): string => kitRows(w).filter(([l]) => l !== 'ALSO').map(([l, v]) => `${l}: ${v.toUpperCase()}`).join('  ');
