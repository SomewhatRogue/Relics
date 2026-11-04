/**
 * Ways out by the side of a room or down through its front kerb (layout 3: shared/ports.ts), drawn
 * flat. Painted once: a dark opening cut in the side wall's strip (or the kerb), posts either side.
 * Each frame: shut, planks across it; open, light in it and a torch either side on the floor just
 * inside, lit with the other lamps. A side way to a dead end is always open, a dim glow in it so you
 * notice it. The 2.5D view cuts the same gaps (three/ground.ts). Drawing only.
 */
import type { Area, GameMap } from '../shared/arena';
import { lampAt } from '../shared/lamps';
import type { Side } from '../shared/ports';
import type { Light } from './light';
import { OX, OY, PX } from './world';

type Rect = (x: number, y: number, w: number, h: number, col: string) => void;
export interface Gap { a: Area; side: Side; dead?: boolean }

/** Every gap a map has in its sides and kerb: its ways out (not a house's door) and its side ways. */
export function sideGaps(m: GameMap, ways: Area[]): Gap[] {
  const out: Gap[] = [];
  for (const a of ways) {
    if (a.x < 1 && a.w < 1.5) out.push({ a, side: 'W' });
    else if (a.x + a.w > m.w - 1 && a.w < 1.5) out.push({ a, side: 'E' });
  }
  for (const b of m.blocks) if (b.kind === 'sideway' && b.face) out.push({ a: b, side: b.face, dead: true });
  return out;
}

/** The opening and its posts, into the map's still picture. */
export function paintSideGaps(m: GameMap, gaps: Gap[], rect: Rect, W: number, H: number): void {
  const wood = m.theme.back === 'palisade' || m.theme.back === 'trees', post = wood ? '#4a3424' : '#4f4a5c';
  for (const { a, side } of gaps) {
    if (side === 'S') {
      const x0 = OX + Math.round(a.x * PX), w = Math.round(a.w * PX);
      rect(x0, H - 8, w, 8, '#08070b'), rect(x0 - 3, H - 10, 3, 10, post), rect(x0 + w, H - 10, 3, 10, post);
      continue;
    }
    const y0 = OY + Math.round(a.y * PX), h = Math.round(a.h * PX), x0 = side === 'W' ? 0 : W - OX;
    rect(x0, y0, OX, h, '#08070b');
    for (let i = 0; i < 3; i++) rect(side === 'W' ? 0 : W - 2 - i * 2, y0 + 2 + i * 2, 2, h - 4 - i * 4, ['#1c1a21', '#16141a', '#110f14'][i]);
    rect(x0 - (side === 'W' ? 0 : 2), y0 - 4, OX + 2, 4, post), rect(x0 - (side === 'W' ? 0 : 2), y0 + h, OX + 2, 4, post);
  }
}

/** Shut or open, each frame; returns the torches' light. */
export function drawSideGaps(g: CanvasRenderingContext2D, l: CanvasRenderingContext2D, m: GameMap, gaps: Gap[], open: boolean, cx: number, cy: number, now: number, flame: (g: CanvasRenderingContext2D, x: number, y: number, now: number) => void): Light[] {
  const lights: Light[] = [];
  for (const { a, side, dead } of gaps) {
    const x0 = OX + a.x * PX - cx, y0 = OY + a.y * PX - cy, w = a.w * PX, h = a.h * PX;
    if (side === 'S') {
      // A gap in the front kerb: a faint glow at its sill.
      g.globalAlpha = 0.25, (g.fillStyle = '#ffe2a0'), g.fillRect(Math.round(x0 + 2), Math.round(y0 + h - 3), w - 4, 3), (g.globalAlpha = 1);
      lights.push({ x: x0 + w / 2, y: y0, r: 40, i: 0.45, c: [1, 0.9, 0.7] });
      continue;
    }
    const edge = side === 'W' ? OX - cx : OX + m.w * PX - cx, inward = side === 'W' ? 1 : -1;
    if (dead) {
      g.globalAlpha = 0.22, (g.fillStyle = '#ffe2a0'), g.fillRect(Math.round(edge - (side === 'W' ? 6 : 0)), Math.round(y0 + 3), 6, h - 6), (g.globalAlpha = 1);
      lights.push({ x: edge + inward * 6, y: y0 + h / 2, r: 38, i: 0.45, c: [1, 0.9, 0.7] });
      continue;
    }
    if (!open) {
      // Planks lashed across the gap.
      l.fillStyle = '#5a3d22';
      for (let y = 3; y < h - 2; y += 6) l.fillRect(Math.round(edge - 6), Math.round(y0 + y), 14, 3);
      continue;
    }
    for (let i = 0; i < 8; i++) (g.globalAlpha = 0.24 - i * 0.025), (g.fillStyle = '#ffe2a0'), g.fillRect(Math.round(edge + inward * i * 3 - (side === 'W' ? 0 : 3)), Math.round(y0 + 2), 3, h - 4);
    g.globalAlpha = 1;
    // A torch either side of the gap, just inside the room.
    const on = lampAt(m.theme, a.x, a.y), tx = edge + inward * 10;
    for (const ty of [y0 - 8, y0 + h + 4]) {
      (l.fillStyle = '#4a3424'), l.fillRect(Math.round(tx), Math.round(ty), 2, 12);
      if (on > 0.5) flame(g, tx + 1, ty - 1, now);
      if (on > 0) lights.push({ x: tx + 1, y: ty - 2, r: 80 + Math.sin(now * 11 + ty) * 4, i: 1.1 * on, c: [1, 0.7, 0.4] });
    }
    lights.push({ x: edge + inward * 8, y: y0 + h / 2, r: 60, i: 0.7, c: [1, 0.9, 0.7] });
  }
  return lights;
}
