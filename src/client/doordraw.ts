/**
 * A Doorkeeper drawn (sim/doorkeepers.ts, doorwall.ts): a big goblin (the butcher's body, a size up)
 * behind a barn door of planks and iron straps. The WALL holds its door square in front of it; the MOVER
 * carries its door to one side, ready to swing (the way to read which is which). While the door's open (its
 * blow and recovery, stunned or staggered, after a lock) it's swung out flat to the side; DOWN, it lies on
 * the floor beside it. Cut straps show bare. In phase 2 the survivor carries both doors, one behind the
 * other. Drawn in both views (the flat scene and the 2.5D cards call drawFoe). Only draws.
 */
import { doorShut } from '../sim/doorwall';
import type { Enemy } from '../sim/types';
import type { Ctx } from './draw';
import { drawEnemy } from './foes';

const WOOD = '#5a3d22', SEAM = '#3a2716', EDGE = '#24180e', IRON = '#4a4652', BARE = '#7a6a58';
const SIZE = 1.15;

export function drawKeeper(c: Ctx, e: Enemy, x: number, y: number, sleeping: boolean): void {
  const b = e.boss!, t = c.t ?? c.now, dead = e.act === 'dead';
  if (dead) return drawEnemy(c, e, x, y, sleeping);
  const shut = doorShut(e, t), down = b.downUntil > t, up = e.fy < -0.4, side = e.fx >= 0 ? 1 : -1;
  // Where the door is, as a box on screen: square in front (the wall), at its side (the mover), swung out (open).
  const doors = b.phase === 2 ? 2 : 1, mover = b.job === 'move';
  const W = !shut ? 4 : mover ? 9 : 15, H = 20, sx = Math.abs(e.fx) > Math.abs(e.fy);
  const dx = !shut ? side * 11 : sx ? side * 8 : mover ? side * 6 : Math.round(e.fx * 4), dy = up ? -5 : 3;
  const front = !up && !down;
  if (down) floorDoor(c, x + side * 10, y + 2, b.straps);
  if (!front && !down) for (let k = 0; k < doors; k++) door(c, x + dx - k * side * 2, y + dy - k * 2, sx && shut ? 5 : W, H, b.straps);
  big(c, e, x, y, sleeping);
  if (front) for (let k = doors - 1; k >= 0; k--) door(c, x + dx + k * side * 2, y + dy + k, sx && shut ? 5 : W, H, b.straps);
}

/** The body a size up, from its feet, on both layers. */
function big(c: Ctx, e: Enemy, x: number, y: number, sleeping: boolean): void {
  for (const g of [c.lit, c.glow]) g.save(), g.translate(x, y), g.scale(SIZE, SIZE), g.translate(-x, -y);
  drawEnemy(c, e, x, y, sleeping);
  for (const g of [c.lit, c.glow]) g.restore();
}

/** A door stood on its edge, its foot at (cx, fy): planks, two iron straps (bare where cut), a dark edge. */
function door(c: Ctx, cx: number, fy: number, w: number, h: number, cut: number): void {
  const l = c.lit, x0 = Math.round(cx - w / 2), y0 = Math.round(fy - h);
  l.fillStyle = EDGE;
  l.fillRect(x0 - 1, y0 - 1, w + 2, h + 2);
  l.fillStyle = WOOD;
  l.fillRect(x0, y0, w, h);
  l.fillStyle = SEAM;
  for (let px = x0 + 3; px < x0 + w - 1; px += 4) l.fillRect(px, y0 + 1, 1, h - 2);
  for (const [k, sy] of [[0, 0.25], [1, 0.72]] as const) {
    l.fillStyle = cut > k ? BARE : IRON;
    l.fillRect(x0, Math.round(y0 + h * sy), w, 2);
  }
  // (Nothing under the door glows through it.)
  c.glow.clearRect(x0 - 1, y0 + 3, w + 2, h - 2);
}

/** A door knocked flat (DOOR DOWN), lying by its feet. */
function floorDoor(c: Ctx, cx: number, fy: number, cut: number): void {
  const l = c.lit, x0 = Math.round(cx - 8), y0 = Math.round(fy - 5);
  l.fillStyle = EDGE;
  l.fillRect(x0 - 1, y0 - 1, 18, 8);
  l.fillStyle = WOOD;
  l.fillRect(x0, y0, 16, 6);
  l.fillStyle = cut ? BARE : IRON;
  l.fillRect(x0 + 4, y0, 2, 6), l.fillRect(x0 + 11, y0, 2, 6);
}
