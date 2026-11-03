/**
 * The found relics on the floor, flat view (2.5D: three/found3d.ts, painted with the same pixels from
 * here): a bell's ring and a knuckle's line while they're wound up, a gall bomb's landing ring while
 * it flies, and a wind-up bow standing on its legs with its reach ringed. All in gold and warm white,
 * never the goblins' red: relics spare friends. Sizes come from shared/relickit.ts, as the room judges them.
 */
import { BELL, BOMB, KNUCKLE, RELICS } from '../shared/tuning';
import type { ArenaRoom } from '../sim/room';
import type { Bolt, Hero, Zone } from '../sim/types';
import type { Ctx } from './draw';
import { OX, OY, PX } from './world';

export const GOLD = '#ffd27a', WARM = '#fff1b0';
type Px = (dx: number, dy: number, col: string) => void;

/** How far through its wind-up a hero is with this relic (null: not winding it up). */
export const windOf = (h: Hero, kind: string) => (h.relic === kind && h.act === 'throw' && h.actT <= RELICS[h.relic].windup ? h.actT / RELICS[h.relic].windup : null);

/** Dots round a ring on the floor (`R` px across, squashed for the three-quarter view when `sq`). */
export function ringDots(px: Px, R: number, a: number, sq = 1, every = 3): void {
  const n = Math.max(12, Math.round(Math.PI * 2 * R));
  for (let i = 0; i < n; i += every) {
    const t = (i / n) * Math.PI * 2 + a;
    px(Math.round(Math.cos(t) * R), Math.round(Math.sin(t) * R * sq), GOLD);
  }
}

/** A wind-up bow: three legs, a body, the bow across it turned to (ax, ay), a gold glint at its heart. */
export function paintSentry(px: Px, z: Zone, t: number): void {
  const left = z.until - t, wob = left < 1 ? Math.round(Math.sin(t * 30) * (1 - left)) : 0;
  const ax = z.ax ?? 0, ay = z.ay ?? 1;
  for (const [lx, ly] of [[-4, 0], [4, 0], [0, 2]]) for (let k = 0; k <= 5; k++) px(Math.round((lx * k) / 5), Math.round(-5 + ((ly + 5) * k) / 5), '#6a4a2a');
  for (let y = -9; y <= -5; y++) for (let x = -2; x <= 2; x++) px(x, y + wob, y === -9 ? '#8a90a0' : '#5a6070');
  // The bow: a bar across the aim, the stock along it.
  const bx = -ay, by = ax * 0.6;
  for (let k = -5; k <= 5; k++) px(Math.round(bx * k), Math.round(-8 + by * k) + wob, '#a87a4a');
  for (let k = 0; k <= 5; k++) px(Math.round(ax * k), Math.round(-8 + ay * 0.6 * k) + wob, '#c8ccd8');
  px(0, -7 + wob, Math.floor(t * 4) % 2 ? WARM : GOLD);
}

/** The gall bomb in its arc: a green gall with a lit fuse. */
export function paintBomb(px: Px, b: Bolt, t: number): void {
  const up = -Math.round(Math.sin(Math.PI * Math.min(1, b.t / b.flight)) * 22);
  for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) px(x, up - 4 + y, y < 0 ? '#8aa050' : '#4a5a2a');
  px(1, up - 6, Math.floor(t * 20) % 2 ? '#ff9a3c' : WARM);
}

export function drawFound(c: Ctx, room: ArenaRoom, cx: number, cy: number): void {
  const g = c.glow, at = (x: number, y: number) => [OX + x * PX - cx, OY + y * PX - cy];
  const glowPx = (x0: number, y0: number, a = 1): Px => (dx, dy, col) => ((g.globalAlpha = a), (g.fillStyle = col), g.fillRect(Math.round(x0 + dx), Math.round(y0 + dy), 1, 1));
  for (const h of room.heroes) {
    const [x, y] = at(h.x, h.y);
    const bell = windOf(h, 'bell');
    if (bell !== null) ringDots(glowPx(x, y, 0.9), BELL.radius * PX, 0, 1, 2), ringDots(glowPx(x, y, 0.5), BELL.radius * PX * bell, 0, 1, 2);
    const kn = windOf(h, 'knuckle');
    if (kn !== null) {
      // The line it will throw down, filling from the hero out.
      const px = glowPx(x, y, 0.85), L = KNUCKLE.length * PX, W = KNUCKLE.width * PX, nx = -h.fy, ny = h.fx;
      for (let d = 0; d <= L; d += 2) for (const s of [-1, 1]) px(h.fx * d + nx * W * s, h.fy * d + ny * W * s, GOLD);
      for (let d = 0; d <= L * kn; d += 3) px(h.fx * d, h.fy * d, WARM);
    }
  }
  for (const b of room.bolts) {
    if (b.kind !== 'bomb') continue;
    const [tx, ty] = at(b.tx, b.ty);
    ringDots(glowPx(tx, ty, 0.5 + 0.3 * Math.sin(c.now * 16)), BOMB.radius * PX, c.now, 1, 3);
    const [x, y] = at(b.x, b.y);
    c.lit.fillStyle = 'rgba(8,6,12,0.55)';
    c.lit.fillRect(Math.round(x - 1), Math.round(y), 3, 1);
    paintBomb((dx, dy, col) => ((c.lit.fillStyle = col), c.lit.fillRect(Math.round(x + dx), Math.round(y + dy), 1, 1)), b, c.now);
  }
  for (const z of room.zones) {
    if (z.kind !== 'sentry') continue;
    const [x, y] = at(z.x, z.y), fade = Math.min(1, (z.until - room.time) / 0.6);
    ringDots(glowPx(x, y, 0.4 * fade), z.r * PX, room.time * 0.3, 1, 4);
    paintSentry((dx, dy, col) => ((c.lit.fillStyle = col), c.lit.fillRect(Math.round(x + dx), Math.round(y + dy), 1, 1)), z, room.time);
    g.globalAlpha = 1;
    g.fillStyle = GOLD;
    g.fillRect(Math.round(x), Math.round(y - 7), 1, 1);
  }
  g.globalAlpha = 1;
}
