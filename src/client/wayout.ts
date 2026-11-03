/**
 * The way out of a room, so you can't miss it. Painted once: a gap in the back wall where the way on is
 * (posts and a lintel, a dark passage), a doorstep where a house's door is. Drawn each frame: shut, stakes
 * across the gap; open, light in it, a torch either side and gold chevrons on the floor running into it
 * (out of a house, down through the door). Also the small marks at the screen's edge for anyone you've
 * freed who's fallen behind out of sight, and the point those (and the quest marks) share. Drawing only.
 */
import type { Area, GameMap } from '../shared/arena';
import { lampAt } from '../shared/lamps';
import type { Survivor } from '../sim/types';
import type { Ctx } from './draw';
import type { Light } from './light';
import { OX, OY, PX } from './world';

type Rect = (x: number, y: number, w: number, h: number, col: string) => void;

/** Every way out of the map: its exit, or the roads at a fork. */
export const waysOut = (m: GameMap): Area[] => (m.exit ? [m.exit] : (m.roads ?? []).map((r) => r.area));
const top = (a: Area) => a.y < 1;

/** The gaps, painted into the map's still picture (world.ts). */
export function paintGaps(m: GameMap, rect: Rect): void {
  const wood = m.theme.back === 'palisade' || m.theme.back === 'trees';
  for (const a of waysOut(m)) {
    const x0 = OX + Math.round(a.x * PX), w = Math.round(a.w * PX);
    if (top(a)) {
      // The passage through the wall: dark, the floor running back into it.
      rect(x0, 6, w, OY - 6, '#08070b');
      for (let i = 0; i < 4; i++) rect(x0 + 2 + i * 2, OY - 4 - i * 4, w - 4 - i * 4, 2, ['#24212a', '#1c1a21', '#16141a', '#110f14'][i]);
      const post = wood ? '#4a3424' : '#4f4a5c', edge = wood ? '#2e2016' : '#2a2733';
      rect(x0 - 4, 2, 4, OY - 2, post), rect(x0 - 1, 2, 1, OY - 2, edge);
      rect(x0 + w, 2, 4, OY - 2, post), rect(x0 + w, 2, 1, OY - 2, edge);
      rect(x0 - 5, 0, w + 10, 4, wood ? '#3a2a1c' : '#5a5466');
    } else {
      // A house's door: a worn sill and the dark beyond it.
      const y = OY + Math.round((a.y + a.h) * PX) - 3;
      rect(x0, y, w, 11, '#08070b');
      rect(x0, y, w, 2, '#5a3d22');
    }
  }
}

/** Shut or open, each frame (screen offset `cx`, `cy`); returns the torches' light. */
export function drawWays(c: Ctx, m: GameMap, open: boolean, cx: number, cy: number, now: number): Light[] {
  const lights: Light[] = [], g = c.glow, l = c.lit;
  for (const a of waysOut(m)) {
    const x0 = OX + a.x * PX - cx, w = a.w * PX, mid = x0 + w / 2;
    if (top(a)) {
      const y0 = OY - cy;
      if (!open) {
        // Stakes across the gap, a plank lashed over them.
        for (let x = 2; x < w - 1; x += 5) (l.fillStyle = '#5a3d22'), l.fillRect(Math.round(x0 + x), Math.round(y0 - 30), 3, 34), (l.fillStyle = '#3a2a1a'), l.fillRect(Math.round(x0 + x + 2), Math.round(y0 - 30), 1, 34);
        l.fillStyle = '#6b4a2b';
        l.fillRect(Math.round(x0 - 2), Math.round(y0 - 18), w + 4, 3);
        continue;
      }
      // Light in the gap, stronger toward the floor.
      for (let i = 0; i < 12; i++) (g.globalAlpha = 0.06 + i * 0.025), (g.fillStyle = '#ffe2a0'), g.fillRect(Math.round(x0 + 2), Math.round(y0 - 46 + i * 4), w - 4, 4);
      g.globalAlpha = 1;
      // A torch either side, on the floor in front of the posts: lit with the other lamps (shared/lamps.ts).
      const on = lampAt(m.theme, a.x, a.y);
      for (const tx of [x0 - 7, x0 + w + 6]) {
        (l.fillStyle = '#4a3424'), l.fillRect(Math.round(tx), Math.round(y0 + 2), 2, 12);
        if (on <= 0) (l.fillStyle = '#1a1410'), l.fillRect(Math.round(tx), Math.round(y0), 2, 2);
        else if (on > 0.5) flame(g, tx + 1, y0 + 1, now);
        if (on > 0) lights.push({ x: tx + 1, y: y0, r: 80 + Math.sin(now * 11 + tx) * 4, i: 1.1 * on, c: [1, 0.7, 0.4] });
      }
      lights.push({ x: mid, y: y0 - 6, r: 60, i: 0.7, c: [1, 0.9, 0.7] });
      chevrons(g, mid, y0 + 14, -1, now);
    } else {
      // Out of a house: light on the sill and chevrons down through the door.
      const y1 = OY + (a.y + a.h) * PX - cy;
      g.globalAlpha = 0.3;
      g.fillStyle = '#ffe2a0';
      g.fillRect(Math.round(x0 + 2), Math.round(y1 - 3), w - 4, 3);
      g.globalAlpha = 1;
      lights.push({ x: mid, y: y1 - 4, r: 46, i: 0.6, c: [1, 0.9, 0.7] });
      chevrons(g, mid, y1 - 30, 1, now);
    }
  }
  return lights;
}

/** Three gold chevrons from (x, y) running `dir` (-1 up the screen, 1 down), each brightening in turn. */
function chevrons(g: CanvasRenderingContext2D, x: number, y: number, dir: number, now: number): void {
  g.fillStyle = '#ffd27a';
  for (let k = 0; k < 3; k++) {
    const p = (now * 1.6 + k / 3) % 1, cy = y - dir * k * 9;
    g.globalAlpha = 0.25 + 0.65 * (1 - p);
    for (let s = -4; s <= 4; s++) g.fillRect(Math.round(x + s), Math.round(cy + dir * (4 - Math.abs(s))), 1, 2);
  }
  g.globalAlpha = 1;
}

function flame(g: CanvasRenderingContext2D, x: number, y: number, now: number): void {
  const f = Math.floor(now * 10 + x) % 3, px = (dx: number, dy: number, col: string) => ((g.fillStyle = col), g.fillRect(Math.round(x + dx), Math.round(y + dy), 1, 1));
  px(0, 0, '#fff1b0'), px(-1, 0, '#ff9a3c'), px(1, 0, '#ff9a3c'), px(0, -1, '#ffd27a');
  px(0, -2 - (f === 0 ? 1 : 0), '#ffb44c'), px(f === 1 ? 1 : -1, -3, '#ff7a28'), px(f === 2 ? -1 : 1, -1, '#ffd27a');
}

/** The view and what the HUD covers at its top and bottom (screen pixels), for marks at the edge. */
export interface View { vw: number; vh: number; top: number; bottom: number }

/**
 * Where a mark for something at (sx, sy) on screen sits, held inside the view clear of the HUD, and the
 * way toward it; null when it's in sight. Draws the little point toward it, `bob` pixels along.
 */
export function edgeMark(g: CanvasRenderingContext2D, sx: number, sy: number, v: View, bob: number, col: string): { x: number; y: number; ux: number; uy: number } | null {
  const m = 8;
  if (sx >= 0 && sx <= v.vw && sy >= v.top && sy <= v.vh - v.bottom) return null;
  const ex = Math.max(m, Math.min(v.vw - m, sx)), ey = Math.max(v.top + m, Math.min(v.vh - v.bottom - m, sy));
  const dx = sx - ex, dy = sy - ey, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, x = ex - ux * bob, y = ey - uy * bob;
  g.fillStyle = col;
  for (let k = 1; k <= 3; k++) for (let w = -(3 - k); w <= 3 - k; w++) g.fillRect(Math.round(ex + ux * (5 + k) - uy * w), Math.round(ey + uy * (5 + k) + ux * w), 1, 1);
  return { x, y, ux, uy };
}

/**
 * Someone you've freed (not yet home) out of sight: a small pale mark at the edge of the screen, toward
 * them, bobbing, so you know who you've left behind.
 */
export function behindMarks(c: Ctx, list: Survivor[], cx: number, cy: number, v: View, now: number): void {
  const g = c.glow;
  for (const s of list) {
    if (s.dead || s.gone || s.home >= 0) continue;
    const at = edgeMark(g, OX + s.x * PX - cx, OY + s.y * PX - cy - 8, v, Math.sin(now * 6 + s.id) * 1.5, '#c8f0c0');
    if (!at) continue;
    // A head and shoulders.
    g.fillRect(Math.round(at.x - 1), Math.round(at.y - 3), 3, 3);
    g.fillRect(Math.round(at.x - 2), Math.round(at.y + 1), 5, 2);
  }
}
