/** Drawing a hero: the class's body, the weapon in hand, the dodge, charge and stun. */
import { CHARGE, WEAPONS } from '../shared/tuning';
import { currentSwing } from '../sim/hero';
import type { Hero } from '../sim/types';
import { blit, line, ring, shadow, smear, spin, stars, type Ctx } from './draw';
import { drawWeapon, pose } from './held';
import { EL_COL } from './palette';
import { drawText } from './pixfont';
import { HEROES, SPRITES } from './sprites';

export function drawHero(c: Ctx, h: Hero, x: number, y: number, me: boolean): void {
  const look = HEROES[WEAPONS[h.weapon].cls];
  if (h.act === 'down') {
    shadow(c, x, y, 6);
    spin(c, look.down, x, y - 4, Math.PI / 2, 0.85);
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
  const dk = WEAPONS[h.weapon].dodge;
  // The mage's blink: gone, a scatter of violet light where they are.
  if (h.act === 'roll' && dk.kind === 'blink') {
    for (let i = 0; i < 10; i++) {
      const t = c.now * 13 + i * 2.4, r = 2 + ((i * 5) % 7);
      c.glow.fillStyle = i % 3 ? '#c9a8ff' : '#ffffff';
      c.glow.fillRect(Math.round(x + Math.cos(t) * r), Math.round(y - 8 + Math.sin(t) * r), 1, 1);
    }
    return;
  }
  if (h.act === 'roll' && dk.kind === 'roll') squash = 0.62;
  if (h.act === 'roll' && dk.kind === 'backstep') oy -= Math.round(4 * Math.sin((Math.PI * h.actT) / dk.time));
  if (h.act === 'roll' && dk.kind === 'dash') (ox = Math.round(h.rollDx * 2)), (oy += 1);
  const bx = x + ox, by = y + oy;
  shadow(c, x, y, 6);
  if (me) ring(c, x, y, 7, '#4a90e0');
  if (h.act === 'roll' || h.act === 'zip') {
    const dx = h.act === 'roll' ? h.rollDx : h.fx, dy = h.act === 'roll' ? h.rollDy : h.fy;
    c.glow.globalAlpha = 0.25;
    const tumble = h.act === 'roll' && dk.kind === 'roll', n = h.act === 'roll' && dk.kind === 'dash' ? 5 : 3;
    for (let k = 1; k <= n; k++) c.glow.drawImage(look.down.white, Math.round(bx - 7 - dx * 5 * k), Math.round(by - (tumble ? 10 : 17) - dy * 5 * k), 14, tumble ? 11 : 18);
    c.glow.globalAlpha = 1;
    if (tumble) return blit(c, look.down, bx, by, flip, 0, squash);
  }
  const side = h.fx >= -0.2 ? 1 : -1, px = bx + side * 3, py = by - 8, p = pose(h, c.now);
  const fresh = c.now - h.parryOpenAt < WEAPONS[h.weapon].parryWindow;
  const shieldAt: [number, number] = h.blocking || fresh ? [bx + h.fx * 6, by - 7 + h.fy * 4] : [bx - side * 4, by - 6];
  const drawGear = () => {
    if (h.weapon === 'sword') blit(c, SPRITES.shield, shieldAt[0], shieldAt[1] + 4, false, fresh ? 0.85 : 0);
    drawWeapon(c, h, px, py, p);
    if (h.act === 'throw' && h.actT < 0.2) {
      const a = Math.atan2(h.fy, h.fx) + Math.PI;
      if (h.relic === 'javelin') line(c.lit, bx - side * 2, by - 10, a, -4, 10, '#d8c48a');
      else if (h.relic === 'hook') line(c.lit, bx + side * 3, by - 9, a + 0.6, 0, 4, '#9aa3ad');
      else if (h.relic === 'horn') line(c.lit, bx + side * 2, by - 12, Math.atan2(h.fy, h.fx), 0, 5, '#d8c48a', 2);
      else (c.lit.fillStyle = '#7aa0a8'), c.lit.fillRect(Math.round(bx - side * 4), Math.round(by - 13), 2, 3);
      const el = h.augments[h.relic];
      if (el) (c.glow.fillStyle = EL_COL[el]), c.glow.fillRect(Math.round(bx - side * 3), Math.round(by - 12), 1, 1);
    }
  };
  if (up) drawGear();
  const flash = h.act === 'hurt' && h.actT < 0.1 ? 0.85 : h.act === 'stun' ? 0.3 : 0;
  blit(c, up ? look.up : look.down, bx, by, flip, flash);
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
