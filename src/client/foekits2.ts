/**
 * The second lot's kit (foekits.ts draws the first): the wolf-keeper's whip and chain, the oil
 * thrower's pot, the torch-bearer's torch, the sapper's pick. Drawing only.
 */
import type { Enemy } from '../sim/types';
import { line, type Ctx } from './draw';

const WOOD = '#5a3d22', IRON = '#8a8a90', LEATHER = '#3a2a1a', OILC = '#2a2418', CLAY = '#8a5a3a';

export function drawFoeKit2(c: Ctx, e: Enemy, bx: number, by: number, hx: number, hy: number, f: number, wind: number): void {
  const g = c.lit, fa = Math.atan2(e.fy, e.fx);
  if (e.variant === 'keeper') {
    // A whip, coiled at the hip, out and cracking on the lash; a chain over the shoulder.
    g.fillStyle = IRON;
    for (let i = 0; i < 5; i++) g.fillRect(Math.round(bx - f * 3 + f * i), Math.round(by - 12 + i), 1, 1);
    if (wind) {
      const back = fa + Math.PI - wind * 0.6;
      line(g, hx, hy - 4, back, 0, 6 + wind * 4, LEATHER, 1);
    } else if (e.attack && e.attack.kind === 'stab') line(g, hx, hy - 4, fa, 0, 14, LEATHER, 1);
    else (g.fillStyle = LEATHER), g.fillRect(hx - 1, hy - 1, 3, 3);
    return;
  }
  if (e.variant === 'oiler') {
    // A clay pot of oil in the hand (raised overhead through the wind-up), a black-stained rag at the belt.
    const up = wind ? Math.round(wind * 8) : 0, px = Math.round(hx), py = Math.round(hy - 2 - up);
    g.fillStyle = CLAY;
    g.fillRect(px - 1, py - 2, 3, 3);
    g.fillStyle = OILC;
    g.fillRect(px - 1, py - 3, 3, 1);
    g.fillRect(Math.round(bx - 2), Math.round(by - 6), 4, 1);
    return;
  }
  if (e.variant === 'torch') {
    // A torch held up, its flame on the glow layer (it flares through the throw).
    const tx = Math.round(hx), ty = Math.round(hy - 4 - (wind ? wind * 4 : 0));
    g.fillStyle = WOOD;
    g.fillRect(tx, ty, 1, 6);
    const fl = Math.floor(c.now * 12 + e.id) % 3, big = wind ? 1 : 0;
    c.glow.fillStyle = '#ff9a3c';
    c.glow.fillRect(tx - 1 - big, ty - 3 - big, 3 + big * 2, 3 + big);
    c.glow.fillStyle = '#ffd27a';
    c.glow.fillRect(tx, ty - 4 - fl % 2 - big, 1, 2);
    return;
  }
  if (e.variant === 'sapper') {
    // A short pick over the shoulder, and earth on it.
    const a = e.attack && e.attack.t < e.attack.windup ? fa - f * 1.8 : fa + f * 0.3;
    line(g, hx, hy - 2, a, 0, 6, WOOD, 1);
    line(g, hx + Math.cos(a) * 6 - Math.sin(a) * 2, hy - 2 + Math.sin(a) * 6 + Math.cos(a) * 2, a + Math.PI / 2, 0, 4, IRON, 1);
    g.fillStyle = '#5a4a3a';
    g.fillRect(Math.round(bx - 3), Math.round(by - 2), 2, 1), g.fillRect(Math.round(bx + 2), Math.round(by - 3), 1, 1);
  }
}
