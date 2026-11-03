/**
 * Potions: three on a belt, one button drinks (or throws) the one at the front. Names from the lore
 * keeper: Sister Agne makes the Bitter; the watch drinks Wall Brandy on the wall.
 */
export type PotionId = 'bitter' | 'brandy' | 'oil' | 'frost' | 'smoke';
export const POTION_ORDER: PotionId[] = ['bitter', 'brandy', 'oil', 'frost', 'smoke'];

/**
 * How potions work: Bitter heals `heal` over `healTime` (and cures poison); Brandy, for `brandyTime`,
 * multiplies your blows and shots by `brandyDmg`, your walking by `brandySpeed` and your breath (its
 * most) by `brandyBreath`; flasks fly `flight` s to at most `range` tiles.
 */
export const POTION = { belt: 3, cooldown: 0.8, heal: 40, healTime: 2, brandyTime: 6, brandyDmg: 2, brandySpeed: 0.5, brandyBreath: 0.5, range: 5.5, fallback: 4, flight: 0.45, burst: 1.8, dmg: 8, smokeR: 2.2, smokeTime: 4.5, seen: 1.2 };

/** What each does, in a line (Kyle, 2026-11-02: short and true to the sim; the numbers are POTION's). */
export const POTIONS: Record<PotionId, { name: string; short: string; text: string; price: number; thrown: boolean; col: string }> = {
  bitter: { name: "SISTER'S BITTER", short: 'BITTER', text: `Heals ${POTION.heal} over ${POTION.healTime} seconds and cures poison.`, price: 20, thrown: false, col: '#c0392b' },
  brandy: { name: 'WALL BRANDY', short: 'BRANDY', text: 'Doubles your damage, halves your speed and breath.', price: 15, thrown: false, col: '#d4a537' },
  oil: { name: 'LAMP OIL', short: 'OIL', text: 'Bursts into flame when thrown.', price: 20, thrown: true, col: '#ff9a3c' },
  frost: { name: 'FROST FLASK', short: 'FROST', text: 'Chills what it splashes. A second splash freezes.', price: 25, thrown: true, col: '#9fd0ff' },
  smoke: { name: 'SMOKE', short: 'SMOKE', text: 'Hides anyone in it from goblins, unless they\'re close.', price: 25, thrown: true, col: '#9a94a8' },
};

/** How long a drink lasts, for the card (seconds), when it's not in the text already. */
export const LASTS: Partial<Record<PotionId, number>> = { brandy: POTION.brandyTime };

/**
 * What goblins leave (sim/pickups.ts): gold `chance` and range by kind (archers a little more; named
 * butchers always, a lot), potions by chance. Gold is split across the party when anyone picks it up.
 */
export const COINS = {
  scrapper: { chance: 0.85, min: 2, max: 6 },
  archer: { chance: 0.85, min: 3, max: 8 },
  butcher: { chance: 1, min: 15, max: 30 },
  named: { chance: 1, min: 60, max: 100 },
  life: 30,
  reach: 0.9,
};
export const POTION_DROPS = { scrapper: 0.08, archer: 0.1, butcher: 0.35, named: 1, weights: { bitter: 35, brandy: 25, oil: 15, frost: 10, smoke: 15 } as Record<PotionId, number> };
