/**
 * Potions: three on a belt, one button drinks (or throws) the one at the front. Names from the lore
 * keeper: Sister Agne makes the Bitter; the watch drinks Wall Brandy on the wall.
 */
import { shown } from './shown.js';
export type PotionId = 'bitter' | 'brandy' | 'oil' | 'frost' | 'smoke';
/**
 * The potions that can be had: bought, dropped or found (Kyle, 2026-11-04: "just have Bitter (healing)
 * and Brandy"). Lamp Oil, the frost flask and the smoke flask stay in the code, dormant: nothing sells,
 * drops or teaches them, and a save's belt turns them into Bitter (client/save.ts). Oil barrels in the
 * world are props, not this, and still burn.
 */
export const POTION_ORDER: PotionId[] = ['bitter'];
/** Kyle, 2026-11-12: "only have healing potions be what drops": the Brandy sleeps too, for now. */
export const DORMANT_POTIONS: PotionId[] = ['brandy', 'oil', 'frost', 'smoke'];

/**
 * How potions work: Bitter heals `heal` over `healTime` (and cures poison); Brandy, for `brandyTime`,
 * multiplies your blows and shots by `brandyDmg`, your walking by `brandySpeed` and your breath (its
 * most) by `brandyBreath`; flasks fly `flight` s to at most `range` tiles.
 */
export const POTION = { belt: 3, cooldown: 0.8, heal: 40, healTime: 2, brandyTime: 6, brandyDmg: 2, brandySpeed: 0.5, brandyBreath: 0.5, range: 5.5, fallback: 4, flight: 0.45, burst: 1.8, dmg: 8, smokeR: 2.2, smokeTime: 4.5, seen: 1.2 };

/** What each does, a few words for the EFFECT row (Kyle, 2026-11-02: short and true to the sim; the numbers are POTION's). */
export const POTIONS: Record<PotionId, { name: string; short: string; text: string; price: number; thrown: boolean; col: string }> = {
  bitter: { name: "SISTER'S BITTER", short: 'BITTER', text: `Heals ${shown(POTION.heal)}, cures poison`, price: 25, thrown: false, col: '#c0392b' },
  brandy: { name: 'WALL BRANDY', short: 'BRANDY', text: 'Double damage. Half speed, half stamina', price: 20, thrown: false, col: '#d4a537' },
  oil: { name: 'LAMP OIL', short: 'OIL', text: 'Bursts into flames where it lands', price: 25, thrown: true, col: '#ff9a3c' },
  frost: { name: 'FROST FLASK', short: 'FROST', text: 'Chills goblins it splashes. Two splashes freeze', price: 30, thrown: true, col: '#9fd0ff' },
  smoke: { name: 'SMOKE FLASK', short: 'SMOKE', text: 'Goblins can\'t see anyone in the smoke unless close', price: 30, thrown: true, col: '#9a94a8' },
};

/** How long a drink lasts, for the card's LASTS row (seconds): the Bitter heals over this, the Brandy holds this long. */
export const LASTS: Partial<Record<PotionId, number>> = { bitter: POTION.healTime, brandy: POTION.brandyTime, smoke: POTION.smokeTime };

/**
 * What goblins leave (sim/pickups.ts), in copper: a goblin now and then a few copper (archers a little
 * more), a butcher a silver half the time, a named butcher a sure silver (economy.md
 * slice 2: the job's pay is most of a job's take, scripts/income.ts). Potions by chance. One pot for the party.
 */
export const COINS = {
  scrapper: { chance: 0.3, min: 1, max: 3 },
  archer: { chance: 0.35, min: 2, max: 4 },
  butcher: { chance: 0.5, min: 100, max: 100 },
  named: { chance: 1, min: 100, max: 100 },
  life: 30,
  reach: 0.9,
};
export const POTION_DROPS = { scrapper: 0.08, archer: 0.1, butcher: 0.35, named: 1, weights: { bitter: 35, brandy: 0, oil: 0, frost: 0, smoke: 0 } as Record<PotionId, number> };
