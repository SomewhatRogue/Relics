/**
 * The weather's light, shared by both views: how thick the fog draws and in what colour (thicker away
 * from your hero, through light.ts in the flat view and the post pass in 2.5D), and a lightning flash
 * lifting the whole scene's light for a beat (sim/stormshape.ts flashOf says how bright). Drawing only.
 */
import type { Theme } from '../shared/arena';
import { fogged } from '../shared/sky';

type RGB = [number, number, number];

/** The fog as drawn: at its thickest `k` (0 to 1) and its colour, or null with none. Paler by day, dim at night. */
export function fogLook(theme: Theme): { k: number; c: RGB } | null {
  if (!fogged(theme)) return null;
  const k = 0.5 + 0.35 * Math.min(1, (theme.fog ?? 0.5) / 0.85);
  const a = theme.ambient, lum = Math.min(1, (a[0] + a[1] + a[2]) / 3 + (theme.moon ?? 0) * 0.25), m = 0.28 + 0.62 * lum;
  return { k, c: [0.62 * m, 0.67 * m, 0.74 * m] };
}

/** The ambient lifted by a flash `k` (0 to 1): a cold white over everything. */
export const flashAmb = (amb: RGB, k: number): RGB => (k > 0 ? [amb[0] + k * 1.0, amb[1] + k * 1.05, amb[2] + k * 1.2] : amb);

/** The theme with a flash in its light (the 2.5D sky light reads the ambient). */
export const flashTheme = (theme: Theme, k: number): Theme => (k > 0 ? { ...theme, ambient: flashAmb(theme.ambient, k) } : theme);
