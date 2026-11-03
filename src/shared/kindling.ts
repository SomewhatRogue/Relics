/**
 * The kindling spot of a house on a job (Kyle, 2026-11-03: "not right at the door; maybe a spot to the
 * side that glints a little as you get close, but always the same spot"). One per small house you
 * could walk into: a woodpile stacked against a side wall, its side and height picked from the house's
 * own seed, so it's the same spot on every screen and every visit. A house already burning, fallen in
 * across its door, a den or a town building has none. The rules (sim/kindle.ts) and the drawing
 * (client/kindledraw.ts, the woodpile in 2.5D) both read it from here.
 */
import type { Block } from './arena.js';
import { Rng } from './rng.js';
import { HOUSEBURN } from './tuning.js';

export interface Kindling { x: number; y: number; side: -1 | 1 }

/** A house on a job that fire can take: one you could walk into, standing (or half fallen in). */
export const burnable = (b: Block) =>
  !!b.door && (b.kind === 'house' || b.kind === 'barn') && b.look !== undefined && !!b.maxHp && b.fate !== 'burning' && b.fate !== 'blocked';
/** Alight now (catching or burning), and not yet fallen in. */
export const houseAlight = (b: Block) => burnable(b) && (b.burning ?? -1) >= 0 && !b.ruined;

const inside = (q: Block, x: number, y: number, pad: number) => !q.ruined && x > q.x - pad && x < q.x + q.w + pad && y > q.y - pad && y < q.y + q.h + pad;

const cache = new WeakMap<Block, Kindling | null>();

/** Where this house's kindling is (null: it has none). `blocks` and `w` are its room's, so a spot is never inside a wall. */
export function kindling(b: Block, blocks: Block[], w: number, h = Infinity): Kindling | null {
  if (!b.door || (b.kind !== 'house' && b.kind !== 'barn') || b.look === undefined || !b.maxHp || b.fate === 'burning' || b.fate === 'blocked') return null;
  const had = cache.get(b);
  if (had !== undefined) return had;
  const rng = new Rng(b.look * 37 + 11), first: -1 | 1 = rng.next() < 0.5 ? -1 : 1, up = rng.range(0.42, 0.7);
  let out: Kindling | null = null;
  for (const side of [first, -first as -1 | 1]) for (const k of [up, 0.55, 0.3]) {
    const x = side < 0 ? b.x - 0.32 : b.x + b.w + 0.32, y = b.y + b.h * k;
    // Room to stand beside it: clear of every other wall, inside the room.
    const sx = x + side * 0.45;
    if (sx < 0.6 || sx > w - 0.6 || y < 0.8 || y > h - 0.8) continue;
    if (blocks.some((q) => q !== b && (inside(q, sx, y, 0.35) || inside(q, x, y, 0.05)))) continue;
    out = { x, y, side };
    break;
  }
  cache.set(b, out);
  return out;
}

/** How long it takes to light, and how long it burns before the roof comes in, by the house. */
export function fireTimes(b: Block): { light: number; catch: number; burn: number } {
  const big = !!b.big;
  return { light: big ? HOUSEBURN.lightBig : HOUSEBURN.light, catch: HOUSEBURN.catch, burn: big ? HOUSEBURN.burnBig : b.kind === 'barn' ? HOUSEBURN.burnBarn : HOUSEBURN.burn };
}
