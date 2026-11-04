/**
 * A Mage's quick cast (the tap), seen: where it is in its cast (gathering at the focus, or just let go),
 * the colour it is cast in, and how bright the hand burns, for the flourish in hand (castflourish.ts),
 * both views' light passes, the trail and impact (fxmagetap.ts) and the sounds (magesfx.ts). Read
 * from what the room already keeps on the hero and its bolts; the fight's numbers are untouched.
 */
import { WEAPONS, type Augment } from '../shared/tuning';
import { castElement } from '../sim/channel';
import { currentSwing } from '../sim/hero';
import type { Bolt, Hero } from '../sim/types';

/** How long the release flourish lasts (s) after the spell or cut goes out. */
export const TAP_OUT = 0.16;

export interface TapCast { wind: boolean; k: number; age: number }
const T: TapCast = { wind: false, k: 0, age: 0 };

/** A Mage's tap in hand now: gathering (`wind`, `k` 0..1 through the wind-up) or just let go (`age` s); null otherwise. Reused: read it at once. */
export function tapCast(h: Hero): TapCast | null {
  if (WEAPONS[h.weapon].cls !== 'MAGE' || h.act !== 'attack' || h.heavy) return null;
  const s = currentSwing(h);
  if (s.wall) return null;
  if (h.actT < s.windup) return (T.wind = true), (T.k = h.actT / Math.max(0.01, s.windup)), (T.age = 0), T;
  const age = h.actT - s.windup;
  return age < TAP_OUT ? ((T.wind = false), (T.k = 1), (T.age = age), T) : null;
}

/** Wreathed now (or about to be, on the cut being wound up). */
const wreathing = (h: Hero) => (h.wreathe ?? 0) > 0 && !!h.wreatheEl;

/** The colour a tap is cast in: the wand's and staff's in their element; a spellblade's cut in its
 *  wreathe's while wreathed, else the blade's own violet (an unwreathed cut carries no element). */
export function tapEl(h: Hero): Augment {
  if (WEAPONS[h.weapon].spellblade) return wreathing(h) ? h.wreatheEl! : '';
  return castElement(h);
}

/** How brightly the hand burns with the cast (0..1): rising through the wind-up, a flash as it goes. */
export function tapGlow(h: Hero): number {
  const t = tapCast(h);
  if (!t) return 0;
  return t.wind ? 0.25 * t.k : Math.max(0, 1 - t.age / (TAP_OUT * 0.75));
}

/** The Mage's spells in flight last frame (where, in what), to tell what a spark or lance hit was in. */
const flying: { x: number; y: number; el: Augment }[] = [];
export function noteBolts(bolts: readonly Bolt[]): void {
  flying.length = 0;
  for (const b of bolts) if (b.kind === 'spark' || b.kind === 'lance') flying.push({ x: b.x, y: b.y, el: b.el });
}

/** The kits whose quick blows these are, by a hit's `src`. */
export const TAP_SRC = new Set(['spark', 'lance', 'staff', 'spellblade']);

/** What a Mage's hit at (x, y) from `src` was in: the spell nearest it last frame, or the caster's. */
export function hitEl(src: string, x: number, y: number, heroes: readonly Hero[]): Augment {
  if (src === 'spark' || src === 'lance') {
    let best: Augment | null = null, bd = 2.5;
    for (const f of flying) {
      const d = Math.hypot(f.x - x, f.y - y);
      if (d < bd) (bd = d), (best = f.el);
    }
    if (best !== null) return best;
  }
  const kit = src === 'spark' || src === 'lance' ? 'wand' : src;
  let h: Hero | undefined, hd = Infinity;
  for (const o of heroes) {
    if (o.weapon !== kit) continue;
    const d = Math.hypot(o.x - x, o.y - y);
    if (d < hd) (hd = d), (h = o);
  }
  if (!h) return 'fire';
  return kit === 'spellblade' ? (h.wreathed && h.wreatheEl ? h.wreatheEl : '') : castElement(h);
}

/** The hero who made an event at (x, y) (the room puts a shot or slash at the caster's feet). */
export function heroAt(heroes: readonly Hero[], x: number, y: number): Hero | undefined {
  let best: Hero | undefined, bd = 1.5;
  for (const h of heroes) {
    const d = Math.hypot(h.x - x, h.y - y);
    if (d < bd) (bd = d), (best = h);
  }
  return best;
}
