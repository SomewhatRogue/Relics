/**
 * Smoke off the flues in 2.5D, puffed by the flat view's own painter (exterior.ts `smoke`) on the flat
 * layer from where the 3D chimney stands: the tower's flue in the coloured fire's colour, the forge's
 * stack (a spark now and then), and a cottage's chimney while its fire is going (cottage.ts drawLit).
 */
import type { GameMap } from '../../shared/arena';
import { houseOf } from '../cottage';
import type { Ctx } from '../draw';
import { smoke } from '../exterior';
import { witchColour } from '../hallsdraw';
import { chimneyAt, TALL, blockState } from './houses3d';
import { flueAt } from './halls3d';
import type { Proj } from './overlay3d';

export function drawFlues(g: CanvasRenderingContext2D, map: GameMap, P: Proj, now: number, W: number, H: number): void {
  const c: Ctx = { lit: g, glow: g, now, t: 0 }, on = (x: number, y: number) => x > -40 && y > -20 && x < W + 40 && y < H + 80;
  for (const b of map.blocks) {
    if (blockState(b) !== 0) continue;
    if (b.door === 'tower' || (b.door === 'forge' && b.kind === 'forge')) {
      const [fx, fy, fz] = flueAt(b, TALL[b.kind] ?? 1.4), [x, y] = P(fx, fy, fz);
      if (!on(x, y)) continue;
      if (b.door === 'forge') {
        smoke(c, x, y, ['#3a3640', '#4a4652'], 1);
        if (Math.floor(now * 5) % 4 === 0) (g.fillStyle = '#ff9a3c'), g.fillRect(Math.round(x + Math.sin(now * 9) * 2), Math.round(y - 4), 1, 1);
      } else {
        const col = witchColour(now);
        smoke(c, x, y, [`rgb(${Math.round(col[0] * 160)},${Math.round(col[1] * 160)},${Math.round(col[2] * 180)})`, '#4a4458'], 0.9);
      }
      continue;
    }
    const home = houseOf(b), ch = home?.lit && b.fate !== 'blocked' && !b.shut ? chimneyAt(b, home) : null;
    if (!ch) continue;
    const [x, y] = P(ch[0], ch[1], ch[2]);
    if (on(x, y)) smoke(c, x, y, ['#3a3438', '#5a5458'], 1);
  }
}
