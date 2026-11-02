/** Drawing a hero: the class's body, the weapon in hand, the dodge, charge and stun. */
import { CHARGE, WARD, WEAPONS, WANT } from '../shared/tuning';
import { chargeFull, currentSwing } from '../sim/hero';
import type { Hero } from '../sim/types';
import { blit, line, ring, shadow, smear, spin, stars, type Ctx } from './draw';
import { drawWeapon, pose } from './held';
import { EL_COL } from './palette';
import { drawText } from './pixfont';
import { PARTY } from '../shared/tuning';
import { HEROES, SPRITES } from './sprites';

/** `t` is the room's time (blessings and rallies are kept in it). */
export function drawHero(c: Ctx, h: Hero, x: number, y: number, me: boolean, t: number): void {
  const look = HEROES[WEAPONS[h.weapon].cls];
  if (h.act === 'down') {
    shadow(c, x, y, 6);
    spin(c, look.down, x, y - 4, Math.PI / 2, 0.85);
    // Alone: up in a moment. In a party: the seconds left to be picked up, and how far along it is.
    if (h.out || h.lying) return;
    const left = h.bleeding ? PARTY.bleed - h.actT : h.actDur - h.actT;
    drawText(c.glow, String(Math.max(0, Math.ceil(left))), Math.round(x - 1), Math.round(y - 18), '#ff6a5a');
    if (h.pickT) ring(c, x, y, 8, '#f0e0b0', h.pickT / PARTY.pickUp, '#3a3428');
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
  // Allies show their health at their feet, and their name.
  else {
    ring(c, x, y, 7, '#5ad07a', h.hp / 100, '#1a3a22');
    const name = (h.tag ?? h.id).toUpperCase();
    drawText(c.glow, name, Math.round(x - name.length * 2), Math.round(y + 6), '#9ad8a8');
  }
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
      else if (h.relic === 'horn') line(c.lit, bx + side * 2, by - 13, -Math.PI / 2 + side * 0.9, 0, 6, '#d8c48a', 2);
      else if (h.relic === 'net') (c.lit.fillStyle = '#8a7a5a'), c.lit.fillRect(Math.round(bx - side * 5), Math.round(by - 13), 3, 3);
      else if (h.relic === 'lodestone') (c.lit.fillStyle = '#3a3440'), c.lit.fillRect(Math.round(bx - side * 5), Math.round(by - 14), 3, 3);
      const el = h.augments[h.relic];
      if (el) (c.glow.fillStyle = EL_COL[el]), c.glow.fillRect(Math.round(bx - side * 3), Math.round(by - 12), 1, 1);
    }
  };
  if (up) drawGear();
  const flash = h.act === 'hurt' && h.actT < 0.1 ? 0.85 : h.act === 'stun' ? 0.3 : 0;
  blit(c, up ? look.up : look.down, bx, by, flip, flash);
  // The Want shows in the eyes first: a glint in the dark, like theirs.
  if (!up && h.want >= WANT.eyes) {
    c.glow.globalAlpha = Math.min(1, h.want / 80) * (0.55 + 0.45 * Math.sin(c.now * 2));
    c.glow.fillStyle = '#ff4a3a';
    c.glow.fillRect(Math.round(bx - 2), Math.round(by - 13), 1, 1);
    c.glow.fillRect(Math.round(bx + 1), Math.round(by - 13), 1, 1);
    c.glow.globalAlpha = 1;
  }
  if (!up) drawGear();
  if (fresh && h.weapon !== 'sword') smear(c.glow, bx, by - 8, Math.atan2(h.fy, h.fx) - 0.7, Math.atan2(h.fy, h.fx) + 0.7, 7, 9, '#cfe8ff');
  if (h.act === 'charge') {
    const k = Math.min(1, (h.actT + CHARGE.start) / chargeFull(WEAPONS[h.weapon], h));
    for (let i = 0; i < 4; i++) {
      const t = c.now * 4 + i * 1.57, r = 9 - 3 * k;
      c.glow.fillStyle = k >= 1 ? '#ffffff' : '#ffd860';
      c.glow.fillRect(Math.round(bx + Math.cos(t) * r), Math.round(by - 8 + Math.sin(t) * r * 0.5), 1, 1);
    }
  }
  if (h.act === 'stun') stars(c, bx, by - 19);
  // Channelling: motes of the element to come spiralling in, faster and tighter as it finishes.
  if (h.act === 'channel') {
    const k = Math.min(1, h.actT / Math.max(0.01, h.actDur)), cur = h.augments.channel || 'fire';
    const next = cur === 'fire' ? 'frost' : cur === 'frost' ? 'storm' : 'fire';
    c.glow.fillStyle = EL_COL[next];
    for (let i = 0; i < 8; i++) {
      const a = c.now * (3 + 6 * k) + (i / 8) * Math.PI * 2, r = 14 - 9 * k;
      c.glow.fillRect(Math.round(bx + Math.cos(a) * r), Math.round(by - 9 + Math.sin(a) * r * 0.55), 1 + (i % 2), 1);
    }
  }
  aura(c, h, bx, by, t);
}

/** Blessed: gold motes rising. Rallied: a red pennant flicker overhead. */
function aura(c: Ctx, h: Hero, x: number, y: number, t: number): void {
  if (h.blessedUntil > t) {
    for (let i = 0; i < 4; i++) {
      const k = (c.now * 0.8 + i / 4) % 1;
      c.glow.globalAlpha = 1 - k;
      c.glow.fillStyle = i % 2 ? '#ffe9a8' : '#ffffff';
      c.glow.fillRect(Math.round(x - 5 + i * 3), Math.round(y - 4 - k * 18), 1, 1);
    }
    c.glow.globalAlpha = 1;
  }
  if (h.rallyUntil > t) {
    c.glow.fillStyle = Math.floor(c.now * 4) % 2 ? '#ff6a5a' : '#ffb0a0';
    c.glow.fillRect(Math.round(x - 1), Math.round(y - 21), 3, 1);
  }
  if (h.wardUntil > t) {
    // Warded: a shell of light, its dots thinning as it takes blows; it flickers before it fades.
    const share = Math.max(0.25, h.wardHp / WARD.hp), fading = h.wardUntil - t < 1 && Math.floor(c.now * 12) % 2;
    if (!fading) {
      c.glow.fillStyle = '#bfe8ff';
      const n = Math.round(28 * share);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + c.now * 0.8;
        c.glow.globalAlpha = 0.5 + 0.5 * Math.sin(a * 3 + c.now * 4);
        c.glow.fillRect(Math.round(x + Math.cos(a) * 9), Math.round(y - 8 + Math.sin(a) * 11), 1, 1);
      }
      c.glow.globalAlpha = 1;
    }
  }
}
