/**
 * The Mage's quick cast in hand: while it gathers, a small sigil of the element turns at the focus and
 * motes come off it (fire embers rising, frost glitter, storm crackle); as it goes, a ring of light
 * opens there and sparks fly off along the aim. Smaller and shorter than a held spell's gathering, so
 * the heavy still reads bigger. Drawn from the hero's state (magetap.ts), into the glow layer: drawing only.
 */
import type { Augment } from '../shared/tuning';
import type { Hero } from '../sim/types';
import { currentSwing } from '../sim/hero';
import { ease, type Ctx } from './draw';
import type { Pose } from './held';
import { EL_COL } from './palette';
import { TAP_OUT, tapCast, tapEl } from './magetap';

const px = (g: CanvasRenderingContext2D, x: number, y: number, col: string, a = 1) => {
  g.globalAlpha = a;
  g.fillStyle = col;
  g.fillRect(Math.round(x), Math.round(y), 1, 1);
};

/** One mote off the focus, `i` of a few, `f` (0..1) through its little life, in the element's way. */
function mote(g: CanvasRenderingContext2D, el: Augment, x: number, y: number, i: number, f: number, now: number): void {
  const col = EL_COL[el], a = 1 - f;
  if (el === 'fire') return px(g, x + Math.sin(i * 2.3 + now * 7) * 2, y - 2 - f * 7, i % 2 ? '#ffd27a' : col, a);
  if (el === 'frost') return px(g, x + Math.cos(i * 2.1) * (3 + f * 3), y + Math.sin(i * 2.1) * (2 + f * 2), Math.floor(now * 20 + i) % 3 ? col : '#ffffff', a);
  if (el === 'storm') {
    // A tiny jag of lightning off the tip, re-jagged each frame.
    const b = i * 1.7 + now * 3, r = 2 + f * 4;
    px(g, x + Math.cos(b) * r, y + Math.sin(b) * r * 0.7, '#ffffff', a);
    return px(g, x + Math.cos(b + 0.4) * (r + 1.5) + (Math.random() - 0.5) * 2, y + Math.sin(b + 0.4) * (r + 1.5) * 0.7, col, a);
  }
  px(g, x + Math.cos(i * 2 + now * 4) * (2 + f * 4), y + Math.sin(i * 2 + now * 4) * (1.5 + f * 3), col, a);
}

/**
 * The flourish at the focus (tx, ty), the hand aiming along `a`. `sigil`: the turning ring as it
 * gathers (the wand's and staff's tip; a spellblade's cut is too quick for one and shows only motes).
 */
export function flourish(c: Ctx, h: Hero, tx: number, ty: number, a: number, sigil = true): void {
  const t = tapCast(h);
  if (!t) return;
  const g = c.glow, el = tapEl(h), col = EL_COL[el];
  if (t.wind) {
    const k = t.k, r = 2 + 3 * k, spin = c.now * 7;
    if (sigil) {
      // The sigil: eight points on a small ring, turning, with four ticks across it once it's half drawn.
      for (let i = 0; i < 8; i++) {
        const b = spin + (i / 8) * Math.PI * 2;
        px(g, tx + Math.cos(b) * r, ty + Math.sin(b) * r * 0.7, i % 2 ? col : '#ffffff', 0.35 + 0.65 * k);
      }
      if (k > 0.5) for (let i = 0; i < 4; i++) {
        const b = -spin * 0.6 + (i / 4) * Math.PI * 2;
        px(g, tx + Math.cos(b) * (r + 1.5), ty + Math.sin(b) * (r + 1.5) * 0.7, col, (k - 0.5) * 2);
      }
    }
    for (let i = 0; i < 3; i++) mote(g, el, tx, ty, i, (c.now * 2.5 + i / 3) % 1, c.now);
    px(g, tx, ty, '#ffffff', 0.5 + 0.5 * k);
    g.globalAlpha = 1;
    return;
  }
  // Let go: a ring opens at the focus, a bright point, and sparks thrown off along the aim.
  const q = t.age / TAP_OUT, r = 3 + 6 * q;
  for (let i = 0; i < 12; i++) {
    const b = (i / 12) * Math.PI * 2;
    px(g, tx + Math.cos(b) * r, ty + Math.sin(b) * r * 0.7, i % 3 ? col : '#ffffff', 1 - q);
  }
  if (q < 0.4) {
    g.globalAlpha = 1;
    g.fillStyle = '#ffffff';
    g.fillRect(Math.round(tx) - 1, Math.round(ty) - 1, 3, 3);
  }
  for (let i = 0; i < 6; i++) {
    const b = a + (i - 2.5) * 0.28, d = 3 + (14 + (i % 3) * 5) * q;
    px(g, tx + Math.cos(b) * d, ty + Math.sin(b) * d - (el === 'fire' ? q * 4 : 0), i % 2 ? '#ffffff' : col, 1 - q);
  }
  for (let i = 0; i < 3; i++) mote(g, el, tx, ty, i, q, c.now);
  g.globalAlpha = 1;
}

/** A Mage's quick cut, seen: the smear in the colour it is cast in (a white edge goes inside it). */
export function tapSmearCol(h: Hero): string | null {
  return h.act === 'attack' && !h.heavy && (h.weapon === 'staff' || h.weapon === 'spellblade') ? EL_COL[tapEl(h)] : null;
}

/**
 * The wand's quick cast, the wrist's flick: up and back (cocked) as the spark gathers, then out along
 * the aim a touch past it, and settling. Null for anything else (held.ts's shared poses).
 */
export function tapPose(h: Hero, fa: number, side: number): Pose | null {
  if (h.weapon !== 'wand' || h.act !== 'attack' || h.heavy) return null;
  const s = currentSwing(h), t = h.actT;
  if (t < s.windup) {
    const e = ease(t / s.windup);
    return { a: fa - side * 1.1 * e, ext: -2 * e, reach: 0, pull: t / s.windup };
  }
  const r = Math.min(1, (t - s.windup) / 0.12);
  return { a: fa + side * 0.35 * Math.sin(r * Math.PI), ext: 3 * (1 - r), reach: 0, pull: 0 };
}
