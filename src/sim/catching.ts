/**
 * Fire taking hold of wood (sim/buildings.ts burns it). Dens, sheds and fences catch every time fire
 * reaches them; a house on a job takes its chance (CATCH in tuning.ts, rolled on the room's fire stream),
 * so a Mage fighting in the street now and then sets one going by accident, and a Lamp Oil flask
 * that bursts against one almost always does (Kyle, 2026-11-03: "a Mage can accidentally burn it down,
 * ditto anyone who throws fire oil").
 */
import { currentMap, type Block } from '../shared/arena';
import { burnable, kindling } from '../shared/kindling';
import { CATCH } from '../shared/tuning';
import type { World } from './elements';

export const wood = (b: Block) => b.hp !== undefined && !b.ruined;
export const burning = (b: Block) => (b.burning ?? -1) >= 0 && !b.ruined;

/** The nearest point of a block to (x, y), and how far it is. */
export function nearest(b: Block, x: number, y: number): [number, number, number] {
  const nx = Math.max(b.x, Math.min(b.x + b.w, x)), ny = Math.max(b.y, Math.min(b.y + b.h, y));
  return [nx, ny, Math.hypot(x - nx, y - ny)];
}

/** Yes `p` of the time, on the room's fire stream (a world without one: only the likely things). */
const roll = (w: Pick<World, 'rng'>, p: number) => p >= 1 || (w.rng ? w.rng.next() < p : p >= 0.5);

/** Set it alight: wood that isn't a house for certain, a house `chance` of the time. */
export function ignite(b: Block, w: Pick<World, 'now' | 'ev' | 'rng'>, chance = 1): void {
  if (!wood(b) || burning(b)) return;
  if (burnable(b) && !roll(w, chance)) return;
  b.burning = w.now;
  w.ev.push({ k: 'blaze', x: b.x + b.w / 2, y: b.y + b.h / 2 });
}

/** How far (x, y) is from a house's kindling spot (Infinity: it has none). */
function fromSpot(b: Block, x: number, y: number): number {
  const m = currentMap(), k = kindling(b, m);
  return k ? Math.hypot(k.x - x, k.y - y) : Infinity;
}

/**
 * A fire burst at (x, y) of reach `r`: an oil flask (`oil`) or a spell or relic's. Against a wall or on
 * the kindling, a house most likely catches; caught by the edge of a spell's burst, only now and then.
 */
export function burstCatch(b: Block, x: number, y: number, r: number, oil: boolean, w: World): void {
  const d = nearest(b, x, y)[2], spot = burnable(b) ? fromSpot(b, x, y) : Infinity;
  if (d > r && spot > 0.9) return;
  const hard = d <= CATCH.wall || spot <= 0.9;
  ignite(b, w, oil ? (spot <= 0.9 ? CATCH.spot : CATCH.oil) : hard ? CATCH.blast : CATCH.edge);
}

/** A fire shot with no burst (a spark, a fire arrow) striking a wall at (x, y). */
export function sparkCatch(x: number, y: number, w: World): void {
  for (const b of currentMap().blocks) if (wood(b) && nearest(b, x, y)[2] <= 0.5) ignite(b, w, CATCH.spark);
}

/** A Mage's Fire Ring going out from (x, y): any wood it reaches may catch. */
export function ringCatch(x: number, y: number, r: number, w: World): void {
  for (const b of currentMap().blocks) if (wood(b) && nearest(b, x, y)[2] <= r) ignite(b, w, CATCH.ring);
}
