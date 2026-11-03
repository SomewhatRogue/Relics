/**
 * A nest being burned out (sim/torch.ts), from the room's state alone, the same in both views: a ring
 * round it filling while someone crouches to light it (gold on dark, like the ring for getting a friend
 * up), then a blaze over the mound as it chars and sinks, then a low heap of ash with embers going out.
 * Flicker uses the wall clock; how far along it is comes from the room's time.
 */
import { NEST } from '../shared/tuning';
import type { Enemy } from '../sim/types';
import { ring, type Ctx } from './draw';

const FLAME = ['#fff1b0', '#ffd27a', '#ff9a3c', '#ff6a20', '#d8401a'];
/** How long the ash smoulders after (seconds): just the look. */
const EMBERS = 6;

/** The ring while it's being lit: fills over NEST.light, sparks catching at its foot. */
export function drawLighting(c: Ctx, e: Enemy, x: number, y: number): void {
  if (!e.lighter || !e.lightT) return;
  const k = Math.min(1, e.lightT / NEST.light), g = c.glow;
  ring(c, x, y - 2, 15, '#ffb040', k, '#3a2418');
  g.fillStyle = FLAME[Math.floor(c.now * 20) % 3];
  for (let i = 0; i < 2 + Math.floor(k * 6); i++) {
    const a = i * 2.39 + c.now * 3, r = 6 + (i % 3) * 2;
    g.globalAlpha = 0.5 + 0.5 * k;
    g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y - 1 + Math.sin(a) * r * 0.3 - ((c.now * 9 + i) % 3)), 1, 1);
  }
  g.globalAlpha = 1;
}

/** 0 as it catches, 1 as it goes to ash. */
export const burnt = (e: Enemy, t: number) => (e.ashAt ? Math.min(1, Math.max(0, 1 - (e.ashAt - t) / NEST.burn)) : 0);

/** The blaze over a nest alight: tall at first, sinking as it burns down (the mound chars: spiders.ts). */
export function drawBlaze(c: Ctx, e: Enemy, x: number, y: number, t: number): void {
  const k = burnt(e, t), g = c.glow;
  const tall = 24 * (1 - k * 0.6);
  // Tongues of fire, wide and yellow at the root, thin and red at the tip, swaying as they go up.
  for (let i = 0; i < 11; i++) {
    const bx = x - 10 + ((i * 9) % 21), mid = 1 - Math.abs(bx - x) / 12, ph = c.now * 7 + i * 2.1;
    const h = Math.max(3, Math.round(tall * (0.35 + 0.65 * mid) * (0.7 + 0.3 * Math.sin(ph * 1.3))));
    for (let j = 0; j < h; j++) {
      const q = j / h, w = Math.max(1, Math.round(3 * (1 - q) * (0.6 + mid * 0.6))), sx = Math.round(bx + Math.sin(ph + j * 0.35) * q * 2.5);
      g.fillStyle = FLAME[Math.min(4, Math.floor(q * 4.6))];
      g.globalAlpha = q > 0.8 ? 0.55 : 0.95;
      g.fillRect(sx - (w >> 1), Math.round(y - j), w, 1);
    }
  }
  // Sparks going up off it.
  g.fillStyle = '#ffd27a';
  for (let i = 0; i < 6; i++) {
    const b = (c.now * 0.8 + i * 0.17) % 1;
    g.globalAlpha = 1 - b;
    g.fillRect(Math.round(x + Math.sin(i * 2.7 + c.now * 2) * 7), Math.round(y - tall - b * 16), 1, 1);
  }
  g.globalAlpha = 1;
}

/** What a burned nest leaves: a low heap of grey ash, embers in it going out. */
export function drawAsh(c: Ctx, e: Enemy, x: number, y: number): void {
  const l = c.lit, g = c.glow;
  // A low grey mound, paler on top, with a few black sticks of web in it.
  for (let r = -4; r <= 1; r++) {
    const half = Math.round(12 * Math.sqrt(Math.max(0, 1 - ((r + 1.5) * (r + 1.5)) / 12.25)));
    for (let i = -half; i <= half; i++) {
      l.fillStyle = r < -2 ? ((i + r) & 1 ? '#8a8480' : '#6e6862') : (i * 3 + r * 5) & 4 ? '#55504c' : (i + r) & 1 ? '#3a3532' : '#6a6460';
      l.fillRect(Math.round(x + i), Math.round(y + r), 1, 1);
    }
  }
  l.fillStyle = '#141010';
  for (const [sx, sy, len] of [[-7, -2, 4], [3, -3, 5], [-2, 0, 3]]) l.fillRect(Math.round(x + sx), Math.round(y + sy), len, 1);
  const glow = Math.max(0, 1 - e.actT / EMBERS);
  if (!glow) return;
  for (let i = 0; i < 9; i++) {
    g.fillStyle = i % 2 ? '#ff6a20' : '#ffb040';
    g.globalAlpha = glow * (0.5 + 0.5 * Math.sin(c.now * 6 + i * 1.9));
    g.fillRect(Math.round(x - 10 + ((i * 7) % 21)), Math.round(y - 3 + (i % 4)), 1, 1);
  }
  g.globalAlpha = 1;
}

/** How bright a nest's small glow is (0 none): growing while it's lit, fading as its ash goes cold. */
export const nestEmber = (e: Enemy): number =>
  e.kind !== 'nest' ? 0 : e.act === 'dead' ? (e.death === 'burn' ? 0.5 * Math.max(0, 1 - e.actT / EMBERS) : 0) : e.lighter && e.lightT ? 0.2 + 0.4 * Math.min(1, e.lightT / NEST.light) : 0;
