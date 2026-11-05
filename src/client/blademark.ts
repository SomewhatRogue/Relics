/**
 * The spellblade's element and charge, shown (sim/spellblade.ts keeps the charge on the hero and the
 * element is the hero's, so a guest sees what the leader's room decided). In hand, the edge burns in the
 * element (embers, glitter, crackle) and glows up its length as the charge builds, white when full. Over
 * the hero, in both views: a ring that fills with the charge (a full blade's hold is free). Drawing only.
 */
import { WEAPONS } from '../shared/tuning';
import { castElement } from '../sim/channel';
import type { Hero } from '../sim/types';
import { line, type Ctx } from './draw';
import { EL_COL } from './palette';

/** The edge in hand along `a` from (ox, oy): motes of the element, and the charge up its length. */
export function bladeEdge(c: Ctx, h: Hero, ox: number, oy: number, a: number): void {
  const k = Math.min(1, h.bladeCharge ?? 0), g = c.glow, el = castElement(h), col = EL_COL[el];
  if (k > 0) {
    g.globalAlpha = 0.35 + 0.55 * k * (k >= 1 ? 0.7 + 0.3 * Math.sin(c.now * 8) : 1);
    line(g, ox, oy, a, 3, 3 + 9 * k, k >= 1 ? '#ffffff' : col);
  }
  // A few motes along the edge, in the element's way: embers rise, frost glitters, storm jumps.
  for (let i = 0; i < 3; i++) {
    const d = 4 + ((c.now * 9 + i * 3.1) % 8), lift = el === 'fire' ? ((c.now * 6 + i) % 1) * 3 : 0;
    const jit = el === 'storm' ? (Math.random() - 0.5) * 2 : 0;
    g.globalAlpha = 0.5 + 0.4 * Math.sin(c.now * 11 + i * 2);
    g.fillStyle = el === 'frost' && i === 1 ? '#ffffff' : col;
    g.fillRect(Math.round(ox + Math.cos(a) * d + jit), Math.round(oy + Math.sin(a) * d - lift + jit), 1, 1);
  }
  g.globalAlpha = 1;
}

/** Over the hero, (x, y) its feet on screen: the charge's ring. */
export function drawBladeMark(c: Ctx, h: Hero, x: number, y: number, _now: number): void {
  if (!WEAPONS[h.weapon].spellblade || h.act === 'down') return;
  const g = c.glow, top = Math.round(y - 25), k = Math.min(1, h.bladeCharge ?? 0);
  if (k <= 0) return;
  const pts = 12, lit = Math.round(k * pts);
  for (let i = 0; i < pts; i++) {
    const a = -Math.PI / 2 + (i / pts) * Math.PI * 2;
    g.fillStyle = i < lit ? (k >= 1 ? '#ffffff' : '#c9a8ff') : '#3a3048';
    g.fillRect(Math.round(x + Math.cos(a) * 4), Math.round(top + Math.sin(a) * 4), 1, 1);
  }
}
