/**
 * The Haulier's crank on screen (sim/sparkshape.ts, shared/haultune.ts `crank`): a striped circle where each
 * shower of sparks will fall, the winding gear spun hard, and sparks streaming off it down onto each circle,
 * thicker as the wind-up runs out. Drawing only (the room judges the same circles).
 */
import type { ArenaRoom } from '../sim/room';
import { sparkShapes } from '../sim/sparkshape';
import type { Ctx } from './draw';
import { drawTelegraph } from './foes';
import { HAUL_FX, secs } from './fxhaul';
import { OX, OY, PX } from './world';

const hash = (n: number) => {
  const s = Math.sin(n * 91.7 + 13.1) * 43758.5453;
  return s - Math.floor(s);
};

/** Under everyone: each spot's circle and the sparks coming down onto it. */
export function drawSparkMarks(c: Ctx, room: ArenaRoom, cx: number, cy: number): void {
  for (const e of room.enemies) {
    if (e.boss?.who !== 'haulier') continue;
    const shapes = sparkShapes(e), a = e.attack;
    if (!shapes.length || !a) continue;
    // The wheel turns hard while it's hauled on (client/sumpdraw.ts reads this).
    HAUL_FX.gearAt = secs();
    HAUL_FX.gearHit = false;
    for (const s of shapes) drawTelegraph(c, s, cx, cy);
    const gear = room.map.gear;
    if (!gear || a.t < (a.tell ?? 0)) continue;
    const gx = OX + gear.x * PX - cx, gy = OY + gear.y * PX - cy - 34, k = Math.min(1, a.t / a.windup), g = c.glow;
    shapes.forEach((s, j) => {
      const tx = OX + s.cx * PX - cx, ty = OY + s.cy * PX - cy, n = Math.round(3 + 7 * k);
      for (let i = 0; i < n; i++) {
        const u = (c.now * (1.3 + hash(j * 7 + i) * 0.8) + hash(j * 31 + i)) % 1, arc = Math.sin(Math.PI * u) * 22;
        const x = Math.round(gx + (tx - gx) * u + (hash(i + j) - 0.5) * 6 * u), y = Math.round(gy + (ty - gy) * u - arc);
        g.globalAlpha = 0.6 + 0.4 * k;
        g.fillStyle = i % 3 ? '#ffd27a' : i % 2 ? '#ffffff' : '#ff9a3c';
        g.fillRect(x, y, 1, 1 + (k > 0.7 ? 1 : 0));
      }
    });
    g.globalAlpha = 1;
  }
}
