/**
 * A Doorkeeper drawn (sim/doorkeepers.ts, doorwall.ts): a big goblin (the butcher's body, a size up)
 * behind a barn door of planks and iron straps. The WALL holds its door square in front of it; the MOVER
 * carries its door to one side, ready to swing (the way to read which is which). While the door's open (its
 * blow and recovery, stunned or staggered, after a lock) it's swung out flat to the side; DOWN, it lies on
 * the floor beside it. Cut straps show bare. In phase 2 the survivor carries both doors, one behind the
 * other, ENRAGED: its eyes burn red and a red heat comes off it. Drawn in both views (the flat scene and the 2.5D cards call drawFoe). Only draws.
 */
import { doorShut } from '../sim/doorwall';
import type { Enemy } from '../sim/types';
import type { Ctx } from './draw';
import { drawEnemy } from './foes';
import { gobPen } from './gobpen';
import { ease, shadow } from './draw';
import { leapFlight } from '../sim/bossleap';
import { DOORKEEPERS } from '../shared/tuning';
import { PX } from './world';

const WOOD = '#5a3d22', GRAIN = '#6c4c2c', SEAM = '#3a2716', EDGE = '#24180e', IRON = '#4a4652', BARE = '#7a6a58';

export function drawKeeper(c: Ctx, e: Enemy, x: number, y: number, sleeping: boolean): void {
  const b = e.boss!, t = c.t ?? c.now, dead = e.act === 'dead';
  if (dead) return drawEnemy(c, e, x, y, sleeping);
  // Up and over on a VAULT (sim/bossleap.ts): carried toward the circle, door and all, high over its shadow.
  const k = leapFlight(e, 'vault', DOORKEEPERS.air);
  if (k >= 0) {
    const a = e.attack!, m = ease(k), up = Math.round(Math.sin(Math.PI * k) * 30);
    x += (a.cx - e.x) * PX * m, y += (a.cy - e.y) * PX * m;
    shadow(c, x, y, Math.max(6, 11 - Math.round(up / 5)));
    y -= up;
  }
  const shut = doorShut(e, t), down = b.downUntil > t, up = e.fy < -0.4, side = e.fx >= 0 ? 1 : -1;
  // Where the door is, as a box on screen: square in front (the wall), at its side (the mover), swung out (open).
  const doors = b.phase === 2 ? 2 : 1, mover = b.job === 'move';
  const W = !shut ? 4 : mover ? 9 : 15, H = 20, sx = Math.abs(e.fx) > Math.abs(e.fy);
  const dx = !shut ? side * 11 : sx ? side * 8 : mover ? side * 6 : Math.round(e.fx * 4), dy = up ? -5 : 3;
  const front = !up && !down, who = b.who as 'latch' | 'hasp';
  // The doors in the old pixels through the pen (1.5x, whole pixels: gobpen.ts); the body a size up (foes.ts).
  const p = gobPen(c, x, y);
  if (down) floorDoor(p, x + side * 10, y + 2, b.straps);
  if (!front && !down) for (let k = 0; k < doors; k++) door(p, x + dx - k * side * 2, y + dy - k * 2, sx && shut ? 5 : W, H, b.straps, shut && !sx ? who : undefined);
  drawEnemy(c, e, x, y, sleeping);
  if (b.phase === 2) mad(c, e, x, y, t);
  if (front) for (let k = doors - 1; k >= 0; k--) door(p, x + dx + k * side * 2, y + dy + k, sx && shut ? 5 : W, H, b.straps, shut && !sx ? who : undefined);
}

/** ENRAGED (its partner dead): eyes burning red, beating, and red heat rising off its shoulders (glow, unlit). */
function mad(c: Ctx, e: Enemy, x: number, y: number, t: number): void {
  // (The body a size up at 1.5x: its eyes 32 rows over the feet, its shoulders 38.)
  const g = c.glow, f = e.fx >= -0.2 ? 1 : -1, beat = Math.floor(t * 8) % 2, hy = Math.round(y - 32);
  // Over its own eyes, bigger and burning.
  g.fillStyle = beat ? '#ff2a1a' : '#ff6a4a';
  g.fillRect(Math.round(x + f - 4), hy, 3, 2);
  g.fillRect(Math.round(x + f + 2), hy, 3, 2);
  g.fillStyle = '#c0281a';
  for (let i = 0; i < 5; i++) {
    const k = (t * 0.9 + i * 0.2) % 1;
    g.fillRect(Math.round(x + (i - 2) * 7), Math.round(y - 42 - k * 15), 1, 3 - Math.floor(k * 3));
  }
}

/** A door stood on its edge, its foot at (cx, fy): planks, two iron straps (bare where cut), a dark edge. */
/** `who`: the face of the door each carries square in front, so the pair read apart: the Latch's bar and its ring, the Hasp's hasp and its lock. */
function door(c: Ctx, cx: number, fy: number, w: number, h: number, cut: number, who?: 'latch' | 'hasp'): void {
  const l = c.lit, x0 = Math.round(cx - w / 2), y0 = Math.round(fy - h);
  l.fillStyle = EDGE;
  l.fillRect(x0 - 1, y0 - 1, w + 2, h + 2);
  l.fillStyle = WOOD;
  l.fillRect(x0, y0, w, h);
  l.fillStyle = SEAM;
  for (let px = x0 + 3; px < x0 + w - 1; px += 4) l.fillRect(px, y0 + 1, 1, h - 2);
  // Each plank's edge catching the light, a knot or two, a split at the foot.
  l.fillStyle = GRAIN;
  for (let px = x0; px < x0 + w - 1; px += 4) l.fillRect(px, y0 + 1, 1, h - 3);
  l.fillStyle = SEAM;
  if (w > 5) l.fillRect(x0 + 1, Math.round(y0 + h * 0.45), 1, 1), l.fillRect(x0 + w - 2, Math.round(y0 + h * 0.88), 1, 2);
  for (const [k, sy] of [[0, 0.25], [1, 0.72]] as const) {
    l.fillStyle = cut > k ? BARE : IRON;
    l.fillRect(x0, Math.round(y0 + h * sy), w, 2);
    // Nail heads along a strap still on (a cut one shows only the bare wood where it was).
    if (cut <= k) for (let px = x0 + 1; px < x0 + w; px += 3) (l.fillStyle = '#8a8696'), l.fillRect(px, Math.round(y0 + h * sy), 1, 1);
  }
  if (who === 'latch') (l.fillStyle = '#7a7684'), l.fillRect(x0 + 2, Math.round(y0 + h * 0.5), w - 5, 1), (l.fillStyle = '#9a96a4'), l.fillRect(x0 + w - 4, Math.round(y0 + h * 0.5) - 1, 2, 3);
  if (who === 'hasp') (l.fillStyle = '#7a7684'), l.fillRect(Math.round(cx) - 1, Math.round(y0 + h * 0.45), 3, 4), (l.fillStyle = '#a89040'), l.fillRect(Math.round(cx) - 1, Math.round(y0 + h * 0.45) + 4, 3, 3);
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
