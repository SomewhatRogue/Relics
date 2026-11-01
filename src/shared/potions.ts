/**
 * Potions: three on a belt, one button drinks (or throws) the one at the front. Names from the lore
 * keeper: Sister Agne makes the Bitter; the watch drinks Wall Brandy on the wall.
 */
export type PotionId = 'bitter' | 'brandy' | 'oil' | 'frost' | 'smoke';
export const POTION_ORDER: PotionId[] = ['bitter', 'brandy', 'oil', 'frost', 'smoke'];

export const POTIONS: Record<PotionId, { name: string; short: string; text: string; price: number; thrown: boolean; col: string }> = {
  bitter: { name: "SISTER'S BITTER", short: 'BITTER', text: '40 health over 2 seconds. Tastes like a boot. Works.', price: 20, thrown: false, col: '#c0392b' },
  brandy: { name: 'WALL BRANDY', short: 'BRANDY', text: 'Full breath, and it comes back half again as fast for 6 seconds.', price: 15, thrown: false, col: '#d4a537' },
  oil: { name: 'LAMP OIL', short: 'OIL', text: 'Thrown where you aim. It bursts into flame.', price: 20, thrown: true, col: '#ff9a3c' },
  frost: { name: 'FROST FLASK', short: 'FROST', text: 'Thrown where you aim. It chills what it splashes; a second splash freezes.', price: 25, thrown: true, col: '#9fd0ff' },
  smoke: { name: 'SMOKE', short: 'SMOKE', text: 'Thrown where you aim. Goblins lose anyone standing in it.', price: 25, thrown: true, col: '#9a94a8' },
};

/** How potions work: Bitter heals `heal` over `healTime`; Brandy speeds breath by `brandyRegen` for `brandyTime`; flasks fly `flight` s to at most `range` tiles. */
export const POTION = { belt: 3, cooldown: 0.8, heal: 40, healTime: 2, brandyTime: 6, brandyRegen: 1.5, range: 5.5, fallback: 4, flight: 0.45, burst: 1.8, dmg: 8, smokeR: 2.2, smokeTime: 4.5, seen: 1.2 };

/**
 * What goblins leave (sim/pickups.ts): gold `chance` and range by kind (archers a little more; named
 * butchers always, a lot), potions by chance. Gold is split across the party when anyone picks it up.
 */
export const COINS = {
  scrapper: { chance: 0.7, min: 2, max: 6 },
  archer: { chance: 0.7, min: 3, max: 8 },
  butcher: { chance: 1, min: 15, max: 30 },
  named: { chance: 1, min: 60, max: 100 },
  life: 30,
  reach: 0.9,
};
export const POTION_DROPS = { scrapper: 0.08, archer: 0.1, butcher: 0.35, named: 1, weights: { bitter: 35, brandy: 25, oil: 15, frost: 10, smoke: 15 } as Record<PotionId, number> };
