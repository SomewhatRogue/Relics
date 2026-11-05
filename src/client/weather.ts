/**
 * A job's rain on screen (shared/weather.ts), over everything like the mist, in both views: thin
 * slanted streaks with a little gloom, and splashes. The fog is drawn through the light (client/skyfx.ts)
 * and a storm's flashes come with its strikes (stormdraw.ts), so a flash always means lightning landing.
 * Cosmetic only; where each streak falls is worked out from the clock, so every frame is the same
 * without keeping any state.
 */
import type { Theme } from '../shared/arena';

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export function drawWeather(g: CanvasRenderingContext2D, theme: Theme, vw: number, vh: number, now: number): void {
  const rain = theme.rain ?? 0;
  if (rain <= 0) return;
  // A little gloom under the cloud.
  g.globalAlpha = 0.1 + 0.12 * rain;
  g.fillStyle = '#1a2230';
  g.fillRect(0, 0, vw, vh);
  // Streaks: each its own speed and place, falling and drifting left with the wind.
  const n = Math.round((vw * vh * rain) / 520);
  g.fillStyle = '#b4c4d6';
  for (let i = 0; i < n; i++) {
    const sp = 220 + hash(i) * 120, len = 6 + Math.floor(hash(i + 0.5) * 5);
    const y = (hash(i + 0.25) * (vh + 40) + now * sp) % (vh + 40) - 20, x = ((hash(i + 0.75) * (vw + 60) - now * sp * 0.25) % (vw + 60) + vw + 60) % (vw + 60) - 30;
    g.globalAlpha = 0.32 + hash(i + 0.1) * 0.3;
    for (let k = 0; k < len; k++) g.fillRect(Math.round(x - k / 3), Math.round(y + k), 1, 1);
  }
  // Where it lands: small splashes that come and go.
  g.fillStyle = '#c8d4e0';
  for (let i = 0; i < n / 4; i++) {
    const t = now * 3 + hash(i + 9) * 10;
    if (t % 1 > 0.25) continue;
    g.globalAlpha = 0.3;
    g.fillRect(Math.round(hash(i + Math.floor(t)) * vw), Math.round(hash(i + 3 + Math.floor(t)) * vh), 2, 1);
  }
  g.globalAlpha = 1;
}
