/**
 * Quest marks: a small gold diamond bobbing over each thing the room's goal is about (sim/targets.ts:
 * a cage, a larder rack, a den, a nest, the named butcher, a house door with someone inside, the way
 * the freed are brought out), so you can tell in the dark what counts. Gold like the way on, never
 * the red of a telegraph. When none is in sight, a gold point at the screen's edge toward the nearest.
 * Each mark goes the moment its thing is done. Drawing only: the list is the room's.
 */
import type { Target, TargetKind } from '../sim/targets';
import type { Ctx } from './draw';
import type { Light } from './light';
import { edgeMark, type View } from './wayout';
import { OX, OY, PX } from './world';

const GOLD = '#ffd860', EDGE = '#3a2408', SHINE = '#fff6c8';
/** How high over its thing (screen pixels above where it stands) each kind's mark sits. */
const LIFT: Record<TargetKind, number> = { cage: 26, larder: 28, den: 36, nest: 22, boss: 34, door: 44, out: 18, job: 14, folk: 40, hall: 26 };

/** The diamond, its point down, centred on (x, y). */
function diamond(g: CanvasRenderingContext2D, x: number, y: number): void {
  const X = Math.round(x), Y = Math.round(y), rows = [1, 3, 5, 7, 9, 7, 5, 3, 1];
  g.fillStyle = EDGE;
  rows.forEach((w, i) => g.fillRect(X - (w >> 1) - 1, Y - 4 + i, w + 2, 1));
  g.fillRect(X, Y - 5, 1, 1), g.fillRect(X, Y + 5, 1, 1);
  g.fillStyle = GOLD;
  rows.forEach((w, i) => g.fillRect(X - (w >> 1), Y - 4 + i, w, 1));
  g.fillStyle = SHINE;
  g.fillRect(X - 2, Y - 1, 1, 2), g.fillRect(X - 1, Y - 2, 1, 1), g.fillRect(X, Y - 3, 1, 1);
}

/**
 * The marks for `list` (under the HUD too: a phone's screen is small), the camera at (cx, cy). `at`
 * gives where a target is on screen this frame before the camera (a moving one is smoothed between
 * ticks); `me` is the hero, for the nearest.
 * Returns a little gold light under each mark in sight.
 */
export function drawQuestMarks(c: Ctx, list: Target[], at: (t: Target) => [number, number], cx: number, cy: number, v: View, me: { x: number; y: number } | null, now: number): Light[] {
  const g = c.glow, lights: Light[] = [];
  let seen = false;
  list.forEach((t, i) => {
    const [px, py] = at(t), sx = px - cx, sy = py - cy, y = sy - LIFT[t.kind] + Math.round(Math.sin(now * 4 + i * 1.3) * 2);
    if (sx < -4 || sx > v.vw + 4 || y < -4 || y > v.vh + 4) return;
    seen = true;
    diamond(g, sx, y);
    lights.push({ x: sx, y: sy - 8, r: 30, i: 0.4, c: [1, 0.85, 0.45] });
  });
  if (seen || !me || !list.length) return lights;
  // None in sight: a point at the edge toward the nearest, a small diamond behind it.
  let best = list[0], bd = Infinity;
  for (const t of list) {
    const d = Math.hypot(t.x - me.x, t.y - me.y);
    if (d < bd) (bd = d), (best = t);
  }
  const [px, py] = at(best), e = edgeMark(g, px - cx, py - cy - LIFT[best.kind] / 2, v, Math.sin(now * 6) * 1.5, GOLD);
  if (e) diamond(g, e.x, e.y);
  return lights;
}

/** Where a target stands on screen before the camera (tiles to pixels). */
export const onScreen = (t: { x: number; y: number }): [number, number] => [OX + t.x * PX, OY + t.y * PX];
