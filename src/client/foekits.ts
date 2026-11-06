/**
 * What the newer goblins carry, drawn where a small goblin's knife would be (foes.ts poses the body):
 * the banner on its pole, the netter's net, the thief's hood and sack, the roof archer's hood, the
 * keeper's whip, the oil thrower's pot, the torch, the sapper's pick, the ironhide's maul. Drawing only: the room says what
 * each is doing. `bx`, `by`: the feet as posed; `ax`, `ay`: the weapon arm's offset this frame.
 */
import type { Enemy } from '../sim/types';
import { line, type Ctx } from './draw';
import { drawFoeKit2 } from './foekits2';
import { drawMaul } from './ironhidedraw';
import { drawChalkKit } from './chalkdraw';

const WOOD = '#7a5a38', HIDE = '#c8a878', HIDE2 = '#9a7a58', ROPE = '#a89a72', IRON = '#8a8a90', GOLD = '#ffd040', CLOTH = '#3a3040';

export const KITTED = new Set(['banner', 'netter', 'thief', 'roofer', 'keeper', 'oiler', 'torch', 'sapper', 'ironhide', 'chalker']);

export function drawFoeKit(c: Ctx, e: Enemy, bx: number, by: number, ax: number, ay: number, t: number): void {
  const f = e.fx < -0.2 ? -1 : 1, hx = Math.round(bx + f * 3 + ax), hy = Math.round(by - 6 + ay), g = c.lit, a = e.attack;
  const wind = a && a.t < a.windup ? a.t / a.windup : 0;
  if (e.variant === 'banner') {
    // A pole twice its height, a stretched cowhide on it (never a person's), their take hung off the bottom edge: keys, buckles, a spoon, a shoe.
    const px = hx, top = hy - 20, sway = Math.round(Math.sin(c.now * 2.2 + e.id) * 1);
    g.fillStyle = WOOD;
    g.fillRect(px, top, 1, 24);
    g.fillStyle = HIDE2;
    g.fillRect(px + f, top + 1, f * 7 + sway, 7);
    g.fillStyle = HIDE;
    for (let y = 0; y < 6; y++) g.fillRect(Math.min(px + f, px + f * 7 + sway) + (y % 2), top + 1 + y, 6, 1);
    // A daub of red across it: their mark.
    g.fillStyle = '#7a1d1d';
    g.fillRect(px + f * 3, top + 3, 2, 3);
    const take = [IRON, '#7a5a38', '#b0a890'];
    for (let i = 1; i < 7; i += 2) (g.fillStyle = take[(i >> 1) % 3]), g.fillRect(px + f * i + sway, top + 8 + (i % 3 ? 1 : 0), 1, 1);
    // A dull glint of iron among it (steady: a pulse of gold reads as a relic).
    g.fillStyle = '#8a8478';
    g.fillRect(px + f * 5 + sway, top + 9, 1, 1);
    return;
  }
  if (e.variant === 'netter') {
    // A coiled net over the shoulder; winding up, swung round its head, the weights out on the ends.
    if (wind && a!.kind === 'net') {
      const r = 3 + Math.round(wind * 3), ang = c.now * 14;
      g.fillStyle = ROPE;
      for (let i = 0; i < 10; i++) {
        const q = ang + (i / 10) * Math.PI * 2;
        g.fillRect(Math.round(bx + Math.cos(q) * r), Math.round(by - 15 + Math.sin(q) * r * 0.4), 1, 1);
      }
      g.fillStyle = IRON;
      g.fillRect(Math.round(bx + Math.cos(ang) * r), Math.round(by - 15 + Math.sin(ang) * r * 0.4), 2, 1);
      return;
    }
    g.fillStyle = ROPE;
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if ((x + y) % 2) g.fillRect(Math.round(bx - f * 4 + x), Math.round(by - 11 + y), 1, 1);
    g.fillStyle = IRON;
    g.fillRect(Math.round(bx - f * 4), Math.round(by - 7), 1, 1), g.fillRect(Math.round(bx - f * 1), Math.round(by - 7), 1, 1);
    return;
  }
  if (e.variant === 'thief' || e.variant === 'roofer') {
    // A dark hood over the head (the eyes still show); the thief a short knife, and the sack once it has something.
    g.fillStyle = CLOTH;
    g.fillRect(Math.round(bx - 4), Math.round(by - 14), 9, 2), g.fillRect(Math.round(bx - 5), Math.round(by - 12), 2, 3), g.fillRect(Math.round(bx + 4), Math.round(by - 12), 2, 3);
    if (e.variant === 'roofer') return;
    line(g, hx, hy, Math.atan2(e.fy, e.fx), 0, 3, '#cfd6dc');
    if (!e.loot) return;
    const sx = Math.round(bx - f * 5), sy = Math.round(by - 9);
    g.fillStyle = '#6a5a3a';
    g.fillRect(sx - 2, sy, 5, 5);
    g.fillStyle = '#4a3a22';
    g.fillRect(sx - 1, sy - 1, 3, 1);
    c.glow.fillStyle = e.loot.potion ? '#9be0ff' : GOLD;
    c.glow.globalAlpha = 0.6 + 0.4 * Math.sin(c.now * 9);
    c.glow.fillRect(sx, sy + 1 + (Math.floor(c.now * 4) % 2), 1, 1);
    c.glow.globalAlpha = 1;
    return;
  }
  if (e.variant === 'chalker') return drawChalkKit(c, e, bx, by, hx, hy, f, t);
  void t;
  // An ironhide's maul (its plates go on over the body: ironhidedraw.ts).
  if (e.variant === 'ironhide') return drawMaul(c, e, hx, hy, f, wind);
  drawFoeKit2(c, e, bx, by, hx, hy, f, wind);
}
