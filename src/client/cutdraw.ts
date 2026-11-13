/**
 * The Rogue's long cut on every screen (sim/samuraicut.ts, shared/cuttune.ts), flat view and the 2.5D overlay
 * alike, by each view's projection (scene.ts, three/view3d.ts):
 * - the stance: the line on the floor from the Rogue to where the slash will end, its edges faint at the band's
 *   width (what's inside is cut), the middle brightening as the beat runs out;
 * - after the slash, till the cut lands: the line as a pale scar on the floor, and a thin white line across each
 *   one cut, flickering, so everyone can see what's about to fall.
 * Pale steel and white, not the goblins' red or a Ranger's gold: a blade, and the Rogue's.
 * The moments themselves (the streak, the fall) are fxcut.ts's.
 */
import { CUT } from '../shared/cuttune';
import type { ArenaRoom } from '../sim/room';
import type { Enemy } from '../sim/types';

/** Floor (x, z) at height y (tiles) to the screen; where a body is drawn now, in tiles. */
type Proj = (x: number, y: number, z: number) => [number, number];
type At = (key: string, x: number, y: number) => [number, number];

const STEEL = '#c8d0dc', WHITE = '#ffffff';
const tall = (e: Enemy) => (e.kind === 'butcher' ? 2.4 : e.kind === 'spider' ? 1.1 : 1.55);

/** A line of pixels on the floor from (x0, z0) to (x1, z1); `gap` leaves every so many out (dashes). */
function floorLine(g: CanvasRenderingContext2D, P: Proj, x0: number, z0: number, x1: number, z1: number, ppu: number, col: string, gap = 0, px = 1): void {
  const l = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(l * ppu * 1.4));
  g.fillStyle = col;
  for (let i = 0; i <= n; i++) {
    if (gap && i % gap >= gap - 2) continue;
    const k = i / n, [sx, sy] = P(x0 + (x1 - x0) * k, 0.02, z0 + (z1 - z0) * k);
    g.fillRect(Math.round(sx), Math.round(sy), px, px);
  }
}

export function drawCuts(g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj, at: At, ppu: number): void {
  const t = room.time;
  for (const h of room.heroes) {
    const c = h.cutLine;
    if (h.act !== 'cut' || !c) continue;
    const l = Math.hypot(c.x1 - c.x0, c.y1 - c.y0) || 1, nx = -(c.y1 - c.y0) / l, ny = (c.x1 - c.x0) / l, b = CUT.band;
    if (h.actT < CUT.stance) {
      // The stance: where it will go, from the Rogue's feet (as drawn now) to the far end.
      const [x0, z0] = at('h:' + h.id, h.x, h.y), k = h.actT / CUT.stance;
      g.globalAlpha = 0.5 + 0.3 * k;
      floorLine(g, P, x0 + nx * b, z0 + ny * b, c.x1 + nx * b, c.y1 + ny * b, ppu, STEEL, 4);
      floorLine(g, P, x0 - nx * b, z0 - ny * b, c.x1 - nx * b, c.y1 - ny * b, ppu, STEEL, 4);
      g.globalAlpha = 0.7 + 0.3 * k;
      floorLine(g, P, x0, z0, c.x1, c.y1, ppu, k > 0.7 && Math.floor(t * 20) % 2 ? WHITE : STEEL, 0, 2);
      // The far end: a bar across, the band's width.
      floorLine(g, P, c.x1 + nx * b, c.y1 + ny * b, c.x1 - nx * b, c.y1 - ny * b, ppu, WHITE, 0, 2);
    } else {
      // The slash done: its scar on the floor while the blade goes away.
      g.globalAlpha = 0.55;
      floorLine(g, P, c.x0, c.y0, c.x1, c.y1, ppu, STEEL);
    }
  }
  // Each one cut: a thin white line across its body, flickering, till it lands.
  for (const e of room.enemies) {
    const m = e.longCut;
    if (!m || e.act === 'dead') continue;
    const [x, z] = at('e:' + e.id, e.x, e.y), left = m.at - t, hi = tall(e) * 0.55;
    g.globalAlpha = left < 0.25 || Math.floor(t * 14) % 2 ? 1 : 0.6;
    const w = e.radius + 0.35, [ax, ay] = P(x - m.dx * w, hi + 0.25, z - m.dy * w), [bx, by] = P(x + m.dx * w, hi - 0.25, z + m.dy * w);
    const n = Math.max(2, Math.round(Math.hypot(bx - ax, by - ay)));
    for (let i = 0; i <= n; i++) {
      g.fillStyle = i % 4 ? WHITE : STEEL;
      g.fillRect(Math.round(ax + ((bx - ax) * i) / n), Math.round(ay + ((by - ay) * i) / n), 1, 1);
    }
  }
  g.globalAlpha = 1;
}

/**
 * The blade in the Rogue's hand through the cut (held.ts asks): `fa` the way faced, `side` which way the body
 * turns. The stance: low and back, trembling a little as it holds. The slash: swept through to the front. The
 * sheathe: brought slowly down to the hip, and gone into it at the end.
 */
export function cutPose(t: number, fa: number, side: number): { a: number; ext: number; reach: number; pull: number; hide?: boolean } {
  if (t < CUT.stance) return { a: fa + side * 2.3 + Math.sin(t * 60) * 0.02, ext: -2, reach: 0, pull: 0 };
  if (t < CUT.stance + CUT.dash) return { a: fa - side * 0.4, ext: 4, reach: 0, pull: 0 };
  const k = Math.min(1, (t - CUT.stance - CUT.dash) / CUT.sheathe);
  return { a: fa - side * 0.4 + side * 1.6 * k, ext: -3 * k, reach: 0, pull: 0, ...(k > 0.92 ? { hide: true } : {}) };
}
