/**
 * THE BRAKESMAN's cart waiting at the top of the rail (sim/brake.ts): its lane striped the rail's length on the
 * glow layer, the stripes of every unblockable floor sign (firewalldraw.ts WALL.stripe), brighter as it's about
 * to go. Drawn from the cart's own `goAt` and the map's rail, the same on every screen.
 */
import { BRAKE } from '../shared/tuning';
import type { GameMap } from '../shared/arena';
import type { Prop } from '../sim/types';
import type { Ctx } from './draw';
import { WALL } from './firewalldraw';
import { OX, OY, PX } from './world';

export function drawBrakeLane(c: Ctx, map: GameMap, p: Prop, cx: number, cy: number, now: number): void {
  const rail = map.rail;
  if (!rail || p.goAt === undefined) return;
  const g = c.glow, k = Math.max(0, Math.min(1, 1 - (p.goAt - now) / BRAKE.warn));
  const xa = Math.round(OX + rail.x0 * PX - cx), xb = Math.round(OX + rail.x1 * PX - cx), h = Math.round(BRAKE.width * PX), y0 = Math.round(OY + rail.y * PX - cy - h / 2);
  g.globalAlpha = 0.35 + 0.5 * k;
  for (let x = xa; x < xb; x++) for (const y of [y0, y0 + h - 1]) (g.fillStyle = WALL.stripe[Math.floor((x - y + now * 20) / 3) % 2 ? 1 : 0]), g.fillRect(x, y, 1, 1);
  g.fillStyle = '#ff5030';
  g.globalAlpha = 0.12 + 0.2 * k;
  g.fillRect(xa, y0 + 1, xb - xa, h - 2);
  g.globalAlpha = 1;
}
