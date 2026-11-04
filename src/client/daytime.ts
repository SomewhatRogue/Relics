/**
 * A job's hour on screen, past what the lighting pass does with the ambient and the lights: the low
 * sun's long shadows (draw.ts SUN), and dawn's mist, pale bands lying over the ground and drifting,
 * drawn over everything in the glowing layer so it sits in front of bodies too. Cosmetic only.
 */
import type { Theme } from '../shared/arena';
import { SUN } from './draw';
import { drawWeather } from './weather';

/** Set the shadows for this frame's map (the town and indoors have no low sun). */
export function setSun(theme: Theme): void {
  SUN.k = theme.sun ?? 0;
}

/** How much a hour's fires and lanterns count (1 when the map says nothing). */
export const torchIn = (theme: Theme) => theme.torch ?? 1;

const BAND = 26, TILE_W = 360, TILE_H = BAND * 4;
let tile: HTMLCanvasElement | null = null;

/** Four bands of mist on one tile, made once: soft middles, thin edges, broken into long patches. */
function mistTile(): HTMLCanvasElement {
  const t = document.createElement('canvas');
  (t.width = TILE_W), (t.height = TILE_H);
  const g = t.getContext('2d')!;
  g.fillStyle = '#c8d2dc';
  for (let j = 0; j < 4; j++) for (let r = 0; r < 12; r++) {
    g.globalAlpha = r < 3 || r > 8 ? 0.5 : 1;
    for (let x0 = -((j * 57 + r * 3) % 180); x0 < TILE_W; x0 += 180) g.fillRect(x0, j * BAND + r, 110 + ((j * 31 + r * 7) % 50), 1);
  }
  return t;
}

/** Dawn's mist: soft bands anchored to the world (so they stay put as you walk), drifting slowly east. */
export function drawMist(g: CanvasRenderingContext2D, theme: Theme, vw: number, vh: number, cx: number, cy: number, now: number): void {
  // A routed job's rain and storm come over everything with the mist (client/weather.ts).
  drawWeather(g, theme, vw, vh, now);
  const m = theme.mist ?? 0;
  if (m <= 0) return;
  tile ??= mistTile();
  g.globalAlpha = 0.1 * m;
  const ox = -(((cx - now * 4) % TILE_W) + TILE_W) % TILE_W, oy = -((cy % TILE_H) + TILE_H) % TILE_H;
  for (let y = oy; y < vh; y += TILE_H) for (let x = ox; x < vw; x += TILE_W) g.drawImage(tile, Math.round(x), Math.round(y));
  g.globalAlpha = 1;
}
