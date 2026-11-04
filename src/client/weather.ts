/**
 * A job's weather on screen (shared/weather.ts), over everything like the mist, in both views: rain
 * falling in thin slanted streaks with a little gloom, fog as a pale veil thickening into the distance, and in a storm the sky flashing white now and
 * then, sometimes twice. Cosmetic only; where each streak falls is worked out from the clock, so every
 * frame is the same without keeping any state.
 */
import type { Theme } from '../shared/arena';

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export function drawWeather(g: CanvasRenderingContext2D, theme: Theme, vw: number, vh: number, now: number): void {
  const rain = theme.rain ?? 0, storm = theme.storm ?? 0, fog = theme.fog ?? 0;
  if (fog > 0) {
    // Fog: a pale veil, thicker toward the back of the room (farther off), over the mist's drifting bands.
    for (let y = 0; y < vh; y += 4) {
      g.globalAlpha = Math.min(0.5, fog * (0.16 + 0.22 * (1 - y / vh)));
      g.fillStyle = '#aab6c0';
      g.fillRect(0, y, vw, 4);
    }
    g.globalAlpha = 1;
  }
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
  // Lightning: a flash every so often in a storm, a second one hard after it now and then.
  if (storm > 0) {
    const every = 6.5, k = Math.floor(now / every), at = now - k * every, go = hash(k + 41) < 0.35 + storm * 0.5;
    const flash = go && (at < 0.08 || (hash(k + 7) < 0.5 && at > 0.18 && at < 0.24));
    if (flash) {
      g.globalAlpha = 0.22 + 0.2 * storm;
      g.fillStyle = '#e8eef8';
      g.fillRect(0, 0, vw, vh);
    }
  }
  g.globalAlpha = 1;
}
