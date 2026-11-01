/** Drawing the Warrior: body, the weapon in hand (sword and shield, greatsword, spear), charge and swing. */
import { CHARGE, GUARD } from '../shared/tuning';
import { currentSwing } from '../sim/hero';
import type { Hero } from '../sim/types';
import { blit, ease, line, ring, shadow, smear, spin, stars, type Ctx } from './draw';
import { drawText } from './pixfont';
import { SPRITES } from './sprites';
import { PX } from './world';

interface Pose { a: number; ext: number; from?: number; thrust?: boolean; reach: number }

/** Where the weapon points now (and what it has swept through, for the smear). */
function pose(h: Hero, now: number): Pose {
  const fa = Math.atan2(h.fy, h.fx), side = h.fx >= -0.2 ? 1 : -1;
  const rest: Record<Hero['weapon'], number> = { sword: fa + side * 1.1, greatsword: -Math.PI / 2 - side * 0.7, spear: -Math.PI / 2 + side * 0.3, daggers: fa + side * 1.4 };
  if (h.act === 'charge') {
    const p = Math.min(1, (h.actT + CHARGE.start) / CHARGE.full);
    if (h.weapon === 'spear') return { a: fa, ext: -5 * p, reach: 0 };
    return { a: fa - side * (1.5 + 0.7 * p) + Math.sin(now * 40) * 0.03 * p, ext: 0, reach: 0 };
  }
  if (h.act === 'attack') {
    const s = currentSwing(h), t = h.actT;
    if (s.thrust) {
      const ext = t < s.windup ? -4 * (t / s.windup) : t < s.windup + s.active ? -4 + 14 * ((t - s.windup) / s.active) : 10 * (1 - ease((t - s.windup - s.active) / s.recover));
      return { a: fa, ext, thrust: true, from: t >= s.windup && t < s.windup + s.active + 0.06 ? fa : undefined, reach: s.range * PX };
    }
    const dir = (h.heavy ? 1 : h.combo % 2 ? -1 : 1) * side, half = ((s.arc / 2) * Math.PI) / 180;
    const start = fa - dir * half, end = fa + dir * half;
    if (t < s.windup) return { a: start - dir * 0.6 * ease(t / s.windup), ext: 0, reach: 0 };
    if (t < s.windup + s.active) return { a: start + (end - start) * ((t - s.windup) / s.active), ext: 0, from: start, reach: s.range * PX };
    return { a: end, ext: 0, from: t < s.windup + s.active + 0.07 ? start : undefined, reach: s.range * PX };
  }
  if (h.blocking) return { a: h.weapon === 'sword' ? rest.sword : fa + side * (h.weapon === 'greatsword' ? Math.PI / 2 : 1.3), ext: 0, reach: 0 };
  if (h.act === 'throw') return { a: rest[h.weapon], ext: 0, reach: 0 };
  return { a: rest[h.weapon], ext: 0, reach: 0 };
}

function drawWeapon(c: Ctx, h: Hero, px: number, py: number, p: Pose): void {
  const g = c.lit, ox = px + Math.cos(p.a) * p.ext, oy = py + Math.sin(p.a) * p.ext;
  if (h.weapon === 'sword') {
    line(g, ox, oy, p.a, 2, 12, '#dfe6ec');
    line(g, ox, oy, p.a, 0, 2, '#d4a537');
  } else if (h.weapon === 'greatsword') {
    line(g, ox, oy, p.a, -2, 2, '#5a3d22');
    line(g, ox + Math.cos(p.a) * 2.5, oy + Math.sin(p.a) * 2.5, p.a + Math.PI / 2, -2, 2, '#d4a537');
    line(g, ox, oy, p.a, 3, 17, '#b9c1c8', 2);
    line(g, ox, oy, p.a, 4, 17, '#eef2f5');
  } else if (h.weapon === 'spear') {
    line(g, ox, oy, p.a, -7, 13, '#8b6a3a');
    line(g, ox, oy, p.a, 13, 17, '#dfe6ec', 2);
  } else {
    // Twin daggers: one in each hand, the off hand trailing the swing.
    const side = h.fx >= -0.2 ? 1 : -1, lx = ox - side * 6, ly = oy + 1, la = p.a - side * 0.6;
    for (const [x0, y0, a] of [[ox, oy, p.a], [lx, ly, la]] as const) {
      line(g, x0, y0, a, 0, 2, '#2a2420');
      line(g, x0, y0, a, 2, 7, '#e6ecf0');
    }
  }
  if (h.act === 'charge') {
    const k = Math.min(1, (h.actT + CHARGE.start) / CHARGE.full), len = h.weapon === 'greatsword' || h.weapon === 'spear' ? 17 : h.weapon === 'daggers' ? 7 : 12;
    c.glow.globalAlpha = 0.4 + 0.5 * k * (0.6 + 0.4 * Math.sin(c.now * 30));
    line(c.glow, ox, oy, p.a, len - 4 * k - 2, len, k >= 1 ? '#ffffff' : '#ffd860');
    c.glow.globalAlpha = 1;
  }
  if (p.from !== undefined) {
    const col = h.counter ? '#ffa040' : h.heavy ? '#ffe9a8' : '#ffffff';
    if (p.thrust) {
      c.glow.globalAlpha = 0.7;
      line(c.glow, px, py, p.a, 10, p.reach, col);
      c.glow.globalAlpha = 1;
    } else smear(c.glow, px, py, p.from, p.a, p.reach * 0.5, p.reach * 0.95, col);
  }
}

export function drawHero(c: Ctx, h: Hero, x: number, y: number, me: boolean): void {
  if (h.act === 'down') {
    shadow(c, x, y, 6);
    spin(c, SPRITES.warriorDown, x, y - 4, Math.PI / 2, 0.85);
    drawText(c.glow, String(Math.ceil(h.actDur - h.actT)), Math.round(x - 1), Math.round(y - 18), '#ff6a5a');
    return;
  }
  const up = h.fy < -0.55 && Math.abs(h.fy) > Math.abs(h.fx) * 0.8;
  const flip = h.fx < -0.2;
  let ox = 0, oy = 0, squash = 1;
  if (h.moving) oy = Math.floor(c.now * 8) % 2 ? -1 : 0;
  else oy = Math.floor(c.now * 2) % 2 ? -1 : 0;
  if (h.act === 'attack' && h.actT >= currentSwing(h).windup) (ox = Math.round(h.fx * 1.5)), (oy = Math.round(h.fy * 1.5));
  if (h.act === 'charge') (ox = -Math.round(h.fx)), (oy = 1);
  if (h.act === 'hurt') ox = Math.round(Math.sin(c.now * 90) * 1.2);
  if (h.act === 'zip') (ox = Math.round(h.fx * 2)), (oy = Math.round(h.fy * 2) - 1);
  if (h.act === 'roll') squash = 0.62;
  const bx = x + ox, by = y + oy;
  shadow(c, x, y, 6);
  if (me) ring(c, x, y, 7, '#4a90e0');
  if (h.act === 'roll' || h.act === 'zip') {
    const dx = h.act === 'roll' ? h.rollDx : h.fx, dy = h.act === 'roll' ? h.rollDy : h.fy;
    c.glow.globalAlpha = 0.25;
    for (let k = 1; k <= 3; k++) c.glow.drawImage(SPRITES.warriorDown.white, Math.round(bx - 7 - dx * 5 * k), Math.round(by - (h.act === 'roll' ? 10 : 17) - dy * 5 * k), 14, h.act === 'roll' ? 11 : 18);
    c.glow.globalAlpha = 1;
    if (h.act === 'roll') return blit(c, SPRITES.warriorDown, bx, by, flip, 0, squash);
  }
  const side = h.fx >= -0.2 ? 1 : -1, px = bx + side * 3, py = by - 8, p = pose(h, c.now);
  const fresh = c.now - h.parryOpenAt < GUARD.parryWindow;
  const shieldAt: [number, number] = h.blocking || fresh ? [bx + h.fx * 6, by - 7 + h.fy * 4] : [bx - side * 4, by - 6];
  const drawGear = () => {
    if (h.weapon === 'sword') blit(c, SPRITES.shield, shieldAt[0], shieldAt[1] + 4, false, fresh ? 0.85 : 0);
    drawWeapon(c, h, px, py, p);
    if (h.act === 'throw' && h.actT < 0.2) {
      const a = Math.atan2(h.fy, h.fx) + Math.PI;
      if (h.relic === 'javelin') line(c.lit, bx - side * 2, by - 10, a, -4, 10, '#d8c48a');
      else line(c.lit, bx + side * 3, by - 9, a + 0.6, 0, 4, '#9aa3ad');
    }
  };
  if (up) drawGear();
  const flash = h.act === 'hurt' && h.actT < 0.1 ? 0.85 : h.act === 'stun' ? 0.3 : 0;
  blit(c, up ? SPRITES.warriorUp : SPRITES.warriorDown, bx, by, flip, flash);
  if (!up) drawGear();
  if (fresh && h.weapon !== 'sword') smear(c.glow, bx, by - 8, Math.atan2(h.fy, h.fx) - 0.7, Math.atan2(h.fy, h.fx) + 0.7, 7, 9, '#cfe8ff');
  if (h.act === 'charge') {
    const k = Math.min(1, (h.actT + CHARGE.start) / CHARGE.full);
    for (let i = 0; i < 4; i++) {
      const t = c.now * 4 + i * 1.57, r = 9 - 3 * k;
      c.glow.fillStyle = k >= 1 ? '#ffffff' : '#ffd860';
      c.glow.fillRect(Math.round(bx + Math.cos(t) * r), Math.round(by - 8 + Math.sin(t) * r * 0.5), 1, 1);
    }
  }
  if (h.act === 'stun') stars(c, bx, by - 19);
}
