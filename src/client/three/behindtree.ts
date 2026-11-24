/**
 * Is a body hidden by a tree's crown (docs/design/forest-redraw.md, "Behind a tree")? Kyle, 2026-11-24: a goblin
 * behind a tree is seen through it as a hero is (figmat.ts `xrayMaterial`), but only behind a tree: a wall still
 * hides whoever waits behind it. The tile redraw's tree cards (propcards.ts): a body stands behind one when it is
 * north of the trunk's foot, within the card's width, and no further back than the card is tall on the ground.
 * Drawing only; the map's trees (its own and the scatter's) found once a map.
 */
import type { GameMap } from '../../shared/arena';
import { scatterOf } from '../../shared/scatter';
import { REDRAW } from '../tilelook';
import { KX, KZ } from '../tilekit';
import { roundCut } from './propcards';

type Tree = { x: number; y: number; half: number; back: number };
const TREES = new WeakMap<GameMap, Tree[]>();
const KINDS = new Set(['tree', 'pine', 'deadtree', 'apple']);

function treesOf(m: GameMap): Tree[] {
  let t = TREES.get(m);
  if (!t) {
    t = [];
    for (const r of [...m.rounds, ...scatterOf(m).stand]) {
      const c = KINDS.has(r.kind) ? roundCut(r) : null;
      // (Half its width less a leaf's worth; its height on the ground less the bare trunk, about 10 pixels.)
      if (c && c.h >= 34) t.push({ x: r.x, y: r.y, half: c.w / KX / 2 - 0.15, back: (c.h - 10) / KZ });
    }
    TREES.set(m, t);
  }
  return t;
}

export function behindTree(m: GameMap, x: number, y: number): boolean {
  if (!REDRAW.on) return false;
  for (const t of treesOf(m)) if (y < t.y - 0.2 && t.y - y < t.back && Math.abs(x - t.x) < t.half) return true;
  return false;
}
