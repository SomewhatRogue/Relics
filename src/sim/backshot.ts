/**
 * A Rogue's backstab from range: a poisoner's dart or a thrown knife that takes a goblin in the
 * back lands at that weapon's backstab rate, the same as a blade there would (combat.ts hitEnemy).
 */
import { GUARD, WEAPONS } from '../shared/tuning';
import { knack } from './gearstats';
import { rearCos } from './knacks';
import type { Bolt, Enemy, Hero } from './types';

/** Shots a Rogue throws or looses (not spells, nets or flasks). */
export const rogueShot = (b: Bolt) => b.kind === 'bolt' || b.kind === 'knife' || b.kind === 'dart';

/** The shot is travelling the way the goblin faces: it takes it in the back. */
export function fromBehind(e: Enemy, dx: number, dy: number, h?: Hero): boolean {
  const l = Math.hypot(dx, dy) || 1, fl = Math.hypot(e.fx, e.fy) || 1;
  // From the goblin, the shot came from -(dx, dy): behind when that points away from its facing.
  return (e.fx * -dx + e.fy * -dy) / (l * fl) < (h ? rearCos(h) : -0.3);
}

/** How much harder a backstab lands for this hero's weapon and knacks. */
export function backstabOf(h: Hero): number {
  const w = WEAPONS[h.weapon];
  return (w.backstab ?? GUARD.rearMult) * (1 + knack(h, 'rear'));
}
