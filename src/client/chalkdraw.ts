/**
 * The chalker as every screen draws it (the room decides it all: sim/chalker.ts). Its kit on the flat
 * figure (the 2.5D view's cards are the same figures): a tally board slung on its back with the strokes
 * on it in fives, a lump of chalk in its hand, lifted as a stroke goes on. Its tally board staged in the
 * CRIES room. And the strokes over a hero it's chalking: red, in a tally, the fifth across the four; the
 * newest white for a moment; when the pack turns on them, the five pulse and a red sight turns at their
 * feet, blinking in its last second. Red, the goblins' colour: it's a blow coming. Drawing only.
 */
import { CHALKER } from '../shared/tuning';
import type { ArenaRoom } from '../sim/room';
import type { Enemy } from '../sim/types';
import type { Ctx } from './draw';

/** Floor (x, z) at height y (tiles) to the screen; where a body is drawn now, in tiles. */
type Proj = (x: number, y: number, z: number) => [number, number];
type At = (key: string, x: number, y: number) => [number, number];

const WOOD = '#6a4a2c', WOOD2 = '#4a321c', CHALK = '#e8e4d8', RED = '#e0302a', HOT = '#ffd0c0', EDGE = '#1a0606', STRAP = '#3a2a1a';

/** A tally, stroke by stroke, in `col` from (x, y) (top left), 1 px strokes `h` tall, fives crossed. */
function tally(g: CanvasRenderingContext2D, x: number, y: number, n: number, h: number, col: string, per = 2): void {
  g.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const five = Math.floor(i / 5), k = i % 5, ox = x + five * (per * 4 + 2);
    if (k < 4) g.fillRect(ox + k * per, y, 1, h);
    else for (let j = 0; j < per * 4; j++) g.fillRect(ox - 1 + j, y + h - 1 - Math.round((j * (h - 1)) / (per * 4 - 1)), 1, 1);
  }
}

/** Its kit, over the posed body (`bx`, `by` its feet; `hx`, `hy` its hand; `f` the way it faces). `t`: room time. */
export function drawChalkKit(c: Ctx, e: Enemy, bx: number, by: number, hx: number, hy: number, f: number, t: number): void {
  const g = c.lit, x = Math.round(bx), y = Math.round(by);
  // The board on its back, over the shoulder away from its hand, on a strap across the chest.
  const ox = x - f * 7 - (f < 0 ? 0 : 5), oy = y - 17;
  g.fillStyle = WOOD2;
  g.fillRect(ox, oy, 6, 8);
  g.fillStyle = WOOD;
  g.fillRect(ox, oy, 6, 1), g.fillRect(ox, oy + 4, 6, 1);
  tally(g, ox + 1, oy + 1, 3, 3, CHALK, 1), tally(g, ox + 1, oy + 5, 2, 2, CHALK, 1);
  g.fillStyle = STRAP;
  for (let i = 0; i < 5; i++) g.fillRect(x - f * 2 + f * i, y - 11 + i, 1, 1);
  // The chalk in its hand: raised and scratching just after a stroke.
  const since = t - (e.chalkAt ?? -9), up = since >= 0 && since < 0.35 ? 4 : 0;
  g.fillStyle = CHALK;
  g.fillRect(Math.round(hx) - 1, Math.round(hy) - 3 - up, 2, 2);
  if (up) (c.glow.fillStyle = HOT), c.glow.fillRect(Math.round(hx), Math.round(hy) - 6 - up, 1, 1);
}

/** The tally board staged in the CRIES room (`n` strokes), stood on its post: feet at (x, y). */
export function drawTally(c: Ctx, n: number, x: number, y: number): void {
  const g = c.lit, X = Math.round(x), Y = Math.round(y), w = Math.min(26, 4 + Math.ceil(n / 5) * 10);
  g.fillStyle = WOOD2;
  g.fillRect(X - 1, Y - 14, 2, 14);
  g.fillStyle = WOOD;
  g.fillRect(X - (w >> 1), Y - 22, w, 10);
  g.fillStyle = WOOD2;
  g.fillRect(X - (w >> 1), Y - 13, w, 1);
  tally(g, X - (w >> 1) + 2, Y - 20, n, 6, CHALK);
}

/** The strokes over each hero being chalked, and the turn on them; by each view's projection, over the bodies. */
export function drawChalkMarks(g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj, at: At, ppu: number): void {
  const t = room.time;
  for (const h of room.heroes) {
    const n = h.chalk ?? 0, turned = (h.chalkedUntil ?? -9) > t;
    if (!n && !turned) continue;
    const [x, z] = at('h:' + h.id, h.x, h.y), since = t - (h.chalkAt ?? -9), left = (h.chalkedUntil ?? 0) - t;
    if (turned && left < 1 && Math.floor(t * 8) % 2) continue;
    const [sx, sy] = P(x, 2.05 + (h.z ?? 0) * 0.5, z), ox = Math.round(sx) - 4, oy = Math.round(sy) - 8, k = Math.max(n, turned ? CHALKER.five : 0);
    // Outlined, so it reads on snow and in the dark alike.
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) tally(g, ox + dx, oy + dy, k, 6, EDGE);
    const flash = turned && since < 0.35, pulse = turned && Math.floor(t * 6) % 2 === 0;
    tally(g, ox, oy, k, 6, flash || pulse ? HOT : RED);
    // The newest stroke, white as it goes on.
    if (!turned && since < 0.3 && n % 5) (g.fillStyle = CHALK), g.fillRect(ox + ((n - 1) % 5) * 2, oy, 1, 6);
    if (!turned) continue;
    // The fifth landing: a red flash round them; then a red sight turning at their feet while the pack is on them.
    const r = 0.55 + (flash ? (0.35 - since) * 3 : 0), m = Math.max(24, Math.round(r * ppu * 4));
    g.globalAlpha = flash ? 1 : 0.85;
    for (let i = 0; i < m; i++) {
      const a = (i / m) * Math.PI * 2 - t * 1.2;
      if (!flash && (i % (m / 5)) / (m / 5) > 0.55) continue;
      const [px, py] = P(x + Math.cos(a) * r, 0.02, z + Math.sin(a) * r);
      g.fillStyle = flash || i % 3 ? RED : HOT;
      g.fillRect(Math.round(px), Math.round(py), 1, 1);
    }
    g.globalAlpha = 1;
  }
}
