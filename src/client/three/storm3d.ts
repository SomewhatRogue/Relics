/**
 * A storm's lightning in the 2.5D view (sim/storm.ts decides it): the bolt, a jagged white line down
 * out of the sky onto the spot for a blink, on the flat overlay (its kinks the flat view's: stormdraw.ts),
 * and the light it throws among the room's lights. The circle while it's coming is a telegraph mesh like
 * any goblin's (actors3d.ts, from sim/stormshape.ts); the flash goes through the sky light (view3d.ts).
 */
import type { ArenaRoom } from '../../sim/room';
import { BOLT, boltKinks, boltOn } from '../stormdraw';
import type { L3 } from './lights3d';

type Proj = (x: number, y: number, z: number) => [number, number];

/** How high the bolt comes down from (tiles). */
const HIGH = 9;

export function drawBolts3(g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj, ppu: number): void {
  for (const s of room.strikes ?? []) {
    if (!boltOn(s, room.time)) continue;
    const k = boltKinks(s), w = 1;
    let [px, py] = P(s.x + k[0][0] * w, HIGH, s.y);
    for (const [dx, f] of k.slice(1)) {
      const [nx, ny] = P(s.x + dx * w, HIGH * (1 - f), s.y);
      seg(g, px, py, nx, ny);
      (px = nx), (py = ny);
    }
    const [gx, gy] = P(s.x, 0, s.y), r = Math.max(2, Math.round(ppu * 0.3));
    g.fillStyle = '#ffffff';
    g.fillRect(Math.round(gx - r), Math.round(gy - 1), r * 2 + 1, 2);
  }
}

function seg(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number): void {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  for (let i = 0; i <= n; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n);
    g.fillStyle = '#b8d0ff';
    g.fillRect(x - 1, y, 4, 1);
    g.fillStyle = '#ffffff';
    g.fillRect(x, y, 2, 1);
  }
}

/** A red glow as a strike comes, a cold white one as it lands. */
export function strikeLights3(room: ArenaRoom, out: L3[]): void {
  for (const s of room.strikes ?? []) {
    const lead = s.at - room.time;
    if (lead > 0) out.push({ x: s.x, y: 0.6, z: s.y, r: 2.5, i: 0.4 * (1 - lead), c: [1, 0.25, 0.15], f: 0 });
    else if (-lead < BOLT.show * 2) out.push({ x: s.x, y: 3, z: s.y, r: 12, i: 1.6, c: [0.8, 0.88, 1], f: 0 });
  }
}
