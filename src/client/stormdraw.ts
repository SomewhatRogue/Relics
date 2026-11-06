/**
 * A storm's lightning in the flat view (sim/storm.ts decides it): each strike's red circle with the
 * striped edge while it's coming (the same shape the room judges: sim/stormshape.ts), then the bolt
 * itself, a jagged white line down out of the sky onto the spot, for a blink, with a cold light round
 * it. The flash over the whole screen goes through the lighting pass (scene.ts, client/skyfx.ts).
 * Cosmetic only: the bolt's kinks come from the strike's id, so every frame draws it the same.
 */
import type { ArenaRoom } from '../sim/room';
import { strikeShape } from '../sim/stormshape';
import type { Strike } from '../sim/types';
import type { Ctx } from './draw';
import { drawTelegraph } from './foes';
import type { Light } from './light';
import { OX, OY, PX } from './world';

/** How long the bolt shows once it's down, and how tall it's drawn (pixels at the flat scale). */
export const BOLT = { show: 0.16, tall: 220, kink: 16 };

const hash = (n: number) => {
  const s = Math.sin(n * 91.7 + 13.1) * 43758.5453;
  return s - Math.floor(s);
};

/** The bolt's kinks: offsets across, from the top (0) to the ground (1), the same each frame for a strike. */
export function boltKinks(s: Strike, n = 9): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) out.push([i === n ? 0 : (hash(s.id * 13 + i) - 0.5) * 2, i / n]);
  return out;
}

/** Whether the bolt is showing now. */
export const boltOn = (s: Strike, t: number) => t >= s.at && t - s.at < BOLT.show;

/** Under everyone: each strike's circle while it's coming. */
export function drawStrikeMarks(c: Ctx, room: ArenaRoom, cx: number, cy: number): void {
  for (const s of room.strikes ?? []) {
    const a = strikeShape(s, room.time);
    if (a) drawTelegraph(c, a, cx, cy);
  }
}

/** Over everyone: the bolt, and the scorch it leaves glowing a moment. */
export function drawBolts(c: Ctx, room: ArenaRoom, cx: number, cy: number): void {
  const g = c.glow;
  for (const s of room.strikes ?? []) {
    if (!boltOn(s, room.time)) continue;
    const x = OX + s.x * PX - cx, y = OY + s.y * PX - cy, k = boltKinks(s);
    let px = x + k[0][0] * BOLT.kink, py = y - BOLT.tall;
    for (const [dx, f] of k.slice(1)) {
      const nx = x + dx * BOLT.kink, ny = y - BOLT.tall * (1 - f);
      line(g, px, py, nx, ny, '#ffffff', '#b8d0ff');
      (px = nx), (py = ny);
    }
    g.fillStyle = '#ffffff';
    g.fillRect(Math.round(x - 3), Math.round(y - 1), 7, 2);
  }
}

/** A line two pixels wide with a one-pixel cold halo either side. */
function line(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, core: string, halo: string): void {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  for (let i = 0; i <= n; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n);
    g.fillStyle = halo;
    g.fillRect(x - 1, y, 4, 1);
    g.fillStyle = core;
    g.fillRect(x, y, 2, 1);
  }
}

/** The light a strike throws: a red glow as it's coming, a cold white one as it lands. */
export function strikeLights(room: ArenaRoom, cx: number, cy: number, out: Light[]): void {
  for (const s of room.strikes ?? []) {
    const x = OX + s.x * PX - cx, y = OY + s.y * PX - cy, lead = s.at - room.time;
    if (lead > 0) out.push({ x, y, r: 40, i: 0.4 * (1 - lead), c: [1, 0.25, 0.15] });
    else if (-lead < BOLT.show * 2) out.push({ x, y: y - 20, r: 180, i: 1.6, c: [0.8, 0.88, 1] });
  }
}
