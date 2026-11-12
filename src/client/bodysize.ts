/**
 * Body size, a test (Kyle, 2026-11-11: "goblins seem super small ... make them bigger but keep the map and
 * view the same"), now the art pass's stopgap (docs/design/art-pass.md, 1.5x picked): goblins not yet
 * redrawn are stretched 1.5x round their feet, so they stand at the picked size beside the redrawn heroes
 * (heroscale.ts, never stretched). Drawing only: the fight (where blows land, the circles on the floor) is
 * unchanged. Butchers and bosses, already big, stay as they are. The SIZE button in options still cycles it
 * (remembered on this device); both go once every goblin is redrawn.
 */
import type { Ctx } from './draw';

const KEY = 'relic.bodysize2', STEPS = [1, 1.5, 2];
let size = 1.5;
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
