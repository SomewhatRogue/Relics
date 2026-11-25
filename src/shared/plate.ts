/**
 * Plate that breaks for good (Kyle, 2026-11-24; docs/design/armor.md). A plated goblin (every ironhide, a Plated
 * elite) carries plate as well as health. Until it runs out an ordinary blow does `through` of itself to health
 * and the whole of itself off the plate; a heavy one (charged, a perfect, a burst) lands in full and takes `heavy`
 * times itself off. At none the plates are off for the rest of the fight. Rules: sim/ironhide.ts.
 */
export const PLATE = {
  /** Plate, as a share of the goblin's health. */
  share: 0.5,
  /** What an ordinary blow does to its health while plated (at least 1). */
  through: 0.2,
  /** A heavy blow takes this many times itself off the plate. */
  heavy: 2,
  /** Lightning lands in full and strips this many times itself (iron draws it). */
  storm: 2,
  /** A rod's strike, a column, a cart: this share of the plate off at once. */
  crack: 0.4,
};

/**
 * Straight through the plate, in full and leaving it be (Kyle, 2026-11-24): crits, bleed, poison, crossbow bolts
 * and anything holy (a smite: the Cleric's light, blessing, censer flare, a mace's smite). Lightning goes through
 * too and strips it (`storm`). Backstabs and burns don't.
 */
export const THROUGH_SRC = ['bleed', 'poison', 'bolt', 'smite'];
