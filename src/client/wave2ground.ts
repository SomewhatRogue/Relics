/**
 * The second wave on the floor, from the room's own state (sim/hornblow.ts, sim/meaty2.ts), flat view and
 * the 2.5D overlay alike by a projection of the floor to the screen:
 * - a Hornblower blowing: at the spot its call will come from (the room's edge on your screen), a ring
 *   filling with the call's own clock and eyes showing in the dark there, more of them as it comes due,
 *   so you see where they'll run in from before they do;
 * - a Gorger pulling a body in: its gaff's line to the body, and the body dragged along the floor to it
 *   (`pulledAt`, which both views draw the body at).
 * Drawing only.
 */
import { calling } from '../sim/hornstate';
import { isDead } from '../sim/damage';
import type { ArenaRoom } from '../sim/room';
import type { Enemy } from '../sim/types';

type Proj = (x: number, y: number, z: number) => [number, number];
const RED = '#e8352a', EYES = '#ffd040', ROPE = '#8a6a3a';

const px = (g: CanvasRenderingContext2D, x: number, y: number, col: string, a: number, s = 1) => {
  g.globalAlpha = Math.max(0, Math.min(1, a));
  g.fillStyle = col;
  g.fillRect(Math.round(x), Math.round(y), s, s);
};

/** Where a body a Gorger is pulling in is drawn now (tiles), or null: from where it lay to the Gorger's feet. */
export function pulledAt(room: ArenaRoom, body: Enemy): [number, number] | null {
  if (!isDead(body)) return null;
  const g = room.enemies.find((o) => o.variant === 'gorger' && !isDead(o) && o.meal && !o.meal.s && o.meal.b === body.id);
  if (!g?.meal) return null;
  const m = g.meal, k = Math.max(0, Math.min(1, (room.time - m.at) / Math.max(0.01, m.until - m.at))), d = Math.hypot(g.x - m.x, g.y - m.y) || 1;
  const tx = g.x - ((g.x - m.x) / d) * (g.radius + 0.25), ty = g.y - ((g.y - m.y) / d) * (g.radius + 0.25);
  return [m.x + (tx - m.x) * k * k, m.y + (ty - m.y) * k * k];
}

export function drawWave2Ground(g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj, ppu: number): void {
  const t = room.time;
  for (const e of room.enemies) {
    if (calling(e, t)) {
      const c = e.call!, k = (t - c.at) / Math.max(0.01, c.until - c.at), n = Math.max(20, Math.round(0.9 * 2 * Math.PI * ppu * 0.6));
      for (let j = 0; j < n; j++) {
        const a = -Math.PI / 2 + (j / n) * Math.PI * 2, [sx, sy] = P(c.x + Math.cos(a) * 0.9, 0.03, c.y + Math.sin(a) * 0.9), on = j / n <= k;
        if (on || j % 3 === 0) px(g, sx, sy, RED, on ? 0.9 : 0.4, ppu > 20 ? 2 : 1);
      }
      // Eyes in the dark there, one pair for each that's coming, showing one by one.
      for (let i = 0; i < 3; i++) {
        if (k < i / 3) continue;
        const blink = Math.floor(t * 3 + i * 1.3) % 5 === 0, [ex, ey] = P(c.x + (i - 1) * 0.5, 0.45 + (i % 2) * 0.1, c.y);
        if (!blink) px(g, ex - 2, ey, EYES, 0.9), px(g, ex + 1, ey, EYES, 0.9);
      }
    }
    const m = e.meal;
    if (e.variant === 'gorger' && m && !isDead(e) && !m.s) {
      const body = room.enemies.find((o) => o.id === m.b), at = body && pulledAt(room, body);
      if (!at) continue;
      const [ax, ay] = P(e.x, 0.45, e.y), [bx, by] = P(at[0], 0.1, at[1]), l = Math.hypot(bx - ax, by - ay);
      for (let s = 0; s < l; s += 2) px(g, ax + ((bx - ax) * s) / l, ay + ((by - ay) * s) / l, ROPE, 0.9);
    }
  }
  g.globalAlpha = 1;
}
