/**
 * The Haulier's tracks as a still floor: the bed and rails of each track, and where its two tunnel mouths are.
 * Its own file, with no sprites, so the still floor (client/world.ts paintMap) can paint them without loading the
 * sprites (Node tests import world.ts: art log 2026-11-13). The rest of the sump is client/sumpdraw.ts.
 */
import type { GameMap } from '../shared/arena';
import type { Ctx } from './draw';
import { OX, OY, PX } from './world';

export const WOOD = '#5a3d22', WOOD_HI = '#7a5a38', WOOD_LO = '#3a2616', IRON = '#5e5a58', IRON_HI = '#9a968f', IRON_LO = '#34302f', RUST = '#6a4632';
export const fill = (g: CanvasRenderingContext2D, col: string, x: number, y: number, w: number, h: number) => ((g.fillStyle = col), g.fillRect(Math.round(x), Math.round(y), w, h));

export type Tr = { x0: number; y0: number; x1: number; y1: number };
export type Seg = { x: number; y: number; len: number; vert: boolean };
export const seg = (t: Tr, cx: number, cy: number): Seg => ({ x: OX + Math.min(t.x0, t.x1) * PX - cx, y: OY + Math.min(t.y0, t.y1) * PX - cy, len: Math.round(Math.hypot(t.x1 - t.x0, t.y1 - t.y0) * PX), vert: t.x0 === t.x1 });
/** A rectangle in the track's own frame: u along it, v across it (0 its middle). */
export const tf = (g: CanvasRenderingContext2D, s: Seg, col: string, u: number, v: number, w: number, h: number) => (s.vert ? fill(g, col, s.x + v, s.y + u, h, w) : fill(g, col, s.x + u, s.y + v, w, h));

/** The tracks painted into a room's still floor (client/world.ts paintMap), for the 3D view's ground (three/ground.ts). */
export function paintTracks(g: CanvasRenderingContext2D, map: GameMap): void {
  const c = { lit: g, glow: g, now: 0 } as unknown as Ctx;
  for (const t of map.tracks ?? []) drawBed(c, seg(t, 0, 0), false);
  for (const t of map.tracks ?? []) drawBed(c, seg(t, 0, 0), true);
}

/** The mouths at a track's two ends, with the side of the room each is on (tile coordinates). */
export function mouthsOf(t: Tr, map: GameMap): [number, number, 'l' | 'r' | 't' | 'b'][] {
  return t.x0 === t.x1
    ? [[t.x0, 0, 't'], [t.x1, map.h, 'b']]
    : [[0, t.y0, 'l'], [map.w, t.y0, 'r']];
}

/** One track's bed (sleepers, gravel) or its rails: a pass each, so crossings read. */
export function drawBed(c: Ctx, s: Seg, rails: boolean): void {
  const g = c.lit, T = (col: string, u: number, v: number, w: number, h: number) => tf(g, s, col, u, v, w, h);
  if (!rails) {
    for (let u = 2; u < s.len; u += 3) {
      const h = (u * 7919) % 13;
      if (h < 6) T(h < 2 ? '#4a4652' : '#3a3640', u, -9 + h * 3, 2, 1);
      if (h === 11) T('#8a6a3a', u, 9, 1, 1);
    }
    for (let u = 3; u < s.len - 2; u += 9) {
      T(WOOD_LO, u, -8, 4, 17), T(WOOD, u, -8, 3, 16), T(WOOD_HI, u, -8, 3, 1);
      T(IRON_HI, u, -5, 1, 1), T(IRON_HI, u, 5, 1, 1);
    }
    return;
  }
  for (const v of [-5, 5]) {
    T(IRON_LO, 0, v + 1, s.len, 1), T('#8a8690', 0, v, s.len, 1);
    for (let u = 4; u < s.len; u += 23) T(RUST, u, v, 5, 1);
  }
}
