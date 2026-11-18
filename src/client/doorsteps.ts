/**
 * Every door's step, so you can tell where to go in (Kyle, 2026-11-16: "if it has a side door, it's hard to
 * know this is the entrance"): on the ground where you stand to go in (shared/arena.ts doorAt), at its level,
 * a warm patch of light and a chevron pointing the way in, faint from afar, brighter and bobbing as you come
 * near. Drawn on the glow layer of either view through its projection `P(x, up, y)` (tiles), as the spells'
 * ground marks are (spellground.ts). Doors locked, burning or in ruins get none.
 */
import { doorAt, levelAt, pushDir, type GameMap } from '../shared/arena';
import type { ArenaRoom } from '../sim/room';

type Proj = (x: number, y: number, z: number) => [number, number];

/** A level's height in tiles (world.ts LIFT 12 px, three/ground.ts LEDGE_H). */
const LEVEL = 0.75;
/** Tiles from a door within which its mark brightens, and its faint and full strength. */
const NEAR = 5, FAINT = 0.55, FULL = 1;
const WARM = ['#ffcf7a', '#fff2c8'];
/** Tiles round a door's spot that hold all of its marks (the patch and chevrons reach under 0.75), and screen pixels of slack. */
const REACH = 1, SLACK = 2;

/**
 * Whether none of a door's marks can land on the canvas: its box (a tile either way, the mark's heights)
 * projected corner by corner falls wholly to one side. Only trusted when the door's spot projects inside
 * that box, which holds for any flat or perspective view with the box all on one side of the eye.
 */
function offCanvas(g: CanvasRenderingContext2D, P: Proj, x: number, up: number, y: number): boolean {
  const W = g.canvas?.width, H = g.canvas?.height;
  if (!W || !H) return false;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const ex of [-REACH, REACH]) for (const ey of [-REACH, REACH]) for (const ez of [-0.01, 0.05]) {
    const [sx, sy] = P(x + ex, up + ez, y + ey);
    if (!Number.isFinite(sx) || !Number.isFinite(sy)) return false;
    (x0 = Math.min(x0, sx)), (x1 = Math.max(x1, sx)), (y0 = Math.min(y0, sy)), (y1 = Math.max(y1, sy));
  }
  const [cx, cy] = P(x, up + 0.01, y);
  if (!(cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1)) return false;
  return x1 < -SLACK || y1 < -SLACK || x0 > W + SLACK || y0 > H + SLACK;
}

const px = (g: CanvasRenderingContext2D, x: number, y: number, col: string, a: number) => {
  g.globalAlpha = a;
  g.fillStyle = col;
  g.fillRect(Math.round(x), Math.round(y), 1, 1);
};

export function drawDoorsteps(g: CanvasRenderingContext2D, room: ArenaRoom, meId: string, P: Proj, ppu: number): void {
  const map: GameMap = room.map;
  if (room.indoors || !map.blocks?.length) return;
  const me = room.heroes.find((h) => h.id === meId), t = room.time;
  let any = false;
  for (const b of map.blocks) {
    if (!b.door || b.locked || b.ruined || (b.burning ?? -1) >= 0) continue;
    const d = doorAt(b), [dx, dy] = pushDir(b), up = levelAt(map, d.x, d.y) * LEVEL;
    // Off the canvas, skipped (the pen still ends warm, as if it had been drawn).
    any = true;
    if (offCanvas(g, P, d.x, up, d.y)) continue;
    const far = me ? Math.hypot(me.x - d.x, me.y - d.y) : NEAR * 2, k = Math.max(0, Math.min(1, 1 - (far - 1) / NEAR));
    const a = FAINT + (FULL - FAINT) * k;
    // The patch: a small dithered oval of warm light on the step.
    const n = Math.max(6, Math.round(0.5 * ppu));
    for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
      if ((i + j) & 1) continue;
      const r = Math.hypot(i / n, j / n);
      if (r > 1) continue;
      const [sx, sy] = P(d.x + (i / n) * 0.5, up + 0.01, d.y + (j / n) * 0.32);
      px(g, sx, sy, WARM[0], a * 0.7 * (1 - r * 0.6));
    }
    // The chevron: two arms meeting at its point, the way in, bobbing toward the door when you're near.
    // Two chevrons, one behind the other, so it reads as "this way" even small.
    const bob = k > 0 ? Math.sin(t * 5) * 0.08 * k : 0, [lx, ly] = [-dy, dx], steps = Math.max(6, Math.round(0.4 * ppu));
    for (const back of [0, 0.3]) {
      const cx = d.x + dx * (0.25 - back + bob), cy = d.y + dy * (0.25 - back + bob);
      for (let s = 0; s <= steps; s++) for (const side of [-1, 1]) for (const thick of [0, 0.06]) {
        const f = s / steps, wx = cx - dx * (0.28 * f + thick) + lx * side * 0.28 * f, wy = cy - dy * (0.28 * f + thick) + ly * side * 0.28 * f;
        const [sx, sy] = P(wx, up + 0.02, wy);
        px(g, sx, sy, WARM[1], a * (back ? 0.6 : 1));
      }
    }
  }
  if (any) g.fillStyle = WARM[1];
  g.globalAlpha = 1;
}
