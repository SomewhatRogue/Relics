/**
 * THE YARD's own small helpers (shared/tollanyard.ts): a goblin set down busy on the level under it, and a straight
 * run of blocks (a wall, a row of hurdles). The clumps and sprinkles are THE RISE's (shared/lowfurrowrisekit.ts),
 * used as they are. Pure.
 */
import type { BlockKind } from './arena.js';
import { cast } from './encounter.js';
import type { Role } from './encounters.js';
import { block, claim, type Kit } from './expedkit.js';
import type { Foe } from './terrain.js';
import type { YardLand } from './tollanyardland.js';

export { clump, markAt, sprinkle } from './lowfurrowrisekit.js';

/** One of `pack` as `role` at (x, y) give or take the seed's nudge, standing on the level there. */
export function put(k: Kit, land: YardLand, x: number, y: number, pack: number, role: Role, more: Partial<Foe> = {}, nudge = 0.3): Foe {
  const px = x + k.rng.range(-nudge, nudge), py = y + k.rng.range(-nudge, nudge);
  const f = Object.assign(cast({ kind: 'scrapper', x: px, y: py, pack }, role), more);
  const z = land.lv(px, py);
  if (z) f.z = z;
  else delete f.z;
  k.foes.push(f), claim(k, px, py, 0.6);
  return f;
}

/** Blocks of `kind` end to end from x0 to x1 at y (`t` thick), or, with `down`, from y0 to y1 at x. */
export function across(k: Kit, kind: BlockKind, y: number, x0: number, x1: number, t: number, step = 3): void {
  for (let x = x0; x < x1 - 0.01; x += step) block(k, kind, x, y, Math.min(step, x1 - x), t);
}
export function down(k: Kit, kind: BlockKind, x: number, y0: number, y1: number, t: number, step = 3): void {
  for (let y = y0; y < y1 - 0.01; y += step) block(k, kind, x, y, t, Math.min(step, y1 - y));
}
