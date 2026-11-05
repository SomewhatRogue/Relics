/**
 * Signs inside the newer round telegraphs (foes.ts draws the red circle and its striped edge): the
 * net's mesh, drops of oil where the pot will burst, the ground cracking over a sapper, and flames
 * licking at the edge of a slick the torch is about to land in. Drawing only.
 */
import type { EnemyAttack } from '../sim/types';
import type { Ctx } from './draw';

/** `ox`, `oy`: the circle's middle on screen; `R` its radius in pixels; `prog` how far the wind-up is. */
export function drawRoundSign(c: Ctx, a: EnemyAttack, ox: number, oy: number, R: number, prog: number): void {
  const g = c.glow;
  if (a.kind === 'net') {
    g.fillStyle = '#e8d090';
    g.globalAlpha = 0.35 + 0.4 * prog;
    for (let y = -R; y <= R; y += 1) for (let x = -R; x <= R; x += 1) if (x * x + y * y < R * R * 0.8 && (Math.round(x + y) % 3 === 0 || Math.round(x - y) % 3 === 0) && (x + y) % 2) g.fillRect(Math.round(ox + x), Math.round(oy + y), 1, 1);
  } else if (a.kind === 'lob') {
    g.fillStyle = '#6a5a2a';
    g.globalAlpha = 0.5 + 0.4 * prog;
    for (let i = 0; i < 9; i++) {
      const q = i * 2.4, r = R * 0.25 + ((i * 31) % 10) / 10 * R * 0.6;
      g.fillRect(Math.round(ox + Math.cos(q) * r), Math.round(oy + Math.sin(q) * r), 2, 1);
    }
  } else if (a.kind === 'erupt') {
    g.fillStyle = '#a08a6a';
    g.globalAlpha = 0.5 + 0.5 * prog;
    for (let i = 0; i < 5; i++) {
      const q = i * 1.26 + 0.3;
      for (let d = 1; d < R * prog; d++) g.fillRect(Math.round(ox + Math.cos(q + Math.sin(d) * 0.3) * d), Math.round(oy + Math.sin(q + Math.sin(d) * 0.3) * d), 1, 1);
    }
  } else if (a.kind === 'torch') {
    for (let i = 0; i < 14; i++) {
      const q = (i / 14) * Math.PI * 2 + c.now, fl = Math.floor(c.now * 12 + i) % 3;
      g.fillStyle = fl ? '#ff9a3c' : '#ffd27a';
      g.globalAlpha = 0.4 + 0.6 * prog;
      g.fillRect(Math.round(ox + Math.cos(q) * R * 0.85), Math.round(oy + Math.sin(q) * R * 0.85 - fl), 1, 1 + fl);
    }
  }
  g.globalAlpha = 1;
}
