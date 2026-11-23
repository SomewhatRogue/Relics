/**
 * The spear thrown on its chain (Kyle, 2026-11-16; numbers shared/warrior.ts SPEAR_CHAIN): it flies as the
 * grappling hook does (sim/hook.ts), with the hold's damage. A small goblin it reaches is reeled in to your
 * feet and knocked down; anything bigger, or a wall, pulls you to it. Let go on the white flash, it flies further.
 */
import { SPEAR_CHAIN, type Swing } from '../shared/tuning';
import { SICKLE_THROW } from '../shared/sickle';
import { fireHook } from './hook';
import type { Hero, Hook } from './types';

export function throwSpear(h: Hero, s: Swing, mult: number): Hook {
  const dmg = Math.max(1, Math.round(s.dmg * mult));
  // The chain sickle (shared/sickle.ts): snags only fully spun; on the flash the goblin it snags bleeds.
  if (s.sickle) return { ...fireHook(h), el: '', spear: { dmg, range: h.perfect ? SICKLE_THROW.big : SICKLE_THROW.range }, sickle: { full: h.power >= 0.999, bleed: h.perfect } };
  return { ...fireHook(h), el: '', spear: { dmg, range: h.perfect ? SPEAR_CHAIN.big : SPEAR_CHAIN.range } };
}
