/**
 * Wall Brandy while it lasts (shared/potions.ts, POTION): blows and shots land `brandyDmg` times as hard,
 * walking is `brandySpeed` as fast, and breath tops out at `brandyBreath` of full. The card's words and
 * these numbers are the same tuning.
 */
import { HERO, POTION } from '../shared/tuning';
import type { Hero } from './types';

const drunk = (h: Hero, now: number) => h.brandyUntil > now;
export const brandyDmg = (h: Hero, now: number) => (drunk(h, now) ? POTION.brandyDmg : 1);
export const brandySpeed = (h: Hero, now: number) => (drunk(h, now) ? POTION.brandySpeed : 1);
/** The most breath a hero can have now. */
export const breathCap = (h: Hero, now: number) => HERO.stamina * (drunk(h, now) ? POTION.brandyBreath : 1);
