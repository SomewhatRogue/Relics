/**
 * A felled tree on screen (sim/felling.ts). Three small things both views need:
 * - `syncFelled`: a friend's map was built from the seed and still has the tree; when the trunk's block arrives
 *   (it names the round, `stump`), the round is made the stump the room already made it. On the room's own
 *   screen this finds nothing to do.
 * - `felledCount`: how many trees have gone over, so the 2.5D view knows to rebuild its trees (three/ground.ts).
 * - `drawFalling` and `drawFallMark`: while a trunk is in the air (`lands`), the red mark where it will lie and
 *   the tree itself going over, drawn from the block alone so every screen shows the same fall.
 */
import type { Block, GameMap } from '../shared/arena';
import { FELL } from '../shared/tuning';
import { gradeSprite } from './darkgold';
import type { Ctx } from './draw';
import { floraLook } from './flora';
import { floraSprite } from './florasprites';
import { SPRITES } from './sprites';

export function syncFelled(map: GameMap): void {
  for (const b of map.blocks) {
    const t = b.stump === undefined ? undefined : map.rounds[b.stump];
    if (t && t.kind !== 'stump') Object.assign(t, { kind: 'stump', r: 0.3, look: undefined });
  }
}
export const felledCount = (map: GameMap): number => map.blocks.reduce((n, b) => n + (b.stump === undefined ? 0 : 1), 0);

/** How a felled trunk's `look` is packed (sim/felling.ts): which end its crown is, what tree it was, how big. */
export const trunkLook = (b: Pick<Block, 'look'>) => {
  const v = Math.max(0, (b.look ?? 10) - 10);
  return { far: (v & 1) === 1, wood: (v >> 1) & 3, size: (v >> 3) & 3 };
};

/** The red mark on the floor where a trunk in the air will lie: a filled box with a brighter edge. */
export function drawFallMark(g: CanvasRenderingContext2D, pts: [number, number][]): void {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(Math.round(x), Math.round(y)) : g.moveTo(Math.round(x), Math.round(y))));
  g.closePath();
  (g.fillStyle = 'rgba(200, 44, 36, 0.42)'), g.fill();
  (g.strokeStyle = 'rgba(255, 96, 72, 0.9)'), (g.lineWidth = 1), g.stroke();
}

/**
 * The tree going over, its foot at (sx, sy) on screen: sideways it swings down like a clock hand; away from you it
 * shortens; toward you it comes down over its own foot. Slow at first, then fast.
 */
export function drawFalling(c: Ctx, b: Block, map: GameMap, sx: number, sy: number): void {
  if (b.lands === undefined || b.stump === undefined) return;
  const t = map.rounds[b.stump], k = trunkLook(b), p = Math.max(0, Math.min(1, 1 - (b.lands - (c.t ?? b.lands)) / FELL.fall)), e = p * p;
  if (!t) return;
  const r = [0.3, 0.5, 0.7][k.size] ?? 0.5, kind = k.wood === 1 ? 'willow' : 'tree', along = b.w >= b.h;
  const s = gradeSprite(k.wood === 2 ? SPRITES.deadtree : floraSprite(kind, floraLook(kind, t.x, t.y, r)));
  const g = c.lit;
  g.save();
  g.translate(Math.round(sx), Math.round(sy));
  if (along) g.rotate((k.far ? -1 : 1) * e * Math.PI * 0.5);
  else g.scale(1, k.far ? 1 - e * 0.75 : 1 - e * 1.9);
  g.drawImage(s.c, -Math.round(s.w / 2), -s.h);
  g.restore();
}
