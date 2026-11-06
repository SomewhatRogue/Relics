/**
 * What the second three meaty sorts carry (shared/meaty2.ts), drawn where a small goblin's knife would be
 * (foes.ts poses the body, drawn bigger: strawman.ts), moving with the room's clock:
 * - the Kegman's keg upright on its back (its fuse spitting sparks once it's lit) and a stave of a club;
 * - the Pouncer's hooked claws, out and up as it crouches to leap;
 * - the Gorger's gaff, held out at the body it's pulling in (the line to the body is on the floor:
 *   wave2ground.ts), else over its shoulder.
 * The hop through the air and the Gorger's growth are strawman.ts's. Drawing only.
 */
import type { Enemy } from '../sim/types';
import { blit, line, type Ctx } from './draw';
import { MEATY2_SPRITES as S } from './meatysprites2';
import { leapAlong } from '../sim/meaty2';

const POLE = '#6b4a2b', SPARK = ['#fff1b0', '#ffd27a', '#ff8a30'];

export function drawMeatyKit2(c: Ctx, e: Enemy, bx: number, by: number, hx: number, hy: number, f: number, wind: number, t: number): void {
  if (e.variant === 'kegman') {
    // The keg rides high on its back, over the shoulder away from you.
    const kx = Math.round(bx - f * 3 - e.fx * 1), ky = Math.round(by - 7 + (e.fy < -0.55 ? 2 : 0));
    blit(c, S.kegUp, kx, ky);
    const lit = e.blast && !e.blast.done && t < e.blast.at;
    if (lit) for (let i = 0; i < 4; i++) {
      // Lit: sparks spitting off the bung, faster as it comes due.
      const q = (c.now * 9 + i * 0.27) % 1;
      c.glow.fillStyle = SPARK[i % 3];
      c.glow.fillRect(kx + Math.round(Math.sin(i * 2.1 + c.now * 13) * 2 * q), ky - 9 - Math.round(q * 4), 1, 1);
    }
    const a = Math.atan2(e.fy, e.fx) + (wind ? -1.2 * wind : 0.3);
    return void line(c.lit, hx, hy, a, 0, 5, POLE, 1);
  }
  if (e.variant === 'pouncer') {
    // Claws out and up as it crouches; low at its sides otherwise.
    const up = wind ? Math.min(1, wind * 2) : 0;
    blit(c, S.claws, Math.round(hx), Math.round(hy + 2 - up * 4));
    return void blit(c, S.claws, Math.round(bx - f * 3), Math.round(by - 4 - up * 3));
  }
  if (e.variant === 'gorger') {
    const m = e.meal, a = m ? Math.atan2(m.y - e.y, m.x - e.x) : -Math.PI / 2 + f * 0.6;
    line(c.lit, hx, hy, a, 0, m ? 9 : 7, POLE, 1);
    blit(c, S.gaff, Math.round(hx + Math.cos(a) * (m ? 10 : 8)), Math.round(hy + Math.sin(a) * (m ? 10 : 8) + 2));
  }
}

/** How high (pixels) a Pouncer is off the ground mid-leap: an arc over its flight, highest halfway. */
export function hopOf(e: Enemy): number {
  const a = e.attack;
  if (e.variant !== 'pouncer' || !a || a.kind !== 'slam' || e.act !== 'attack') return 0;
  const k = leapAlong(a), far = Math.hypot(a.cx - a.ox, a.cy - a.oy);
  return Math.round(Math.sin(k * Math.PI) * (6 + far * 3));
}
