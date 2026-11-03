/**
 * Small live things in Wickhold's streets, drawn where their round says (cosmetic only): crows at
 * the blood, hopping and pecking; a dog nosing about; smoke past the wall; and once Perrin's garden
 * has its lamp, moths round it after dark, with a soft light over the beds.
 */
import type { Round } from '../shared/arena';
import { daylight } from '../shared/daylight';
import { townPhase } from './townclock';
import type { Ctx } from './draw';

/** Three crows: they peck, hop, and now and then one flaps up and settles again. */
function crows(c: Ctx, r: Round, x: number, y: number): void {
  const g = c.lit;
  for (let i = 0; i < 3; i++) {
    const t = c.now * (0.9 + i * 0.23) + r.x * 3 + i * 2.1, hop = Math.floor(t) % 7 === 0 ? 2 : 0, fly = Math.floor(t * 0.5 + i) % 11 === 0;
    const bx = Math.round(x - 8 + i * 7 + Math.sin(t * 0.3) * 3), by = Math.round(y - 2 + (i % 2) * 3 - hop - (fly ? 6 + Math.round(Math.sin(t * 9) * 2) : 0));
    const peck = !fly && Math.floor(t * 2.5) % 3 === 0, face = Math.sin(t * 0.3 + i) > 0 ? 1 : -1;
    g.fillStyle = '#16141c';
    g.fillRect(bx - 2, by - 3, 5, 3);
    g.fillRect(bx + face * 2, by - (peck ? 2 : 5), 2, 2);
    g.fillStyle = '#2a2632';
    g.fillRect(bx - 1, by - 3, 2, 1);
    if (fly) g.fillRect(bx - 4, by - 4 - (Math.floor(c.now * 12) % 2), 9, 1);
    else (g.fillStyle = '#3a3440'), g.fillRect(bx, by, 1, 1);
    g.fillStyle = '#c8a040';
    g.fillRect(bx + face * 3 + (face < 0 ? 1 : 0), by - (peck ? 1 : 4), 1, 1);
  }
}

/** How dark it is in Wickhold now (0 day, 1 night). */
export const dusk = () => 1 - daylight(townPhase());

/** Moths round the garden lamp (the round stands at its foot): specks on the glow layer, after dusk. */
function moths(c: Ctx, r: Round, x: number, y: number): void {
  const k = dusk();
  if (k < 0.35) return;
  c.glow.globalAlpha = Math.min(1, (k - 0.35) * 2);
  for (let i = 0; i < 7; i++) {
    const t = c.now * (0.7 + (i % 3) * 0.3) + i * 1.7;
    c.glow.fillStyle = i % 3 ? '#e8dcb0' : '#fff4c8';
    c.glow.fillRect(Math.round(x + Math.sin(t) * (5 + i) + Math.cos(t * 1.7) * 3), Math.round(y - 26 - Math.sin(t * 1.3) * 5 - i), 1, 1);
  }
  c.glow.globalAlpha = 1;
  void r;
}

/** A thin dog nosing along the lane and back, nose down, tail going now and then. */
function dog(c: Ctx, r: Round, x: number, y: number): void {
  const g = c.lit, t = c.now * 0.18 + r.x, along = Math.sin(t) * 26, face = Math.cos(t) > 0 ? 1 : -1, stop = Math.floor(c.now * 0.7) % 3 === 0;
  const dx = Math.round(x + along), step = stop ? 0 : Math.floor(c.now * 8) % 2, sniff = stop && Math.floor(c.now * 5) % 2;
  g.fillStyle = 'rgba(0,0,0,0.3)', g.fillRect(dx - 5, y, 11, 2);
  g.fillStyle = '#5a4a3a', g.fillRect(dx - 4, y - 6, 9, 3);
  g.fillStyle = '#4a3c2e';
  for (const lx of [-4, -2, 2, 4]) g.fillRect(dx + lx * face, y - 3, 1, 3 - ((lx > 0 ? step : 1 - step) ? 1 : 0));
  g.fillStyle = '#5a4a3a', g.fillRect(dx + 5 * face - (face < 0 ? 2 : 0), y - (sniff ? 4 : 7), 3, 3);
  g.fillStyle = '#2a2018', g.fillRect(dx + 7 * face - (face < 0 ? 0 : 0), y - (sniff ? 3 : 6), 1, 1);
  g.fillStyle = '#4a3c2e', g.fillRect(dx - 5 * face, y - 8 + (stop && Math.floor(c.now * 6) % 2 ? 1 : 0), 1, 3);
}

/** Smoke going up past the north wall from something burning outside. */
function smoke(c: Ctx, r: Round, x: number, y: number): void {
  const g = c.lit;
  for (let i = 0; i < 9; i++) {
    const k = (c.now * 0.12 + i / 9) % 1, sx = Math.round(x + Math.sin(k * 5 + r.x) * 6 + k * 18), sy = Math.round(y - 50 - k * 70), s = 3 + Math.round(k * 9);
    g.globalAlpha = 0.5 * (1 - k);
    g.fillStyle = i % 2 ? '#4a4652' : '#3a3640';
    g.fillRect(sx - s / 2, sy - s / 2, s, s);
  }
  g.globalAlpha = 1;
}

/** Returns true if it drew the round (a live one). */
export function drawLife(c: Ctx, r: Round, x: number, y: number): boolean {
  if (r.kind === 'dog') return dog(c, r, x, y), true;
  if (r.kind === 'smoke') return smoke(c, r, x, y), true;
  if (r.kind === 'crows') return crows(c, r, x, y), true;
  if (r.kind === 'moths') return moths(c, r, x, y), true;
  return false;
}
