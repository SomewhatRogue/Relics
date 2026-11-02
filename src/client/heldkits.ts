/**
 * The Rogue's and Cleric's other kits in hand (held.ts has the rest): the rapier, the knife and hand
 * crossbow, the sword and censer, the flail. Their rest and charge poses, and how each is drawn. Swings,
 * thrusts and shots use held.ts's shared poses, so what sweeps on screen is the arc the room judges.
 */
import { WEAPONS } from '../shared/tuning';
import { currentSwing } from '../sim/hero';
import type { Hero } from '../sim/types';
import { line, type Ctx } from './draw';
import type { Pose } from './held';

const KITS = new Set<Hero['weapon']>(['rapier', 'handbow', 'censer', 'flail']);

/** How long a blade's charge glow runs along it (0: none; a flail or a censer glows its own way). */
export function bladeLength(w: Hero['weapon']): number {
  if (w === 'greatsword' || w === 'spear') return 17;
  if (w === 'daggers') return 7;
  if (w === 'rapier') return 14;
  return w === 'mace' || w === 'flail' || w === 'censer' || w === 'handbow' ? 0 : 12;
}

/** The censer swinging on its chain now (a held censer swing, or the whirl). */
const swingingCenser = (h: Hero) => h.weapon === 'censer' && (h.act === 'charge' || (h.act === 'attack' && !!currentSwing(h).burn));
/** The hand crossbow up and aimed (drawing, or the bolt just loosed). */
const aiming = (h: Hero) => h.weapon === 'handbow' && (h.act === 'charge' || (h.act === 'attack' && h.heavy));

/** Rest and charge for these kits (null: held.ts's shared poses, or not one of these). */
export function kitPose(h: Hero, now: number, fa: number, side: number, charge: number): Pose | null {
  if (!KITS.has(h.weapon) || h.act === 'attack' || h.blocking) return null;
  if (h.act === 'charge') {
    // The fencer coils back for the lunge; the crossbow comes up to the eye.
    if (h.weapon === 'rapier') return { a: fa, ext: -6 * charge, reach: 0, pull: charge };
    if (h.weapon === 'handbow') return { a: fa, ext: 0, reach: 0, pull: charge };
    // The censer whirls round the Cleric, faster as it fills; the flail spins overhead.
    if (h.weapon === 'censer') return { a: now * (8 + 10 * charge), ext: 0, reach: 0, pull: charge };
    return { a: now * (9 + 9 * charge), ext: 0, reach: 0, pull: charge };
  }
  const rest = { rapier: 1.2, handbow: 1.3, censer: 1.1, flail: 1.3 } as Record<string, number>;
  return { a: fa + side * rest[h.weapon], ext: 0, reach: 0, pull: 0 };
}

/** The censer at the off hand, a coal lit from the Last Lantern swinging in it (every Cleric carries one). */
export function censer(c: Ctx, px: number, py: number, side: number): void {
  const g = c.lit, cx = px - side * 9, cy = py + 3 + Math.round(Math.sin(c.now * 3)), sway = Math.sin(c.now * 3) * 2;
  line(g, px - side * 8, py - 1, Math.PI / 2 + sway * 0.1, 0, 3, '#6a6470');
  g.fillStyle = '#b08a3a';
  g.fillRect(Math.round(cx + sway - 1), Math.round(cy), 3, 2);
  c.glow.fillStyle = Math.floor(c.now * 6) % 2 ? '#ffd27a' : '#ff9a3c';
  c.glow.fillRect(Math.round(cx + sway), Math.round(cy - 1), 1, 1);
}

/** A censer on a chain swung along `a`, coals spilling from it (bigger as a whirl fills). */
function censerOnChain(c: Ctx, x: number, y: number, a: number, pull: number): void {
  for (let k = 1; k < 8; k += 2) line(c.lit, x, y, a, k, k + 1, '#6a6470');
  const tx = x + Math.cos(a) * 9, ty = y + Math.sin(a) * 9;
  c.lit.fillStyle = '#b08a3a';
  c.lit.fillRect(Math.round(tx) - 1, Math.round(ty) - 1, 3, 3);
  c.glow.fillStyle = '#ffd27a';
  c.glow.fillRect(Math.round(tx), Math.round(ty) - 1, 1, 1);
  // Coals thrown off behind the swing.
  for (let i = 1; i <= 3 + Math.round(pull * 3); i++) {
    const b = a - i * 0.22, r = 9 + ((i * 3) % 4) - 1;
    c.glow.fillStyle = i % 2 ? '#ff9a3c' : '#ffd27a';
    c.glow.globalAlpha = 1 - i * 0.14;
    c.glow.fillRect(Math.round(x + Math.cos(b) * r), Math.round(y + Math.sin(b) * r), 1, 1);
  }
  c.glow.globalAlpha = 1;
}

/** A small crossbow along `a`: stock, prod across, a bolt on it if loaded. */
function handbow(c: Ctx, x: number, y: number, a: number, loaded: boolean): void {
  line(c.lit, x, y, a, -2, 5, '#5a3d22');
  line(c.lit, x + Math.cos(a) * 4, y + Math.sin(a) * 4, a + Math.PI / 2, -3, 3, '#9aa3ad');
  if (loaded) line(c.lit, x, y, a, 1, 6, '#cfd6dc');
}

/** Draw one of these kits at the hand (ox, oy); false if it isn't one of them. */
export function drawKit(c: Ctx, h: Hero, px: number, py: number, ox: number, oy: number, p: Pose): boolean {
  if (!KITS.has(h.weapon)) return false;
  const g = c.lit, side = h.fx >= -0.2 ? 1 : -1, s = h.act === 'attack' ? currentSwing(h) : null;
  const out = !!s && h.actT >= s.windup && h.actT < s.windup + 0.08;
  if (h.weapon === 'rapier') {
    // A long thin blade and a swept gilt hilt.
    line(g, ox, oy, p.a, 0, 2, '#2a2420');
    line(g, ox + Math.cos(p.a) * 2, oy + Math.sin(p.a) * 2, p.a + Math.PI / 2, -1.5, 1.5, '#d4a537');
    line(g, ox, oy, p.a, 2, 15, '#e6ecf0');
    if (out) line(c.glow, ox, oy, p.a, 6, 15, '#ffffff');
  } else if (h.weapon === 'handbow') {
    if (aiming(h)) {
      handbow(c, ox, oy, p.a, !(s && h.actT > s.windup + 0.05));
      if (p.pull >= 1) (c.glow.fillStyle = '#ffffff'), c.glow.fillRect(Math.round(ox + Math.cos(p.a) * 7), Math.round(oy + Math.sin(p.a) * 7), 1, 1);
    } else {
      // The knife in hand; the crossbow hangs at the off hand.
      line(g, ox, oy, p.a, 0, 2, '#2a2420');
      line(g, ox, oy, p.a, 2, 7, '#e6ecf0');
      handbow(c, px - side * 7, py + 2, Math.PI / 2 - side * 0.5, true);
    }
  } else if (h.weapon === 'censer') {
    if (swingingCenser(h)) {
      censerOnChain(c, ox, oy, p.a, p.pull);
      // The sword held low in the off hand meanwhile.
      line(g, px - side * 7, py + 1, Math.PI / 2 + side * 0.3, 2, 9, '#dfe6ec');
    } else {
      line(g, ox, oy, p.a, 2, 11, '#dfe6ec');
      line(g, ox, oy, p.a, 0, 2, '#d4a537');
      if (out) line(c.glow, ox, oy, p.a, 4, 11, '#ffffff');
      censer(c, px, py, side);
    }
  } else {
    // The flail: a short haft, a chain, a spiked iron head. At rest it hangs; swung or spun it flies out.
    line(g, ox, oy, p.a, 0, 5, '#5a3d22');
    const hx = ox + Math.cos(p.a) * 5, hy = oy + Math.sin(p.a) * 5;
    const flying = h.act === 'attack' || h.act === 'charge', ca = flying ? p.a : Math.PI / 2 + Math.sin(c.now * 3) * 0.25;
    for (let k = 0; k < 5; k += 2) line(g, hx, hy, ca, k, k + 1, '#8a8490');
    const bx = Math.round(hx + Math.cos(ca) * 6), by = Math.round(hy + Math.sin(ca) * 6);
    g.fillStyle = '#5a5560';
    g.fillRect(bx - 1, by - 1, 3, 3);
    g.fillStyle = '#cfd6dc';
    g.fillRect(bx - 2, by, 1, 1), g.fillRect(bx + 2, by, 1, 1), g.fillRect(bx, by - 2, 1, 1);
    if (p.pull > 0) {
      // Holy light gathers in the head as the spin fills.
      c.glow.globalAlpha = 0.3 + 0.6 * p.pull;
      c.glow.fillStyle = p.pull >= 1 ? '#ffffff' : '#ffe9a8';
      c.glow.fillRect(bx - 1, by - 1, 3, 3);
      c.glow.globalAlpha = 1;
    }
    censer(c, px, py, side);
  }
  return true;
}

/** Whether this kit lights its holder (a caster's tip, a Cleric's censer coal). */
export const lightsHolder = (w: Hero['weapon']) => WEAPONS[w].cls === 'HEALER' || w === 'staff' || w === 'wand' || w === 'rod';
