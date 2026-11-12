/**
 * A held cart's aim (sim/haulcarts.ts; Kyle, 2026-11-12: "aim it with an aiming icon and click again to throw
 * it"): a marching dotted line from the cart the way its hero faces, out to where it will stop
 * (sim/cartpath.ts, the same spot the room stops it), and an arrowhead there. Drawing only.
 */
import type { ArenaRoom } from '../sim/room';
import { cartPath } from '../sim/cartpath';
import type { Ctx } from './draw';
import { OX, OY, PX } from './world';

export function drawCartAims(c: Ctx, room: ArenaRoom, cx: number, cy: number): void {
  for (const p of room.props) {
    if (p.kind !== 'cart' || !p.heldBy || p.broken) continue;
    const h = room.heroes.find((x) => x.id === p.heldBy);
    if (!h) continue;
    const end = cartPath(p.x, p.y, h.fx, h.fy, p.radius), g = c.glow;
    const x0 = OX + p.x * PX - cx, y0 = OY + p.y * PX - cy - 4, x1 = OX + end.x * PX - cx, y1 = OY + end.y * PX - cy - 4;
    const n = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / (n || 1), uy = (y1 - y0) / (n || 1), shift = (c.now * 24) % 6;
    g.globalAlpha = 0.85;
    g.fillStyle = '#ffd27a';
    for (let d = 10 + shift; d < n - 4; d += 6) g.fillRect(Math.round(x0 + ux * d), Math.round(y0 + uy * d), 2, 2);
    // The arrowhead where it'll stop.
    for (let i = 0; i < 6; i++) {
      const bx = x1 - ux * i, by = y1 - uy * i;
      g.fillRect(Math.round(bx - uy * i * 0.7), Math.round(by + ux * i * 0.7), 1, 1);
      g.fillRect(Math.round(bx + uy * i * 0.7), Math.round(by - ux * i * 0.7), 1, 1);
    }
    g.fillStyle = '#ffffff';
    g.fillRect(Math.round(x1) - 1, Math.round(y1) - 1, 2, 2);
    g.globalAlpha = 1;
  }
}
