/** Drawing relics in the world: javelins in flight or stuck fast, and the hook on its chain. */
import type { Hero, Hook, Javelin } from '../sim/types';
import { line, type Ctx } from './draw';

const runes = (c: Ctx, x: number, y: number, a: number, from: number, to: number) => {
  c.glow.globalAlpha = 0.6 + 0.4 * Math.sin(c.now * 6);
  c.glow.fillStyle = '#9fe8ff';
  for (let r = from; r <= to; r += 3) c.glow.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1);
  c.glow.globalAlpha = 1;
};

/** (x, y) is the javelin's point on the floor in screen pixels. */
export function drawJavelin(c: Ctx, j: Javelin, x: number, y: number): void {
  const a = Math.atan2(j.dy, j.dx), back = a + Math.PI;
  const fade = j.state === 'fly' ? 1 : Math.min(1, j.life / 1.5);
  c.lit.globalAlpha = c.glow.globalAlpha = fade;
  if (j.state === 'floor') {
    line(c.lit, x, y, back, 1, 14, '#a8945e');
    line(c.lit, x, y, back, 0, 1, '#dfe6ec');
    runes(c, x, y, back, 3, 12);
  } else {
    const h = j.state === 'body' ? 10 : 8, tx = x, ty = y - h;
    if (j.state === 'fly') {
      c.lit.fillStyle = 'rgba(8,6,12,0.5)';
      for (let r = 0; r < 12; r++) c.lit.fillRect(Math.round(x + Math.cos(back) * r), Math.round(y + 2 + Math.sin(back) * r * 0.4), 1, 1);
      c.glow.globalAlpha = 0.3;
      line(c.glow, tx, ty, back, 14, 26, '#9fe8ff');
      c.glow.globalAlpha = 1;
      line(c.lit, tx, ty, a, 0, 3, '#dfe6ec', 2);
    }
    const from = j.state === 'fly' ? 0 : 2;
    line(c.lit, tx, ty, back, from, 14, '#d8c48a');
    runes(c, tx, ty, back, from + 3, 13);
  }
  c.lit.globalAlpha = c.glow.globalAlpha = 1;
}

/** The hook and its chain, from the owner's hand. */
export function drawHook(c: Ctx, k: Hook, hx: number, hy: number, x: number, y: number): void {
  const sx = hx, sy = hy - 9, ex = x, ey = y - 8, d = Math.hypot(ex - sx, ey - sy), n = Math.max(1, Math.floor(d / 2));
  for (let i = 0; i <= n; i++) {
    const t = i / n, sag = Math.sin(t * Math.PI) * Math.min(4, d / 14) * (k.state === 'fly' ? 1 : 0.2);
    c.lit.fillStyle = i % 2 ? '#6a6470' : '#9aa3ad';
    c.lit.fillRect(Math.round(sx + (ex - sx) * t), Math.round(sy + (ey - sy) * t + sag), 1, 1);
  }
  const a = Math.atan2(k.dy, k.dx);
  line(c.lit, ex, ey, a + 2.4, 0, 3, '#cfd6dc');
  line(c.lit, ex, ey, a - 2.4, 0, 3, '#cfd6dc');
  c.glow.fillStyle = '#9fe8ff';
  c.glow.fillRect(Math.round(ex), Math.round(ey), 1, 1);
}

export type { Hero };
