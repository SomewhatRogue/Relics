/**
 * The way out, marked on the floor: a lit threshold just inside each way out of the room with an arrow
 * pointing out, the same place in both views (the flat one here, the 2.5D one in three/exitmat3d.ts).
 * Where it sits comes from the map's own exit (and roads at a fork), the areas the room judges you
 * leaving by (waysOut). Drawing only.
 */
import type { GameMap } from '../shared/arena';
import { waysOut } from './wayout';
import { OX, OY, PX } from './world';

/** A threshold in map units: its box, and which way is out (-1 up the screen, 1 down). */
export interface ExitMat { x: number; y: number; w: number; d: number; out: -1 | 1 }

/** How deep the threshold runs into the room, in tiles. */
const DEPTH = 1.3;

/** Every way out's threshold, inside the room in front of it. */
export function exitMats(m: GameMap): ExitMat[] {
  return waysOut(m).map((a) => {
    const out = a.y < 1 ? -1 : 1, w = a.w + 0.4, x = a.x - 0.2;
    return out < 0 ? { x, y: Math.max(0, a.y + a.h), w, d: DEPTH, out } : { x, y: a.y - DEPTH + a.h * 0.5, w, d: DEPTH, out };
  });
}

/** The flat view: a soft gold mat with a bright edge and an arrow out, breathing (on the glow layer). */
export function drawExitMats(g: CanvasRenderingContext2D, m: GameMap, cx: number, cy: number, now: number): void {
  const pulse = 0.5 + 0.5 * Math.sin(now * 3);
  for (const t of exitMats(m)) {
    const x0 = Math.round(OX + t.x * PX - cx), y0 = Math.round(OY + t.y * PX - cy), w = Math.round(t.w * PX), h = Math.round(t.d * PX);
    g.fillStyle = '#ffd27a';
    g.globalAlpha = 0.12 + 0.06 * pulse;
    g.fillRect(x0, y0, w, h);
    g.globalAlpha = 0.55 + 0.25 * pulse;
    g.fillRect(x0, y0, w, 1), g.fillRect(x0, y0 + h - 1, w, 1), g.fillRect(x0, y0, 1, h), g.fillRect(x0 + w - 1, y0, 1, h);
    arrow(g, x0 + w / 2, y0 + h / 2, t.out, 0.7 + 0.3 * pulse);
  }
  g.globalAlpha = 1;
}

/** A solid arrow centred on (x, y), pointing `dir` (-1 up, 1 down). */
function arrow(g: CanvasRenderingContext2D, x: number, y: number, dir: number, a: number): void {
  g.globalAlpha = a;
  g.fillStyle = '#fff1b0';
  g.fillRect(Math.round(x - 1), Math.round(y - 5), 3, 8);
  for (let s = 0; s <= 5; s++) g.fillRect(Math.round(x - 5 + s), Math.round(y + dir * (3 + s) - (dir > 0 ? 0 : 1)), 11 - s * 2, 1);
}
