/**
 * A Cleric raising a friend who is out kneels by them (sim/raise.ts decides it; the friend carries
 * `riseBy` and `riseAt`, so nothing more comes over the wire). Each frame, before the heroes are drawn
 * (the flat scene and the 2.5D cards: both draw the same figure), the room's heroes are looked over once
 * and each Cleric at it is noted with which side the friend lies and how far into the raise they are;
 * idlepose.ts kneels them and idledraw.ts puts the light in their hands. Drawing only.
 */
import { RAISE } from '../shared/tuning';
import type { Hero } from '../sim/types';

/** `side`: the friend's side (1 right, -1 left); `down`: how far down on the knee (0..1, over KNEEL_IN s); `share`: of the raise. */
export interface Kneel { side: number; down: number; share: number }
/** Seconds to get down on the knee. */
export const KNEEL_IN = 0.3;

let kneels = new WeakMap<Hero, Kneel>();

/** Note who's kneeling this frame (`t`: the room's time). */
export function noteKneels(heroes: readonly Hero[], t: number): void {
  kneels = new WeakMap();
  for (const o of heroes) {
    if (!o.out || !o.riseBy || o.riseAt === undefined || o.riseAt < 0) continue;
    const c = heroes.find((h) => h.id === o.riseBy);
    if (!c) continue;
    const since = Math.max(0, t - o.riseAt);
    kneels.set(c, { side: o.x < c.x ? -1 : 1, down: Math.min(1, since / KNEEL_IN), share: Math.min(1, since / RAISE.time) });
  }
}

/** This hero kneeling to raise a friend now, or null. */
export const kneelOf = (h: Hero): Kneel | null => kneels.get(h) ?? null;
