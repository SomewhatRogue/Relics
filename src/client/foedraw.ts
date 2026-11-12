/**
 * The newer goblins' bodies and marks that aren't a small goblin with something in its hand: the
 * log-carriers (two big ones and the log between them), a net over a hero, a banner's reach on the
 * floor and the goblins that have taken heart in it, and the panic of a rout. Drawing only.
 */
import { BANNER } from '../shared/tuning';
import type { Enemy } from '../sim/types';
import { blit, line, shadow, spin, stars, type Ctx } from './draw';
import { SPRITES } from './sprites';
import { PX } from './world';

/** How high a roof archer stands over its feet in the flat view (pixels): the house's ridge. */
export const ROOF_UP = 45;
/** And in 2.5D (world units). */
export const ROOF_UP3 = 3.45;

const BARK = '#5a3f28', BARK2 = '#7a5a38', ROPE = '#a89a72', HEART = '#e8a040';

/**
 * The log-carriers: a big goblin at each end of a trunk carried along its facing. Winding up for the
 * run they drop the log level and lean in; running, they bob hard; stood after it, they pant.
 */
export function drawLogs(c: Ctx, e: Enemy, x: number, y: number): void {
  const a = e.attack, nx = -e.fy, ny = e.fx, fa = Math.atan2(e.fy, e.fx), flip = e.fx < -0.2;
  const wind = a && a.kind === 'charge' && a.t < a.windup, run = a && a.kind === 'charge' && a.t >= a.windup && a.t < a.windup + a.active;
  const bob = run ? (Math.floor(c.now * 14) % 2 ? -2 : 0) : e.moving ? (Math.floor(c.now * 6) % 2 ? -1 : 0) : 0;
  const lean = wind ? Math.round(Math.sin(c.now * 30) * 1) : 0, gap = 7;
  // Each carrier a little to the side of the log, the front one a step ahead.
  const ends = [
    { x: x + e.fx * 10 + nx * gap * 0.4, y: y + e.fy * 5 + ny * gap * 0.2 },
    { x: x - e.fx * 10 - nx * gap * 0.4, y: y - e.fy * 5 - ny * gap * 0.2 },
  ].sort((p, q) => p.y - q.y);
  for (const p of ends) shadow(c, p.x, p.y, 8);
  const draw = (p: { x: number; y: number }) => blit(c, e.fy < -0.55 ? SPRITES.scrapperUp : SPRITES.scrapper, Math.round(p.x + lean), Math.round(p.y + bob), flip);
  draw(ends[0]);
  // The log: a thick trunk at shoulder height, banded with rope, its front end iron-shod.
  const ly = y - 13 + bob + (wind ? 2 : 0), len = 16;
  line(c.lit, x - Math.cos(fa) * len, ly - Math.sin(fa) * len * 0.5, fa, 0, len * 2, '#2a1a10', 5);
  line(c.lit, x - Math.cos(fa) * len, ly - Math.sin(fa) * len * 0.5, fa, 0, len * 2, BARK, 3);
  line(c.lit, x - Math.cos(fa) * len, ly - 1 - Math.sin(fa) * len * 0.5, fa, 0, len * 2, BARK2, 1);
  for (const k of [-6, 6]) (c.lit.fillStyle = ROPE), c.lit.fillRect(Math.round(x + Math.cos(fa) * k), Math.round(ly - 2 + Math.sin(fa) * k * 0.5), 1, 4);
  c.lit.fillStyle = '#8a8a90';
  c.lit.fillRect(Math.round(x + Math.cos(fa) * len - 1), Math.round(ly - 2 + Math.sin(fa) * len * 0.5), 3, 4);
  draw(ends[1]);
  if (e.act === 'stunned') stars(c, x, y - 22, 4, 8);
  // Glowing eyes on both, the way every goblin's show in the dark.
  c.glow.fillStyle = '#ff4a3a';
  for (const p of ends) if (e.fy >= -0.55) c.glow.fillRect(Math.round(p.x + lean - 2), Math.round(p.y + bob - 17), 1, 1), c.glow.fillRect(Math.round(p.x + lean + 2), Math.round(p.y + bob - 17), 1, 1);
}

/** The log-carriers dead: the two of them down either side of their log. */
export function drawLogsDead(c: Ctx, e: Enemy, x: number, y: number): void {
  const fade = Math.max(0, 1 - e.actT / Math.max(1, e.actDur)), fa = Math.atan2(e.fy, e.fx);
  c.lit.globalAlpha = fade;
  line(c.lit, x - Math.cos(fa) * 14, y - 2 - Math.sin(fa) * 7, fa, 0, 28, BARK, 3);
  c.lit.globalAlpha = 1;
  for (const s of [-1, 1]) spin(c, SPRITES.scrapper, x + e.fx * 10 * s, y - 4 + e.fy * 5 * s, -Math.PI / 2 * s, fade);
}

/** A weighted net over a hero (`x`, `y` their feet), shaking as they fight it; `k` how much is left (0..1). */
export function drawNetOn(c: Ctx, x: number, y: number, k: number): void {
  const g = c.lit, shake = Math.round(Math.sin(c.now * 25) * (k > 0.5 ? 0 : 1));
  g.fillStyle = ROPE;
  for (let dy = -16; dy <= 0; dy++) for (let dx = -7; dx <= 7; dx++) {
    const r = (dx * dx) / 49 + ((dy + 8) * (dy + 8)) / 70;
    if (r > 1 || (dx + dy + 40) % 3) continue;
    g.fillRect(Math.round(x + dx + shake), Math.round(y + dy), 1, 1);
  }
  g.fillStyle = '#6a6a70';
  for (const dx of [-6, -2, 2, 6]) g.fillRect(Math.round(x + dx + shake), Math.round(y - 1), 2, 1);
}

type At = (e: Enemy) => [number, number];

/** On the floor: a standing banner's reach, faint, and a warm tick under each goblin that has taken heart. */
export function drawBanners(c: Ctx, enemies: Enemy[], at: At): void {
  const g = c.glow, R = BANNER.radius * PX;
  let any = false;
  for (const e of enemies) {
    if (e.variant !== 'banner' || e.act === 'dead' || e.alert === false) continue;
    any = true;
    const [x, y] = at(e), n = Math.round((Math.PI * 2 * R) / 7);
    g.fillStyle = HEART;
    g.globalAlpha = 0.22;
    for (let i = 0; i < n; i++) {
      const q = (i / n) * Math.PI * 2 + c.now * 0.15;
      g.fillRect(Math.round(x + Math.cos(q) * R), Math.round(y + Math.sin(q) * R * 0.5), 1, 1);
    }
  }
  g.globalAlpha = 1;
  for (const e of enemies) {
    if (e.act === 'dead') continue;
    const [x, y] = at(e);
    if (any && e.heart) {
      // Taken heart: a warm chevron under the feet.
      g.fillStyle = HEART;
      g.globalAlpha = 0.7;
      for (let i = -2; i <= 2; i++) g.fillRect(Math.round(x + i * 2), Math.round(y + 2 - Math.abs(i)), 2, 1);
    }
    if ((e.routUntil ?? -9) > (c.t ?? c.now)) {
      // Routed: no fight left, the whites of its eyes as it scatters.
      g.fillStyle = '#ffffff';
      g.globalAlpha = Math.floor(c.now * 8) % 2 ? 0.9 : 0.5;
      g.fillRect(Math.round(x - 4), Math.round(y - 15), 1, 2), g.fillRect(Math.round(x + 4), Math.round(y - 15), 1, 2);
    }
  }
  g.globalAlpha = 1;
}
