/**
 * A Mage's taps in the room, by element (numbers: shared/spellbook.ts TAPS, ICICLES). The wand's are
 * shots: fire a firebolt that sets alight, frost three icicles that slow, storm an arc that jumps on to
 * two more. The staff's slash and the spellblade's cuts carry the element on every blow that lands:
 * fire sets alight, frost chills, storm jumps on to the nearest one more. A tap never freezes.
 */
import { ICICLES, STORM, TAPS, type Augment, type MageKit, type Swing, type TraitId } from '../shared/tuning';
import { shoot } from './bolts';
import { afflict, chill, type World } from './elements';
import type { Bolt, Enemy, Hero } from './types';
import { ICICLE_SHARE } from './techmage';

/** How many more goblins a storm tap from this kit jumps to. */
export const tapJumps = (kit: string): number => TAPS[kit as MageKit]?.storm.jumps ?? STORM.chains;

/** The wand's tap, loosed: one bolt, or the fan of icicles. (`s.dmg` is already the element's: sim/channel.ts tapSwing.) */
export function castTap(h: Hero, s: Swing, el: Augment, mult: number, traits: TraitId[]): Bolt[] {
  if (el === 'frost') {
    const half = (ICICLES.n - 1) / 2;
    return Array.from({ length: ICICLES.n }, (_, i) => {
      const a = (i - half) * ICICLES.spread, c = Math.cos(a), n = Math.sin(a), aim = { ...h, fx: h.fx * c - h.fy * n, fy: h.fx * n + h.fy * c };
      return Object.assign(shoot(aim, { ...s, shot: 'lance', burst: 0, speed: (s.speed ?? 20) * ICICLES.speed }, el, mult, traits), { chills: true });
    });
  }
  const b = shoot(h, s, el, mult, traits);
  if (el === 'storm') b.jumps = tapJumps(h.weapon);
  return [b];
}

/** The element on a Mage's blow of `n` landing on `e` (a staff's slash, a spellblade's cut). Storm jumps
 *  on only from the first goblin a swing lands on (a sweep through a crowd would otherwise jump from each). */
export function tapElement(w: World, h: Hero, e: Enemy, el: Augment, n: number): void {
  if (el === 'frost') return chill(w, e);
  afflict(w, e, el, n, h.hitIds.filter((id) => id > 0 && id !== e.id).length ? 0 : tapJumps(h.weapon));
}

/** A shot's element landing: a tap's frost only chills; storm jumps as far as the shot says. */
export function shotElement(w: World, b: Bolt, e: Enemy): void {
  if (b.chills && b.el === 'frost') return chill(w, e, ICICLE_SHARE);
  afflict(w, e, b.el, b.dmg, b.jumps);
  if (b.freeze) afflict(w, e, b.el, b.dmg, b.jumps);
}
