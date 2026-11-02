/** Drawing a hero: the class's body, the weapon in hand, the dodge, charge and stun. */
import { CHARGE, WARD, WEAPONS, WANT } from '../shared/tuning';
import { chargeFull } from '../sim/hero';
import { castElement } from '../sim/channel';
import type { Hero } from '../sim/types';
import { blit, line, ring, shadow, smear, spin, stars, type Ctx } from './draw';
import { armOffset, drawFigure, layout } from './figure';
import { heroCut, jointed } from './joints';
import { heroPose } from './heropose';
import { drawWeapon, pose } from './held';
import { EL_COL } from './palette';
import { drawText } from './pixfont';
import { PARTY } from '../shared/tuning';
import { LOOKS, SPRITES, heroLook } from './sprites';

const ARM: [number, number] = [0, 0];
const POISON_TINT = '#5ad02a';

/** Green drops running off a poisoned hero, one more a stack. */
function drip(c: Ctx, x: number, y: number, n: number): void {
  c.glow.fillStyle = '#8ae040';
  for (let i = 0; i < n + 1; i++) {
    const k = (c.now * 0.9 + i * 0.41) % 1;
    c.glow.globalAlpha = 0.9 * (1 - k);
    c.glow.fillRect(Math.round(x - 4 + ((i * 5) % 9)), Math.round(y - 12 + i * 2 + k * 9), 1, k > 0.5 ? 2 : 1);
  }
  c.glow.globalAlpha = 1;
}
/** How a class's look is cut into parts: hats make it taller; a robe hides the legs but for the feet. */
const cutOf = (cls: keyof typeof LOOKS, look = 0) => heroCut((LOOKS[cls][look] ?? LOOKS[cls][0]).tall ?? 0, cls === 'MAGE' || (cls === 'HEALER' && look === 1));

/** `t` is the room's time (blessings and rallies are kept in it). */
export function drawHero(c: Ctx, h: Hero, x: number, y: number, me: boolean | 'bare', t: number): void {
  const look = heroLook(WEAPONS[h.weapon].cls, h.look);
  if (h.act === 'down') {
    shadow(c, x, y, 6);
    spin(c, look.down, x, y - 4, Math.PI / 2, 0.85);
    // Alone: up in a moment. In a party: the seconds left to be picked up, and how far along it is.
    if (h.out || h.lying) return;
    // In a party: gold while your own get-up is still to come, red once it's spent (then it's out).
    const left = h.bleeding ? PARTY.bleed - h.actT : h.actDur - h.actT;
    drawText(c.glow, String(Math.max(0, Math.ceil(left))), Math.round(x - 1), Math.round(y - 18), h.bleeding && !h.selfUp ? '#ffd27a' : '#ff6a5a');
    if (h.pickT) ring(c, x, y, 8, '#f0e0b0', h.pickT / PARTY.pickUp, '#3a3428');
    return;
  }
  // Just come into the room: flickering, so everyone can see nothing lands on you yet.
  if (h.safeT && Math.floor(c.now * 14) % 3 === 0) return;
  const up = h.fy < -0.55 && Math.abs(h.fy) > Math.abs(h.fx) * 0.8;
  const flip = h.fx < -0.2;
  // The body's pose (heropose.ts), drawn part by part; walking it bobs a pixel, standing it keeps still.
  const pz = heroPose(h, t, c.now);
  let ox = pz.ox, oy = pz.oy, squash = 1;
  if (pz.phase === 'rest' && h.moving) oy = Math.floor(c.now * 8) % 2 ? -1 : 0;
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
  if (me === true) ring(c, x, y, 7, '#4a90e0');
  // Allies show their health at their feet, and their name (nothing at all on the pick screen).
  else if (me === false) {
    ring(c, x, y, 7, '#5ad07a', h.hp / 100, '#1a3a22');
    const name = (h.tag ?? h.id).toUpperCase();
    drawText(c.glow, name, Math.round(x - name.length * 2), Math.round(y + 6), '#9ad8a8');
  }
  if (h.act === 'roll' || h.act === 'zip' || h.act === 'bash') {
    const dx = h.act === 'zip' ? h.fx : h.rollDx, dy = h.act === 'zip' ? h.fy : h.rollDy;
    c.glow.globalAlpha = 0.25;
    const tumble = h.act === 'roll' && dk.kind === 'roll', n = h.act === 'roll' && dk.kind === 'dash' ? 5 : 3;
    for (let k = 1; k <= n; k++) c.glow.drawImage(look.down.white, Math.round(bx - 7 - dx * 5 * k), Math.round(by - (tumble ? 10 : 17) - dy * 5 * k), 14, tumble ? 11 : 18);
    c.glow.globalAlpha = 1;
    if (tumble) return blit(c, look.down, bx, by, flip, 0, squash);
  }
  // The body in parts (figure.ts); the weapon is in the weapon hand, wherever that arm has gone.
  const cls = WEAPONS[h.weapon].cls, body = jointed(up ? look.up : look.down, cutOf(cls, h.look));
  const L = layout(body, bx, by, flip, pz), [ax, ay] = armOffset(ARM), mid = Math.round(L.lean / 2), low = L.drop;
  const side = h.fx >= -0.2 ? 1 : -1, px = bx + side * 3 + ax, py = by - 8 + ay, p = pose(h, c.now);
  // The sword and shield's release: the shield flashes as the blow goes out (the blade too, held.ts).
  const snap = h.weapon === 'sword' && (pz.phase === 'release' || pz.phase === 'contact');
  const fresh = t - h.parryOpenAt < WEAPONS[h.weapon].parryWindow;
  const shieldAt: [number, number] = h.blocking || fresh ? [bx + mid + h.fx * 6, by - 7 + low + h.fy * 4] : [bx + mid - side * 4, by - 6 + low];
  const drawGear = () => {
    if (h.weapon === 'sword') blit(c, SPRITES.shield, shieldAt[0], shieldAt[1] + 4, false, fresh || snap ? 0.85 : 0);
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
  // Poisoned: a green cast over the body, pulsing, stronger with each stack (unless a hit's flash is on it).
  if (h.poison && !pz.flash) (pz.flash = 0.16 + 0.07 * h.poison + 0.06 * Math.sin(c.now * 5)), (pz.tint = POISON_TINT);
  drawFigure(c, body, bx, by, pz);
  if (h.poison) drip(c, bx, by, h.poison);
  // The Want shows in the eyes first: a glint in the dark, like theirs.
  if (!up && h.want >= WANT.eyes) {
    c.glow.globalAlpha = Math.min(1, h.want / 80) * (0.55 + 0.45 * Math.sin(c.now * 2));
    c.glow.fillStyle = '#ff4a3a';
    const ex = Math.round(bx + L.lean), ey = Math.round(by - 13 + L.drop);
    c.glow.fillRect(ex - 2, ey, 1, 1);
    c.glow.fillRect(ex + 1, ey, 1, 1);
    c.glow.globalAlpha = 1;
  }
  if (!up) drawGear();
  if (fresh && h.weapon !== 'sword') smear(c.glow, bx, by - 8, Math.atan2(h.fy, h.fx) - 0.7, Math.atan2(h.fy, h.fx) + 0.7, 7, 9, '#cfe8ff');
  // A blade's charge gathers at the hand (a caster's draws into the tip instead, held.ts).
  if (h.act === 'charge' && cls !== 'MAGE') {
    const k = Math.min(1, (h.actT + CHARGE.start) / chargeFull(WEAPONS[h.weapon], h));
    for (let i = 0; i < 4; i++) {
      const t = c.now * 4 + i * 1.57, r = 6 - 3 * k;
      c.glow.fillStyle = k >= 1 ? '#ffffff' : '#ffd860';
      c.glow.fillRect(Math.round(px + Math.cos(t) * r), Math.round(py + Math.sin(t) * r * 0.5), 1, 1);
    }
  }
  if (h.act === 'stun') stars(c, bx, by - 19);
  // Primed (just channelled): motes of the element circling slowly until the next spell goes.
  if (h.primed && WEAPONS[h.weapon].cls === 'MAGE') {
    c.glow.fillStyle = EL_COL[castElement(h)];
    for (let i = 0; i < 4; i++) {
      const a = c.now * 3 + (i / 4) * Math.PI * 2;
      c.glow.fillRect(Math.round(bx + Math.cos(a) * 8), Math.round(by - 9 + Math.sin(a) * 4), 1, 1);
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
