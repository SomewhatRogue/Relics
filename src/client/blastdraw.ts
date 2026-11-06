/**
 * Bursts on the floor (sim/blast.ts), drawn from the shape the room judges (sim/blastshape.ts): the striped
 * circle filling as the fuse burns down, a Kegman's keg lying where it fell, spitting sparks, and a
 * Smouldering one's body glowing as its embers come up. Under everyone, in the flat view (the 2.5D view
 * lays the same circle: three/actors3d.ts). Drawing only.
 */
import { blastShape } from '../sim/blastshape';
import type { ArenaRoom } from '../sim/room';
import { blit, type Ctx } from './draw';
import { drawTelegraph } from './foes';
import { MEATY2_SPRITES as S } from './meatysprites2';
import { OX, OY, PX } from './world';

const SPARK = ['#fff1b0', '#ffd27a', '#ff8a30'], EMBER = ['#ff6a20', '#ff9a3c', '#ffd27a'];

export function drawBlasts(c: Ctx, room: ArenaRoom, cx: number, cy: number): void {
  for (const e of room.enemies) {
    const a = blastShape(e, room.time);
    if (!a) continue;
    drawTelegraph(c, a, cx, cy);
    const x = Math.round(OX + a.cx * PX - cx), y = Math.round(OY + a.cy * PX - cy), k = a.t / a.windup;
    if (e.blast!.k === 'keg' && e.act === 'dead') {
      // The keg where it fell, the fuse spitting faster as it comes due.
      blit(c, S.kegDown, x + 4, y + 2);
      for (let i = 0; i < 3 + Math.round(k * 4); i++) {
        const q = (c.now * (8 + 10 * k) + i * 0.31) % 1;
        c.glow.fillStyle = SPARK[i % 3];
        c.glow.fillRect(x + 4 + Math.round(Math.sin(i * 2.3 + c.now * 11) * 3 * q), y - 4 - Math.round(q * 5), 1, 1);
      }
    } else if (e.blast!.k === 'ember') {
      // Its embers coming up through the body, brighter and thicker as they come due.
      for (let i = 0; i < 4 + Math.round(k * 8); i++) {
        const q = (c.now * 1.4 + i * 0.13) % 1;
        c.glow.fillStyle = EMBER[i % 3];
        c.glow.globalAlpha = (1 - q) * (0.5 + 0.5 * k);
        c.glow.fillRect(x - 5 + ((i * 7) % 11), y - 1 - Math.round(q * (4 + 8 * k)), 1, 1);
      }
      c.glow.globalAlpha = 1;
    }
  }
}
