/**
 * What the new meaty sorts carry (shared/meaty.ts), drawn where a small goblin's knife would be (foes.ts
 * poses the body, drawn bigger: strawman.ts) and moving with the room's clock, so the wind-up you see is
 * the one judged:
 * - the Planker's barn door, up to its eyes when it faces you, edge-on to the side, on its back facing
 *   away; drawn back through the wind-up and shoved out on the bash;
 * - the Swingle's flail over its shoulder, whirled round its head faster and faster through the wind-up,
 *   then dragging on the ground while it reels;
 * - the Forker's pitchfork along its facing, drawn back through the wind-up and thrust out on the jab.
 * Drawing only.
 */
import type { Enemy } from '../sim/types';
import { blit, line, spin, type Ctx } from './draw';
import { MEATY_SPRITES as S } from './meatysprites';

const POLE = '#6b4a2b', TINE = '#8a7a6a', CHAIN = '#5a5a60';

export function drawMeatyKit(c: Ctx, e: Enemy, bx: number, by: number, hx: number, hy: number, f: number, wind: number): void {
  const a = e.attack, out = a && a.t >= a.windup && a.t < a.windup + a.active + 0.12;
  if (e.variant === 'planker') {
    // Back a pixel through the wind-up, shoved out along its facing on the bash.
    const push = out ? 3 : wind ? -1 : 0, px = Math.round(bx + e.fx * push), py = Math.round(by + e.fy * push * 0.5);
    if (e.fy < -0.55) return blit(c, S.doorBack, px, py - 1);
    if (Math.abs(e.fx) > 0.75) return blit(c, S.doorSide, px + f * 5, py);
    // Up to its chin: the eyes glow over the top.
    return blit(c, S.doorFront, px + f, py + 2);
  }
  if (e.variant === 'swingle') {
    const g = c.lit;
    if (e.act === 'stunned') {
      // Reeling: the flail trails on the ground from a slack hand.
      line(g, hx, hy, Math.PI / 2 - f * 0.6, 0, 6, POLE, 1);
      return blit(c, S.flailHead, Math.round(hx + f * 4), Math.round(by + 1));
    }
    if (wind) {
      // Whirled round its head, faster as the spin comes.
      const q = c.now * (9 + 14 * wind), cx = bx, cy = by - 15, r = 6 + Math.round(wind * 2);
      line(g, hx, hy - 2, -Math.PI / 2, 0, 5, POLE, 1);
      const ex = cx + Math.cos(q) * r, ey = cy + Math.sin(q) * r * 0.45;
      g.fillStyle = CHAIN;
      g.fillRect(Math.round((cx + ex) / 2), Math.round((cy + ey) / 2), 1, 1);
      return blit(c, S.flailHead, Math.round(ex), Math.round(ey + 2));
    }
    // Carried over the shoulder.
    const ang = -Math.PI / 2 + f * 0.7;
    line(g, hx, hy - 1, ang, 0, 7, POLE, 1);
    return blit(c, S.flailHead, Math.round(hx + Math.cos(ang) * 8), Math.round(hy - 1 + Math.sin(ang) * 8 + 2));
  }
  if (e.variant === 'forker') {
    const fa = Math.atan2(e.fy, e.fx), shift = out ? 6 : wind ? -3 * wind : 0, ox = hx, oy = hy - 3;
    line(c.lit, ox, oy, fa, -6 + shift, 10 + shift, POLE, 1);
    const tx = ox + Math.cos(fa) * (11 + shift), ty = oy + Math.sin(fa) * (11 + shift);
    spin(c, S.tines, tx, ty, fa + Math.PI / 2);
    for (const k of [-1, 0, 1]) line(c.lit, tx - Math.sin(fa) * k * 1.6, ty + Math.cos(fa) * k * 1.6, fa, 0, 3, TINE, 1);
  }
}
