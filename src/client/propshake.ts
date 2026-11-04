/**
 * A prop that takes a blow and holds (a cage, a barrel, a crate, a larder rack) is knocked about on its
 * spot a moment: a fast, dying shudder from the room's `hitAt`, the same in the flat view and the 2.5D
 * one (Kyle, 2026-11-04: "it's not clear when you're hitting the cage"). Drawing only.
 */
import { PROP } from '../shared/tuning';
import type { Prop } from '../sim/types';

/** How far off its spot (tiles, x and y) a prop is drawn at room time `t`. */
export function propShake(p: Prop, t: number): [number, number] {
  const k = t - p.hitAt;
  if (k < 0 || k >= PROP.shake || p.lifted) return [0, 0];
  const a = 1 - k / PROP.shake, s = Math.sin(k * 75) * a;
  return [s * 0.13, Math.cos(k * 60) * a * 0.04];
}

/** The white flash on a hit (both views). */
export const propFlash = (p: Prop, t: number) => t - p.hitAt < 0.08 && t >= p.hitAt;
