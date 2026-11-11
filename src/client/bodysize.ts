/**
 * Body size, a test (Kyle, 2026-11-11: "goblins seem super small ... make them bigger but keep the map and
 * view the same"): heroes and goblins drawn 1x, 1.5x or 2x round their feet, the map and the camera as they
 * are. Drawing only: the fight (where blows land, the circles on the floor) is unchanged. Butchers and
 * bosses, already big, stay as they are. Remembered on this device; the SIZE button in options cycles it.
 */
import type { Ctx } from './draw';

const KEY = 'relic.bodysize', STEPS = [1, 1.5, 2];
let size = 1;
try {
  const v = Number(localStorage.getItem(KEY));
  if (STEPS.includes(v)) size = v;
} catch {
  /* this session only */
}

/** The size now. */
export const bodySize = () => size;

/** The next step round (1, 1.5, 2), remembered. */
export function nextBodySize(): number {
  size = STEPS[(STEPS.indexOf(size) + 1) % STEPS.length];
  try {
    localStorage.setItem(KEY, String(size));
  } catch {
    /* this session only */
  }
  return size;
}

/** Run `draw` with both layers scaled by the body size round the feet at (x, y). */
export function sized(c: Ctx, x: number, y: number, draw: () => void, on = true): void {
  if (!on || size === 1) return draw();
  for (const g of [c.lit, c.glow]) g.save(), g.translate(x, y), g.scale(size, size), g.translate(-x, -y);
  try {
    draw();
  } finally {
    c.lit.restore(), c.glow.restore();
  }
}
