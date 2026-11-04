/**
 * The staff's walls, from the room's zones (sim/staffwall.ts decides them; the same length, depth and
 * place drawn): fire a row of flames licking up, frost a run of ice blocks with bright tops, storm a
 * line of crackling posts with lightning jumping between them. The big wall (raised on the flash) is
 * taller. Flat view and the 2.5D overlay alike, by a projection of the floor to the screen, and the
 * light each gives off. Cosmetic only: Math.random is fine here.
 */
import type { Augment } from '../shared/tuning';
import type { ArenaRoom } from '../sim/room';
import type { Zone } from '../sim/types';
import type { Light } from './light';
import { EL_LIGHT } from './palette';
import { OX, OY, PX } from './world';

/** Floor (x, z) at height y (tiles) to the screen. */
type Proj = (x: number, y: number, z: number) => [number, number];

const COLS: Record<Augment, string[]> = { fire: ['#ff6a20', '#ff9a3c', '#ffd27a'], frost: ['#7ab8e0', '#bfe8ff', '#e8f6ff'], storm: ['#c8c070', '#fff27a', '#ffffff'], '': ['#c9a8ff'] };

/** One wall, its posts every `step` tiles along it, rising `tall` tiles. */
function wall(g: CanvasRenderingContext2D, z: Zone, P: Proj, t: number, ppu: number): void {
  const fade = Math.min(1, (z.until - t) / 0.6, (t - (z.at ?? t) + 0.05) / 0.25), cols = COLS[z.el], tx = -(z.ay ?? 1), ty = z.ax ?? 0;
  const tall = z.big ? 1.3 : 0.9, n = Math.max(6, Math.round(z.r * 2 * ppu)), rise = tall * Math.min(1, fade * 1.5);
  for (let i = 0; i <= n; i++) {
    const u = -z.r + (2 * z.r * i) / n, x = z.x + tx * u, y = z.y + ty * u, f = Math.random();
    const [bx, by] = P(x, 0, y), [, top] = P(x, rise * (z.el === 'fire' ? 0.55 + 0.45 * f : z.el === 'frost' ? 0.85 + 0.15 * Math.sin(i * 1.7) : 0.4 + 0.6 * f), y);
    const h = Math.max(1, Math.round(by - top));
    g.globalAlpha = (z.el === 'frost' ? 0.85 : 0.55 + 0.45 * f) * fade;
    g.fillStyle = cols[Math.min(cols.length - 1, Math.floor(f * cols.length))];
    if (z.el === 'storm' && i % 4) {
      // Between the posts, a spark or two.
      if (f > 0.6) g.fillRect(Math.round(bx), Math.round(by - h * f), 1, 1);
      continue;
    }
    g.fillRect(Math.round(bx), Math.round(top), 1, h);
    g.fillStyle = z.el === 'frost' ? '#ffffff' : cols[cols.length - 1];
    g.fillRect(Math.round(bx), Math.round(top), 1, 1);
  }
  if (z.el === 'storm') {
    // Lightning jumping along the top of the posts.
    const [ax, ay] = P(z.x - tx * z.r, rise * 0.8, z.y - ty * z.r), [cx, cy] = P(z.x + tx * z.r, rise * 0.8, z.y + ty * z.r), m = Math.max(2, Math.round(Math.hypot(cx - ax, cy - ay) / 3));
    g.fillStyle = '#ffffff';
    g.globalAlpha = 0.8 * fade;
    for (let i = 0; i <= m; i++) g.fillRect(Math.round(ax + ((cx - ax) * i) / m), Math.round(ay + ((cy - ay) * i) / m + (Math.random() - 0.5) * 4), 1, 1);
  }
  g.globalAlpha = 1;
}

/** Every wall in the room on the flat view's glow layer. */
export function drawWalls(g: CanvasRenderingContext2D, room: ArenaRoom, cx: number, cy: number): void {
  const P: Proj = (x, y, z) => [OX + x * PX - cx, OY + z * PX - cy - y * PX];
  for (const z of room.zones) if (z.kind === 'wall') wall(g, z, P, room.time, PX);
}

/** Every wall on the 2.5D overlay (`P` the camera's own projection, `ppu` its pixels a tile). */
export function drawWalls3(g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj, ppu: number): void {
  for (const z of room.zones) if (z.kind === 'wall') wall(g, z, P, room.time, ppu);
}

/** Their light: a few lights strung along each wall, in tiles (`at` places one for the caller's view). */
export function wallLights<L>(room: ArenaRoom, at: (x: number, y: number, r: number, i: number, c: [number, number, number]) => L): L[] {
  const out: L[] = [];
  for (const z of room.zones) {
    if (z.kind !== 'wall') continue;
    const k = Math.min(1, (z.until - room.time) / 0.6), tx = -(z.ay ?? 1), ty = z.ax ?? 0;
    for (const s of [-0.6, 0, 0.6]) out.push(at(z.x + tx * z.r * s, z.y + ty * z.r * s, z.r * 0.9 + 0.8, (z.el === 'fire' ? 0.8 : 0.55) * k, EL_LIGHT[z.el]));
  }
  return out;
}

/** The flat view's lights for the walls. */
export const wallLightsFlat = (room: ArenaRoom, cx: number, cy: number): Light[] =>
  wallLights(room, (x, y, r, i, c) => ({ x: OX + x * PX - cx, y: OY + y * PX - cy - 6, r: r * PX, i, c }));

