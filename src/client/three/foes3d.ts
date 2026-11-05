/**
 * The newer goblins' marks in the 2.5D view's flat layer, placed where the room says: a banner's reach
 * and the goblins that have taken heart in it, lamp oil on the floor (burning or not) and carrion crows
 * on the dead. The bodies are the flat view's own (cards3d.ts draws them).
 */
import { BANNER } from '../../shared/tuning';
import type { ArenaRoom } from '../../sim/room';
import type { Ctx } from '../draw';
import { drawCrows, drawSlicks } from '../beastdraw';
import type { Lerp } from './actors3d';
import type { Proj } from './overlay3d';

const HEART = '#e8a040';

export function drawFoes3d(g: CanvasRenderingContext2D, c: Ctx, room: ArenaRoom, P: Proj, lerp: Lerp): void {
  const floor = (x: number, y: number) => P(x, 0.03, y) as [number, number];
  if (room.slicks?.length) drawSlicks(c, room.slicks, floor, room.time);
  if (room.crows?.length) drawCrows(c, room.crows, floor, room.time);
  for (const e of room.enemies) {
    if (e.act === 'dead') continue;
    const [ex, ey] = lerp('e:' + e.id, e.x, e.y);
    if (e.variant === 'banner' && e.alert !== false) dots(g, P, ex, ey, BANNER.radius, 0.25, 0.4);
    else if (e.heart) dots(g, P, ex, ey, 0.4, 0.7, 0.15);
  }
}

function dots(g: CanvasRenderingContext2D, P: Proj, x: number, y: number, r: number, alpha: number, gap: number): void {
  const n = Math.max(10, Math.round((Math.PI * 2 * r) / gap));
  g.fillStyle = HEART;
  g.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, [px, py] = P(x + Math.cos(a) * r, 0.04, y + Math.sin(a) * r);
    g.fillRect(Math.round(px), Math.round(py), 1, 1);
  }
  g.globalAlpha = 1;
}
