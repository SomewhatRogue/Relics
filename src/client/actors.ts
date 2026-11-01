/**
 * Drawing heroes, enemies and telegraphs. `lit` is the flat layer the lighting pass shades;
 * `glow` is drawn unlit on top (telegraphs, eyes, trails, flashes). Each sprite erases the glow
 * layer under itself, so a telegraph never shows through whoever is standing on it.
 */
import { COMBO, GUARD } from '../shared/tuning';
import type { Enemy, EnemyAttack, Hero } from '../sim/types';
import { drawText } from './pixfont';
import { OUTLINE, SPRITES, type Sprite } from './sprites';
import { OX, OY, PX } from './world';

export interface Ctx {
  lit: CanvasRenderingContext2D;
  glow: CanvasRenderingContext2D;
  now: number;
}

/** Draw a sprite with its feet at (x, y): lit pixels, then knock out and relight its glow. */
export function blit(c: Ctx, s: Sprite, x: number, y: number, flip = false, flash = 0, squash = 1): void {
  const h = Math.round(s.h * squash), left = Math.round(x - s.w / 2), top = Math.round(y - h);
  const put = (g: CanvasRenderingContext2D, img: HTMLCanvasElement) => {
    g.save();
    if (flip) {
      g.translate(left + s.w, top);
      g.scale(-1, 1);
      g.drawImage(img, 0, 0, s.w, h);
    } else g.drawImage(img, left, top, s.w, h);
    g.restore();
  };
  put(c.lit, s.c);
  c.glow.globalCompositeOperation = 'destination-out';
  put(c.glow, s.white);
  c.glow.globalCompositeOperation = 'source-over';
  if (squash === 1) for (const [gx, gy, col] of s.glow) {
    c.glow.fillStyle = col;
    c.glow.fillRect(flip ? left + s.w - 1 - gx : left + gx, top + gy, 1, 1);
  }
  if (flash > 0) {
    c.glow.globalAlpha = flash;
    put(c.glow, s.white);
    c.glow.globalAlpha = 1;
  }
}

export function shadow(c: Ctx, x: number, y: number, rx: number): void {
  c.lit.fillStyle = 'rgba(8,6,12,0.55)';
  const ry = Math.max(1, Math.round(rx / 3));
  for (let dy = -ry; dy <= ry; dy++) {
    const w = Math.round(rx * Math.sqrt(1 - (dy * dy) / (ry * ry + 0.01)));
    c.lit.fillRect(Math.round(x - w), Math.round(y + dy), w * 2 + 1, 1);
  }
}

/** A ring of pixels at the feet: the hero's team colour, or an enemy's health. */
export function ring(c: Ctx, x: number, y: number, rx: number, col: string, share = 1, rest = '#3a1418'): void {
  const ry = Math.max(2, rx / 3);
  for (let a = 0; a < 40; a++) {
    const t = (a / 40) * Math.PI * 2;
    c.glow.fillStyle = a / 40 < share ? col : rest;
    c.glow.fillRect(Math.round(x + Math.cos(t - Math.PI / 2) * rx), Math.round(y + Math.sin(t - Math.PI / 2) * ry), 1, 1);
  }
}

function line(g: CanvasRenderingContext2D, x0: number, y0: number, a: number, r0: number, r1: number, col: string): void {
  g.fillStyle = col;
  for (let r = r0; r <= r1; r += 0.5) g.fillRect(Math.round(x0 + Math.cos(a) * r), Math.round(y0 + Math.sin(a) * r), 1, 1);
}

/** The Warrior's sword angle now, and the swept range when swinging. */
function swordAngle(h: Hero): { a: number; from?: number } {
  const fa = Math.atan2(h.fy, h.fx);
  if (h.act !== 'attack') return { a: fa + (h.fx >= 0 ? 1.1 : -1.1) };
  const s = COMBO[h.combo], dir = h.combo === 1 ? -1 : 1, half = ((s.arc / 2) * Math.PI) / 180;
  const start = fa - dir * half, end = fa + dir * half;
  if (h.actT < s.windup) return { a: start - dir * 0.5 * (h.actT / s.windup) };
  if (h.actT < s.windup + s.active) return { a: start + (end - start) * ((h.actT - s.windup) / s.active), from: start };
  return { a: end, from: h.actT < s.windup + s.active + 0.08 ? start : undefined };
}

export function drawHero(c: Ctx, h: Hero, x: number, y: number, me: boolean): void {
  if (h.act === 'down') {
    shadow(c, x, y, 6);
    c.lit.save();
    c.lit.translate(Math.round(x), Math.round(y - 3));
    c.lit.rotate(Math.PI / 2);
    c.lit.globalAlpha = 0.85;
    c.lit.drawImage(SPRITES.warriorDown.c, -8, -7);
    c.lit.restore();
    drawText(c.glow, String(Math.ceil(h.actDur - h.actT)), Math.round(x - 1), Math.round(y - 18), '#ff6a5a');
    return;
  }
  const up = h.fy < -0.55 && Math.abs(h.fy) > Math.abs(h.fx) * 0.8;
  const flip = h.fx < -0.2;
  let ox = 0, oy = 0, squash = 1;
  if (h.moving) oy = Math.floor(c.now * 8) % 2 ? -1 : 0;
  else oy = Math.floor(c.now * 2) % 2 ? -1 : 0;
  if (h.act === 'attack' && h.actT >= COMBO[h.combo].windup) (ox = Math.round(h.fx * 1.5)), (oy = Math.round(h.fy * 1.5));
  if (h.act === 'hurt') ox = Math.round(Math.sin(c.now * 90) * 1.2);
  if (h.act === 'roll') squash = 0.62;
  const bx = x + ox, by = y + oy;
  shadow(c, x, y, 6);
  if (me) ring(c, x, y, 7, '#4a90e0');
  if (h.act === 'roll') {
    c.glow.globalAlpha = 0.25;
    for (let k = 1; k <= 2; k++) c.glow.drawImage(SPRITES.warriorDown.white, Math.round(bx - 7 - h.rollDx * 5 * k), Math.round(by - 10 - h.rollDy * 5 * k), 14, 11);
    c.glow.globalAlpha = 1;
    blit(c, SPRITES.warriorDown, bx, by, flip, 0, squash);
    return;
  }
  const sw = swordAngle(h), px = bx + (flip ? -3 : 3), py = by - 8;
  const drawSword = () => {
    line(c.lit, px, py, sw.a, 2, 12, '#dfe6ec');
    line(c.lit, px, py, sw.a, 0, 2, '#d4a537');
    if (sw.from !== undefined) {
      const steps = 14, col = h.counter ? '#ffa040' : '#ffffff';
      for (let i = 0; i <= steps; i++) {
        const a = sw.from + ((sw.a - sw.from) * i) / steps;
        c.glow.globalAlpha = 0.25 + 0.6 * (i / steps);
        for (let r = 13; r <= 21; r += 2) {
          c.glow.fillStyle = col;
          c.glow.fillRect(Math.round(px + Math.cos(a) * r), Math.round(py + Math.sin(a) * r), 1, 1);
        }
      }
      c.glow.globalAlpha = 1;
    }
  };
  const fresh = c.now - h.parryOpenAt < GUARD.parryWindow;
  const shieldAt: [number, number] = h.blocking || fresh ? [bx + h.fx * 6, by - 7 + h.fy * 4] : [bx + (flip ? 4 : -4), by - 6];
  const drawShield = () => {
    blit(c, SPRITES.shield, shieldAt[0], shieldAt[1] + 4, false, fresh ? 0.85 : 0);
  };
  if (up) drawSword(), drawShield();
  const flash = h.act === 'hurt' && h.actT < 0.1 ? 0.85 : h.act === 'stun' ? 0.3 : 0;
  blit(c, up ? SPRITES.warriorUp : SPRITES.warriorDown, bx, by, flip, flash);
  if (!up) drawShield(), drawSword();
  if (h.act === 'stun') stars(c, bx, by - 19);
}

function stars(c: Ctx, x: number, y: number): void {
  for (let i = 0; i < 3; i++) {
    const t = c.now * 5 + (i * Math.PI * 2) / 3;
    c.glow.fillStyle = '#ffe070';
    c.glow.fillRect(Math.round(x + Math.cos(t) * 6), Math.round(y + Math.sin(t) * 2), 1, 1);
  }
}

export function drawEnemy(c: Ctx, e: Enemy, x: number, y: number): void {
  const big = e.kind === 'butcher';
  if (e.act === 'dead') {
    c.lit.save();
    c.lit.globalAlpha = Math.max(0, 1 - e.actT / e.actDur);
    c.lit.translate(Math.round(x), Math.round(y - 4));
    c.lit.rotate(-Math.PI / 2);
    c.lit.drawImage(SPRITES.butcherDown.c, -12, -10);
    c.lit.restore();
    return;
  }
  const flash = c.now - e.hitAt < 0.09 ? 0.9 : 0;
  shadow(c, x, y, big ? 10 : 5);
  const hurt = e.hp < e.maxHp && (c.now - e.hitAt < 3 || e.hp < e.maxHp * 0.5);
  if (big && hurt) ring(c, x, y, 11, '#e24b4a', e.hp / e.maxHp);
  let ox = 0, oy = 0;
  const a = e.attack;
  if (a && a.t < a.windup) oy = -1;
  else if (a && a.t < a.windup + a.active + 0.1) (ox = Math.round(e.fx * 2)), (oy = Math.round(e.fy * 2));
  if (e.act === 'stagger') ox = Math.round(Math.sin(c.now * 30));
  if (e.moving) oy += Math.floor(c.now * 5) % 2 ? -1 : 0;
  if (!big) {
    const s = e.kind === 'dummy' ? SPRITES.dummy : SPRITES.swingDummy;
    const wob = c.now - e.hitAt < 0.3 ? Math.round(Math.sin(c.now * 60)) : 0;
    blit(c, s, x + wob, y, false, flash);
    if (e.kind === 'swingDummy') {
      let ang = Math.atan2(e.fy, e.fx);
      if (a) ang += a.t < a.windup ? -1.2 * (a.t / a.windup) : -1.2 + 2.4 * Math.min(1, (a.t - a.windup) / a.active);
      line(c.lit, x + 5, y - 10, ang, 0, 11, '#6b4a2b');
      line(c.lit, x + 5, y - 10, ang, 9, 12, '#3a2a1a');
    }
    if (e.act === 'stagger') stars(c, x, y - 18);
    return;
  }
  const up = e.fy < -0.55;
  blit(c, up ? SPRITES.butcherUp : SPRITES.butcherDown, x + ox, y + oy, e.fx < -0.2, flash);
  if (e.act === 'stagger') stars(c, x, y - 25);
  if (a && a.unblockable && a.t < a.windup) {
    const bob = Math.floor(c.now * 6) % 2;
    drawText(c.glow, '!', Math.round(x - 1), Math.round(y - 33 - bob), '#ffd040');
  }
}

/** The telegraph on the floor: a red shape that fills before the attack lands. */
export function drawTelegraph(c: Ctx, a: EnemyAttack, cx: number, cy: number): void {
  if (a.t >= a.windup + a.active) return;
  const prog = Math.min(1, a.t / a.windup), g = c.glow;
  const pulse = 0.85 + 0.15 * Math.sin(c.now * 20);
  if (a.kind === 'slam') {
    const R = a.radius * PX, ox = OX + a.cx * PX - cx, oy = OY + a.cy * PX - cy;
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      const d = Math.hypot(x, y);
      if (d > R) continue;
      const edge = d > R - 1.2;
      if (edge) {
        g.fillStyle = Math.floor((Math.atan2(y, x) + Math.PI) * 6) % 2 ? '#ffd040' : '#2a1408';
        g.globalAlpha = 0.95;
      } else {
        g.fillStyle = '#e8501f';
        g.globalAlpha = d < R * prog ? 0.5 * pulse : 0.16;
      }
      g.fillRect(Math.round(ox + x), Math.round(oy + y), 1, 1);
    }
  } else {
    const R = a.range * PX, ox = OX + a.ox * PX - cx, oy = OY + a.oy * PX - cy, cos = Math.cos(((a.arc / 2) * Math.PI) / 180);
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      const d = Math.hypot(x, y);
      if (d > R || d < 4) continue;
      const k = (x * a.dx + y * a.dy) / d;
      if (k < cos) continue;
      const edge = d > R - 1.2 || k < cos + 0.012;
      g.fillStyle = '#e23a30';
      g.globalAlpha = edge ? 0.9 : d < R * prog ? 0.48 * pulse : 0.16;
      g.fillRect(Math.round(ox + x), Math.round(oy + y), 1, 1);
    }
  }
  g.globalAlpha = 1;
}

export { OUTLINE };
