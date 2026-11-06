/** Drawing a hero: the class's body, the weapon in hand, the dodge, charge and stun. */
import { CHARGE, NETTER, WARD, WEAPONS, WANT } from '../shared/tuning';
import { drawNetOn } from './foedraw';
import { drawHoistRope } from './wooddraw';
import { drawCrowsOn } from './beastdraw';
import { chargeFull } from '../sim/hero';
import { releaseWindow } from '../sim/knacks';
import { castElement } from '../sim/channel';
import type { Hero } from '../sim/types';
import { BARE, blit, line, ring, shadow, spin, stars, type Ctx } from './draw';
import { LAYOUT, armOffset, drawFigure, layout } from './figure';
import { heroCut, jointed } from './joints';
import { heroPose } from './heropose';
import { drawWeapon, pose } from './held';
import { EL_COL, heldEl } from './palette';
import { drawLoad } from './xbowmark';
import { drawBladeMark } from './blademark';
import { drawHolyGuard } from './holyguardmark';
import { drawHolyShield } from './holyshield';
import { drawText } from './pixfont';
import { PARTY } from '../shared/tuning';
import { SPRITES, heroLook, lookDef } from './sprites';
import type { Cls, LookDef } from './lookkit';
import { drawLife, idPhase } from './herolife';
import { dialLook, drawDialAura, drawDialEyes } from './heroeyes';
import { eyesAt, rim, topRow } from './herodial';
import { idlePose } from './idlepose';
import { idleProps } from './idledraw';

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
/** How a class's look is cut into parts: hats and hoods make it taller; a robe hides the legs but for the feet. */
const cutOf = (d: LookDef) => heroCut(d.tall, !!d.robe);
/** Breathing at rest: the body rises a pixel for part of a slow breath (Kyle, 2026-11-05: more life). */
const BREATH = { every: 3.4, up: 1.3, crouch: -0.07 };
/** Walking: a step every 1/8 s, a foot up a pixel and the body bobbing with it. */
const STEPS = [-1, 0, 1, 0];

/** `t` is the room's time (blessings and rallies are kept in it). */
/** A hero, and a netter's net over them while they're held in it (foedraw.ts). */
export function drawHero(c: Ctx, h: Hero, x: number, y: number, me: boolean | 'bare', t: number): void {
  // Hoisted by the ankle in Hangman's Wood (sim/snares.ts): off the ground on the rope, no net over them.
  if (h.hoisted && (h.netUntil ?? -9) > t) return void (drawHoistRope(c, h, x, y), heroBody(c, h, x, y - 10, me, t));
  heroBody(c, h, x, y, me, t);
  if ((h.netUntil ?? -9) > t) drawNetOn(c, x, y, Math.min(1, (h.netUntil! - t) / NETTER.hold));
  if ((h.crowsUntil ?? -9) > t) drawCrowsOn(c, x, y);
}

function heroBody(c: Ctx, h: Hero, x: number, y: number, me: boolean | 'bare', t: number): void {
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
  // The body's pose (heropose.ts), drawn part by part; walking it bobs a pixel, standing it keeps still.
  const pz = heroPose(h, t, c.now);
  // Stood still a while out of a fight: an idle of their class, or petting a hound (idlepose.ts).
  const idl = idlePose(h, pz, c.now);
  const up = idl?.up ?? (h.fy < -0.55 && Math.abs(h.fy) > Math.abs(h.fx) * 0.8);
  const flip = idl?.flip ?? h.fx < -0.2;
  // Looking the other way for a moment: the weapon's drawn as if they faced it (held.ts reads the facing).
  const hw = flip !== h.fx < -0.2 ? { ...h, fx: -h.fx } : h;
  let ox = pz.ox, oy = pz.oy, squash = 1;
  const ph = idPhase(h.id);
  if (pz.phase === 'rest' && h.moving) (pz.step = STEPS[Math.floor(c.now * 8 + ph * 4) % 4]), (oy = pz.step ? -1 : 0);
  else if (!idl && pz.phase === 'rest' && h.act === 'idle' && !h.blocking && ((c.now + ph * BREATH.every) % BREATH.every) < BREATH.up) pz.crouch = BREATH.crouch;
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
    // (On a 2.5D card the name goes over the head instead, three/overlay3d.ts.)
    const name = (h.tag ?? h.id).toUpperCase();
    if (!BARE.on) drawText(c.glow, name, Math.round(x - name.length * 2), Math.round(y + 6), '#9ad8a8');
  }
  // Knocked flat by the hound (the Ranger's rare idle): lying there laughing, the gear set down.
  if (idl?.lying) {
    spin(c, look.down, bx, by - 5 + (Math.floor(c.now * 7) % 2), (idl.lying * Math.PI) / 2);
    return idleProps(c, { x, y, bx, by, px: bx, py: by, side: flip ? -1 : 1, ey: 0, exl: 0, exr: 0, def: lookDef(WEAPONS[h.weapon].cls as Cls, h.look), p: { a: 0, ext: 0, reach: 0, pull: 0 }, el: '', now: c.now, o: idl, w: h.weapon });
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
  const cls = WEAPONS[h.weapon].cls as Cls, def = lookDef(cls, h.look), body = jointed(up ? look.up : look.down, cutOf(def));
  const L = layout(body, bx, by, flip, pz), [ax, ay] = armOffset(ARM), mid = Math.round(L.lean / 2), low = L.drop;
  const side = flip ? -1 : 1, px = bx + side * 3 + ax, py = by - 8 + ay, p = pose(hw, c.now);
  if (idl?.a != null) p.a = side > 0 ? idl.a : Math.PI - idl.a;
  if (idl?.ext != null) p.ext = idl.ext;
  if (idl?.hide) p.hide = true;
  // The sword and shield's release: the shield flashes as the blow goes out (the blade too, held.ts).
  const snap = h.weapon === 'sword' && (pz.phase === 'release' || pz.phase === 'contact');
  const shieldAt: [number, number] = idl?.shield ? [bx + idl.shield[0], by + idl.shield[1]] : h.blocking ? [bx + mid + h.fx * 6, by - 7 + low + h.fy * 4] : [bx + mid - side * 4, by - 6 + low];
  const drawGear = () => {
    if (h.weapon === 'sword') blit(c, SPRITES.shield, shieldAt[0], shieldAt[1] + 4, false, snap ? 0.85 : 0);
    drawWeapon(c, hw, px, py, p);
    if (h.act === 'throw' && h.actT < 0.2) {
      const a = Math.atan2(h.fy, h.fx) + Math.PI;
      if (h.relic === 'javelin') line(c.lit, bx - side * 2, by - 10, a, -4, 10, '#d8c48a');
      else if (h.relic === 'hook') line(c.lit, bx + side * 3, by - 9, a + 0.6, 0, 4, '#9aa3ad');
      else if (h.relic === 'horn') line(c.lit, bx + side * 2, by - 13, -Math.PI / 2 + side * 0.9, 0, 6, '#d8c48a', 2);
      else if (h.relic === 'net') (c.lit.fillStyle = '#8a7a5a'), c.lit.fillRect(Math.round(bx - side * 5), Math.round(by - 13), 3, 3);
      else if (h.relic === 'lodestone') (c.lit.fillStyle = '#3a3440'), c.lit.fillRect(Math.round(bx - side * 5), Math.round(by - 14), 3, 3);
      else if (h.relic === 'bomb') (c.lit.fillStyle = '#5a6a30'), c.lit.fillRect(Math.round(bx - side * 5), Math.round(by - 14), 3, 3);
      else if (h.relic === 'bell') (c.lit.fillStyle = '#e8dcc0'), c.lit.fillRect(Math.round(bx + side * 4), Math.round(by - 13), 2, 3);
      else if (h.relic === 'knuckle') (c.lit.fillStyle = '#e8dcc0'), c.lit.fillRect(Math.round(bx + side * 4), Math.round(by - 11), 3, 2);
      const el = h.augments[h.relic];
      if (el) (c.glow.fillStyle = EL_COL[el]), c.glow.fillRect(Math.round(bx - side * 3), Math.round(by - 12), 1, 1);
    }
  };
  // (Behind the body walking away, or rested back over the shoulder in an idle.)
  const behind = up || !!idl?.behind;
  if (behind) drawGear();
  // Poisoned: a green cast over the body, pulsing, stronger with each stack (unless a hit's flash is on it).
  if (h.poison && !pz.flash) (pz.flash = 0.16 + 0.07 * h.poison + 0.06 * Math.sin(c.now * 5)), (pz.tint = POISON_TINT);
  // The eye dial's light round the body (heroeyes.ts), cloth behind, the body, cloth over it (herolife.ts).
  const dl = dialLook(h.dial);
  drawLife(c, h, def, up, 'back', pz.flash, pz.tint, dl.side < 0 ? dl.a : 0);
  drawFigure(c, body, bx, by, pz);
  drawLife(c, h, def, up, 'front', pz.flash, pz.tint, dl.side < 0 ? dl.a : 0);
  rim(c, dl, body);
  if (h.poison) drip(c, bx, by, h.poison);
  const [ey, exl, exr] = eyesAt(def);
  if (!up) drawDialEyes(c, dl, exl, exr, ey, ph);
  drawDialAura(c, dl, bx, by, LAYOUT.top + 1 + topRow(def) + LAYOUT.drop, ph);
  // The Want shows in the eyes first: a glint in the dark, like theirs.
  if (!up && h.want >= WANT.eyes) {
    c.glow.globalAlpha = Math.min(1, h.want / 80) * (0.55 + 0.45 * Math.sin(c.now * 2));
    c.glow.fillStyle = '#ff4a3a';
    c.glow.fillRect(exl, ey, 1, 1);
    c.glow.fillRect(exr, ey, 1, 1);
    c.glow.globalAlpha = 1;
  }
  if (!behind) drawGear();
  if (idl) idleProps(c, { x, y, bx, by, px, py, side, ey, exl, exr, def, p, el: EL_COL[heldEl(h)], now: c.now, o: idl, w: h.weapon });
  // A blade's charge gathers at the hand (a caster's draws into the tip instead, held.ts).
  if (h.act === 'charge' && cls !== 'MAGE' && !h.winding) {
    const held = h.actT + CHARGE.start, full = chargeFull(WEAPONS[h.weapon], h), k = Math.min(1, held / full);
    // A draw's white is its clean-release window, the one the room judges (sim/knacks.ts); a blade stays white once full.
    // (A crossbow's perfect is its glint, not the flash: aiming, it stays gold; winding, it shows nothing here.)
    // (Every Cleric hold is judged on its window too, so its white goes when the window does.)
    const hv = WEAPONS[h.weapon].heavy, white = k >= 1 && (!(hv.shot || hv.holy) || held <= full + releaseWindow(h)) && !WEAPONS[h.weapon].reloads;
    for (let i = 0; i < 4; i++) {
      const t = c.now * 4 + i * 1.57, r = 6 - 3 * k;
      c.glow.fillStyle = white ? '#ffffff' : '#ffd860';
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
  drawLoad(c, h, bx, by);
  drawBladeMark(c, h, bx, by, t);
  drawHolyGuard(c, h, bx, by);
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
  drawHolyShield(c, h, x, y, t);
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
