/**
 * A house's kindling spot (shared/kindling.ts), drawn from the block alone so it reads the same on every
 * screen: a woodpile stacked against the side wall, dark with lamp oil; a soft spark glinting off it
 * while you're near (HOUSEBURN.glint); while someone crouches at it, a ring filling over the light time,
 * like a nest's (nestfire.ts). Once the house is alight the pile is burning with it; after, a black heap.
 * The 2.5D view draws its own pile (three/woodpile3d.ts) and these marks on its flat layer.
 */
import type { Block } from '../shared/arena';
import { fireTimes, type Kindling } from '../shared/kindling';
import { HOUSEBURN } from '../shared/tuning';
import { ring, type Ctx } from './draw';

const BARK = ['#4a3420', '#5c4128', '#6b4c2e'], END = '#b08a58', RING = '#7a5a34', OIL = '#1a1512';

/** The pile at its foot (x, y on screen): log ends in a little pyramid, an oil stain under it. */
export function drawWoodpile(c: Ctx, k: Kindling, x: number, y: number, b: Block): void {
  const l = c.lit, gone = !!b.ruined || (b.burning ?? -1) >= 0, sx = Math.round(x - 6 + k.side * 3);
  l.fillStyle = OIL;
  l.globalAlpha = 0.55;
  l.fillRect(sx - 2, Math.round(y) - 1, 14, 3);
  l.globalAlpha = 1;
  if (b.ruined) {
    l.fillStyle = '#141010';
    l.fillRect(sx, Math.round(y) - 2, 10, 2);
    return;
  }
  for (let row = 0; row < 3; row++) for (let i = 0; i < 4 - row; i++) {
    const lx = Math.round(sx - 2 + i * 4 + row * 2), ly = Math.round(y - 3 - row * 3);
    l.fillStyle = gone ? '#1e1612' : BARK[(i + row) % 3];
    l.fillRect(lx, ly - 1, 4, 3);
    l.fillStyle = gone ? '#3a1a10' : END;
    l.fillRect(lx + 1, ly, 2, 1);
    if (!gone) (l.fillStyle = RING), l.fillRect(lx + ((i + row) % 2 ? 0 : 3), ly - 1, 1, 1);
  }
}

/** A soft spark off the pile now and then, while `d` (tiles from you) is inside the glint's reach. */
export function drawGlint(c: Ctx, x: number, y: number, d: number, seed: number): void {
  if (d > HOUSEBURN.glint) return;
  const g = c.glow, near = 1 - d / HOUSEBURN.glint, p = (c.now * 0.7 + seed * 0.37) % 1, pulse = Math.max(0, Math.sin(p * Math.PI));
  const sx = Math.round(x + 1 + Math.round(Math.sin(seed) * 3)), sy = Math.round(y - 11);
  // A warm haze round it, then a star that opens and closes.
  g.globalAlpha = (0.15 + 0.25 * pulse) * (0.5 + 0.5 * near);
  g.fillStyle = '#ffb040';
  g.fillRect(sx - 2, sy - 1, 5, 3);
  g.fillRect(sx - 1, sy - 2, 3, 5);
  g.globalAlpha = (0.55 + 0.45 * pulse) * (0.6 + 0.4 * near);
  g.fillStyle = '#ffffff';
  g.fillRect(sx, sy, 1, 1);
  g.fillStyle = '#ffe9a8';
  const arm = 1 + Math.round(pulse * 2);
  for (let i = 1; i <= arm; i++) g.fillRect(sx - i, sy, 1, 1), g.fillRect(sx + i, sy, 1, 1), g.fillRect(sx, sy - i, 1, 1), g.fillRect(sx, sy + i, 1, 1);
  g.globalAlpha = 1;
}

/** The ring while someone lights it: fills over the house's light time, sparks catching in the pile. */
export function drawKindling(c: Ctx, b: Block, x: number, y: number): void {
  if (!b.lighter || !b.lightT) return;
  const k = Math.min(1, b.lightT / fireTimes(b).light), g = c.glow;
  ring(c, x, y - 2, 13, '#ffb040', k, '#3a2418');
  for (let i = 0; i < 2 + Math.floor(k * 7); i++) {
    const a = i * 2.39 + c.now * 3, r = 2 + (i % 3) * 2;
    g.fillStyle = ['#fff1b0', '#ffd27a', '#ff9a3c'][(i + Math.floor(c.now * 20)) % 3];
    g.globalAlpha = 0.5 + 0.5 * k;
    g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y - 4 - ((c.now * 9 + i) % (3 + k * 5))), 1, 1);
  }
  g.globalAlpha = 1;
}

/** Smoke rolling up off a house alight, thicker as it goes (the 2.5D view's; the flat view's is in blocks.ts). */
export function drawHouseSmoke(c: Ctx, x: number, y: number, share: number, seed: number): void {
  const l = c.lit, t = c.now;
  for (let j = 0; j < 10; j++) {
    const p = (t * 0.2 + j / 10 + seed * 0.13) % 1, r = (3 + p * 10) * (0.6 + 0.6 * share);
    l.globalAlpha = (1 - p) * (0.35 + 0.35 * share);
    l.fillStyle = p < 0.3 ? '#1e1a1c' : p < 0.6 ? '#3a3438' : '#5a5458';
    l.beginPath();
    l.ellipse(Math.round(x + Math.sin(p * 5 + j * 1.7) * 5 + p * 24), Math.round(y - p * 70), r, r * 0.8, 0, 0, Math.PI * 2);
    l.fill();
  }
  l.globalAlpha = 1;
}
