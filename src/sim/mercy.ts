/**
 * The Cleric's class perk (Kyle, 2026-11-04, "like rogue backstab"): a Cleric never hurts a friend. No
 * blow, smite, shot, censer coal, fire or relic of theirs damages, knocks back or sets alight another
 * hero or anyone freed. Every path where the party's harm reaches a friend asks here first, by the id
 * the harm is credited to (a swing's hero, a shot's owner, a goblin's or prop's `lastBy`, a fire's).
 */
import { WEAPONS } from '../shared/tuning';
import type { Hero } from './types';

/** A Cleric right now (the class goes with the kit in hand). */
export const isCleric = (h: Hero | undefined) => !!h && WEAPONS[h.weapon].cls === 'HEALER';

/** Harm credited to `by` spares friends: `by` is a Cleric in this room. */
export const merciful = (heroes: Hero[], by: string | undefined) => !!by && isCleric(heroes.find((h) => h.id === by));
