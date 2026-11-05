/**
 * A Mage's taps in the room, by element (numbers: shared/spellbook.ts TAPS, ICICLES, STREAM). The wand's
 * are shots: fire a firebolt that sets alight, frost three icicles that slow, storm the stream of
 * lightning (sim/stream.ts). The staff's slash and the spellblade's cuts carry the element on every blow
 * that lands: fire sets alight, frost chills, storm ignores shields and jumps between wet goblins. A tap
 * never freezes.
 */
import { ICICLES, STORM, WEAPONS, type Augment, type Swing, type TraitId } from '../shared/tuning';
import { shoot } from './bolts';
import { castElement } from './channel';
import { afflict, chill, newCast, type World } from './elements';
import { feedStream, streams } from './stream';
import type { Bolt, Enemy, Hero } from './types';
import { ICICLE_SHARE } from './techmage';
import { wet } from './wet';

/** The wand's tap, loosed: one bolt, the fan of icicles, or (storm) the stream fed, no bolt at all.
 *  (`s.dmg` is already the element's: sim/channel.ts tapSwing.) */
export function castTap(h: Hero, s: Swing, el: Augment, mult: number, traits: TraitId[], now: number): Bolt[] {
  if (el === 'storm' && streams(h)) return feedStream(h, s.dmg * mult, now), [];
  if (el === 'frost') {
    const half = (ICICLES.n - 1) / 2;
    return Array.from({ length: ICICLES.n }, (_, i) => {
      const a = (i - half) * ICICLES.spread, c = Math.cos(a), n = Math.sin(a), aim = { ...h, fx: h.fx * c - h.fy * n, fy: h.fx * n + h.fy * c };
      return Object.assign(shoot(aim, { ...s, shot: 'lance', burst: 0, speed: (s.speed ?? 20) * ICICLES.speed }, el, mult, traits), { chills: true });
    });
  }
  return [shoot(h, s, el, mult, traits)];
}

/** A staff's slash or a spellblade's cut in storm: it goes past a shield-bearer's board. */
export const stormCut = (h: Hero, s: Swing) => WEAPONS[h.weapon]?.cls === 'MAGE' && castElement(h) === 'storm' && (!!s.slash || (!!WEAPONS[h.weapon].spellblade && !h.heavy));

/** The element on a Mage's blow of `n` landing on `e` (a staff's slash, a spellblade's cut). Storm jumps
 *  from each wet goblin it lands on, to each wet one at most once a swing (`h.swingCast`). */
export function tapElement(w: World, h: Hero, e: Enemy, el: Augment, n: number): void {
  if (el === 'frost') return chill(w, e);
  // (The blow was counted wet already: its jumps go by the blow before it.)
  afflict(w, e, el, el === 'storm' && wet(e) ? Math.round(n / STORM.wet) : n, { cast: (h.swingCast ??= newCast()) });
}

/** A shot's element landing: a tap's frost only chills; storm jumps once a shot to each wet goblin. */
export function shotElement(w: World, b: Bolt, e: Enemy): void {
  if (b.chills && b.el === 'frost') return chill(w, e, ICICLE_SHARE);
  const how = { cast: (b.cast ??= newCast()) };
  afflict(w, e, b.el, b.dmg, how);
  if (b.freeze) afflict(w, e, b.el, b.dmg, how);
}
