/**
 * An ENRAGED Doorkeeper's QUAKE on screen (sim/quakeshape.ts): a striped circle for each place the crack will
 * burst through, the nearest first, and the crack itself running along the floor from its doors to the
 * circles as the wind-up runs out. Drawing only (the room judges the same circles).
 */
import type { ArenaRoom } from '../sim/room';
import { quakeShapes } from '../sim/quakeshape';
import type { Ctx } from './draw';
import { drawTelegraph } from './foes';
import { OX, OY, PX } from './world';

const hash = (n: number) => {
  const s = Math.sin(n * 57.3 + 7.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Under everyone: each circle still to come, and the crack running out to the furthest. */
export function drawQuakeMarks(c: Ctx, room: ArenaRoom, cx: number, cy: number): void {
  for (const e of room.enemies) {
    const shapes = quakeShapes(e), a = e.attack;
    if (!shapes.length || !a) continue;
    for (const s of shapes) drawTelegraph(c, s, cx, cy);
    if (a.t < (a.tell ?? 0)) continue;
    // The crack: a jagged dark line out from its feet, reaching further as the wind-up runs out.
    const k = Math.min(1, a.t / a.windup), last = shapes[shapes.length - 1], g = c.lit;
    const x0 = OX + a.ox * PX - cx, y0 = OY + a.oy * PX - cy, x1 = OX + last.cx * PX - cx, y1 = OY + last.cy * PX - cy;
    const n = Math.round(Math.hypot(x1 - x0, y1 - y0) * k);
    const ux = (x1 - x0) / (Math.hypot(x1 - x0, y1 - y0) || 1), uy = (y1 - y0) / (Math.hypot(x1 - x0, y1 - y0) || 1);
    for (let i = 0; i < n; i++) {
      const j = (hash(e.id * 31 + Math.floor(i / 4)) - 0.5) * 3;
      g.fillStyle = i % 5 ? '#1a1210' : '#3a2a20';
      g.fillRect(Math.round(x0 + ux * i - uy * j), Math.round(y0 + uy * i + ux * j), 1, 1);
    }
  }
}
