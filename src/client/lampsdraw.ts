/**
 * The tended lamps in the flat view: wall torches, braziers and lamp posts, burning or put out by the
 * shared rule (shared/lamps.ts). Burning, a flickering flame on the glow and its pool of light; out, a
 * charred torch head, a brazier of grey ash, a post with nothing in its lamp, and no light at all, so
 * by day the sun does the work. A camp's brazier (`wild`) burns whatever the hour. Drawing only.
 */
import type { GameMap } from '../shared/arena';
import { lampAt } from '../shared/lamps';
import { blit, type Ctx } from './draw';
import type { Light } from './light';
import { SPRITES } from './sprites';
import { OX, OY, PX } from './world';

/** A small flickering flame on the glow at (x, y). */
export function flame(g: CanvasRenderingContext2D, x: number, y: number, now: number, size: number): void {
  const f = Math.floor(now * 10 + x) % 3;
  const px = (dx: number, dy: number, col: string) => ((g.fillStyle = col), g.fillRect(Math.round(x + dx), Math.round(y + dy), 1, 1));
  px(0, 0, '#fff1b0');
  px(-1, 0, '#ff9a3c');
  px(1, 0, '#ff9a3c');
  px(0, -1, '#ffd27a');
  px(0, -2 - (f === 0 ? 1 : 0), '#ffb44c');
  px(f === 1 ? 1 : -1, -3, '#ff7a28');
  if (size > 1) px(f === 2 ? -1 : 1, -1, '#ffd27a'), px(0, -4, '#ff6a20');
}

/** How lit this brazier is (a camp's always). */
export const brazierOn = (m: GameMap, b: GameMap['braziers'][number]) => (b.wild ? 1 : lampAt(m.theme, b.x, b.y));

/** A brazier at its foot (x, y on screen): two flames over the coals, or cold grey ash. */
export function drawBrazier(c: Ctx, x: number, y: number, now: number, on: number): void {
  blit(c, SPRITES.brazier, x, y);
  if (on > 0.5) {
    // (Over the coals of the brazier, twice its first height since the heroic proportions.)
    flame(c.glow, x - 2, y - 20, now, 2);
    flame(c.glow, x + 2, y - 20, now + 0.37, 2);
    // Coals glowing between the flames, one or two flaring in turn.
    const g = c.glow, f = Math.floor(now * 6);
    for (let i = 0; i < 5; i++) (g.fillStyle = (f + i * 3) % 7 < 2 ? '#ffb84a' : '#c8501a'), g.fillRect(Math.round(x - 4 + i * 2), Math.round(y - 16), 1, 1);
    return;
  }
  const r = (dx: number, w: number, col: string) => ((c.lit.fillStyle = col), c.lit.fillRect(Math.round(x + dx), Math.round(y - 16), w, 1));
  r(-3, 6, '#5a5660');
  r(-2, 1, '#77727e');
  r(1, 1, '#3a3640');
}

/** Torches on the wall, braziers' light and lamp posts this frame; their lights go into `lights`. */
export function drawLamps(c: Ctx, m: GameMap, cx: number, cy: number, now: number, tk: number, lights: Light[]): void {
  for (const t of m.torches) {
    const x = OX + t.x * PX - cx, y = OY + t.y * PX - cy, on = lampAt(m.theme, t.x, t.y);
    if (on <= 0) {
      // Put out: a charred head on the stick.
      c.lit.fillStyle = '#1a1410';
      c.lit.fillRect(Math.round(x - 1), Math.round(y - 1), 3, 2);
      continue;
    }
    if (on > 0.5) flame(c.glow, x, y - 1, now, 1);
    lights.push({ x, y: y - 3, r: 118 + Math.sin(now * 13 + x) * 4 + Math.sin(now * 7.3) * 3, i: 1.15 * tk * on, c: [1, 0.66, 0.36] });
  }
  for (const b of m.braziers) {
    const on = brazierOn(m, b), x = OX + b.x * PX - cx, y = OY + b.y * PX - cy;
    if (on > 0) lights.push({ x, y: y - 16, r: 78 + Math.sin(now * 11 + x) * 3, i: 0.95 * tk * on, c: [1, 0.6, 0.3] });
  }
  for (const r of m.rounds) {
    if (r.kind !== 'post') continue;
    const on = lampAt(m.theme, r.x, r.y), x = OX + r.x * PX - cx, y = OY + r.y * PX - cy - 48;
    if (on <= 0) continue;
    if (on > 0.5) flame(c.glow, x, y + 3, now, 1);
    lights.push({ x, y, r: 64, i: 0.8 * tk * on, c: [1, 0.72, 0.42] });
  }
}
