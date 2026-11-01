/** What a hero holds and how: each weapon's pose through rest, charge and swing, then drawn in hand. */
import { CHARGE, WEAPONS } from '../shared/tuning';
import { currentSwing } from '../sim/hero';
import type { Hero } from '../sim/types';
import { ease, line, smear, type Ctx } from './draw';
import { EL_COL } from './palette';
import { PX } from './world';

export interface Pose { a: number; ext: number; from?: number; thrust?: boolean; reach: number; pull: number }

const ranged = (h: Hero) => !!WEAPONS[h.weapon].combo[0].shot;

/** Where the weapon points now (and what it has swept through, for the smear). */
export function pose(h: Hero, now: number): Pose {
  const fa = Math.atan2(h.fy, h.fx), side = h.fx >= -0.2 ? 1 : -1;
  const rest: Record<Hero['weapon'], number> = {
    sword: fa + side * 1.1, greatsword: -Math.PI / 2 - side * 0.7, spear: -Math.PI / 2 + side * 0.3, daggers: fa + side * 1.4,
    bow: fa + side * 1.2, staff: -Math.PI / 2 + side * 0.25, mace: fa + side * 1.2,
  };
  const charge = Math.min(1, (h.actT + CHARGE.start) / CHARGE.full);
  if (h.act === 'charge') {
    if (ranged(h)) return { a: h.weapon === 'staff' ? -Math.PI / 2 + side * 0.25 : fa, ext: 0, reach: 0, pull: charge };
    if (h.weapon === 'spear') return { a: fa, ext: -5 * charge, reach: 0, pull: 0 };
    return { a: fa - side * (1.5 + 0.7 * charge) + Math.sin(now * 40) * 0.03 * charge, ext: 0, reach: 0, pull: 0 };
  }
  if (h.act === 'attack') {
    const s = currentSwing(h), t = h.actT;
    if (s.shot) {
      const pull = t < s.windup ? (h.heavy ? 1 : t / s.windup) : 0;
      return { a: fa, ext: t >= s.windup && t < s.windup + 0.08 ? (h.weapon === 'staff' ? 3 : -1) : 0, reach: 0, pull };
    }
    if (s.thrust) {
      const ext = t < s.windup ? -4 * (t / s.windup) : t < s.windup + s.active ? -4 + 14 * ((t - s.windup) / s.active) : 10 * (1 - ease((t - s.windup - s.active) / s.recover));
      return { a: fa, ext, thrust: true, from: t >= s.windup && t < s.windup + s.active + 0.06 ? fa : undefined, reach: s.range * PX, pull: 0 };
    }
    const dir = (h.heavy ? 1 : h.combo % 2 ? -1 : 1) * side, half = ((Math.min(s.arc, 359) / 2) * Math.PI) / 180;
    const start = fa - dir * half, end = fa + dir * half;
    if (t < s.windup) return { a: start - dir * 0.6 * ease(t / s.windup), ext: 0, reach: 0, pull: 0 };
    if (t < s.windup + s.active) return { a: start + (end - start) * ((t - s.windup) / s.active), ext: 0, from: start, reach: s.range * PX, pull: 0 };
    return { a: end, ext: 0, from: t < s.windup + s.active + 0.07 ? start : undefined, reach: s.range * PX, pull: 0 };
  }
  if (h.blocking) return { a: h.weapon === 'sword' ? rest.sword : fa + side * (h.weapon === 'greatsword' ? Math.PI / 2 : 1.3), ext: 0, reach: 0, pull: 0 };
  return { a: rest[h.weapon], ext: 0, reach: 0, pull: 0 };
}

/** The longbow, its belly toward the target; the string pulls back with an arrow on it. */
function bow(c: Ctx, x: number, y: number, a: number, pull: number): void {
  const dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx, gx = x + dx * 3, gy = y + dy * 3;
  const at = (k: number): [number, number] => [gx + nx * k - dx * ((k * k) / 14), gy + ny * k - dy * ((k * k) / 14)];
  c.lit.fillStyle = '#8b6a3a';
  for (let k = -6; k <= 6; k += 0.5) {
    const [px, py] = at(k);
    c.lit.fillRect(Math.round(px), Math.round(py), 1, 1);
  }
  const [ax, ay] = at(-6), [bx, by] = at(6), nock: [number, number] = [gx - dx * (2.6 + 5 * pull), gy - dy * (2.6 + 5 * pull)];
  for (const [ex, ey] of [[ax, ay], [bx, by]]) {
    const d = Math.hypot(nock[0] - ex, nock[1] - ey);
    line(c.lit, ex, ey, Math.atan2(nock[1] - ey, nock[0] - ex), 0, d, '#d8d0bc');
  }
  if (pull > 0.05) {
    line(c.lit, nock[0], nock[1], a, 0, 9, '#8b6a3a');
    line(c.lit, nock[0], nock[1], a, 9, 10, '#dfe6ec');
    if (pull >= 1) (c.glow.fillStyle = '#ffffff'), c.glow.fillRect(Math.round(nock[0] + dx * 10), Math.round(nock[1] + dy * 10), 1, 1);
  }
}

export function drawWeapon(c: Ctx, h: Hero, px: number, py: number, p: Pose): void {
  const g = c.lit, ox = px + Math.cos(p.a) * p.ext, oy = py + Math.sin(p.a) * p.ext;
  const side = h.fx >= -0.2 ? 1 : -1, el = EL_COL[h.augments[h.relic]];
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
  } else if (h.weapon === 'bow') bow(c, ox, oy, p.a, p.pull);
  else if (h.weapon === 'staff') {
    line(g, ox, oy, p.a, -6, 12, '#6b4a2b');
    const tx = ox + Math.cos(p.a) * 13, ty = oy + Math.sin(p.a) * 13, r = 1 + Math.round(p.pull * 2);
    c.glow.fillStyle = el;
    c.glow.globalAlpha = 0.7 + 0.3 * Math.sin(c.now * 9);
    c.glow.fillRect(Math.round(tx - r / 2), Math.round(ty - r / 2), r + 1, r + 1);
    c.glow.globalAlpha = 1;
    c.glow.fillStyle = '#ffffff';
    c.glow.fillRect(Math.round(tx), Math.round(ty), 1, 1);
  } else if (h.weapon === 'mace') {
    line(g, ox, oy, p.a, 0, 8, '#5a3d22');
    line(g, ox, oy, p.a, 8, 11, '#9aa3ad', 3);
    line(g, ox + Math.cos(p.a) * 9.5, oy + Math.sin(p.a) * 9.5, p.a + Math.PI / 2, -2.5, 2.5, '#cfd6dc');
    // The censer in the off hand, a coal from the Last Lantern swinging in it.
    const cx = px - side * 9, cy = py + 3 + Math.round(Math.sin(c.now * 3)), sway = Math.sin(c.now * 3) * 2;
    line(g, px - side * 8, py - 1, Math.PI / 2 + sway * 0.1, 0, 3, '#6a6470');
    g.fillStyle = '#b08a3a';
    g.fillRect(Math.round(cx + sway - 1), Math.round(cy), 3, 2);
    c.glow.fillStyle = Math.floor(c.now * 6) % 2 ? '#ffd27a' : '#ff9a3c';
    c.glow.fillRect(Math.round(cx + sway), Math.round(cy - 1), 1, 1);
  } else {
    // Twin daggers: one in each hand, the off hand trailing the swing.
    const lx = ox - side * 6, ly = oy + 1, la = p.a - side * 0.6;
    for (const [x0, y0, a] of [[ox, oy, p.a], [lx, ly, la]] as const) {
      line(g, x0, y0, a, 0, 2, '#2a2420');
      line(g, x0, y0, a, 2, 7, '#e6ecf0');
    }
  }
  if (h.act === 'charge' && !ranged(h)) {
    const k = Math.min(1, (h.actT + CHARGE.start) / CHARGE.full), len = h.weapon === 'greatsword' || h.weapon === 'spear' ? 17 : h.weapon === 'daggers' ? 7 : h.weapon === 'mace' ? 11 : 12;
    c.glow.globalAlpha = 0.4 + 0.5 * k * (0.6 + 0.4 * Math.sin(c.now * 30));
    line(c.glow, ox, oy, p.a, len - 4 * k - 2, len, k >= 1 ? '#ffffff' : h.weapon === 'mace' ? '#ffe9a8' : '#ffd860');
    c.glow.globalAlpha = 1;
  }
  if (p.from !== undefined) {
    const col = h.counter ? '#ffa040' : h.weapon === 'mace' && h.heavy ? '#ffe9a8' : h.heavy ? '#ffe9a8' : '#ffffff';
    if (p.thrust) {
      c.glow.globalAlpha = 0.7;
      line(c.glow, px, py, p.a, 10, p.reach, col);
      c.glow.globalAlpha = 1;
    } else smear(c.glow, px, py, p.from, p.a, p.reach * 0.5, p.reach * 0.95, col);
  }
}
