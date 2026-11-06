/**
 * The Night Watch's night: the moon and the stars (glowing), cloud drifting over the moon (it goes dark
 * on the field too: watchview.ts turns the light down with it), and fog banks rolling in low over the
 * fields, painted in dithered steps on the lit layer so the lighting shades them like everything else.
 */
import { FIELDS, NIGHT, WATCH, groundY } from '../shared/watchtune';
import { cover, fogAt } from '../sim/watchnight';
import type { WatchState } from '../sim/watchtypes';
import { dith, farHill } from './watchland';

type G2 = CanvasRenderingContext2D;
/** The moon's size (where it hangs is the field's: FIELDS). */
export const MOON = { r: 6 };
const STARS = Array.from({ length: 46 }, (_, i) => [((i * 97) % 300) - 34, ((i * 53) % 110) - 40, i % 3] as const);

/** The moon (craters and all), its halo, the stars, and cloud across them: (ox, oy) is the field's corner. */
export function drawSky(glow: G2, s: WatchState, ox: number, oy: number, now: number): void {
  const F = FIELDS[s.field], c = cover(s.clouds, s.t), mx = ox + F.moon[0], my = oy + F.moon[1];
  for (const [x, y, k] of STARS) {
    // (None up under the clock and score.)
    if (oy + y < 16 || y > farHill(x) + F.hills - 3 || groundY(Math.min(x, WATCH.wallX), s.field) < y + 2 || (x > WATCH.wallX - 4 && y > WATCH.parapetTop - 30)) continue;
    const tw = (Math.sin(now * (1.3 + k) + x) + 1) / 2;
    glow.globalAlpha = (0.25 + 0.45 * tw) * (1 - c * 0.85);
    glow.fillStyle = k === 0 ? '#e8e4ff' : '#9aa4c8';
    glow.fillRect(ox + x, oy + y, 1, 1);
  }
  // The halo: a ring of dithered light round the moon, fading out behind cloud.
  glow.fillStyle = '#6a7090';
  for (let y = -14; y <= 14; y++)
    for (let x = -14; x <= 14; x++) {
      const d = Math.hypot(x, y);
      if (d > MOON.r + 1 && d < 14 && dith(mx + x, my + y, (1 - (d - MOON.r) / 8) * 0.5 * (1 - c))) glow.fillRect(mx + x, my + y, 1, 1);
    }
  glow.globalAlpha = 1 - c * 0.7;
  for (let y = -MOON.r; y <= MOON.r; y++)
    for (let x = -MOON.r; x <= MOON.r; x++) {
      if (x * x + y * y > MOON.r * MOON.r) continue;
      const crater = (x === -2 && y === -1) || (x === 1 && y === 2) || (x === 2 && y === 1) || (x === -1 && y === 3);
      glow.fillStyle = crater ? '#bab6a4' : x + y > 4 ? '#d4d0bc' : '#ece8d6';
      glow.fillRect(mx + x, my + y, 1, 1);
    }
  glow.globalAlpha = 1;
  if (c <= 0) return;
  // The cloud: a few dark lumps run together, drifting slowly across as it thickens.
  const cx = mx - 10 + ((s.t * 1.5) % 30) - 15;
  glow.fillStyle = '#151924';
  for (let y = -14; y <= 12; y++)
    for (let x = -50; x <= 50; x++) {
      let e = 9;
      for (const [bx, by, rx, ry] of LUMPS) e = Math.min(e, ((x - bx) / rx) ** 2 + ((y - by) / ry) ** 2);
      if (e < 1 && dith(cx + x, my + y, Math.min(1, c * 1.4 * (1.2 - e)))) glow.fillRect(cx + x, my + y, 1, 1);
    }
}
/** The cloud's lumps: centre and half-size. */
const LUMPS = [[-30, 3, 20, 6], [-9, -2, 17, 9], [12, 1, 19, 8], [33, 4, 16, 5], [0, 6, 40, 5]];

/** Fog over the field, on the lit layer: pale, in dithered steps, thickest low down in the middle of a bank. */
export function drawFog(lit: G2, s: WatchState, ox: number, oy: number, lw: number): void {
  if (!s.fogs.some((f) => s.t >= f.at)) return;
  lit.fillStyle = '#aab2c4';
  for (let cx = 0; cx < lw; cx++) {
    const x = cx - ox, gy = groundY(Math.min(x, WATCH.wallX - 1), s.field);
    if (x >= WATCH.wallX) continue;
    // Its top rolls: higher here, lower there, moving with the bank.
    const top = NIGHT.fogHigh * (0.65 + 0.35 * Math.sin(x / 11 - s.t * 0.4) * Math.sin(x / 5 + 1));
    for (let up = -2; up <= top; up++) {
      const f = fogAt(s.fogs, s.t, x, up) * Math.min(1, (top - up) / 6), cy = Math.round(oy + gy - up);
      // Stepped in four bands, then dithered (the look of the lighting pass).
      if (f > 0 && dith(cx + Math.floor(s.t * 3), cy, Math.round(f * 4) / 4.6)) lit.fillRect(cx, cy, 1, 1);
    }
  }
}
