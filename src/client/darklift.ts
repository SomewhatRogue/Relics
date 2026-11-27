/**
 * Dark maps a little lighter (Kyle, 2026-11-27: "maps are a little dark, maybe we increase light on dark maps by a
 * bit: dusk and night and caves"). Any map not in full daylight (dusk, night, underground, indoors) has its
 * ambient lifted by DARK_LIFT before either view lights it (scene.ts, three/lights3d.ts): still dark, the torches
 * still own the ground round them, but the shapes in between read.
 */
import type { Theme } from '../shared/arena';

/** 1.2 at first; 1.45 the same day (Kyle: "lets make dark brighter again"). */
export const DARK_LIFT = 1.45;

/** The ambient a theme is lit with: its own, lifted when it's not full day. */
export function liftedAmbient(t: Theme): [number, number, number] {
  const a = t.ambient;
  const dark = !t.day || t.time === 'dusk' || t.time === 'night';
  return !dark ? a : [Math.min(1, a[0] * DARK_LIFT), Math.min(1, a[1] * DARK_LIFT), Math.min(1, a[2] * DARK_LIFT)];
}
