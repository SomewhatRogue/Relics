/**
 * THE BRAKESMAN's incline (sim/brake.ts), on the floor: each lane's two rails and their sleepers down the slope; and
 * a cart waiting at the top of a lane, that lane striped its length on the glow layer, the stripes of every
 * unblockable floor sign (firewalldraw.ts WALL.stripe), brighter as it's about to go. From the map and the cart's
 * own `goAt`, the same on every screen.
 */
import { BRAKE } from '../shared/tuning';
import type { GameMap } from '../shared/arena';
import type { Prop } from '../sim/types';
import type { Ctx } from './draw';
import { WALL } from './firewalldraw';
import { OX, OY, PX } from './world';

/** The lanes' rails and sleepers, on the lit layer (the floor). */
export function drawIncline(c: Ctx, map: GameMap, cx: number, cy: number): void {
  const inc = map.incline;
  if (!inc) return;
  const g = c.lit, ya = Math.round(OY + inc.y0 * PX - cy), yb = Math.round(OY + inc.y1 * PX - cy), half = Math.round((BRAKE.width * PX) / 2);
  for (const lane of inc.lanes) {
    const x = Math.round(OX + lane * PX - cx);
    g.fillStyle = '#3a2a1a';
    for (let y = ya; y < yb; y += 5) g.fillRect(x - half - 1, y, 2 * half + 2, 2);
    g.fillStyle = '#6a6470';
    g.fillRect(x - half + 1, ya, 1, yb - ya), g.fillRect(x + half - 2, ya, 1, yb - ya);
  }
}

/** A cart waiting at the top of its lane: the lane striped down to the foot, brightening; then, as it runs down, the
 * lane still striped from the cart to the foot. */
export function drawBrakeLane(c: Ctx, map: GameMap, p: Prop, cx: number, cy: number, now: number): void {
  const inc = map.incline;
  const down = (p.roll ?? 0) > 0;
  if (!inc || (p.goAt === undefined && !down)) return;
  const g = c.glow, k = down ? 1 : Math.max(0, Math.min(1, 1 - (p.goAt! - now) / BRAKE.warn)), w = Math.round(BRAKE.width * PX);
  const x0 = Math.round(OX + p.x * PX - cx - w / 2), ya = Math.round(OY + (down ? p.y : inc.y0) * PX - cy), yb = Math.round(OY + inc.y1 * PX - cy);
  g.globalAlpha = 0.35 + 0.5 * k;
  for (let y = ya; y < yb; y++) for (const x of [x0, x0 + w - 1]) (g.fillStyle = WALL.stripe[Math.floor((y - x + now * 20) / 3) % 2 ? 1 : 0]), g.fillRect(x, y, 1, 1);
  g.fillStyle = '#ff5030';
  g.globalAlpha = 0.12 + 0.2 * k;
  g.fillRect(x0 + 1, ya, w - 2, yb - ya);
  g.globalAlpha = 1;
}
