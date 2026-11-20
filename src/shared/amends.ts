/**
 * AMENDS, the code's penance (docs/design/holy-gear.md; holy-and-hungry section 3): what giving hungry gear up
 * adds, kept for good. Never shown as a number (Kyle, 2026-11-19): Father Odric says a line when it crosses a step.
 * Its steps paying in the church's best pieces are a later slice.
 */
import type { Item } from './loot.js';
import { HUNGER, type FedItem } from './hunger.js';

/** A piece's weight: 1, and 1 more for every `span` units it was worn (an old, sour piece is worth more). */
export const amendsOf = (it: Item) => 1 + Math.floor(Math.max(0, Number((it as FedItem).worn) || 0) / HUNGER.span);

/** Where Odric says something: each step crossed once. */
export const AMENDS_STEPS = [3, 8, 15, 25];

/** The step just crossed going from `was` to `now`, or -1. */
export function stepCrossed(was: number, now: number): number {
  for (let i = AMENDS_STEPS.length - 1; i >= 0; i--) if (was < AMENDS_STEPS[i] && now >= AMENDS_STEPS[i]) return i;
  return -1;
}
