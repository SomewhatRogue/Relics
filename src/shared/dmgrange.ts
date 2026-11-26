import { SPREAD } from './tuning.js';

/** A weapon's spread either side of its base hit (SPREAD in tuning.ts, by weapon id; 0.15 if not named). */
export const spreadOf = (kit: string): number => SPREAD[kit] ?? SPREAD.default;

/** A weapon's range from its base hit: [low, high], rounded. */
export const rangeOf = (base: number, kit: string): [number, number] => {
  const s = spreadOf(kit);
  return [Math.round(base * (1 - s)), Math.round(base * (1 + s))];
};

/** What a hero's dice stream is kept on (a Hero has these). */
export interface Dice { id: string; weapon: string; dmgSeed?: number }

/**
 * One hit's roll: a factor even across [1 - s, 1 + s] for the hero's weapon, from the hero's own stream
 * (seeded from their name with a salt unlike the crit's, stepped each roll, so no other stream moves).
 */
/** A hero's first damage dice, from their name. Set when they join the room (sim/room.ts `join`), so the dice travel
 *  in the room's save: a handover renames the heroes, and dice seeded later from the new name would differ. */
export const dmgSeedOf = (id: string): number => [...id].reduce((a, c) => (a * 37 + c.charCodeAt(0)) >>> 0, 11);

export function rollDmg(h: Dice): number {
  let x = h.dmgSeed ?? dmgSeedOf(h.id);
  x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
  h.dmgSeed = x;
  const s = spreadOf(h.weapon);
  return 1 - s + (2 * s * x) / 4294967296;
}

/** A spell's or skill's roll for the hero who made it, or none if there is no hero (a weather strike, a lost owner). */
export const rollOf = (h?: Dice): number => (h ? rollDmg(h) : 1);
