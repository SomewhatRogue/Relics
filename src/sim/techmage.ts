/**
 * The Mage's techniques in the room (numbers: shared/techniques.ts). PRIMED SPELLS: a primed spell
 * hits harder. ATTUNED: a Mage's fire burns longer, chilling hits build up to a freeze, and storm's
 * bonus on wet goblins is bigger. SPELLTHIEF: a hold let go on the flash gives some magic back. Who set
 * an element off is the goblin's `lastBy` (every blow and shot sets it before its element lands).
 */
import { BURN, HERO, ICICLES, WEAPONS } from '../shared/tuning';
import { ATTUNED, PRIMED, SPELLTHIEF, knowsTech } from '../shared/techniques';
import type { World } from './elements';
import type { Enemy, FightEvent, Hero } from './types';

/** PRIMED SPELLS: what a primed spell's multiplier goes up by. */
export const primedMore = (h: Hero) => (knowsTech(h, 'primed') ? PRIMED.more : 0);

/** The Mage who set off an element on `e`, if they know ATTUNED. */
export function attunedBy(w: World, e: Enemy): Hero | undefined {
  const h = e.lastBy ? w.heroes.find((x) => x.id === e.lastBy) : undefined;
  return h && WEAPONS[h.weapon]?.cls === 'MAGE' && knowsTech(h, 'attuned') ? h : undefined;
}

/** ATTUNED fire: a goblin just set alight by an attuned Mage burns `burn` times as long. */
export function burnLonger(w: World, e: Enemy): void {
  if (e.burnUntil <= w.now || !attunedBy(w, e)) return;
  const until = w.now + BURN.time * ATTUNED.burn;
  if (until > e.burnUntil) (e.burnUntil = until), w.ev.push({ k: 'attuned', x: e.x, y: e.y, el: 'fire' });
}

/**
 * ATTUNED frost: a chilling hit (`share` of one: a wand's icicle is a third) on a goblin already chilled
 * builds rime; at ATTUNED.freezeAt it freezes. True when it should freeze now (the caller freezes it).
 */
export function rimeUp(w: World, e: Enemy, share: number): boolean {
  if (!attunedBy(w, e)) return false;
  // Chilled afresh: the rime starts over.
  if (e.chillUntil <= w.now) return void (e.rime = share), false;
  e.rime = (e.rime ?? 0) + share;
  if (e.rime < ATTUNED.freezeAt - 1e-6) return false;
  e.rime = 0;
  w.ev.push({ k: 'attuned', x: e.x, y: e.y, el: 'frost' });
  return true;
}

/** A wand icicle's share of a chilling hit. */
export const ICICLE_SHARE = 1 / ICICLES.n;

/**
 * ATTUNED storm: the wet bonus (Kyle, 2026-11-04: storm jumps only to wet goblins now, and hits them
 * harder). Hook for the wet rule's code (built in wt-storm): it multiplies a storm hit on a wet goblin
 * by `wetMult(h, base)` instead of its own `base` (1.5).
 */
export const wetMult = (h: Hero | undefined, base: number) => (h && WEAPONS[h.weapon]?.cls === 'MAGE' && knowsTech(h, 'attuned') ? ATTUNED.wet : base);

/** SPELLTHIEF: a hold let go on the flash gives back half of what this kit's hold costs (`cost`, before
 *  the flash made a spellblade's free). */
export function spellthief(h: Hero, cost: number, ev: FightEvent[]): void {
  if (!h.perfect || !knowsTech(h, 'spellthief') || !WEAPONS[h.weapon]?.heavy.spell) return;
  const n = Math.round(cost * SPELLTHIEF.back);
  if (n <= 0) return;
  h.stamina = Math.min(HERO.stamina, h.stamina + n);
  ev.push({ k: 'spellthief', x: h.x, y: h.y, n });
}
