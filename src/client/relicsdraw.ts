/** Drawing relics and shots in the world: javelins, the hook on its chain, arrows, spells, flasks. */
import type { Bolt, Hero, Hook, Javelin } from '../sim/types';
import { line, type Ctx } from './draw';
import { EL_COL } from './palette';

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

/** Shots, smites and thrown relics. (x, y) is the bolt's spot on the floor in screen pixels. */
export function drawBolt(c: Ctx, b: Bolt, x: number, y: number): void {
  const a = Math.atan2(b.dy, b.dx), back = a + Math.PI, col = EL_COL[b.el];
  if (b.kind === 'arrow' || b.kind === 'bolt') {
    const bolt = b.kind === 'bolt', len = bolt ? 5 : 7;
    c.lit.globalAlpha = b.state === 'stuck' ? Math.min(1, b.life / 0.8) : 1;
    const ty = y - (b.state === 'stuck' ? 6 : 8);
    if (b.state === 'fly') (c.lit.fillStyle = 'rgba(8,6,12,0.5)'), c.lit.fillRect(Math.round(x), Math.round(y + 1), 1, 1);
    line(c.lit, x, ty, back, b.state === 'stuck' ? 0 : 1, len, bolt ? '#5a3d22' : '#8b6a3a', bolt ? 2 : 1);
    line(c.lit, x, ty, back, len - 1, len, bolt ? '#9aa3ad' : '#e8e0c8');
    if (b.state === 'fly') line(c.lit, x, ty, a, 0, 1, '#dfe6ec');
    c.lit.globalAlpha = 1;
    return;
  }
  if (b.kind === 'smite') {
    // A ring of gold closing on the spot, then the light comes down.
    const k = Math.min(1, b.t / b.flight), r = b.burst * 16 * (1.3 - 0.3 * k);
    c.glow.fillStyle = '#ffe9a8';
    c.glow.globalAlpha = 0.5 + 0.5 * k;
    for (let i = 0; i < 40; i++) {
      const t = (i / 40) * Math.PI * 2;
      c.glow.fillRect(Math.round(x + Math.cos(t) * r), Math.round(y + Math.sin(t) * r * 0.6), 1, 1);
    }
    c.glow.globalAlpha = 0.25 * k;
    c.glow.fillRect(Math.round(x - 2), Math.round(y - 60), 5, 60);
    c.glow.globalAlpha = 1;
    return;
  }
  if (b.kind === 'lodestone') {
    if (b.state === 'well') {
      const r = 3.6 * 16;
      c.glow.fillStyle = b.el ? col : '#b080ff';
      for (let i = 0; i < 24; i++) {
        const t = c.now * -3 + (i / 24) * Math.PI * 2, rr = r * (((c.now * 0.9 + i / 24) % 1) * 0.9 + 0.1);
        c.glow.globalAlpha = 0.25 + 0.5 * (1 - rr / r);
        c.glow.fillRect(Math.round(x + Math.cos(t) * rr), Math.round(y + Math.sin(t) * rr * 0.6), 1, 1);
      }
      c.glow.globalAlpha = 1;
      c.lit.fillStyle = '#2a2630';
      c.lit.fillRect(Math.round(x - 2), Math.round(y - 3), 5, 4);
      c.glow.fillStyle = '#d8c0ff';
      c.glow.fillRect(Math.round(x), Math.round(y - 2), 1, 1);
      return;
    }
    const k = b.t / b.flight, up = Math.sin(Math.PI * k) * 24;
    c.lit.fillStyle = 'rgba(8,6,12,0.55)';
    c.lit.fillRect(Math.round(x - 1), Math.round(y), 3, 1);
    c.lit.fillStyle = '#3a3440';
    c.lit.fillRect(Math.round(x - 1), Math.round(y - 5 - up), 3, 3);
    return;
  }
  if (b.kind === 'net') {
    const spin = c.now * 18;
    c.lit.fillStyle = '#8a7a5a';
    for (let i = 0; i < 6; i++) c.lit.fillRect(Math.round(x + Math.cos(spin + i) * 2), Math.round(y - 8 + Math.sin(spin + i) * 2), 1, 1);
    return;
  }
  const ty = y - 8;
  if (b.kind === 'lance') {
    c.glow.fillStyle = col;
    line(c.glow, x, ty, back, 0, 12, col, 2);
    line(c.glow, x, ty, back, 0, 12, '#ffffff');
    return;
  }
  const r = b.kind === 'orb' ? 2 + Math.round(Math.sin(c.now * 20)) * 0.5 : 1;
  c.glow.fillStyle = col;
  for (let i = 1; i <= 4; i++) {
    c.glow.globalAlpha = 0.5 - i * 0.1;
    c.glow.fillRect(Math.round(x + Math.cos(back) * i * 3), Math.round(ty + Math.sin(back) * i * 3), 1, 1);
  }
  c.glow.globalAlpha = 1;
  c.glow.fillRect(Math.round(x - r), Math.round(ty - r), r * 2 + 1, r * 2 + 1);
  c.glow.fillStyle = '#ffffff';
  c.glow.fillRect(Math.round(x), Math.round(ty), 1, 1);
}
