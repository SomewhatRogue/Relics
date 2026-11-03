/**
 * The found relics in 2.5D, from the same room data and the same pixels as the flat view
 * (foundsdraw.ts): a bell's ring and a knuckle's line while wound up, a gall bomb's landing ring, a
 * wind-up bow standing where it was set down (its reach is ringed in gold by actors3d.ts, like every
 * zone). Drawn on the flat layer over the 3D view, placed by the camera's own sums. Never red.
 */
import { BELL, BOMB, KNUCKLE } from '../../shared/tuning';
import type { ArenaRoom } from '../../sim/room';
import { GOLD, WARM, paintSentry, windOf } from '../foundsdraw';
import type { Lerp } from './actors3d';
import type { Proj } from './overlay3d';

/** Dots round a ring on the floor at (x, z), `R` tiles out. */
function ring(g: CanvasRenderingContext2D, P: Proj, ppu: number, x: number, z: number, R: number, a: number, spin = 0, every = 3): void {
  const n = Math.max(12, Math.round(Math.PI * 2 * R * ppu));
  g.fillStyle = GOLD;
  g.globalAlpha = a;
  for (let i = 0; i < n; i += every) {
    const t = (i / n) * Math.PI * 2 + spin, [px, py] = P(x + Math.cos(t) * R, 0.04, z + Math.sin(t) * R);
    g.fillRect(Math.round(px), Math.round(py), 1, 1);
  }
  g.globalAlpha = 1;
}

export function drawFound3(g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj, lerp: Lerp, ppu: number, now: number): void {
  for (const h of room.heroes) {
    const [x, z] = lerp('h:' + h.id, h.x, h.y);
    const bell = windOf(h, 'bell');
    if (bell !== null) ring(g, P, ppu, x, z, BELL.radius, 0.9, 0, 2), ring(g, P, ppu, x, z, BELL.radius * bell, 0.5, 0, 2);
    const kn = windOf(h, 'knuckle');
    if (kn !== null) {
      const nx = -h.fy, nz = h.fx, W = KNUCKLE.width;
      g.globalAlpha = 0.85;
      for (let d = 0; d <= KNUCKLE.length; d += 0.15) {
        g.fillStyle = GOLD;
        for (const s of [-1, 1]) {
          const [px, py] = P(x + h.fx * d + nx * W * s, 0.04, z + h.fy * d + nz * W * s);
          g.fillRect(Math.round(px), Math.round(py), 1, 1);
        }
        if (d <= KNUCKLE.length * kn) {
          const [px, py] = P(x + h.fx * d, 0.04, z + h.fy * d);
          (g.fillStyle = WARM), g.fillRect(Math.round(px), Math.round(py), 1, 1);
        }
      }
      g.globalAlpha = 1;
    }
  }
  for (const b of room.bolts) if (b.kind === 'bomb') ring(g, P, ppu, b.tx, b.ty, BOMB.radius, 0.5 + 0.3 * Math.sin(now * 16), now, 3);
  for (const zn of room.zones) {
    if (zn.kind !== 'sentry') continue;
    ring(g, P, ppu, zn.x, zn.y, zn.r, 0.4 * Math.min(1, (zn.until - room.time) / 0.6), room.time * 0.3, 4);
    const [bx, by] = P(zn.x, 0, zn.y);
    paintSentry((dx, dy, col) => ((g.fillStyle = col), g.fillRect(Math.round(bx + dx), Math.round(by + dy), 1, 1)), zn, room.time);
  }
}
