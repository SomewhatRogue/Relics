/** What a hero holds and how: each weapon's pose through rest, charge and swing, then drawn in hand. */
import { CHARGE, RELEASE, WEAPONS } from '../shared/tuning';
import { chargeFull, currentSwing } from '../sim/hero';
import type { Hero } from '../sim/types';
import { ease, line, smear, type Ctx } from './draw';
import { EL_COL } from './palette';
import { PX } from './world';
import { bladeLength, censer, drawKit, kitPose } from './heldkits';

export interface Pose { a: number; ext: number; from?: number; thrust?: boolean; reach: number; pull: number }

// (A Ranger draws the bow on a hold, though their tap is the short sword.)
const ranged = (h: Hero) => !!WEAPONS[h.weapon].combo[0].shot || WEAPONS[h.weapon].cls === 'RANGER';

/** Where the weapon points now (and what it has swept through, for the smear). */
export function pose(h: Hero, now: number): Pose {
  const fa = Math.atan2(h.fy, h.fx), side = h.fx >= -0.2 ? 1 : -1;
  const rest: Partial<Record<Hero['weapon'], number>> = {
    sword: fa + side * 1.1, greatsword: -Math.PI / 2 - side * 0.7, spear: -Math.PI / 2 + side * 0.3, daggers: fa + side * 1.4,
    longbow: fa + side * 1.2, shortbow: fa + side * 1.1, crossbow: fa + side * 0.9, wand: fa + side * 1.1, staff: -Math.PI / 2 + side * 0.25,
    rod: fa + side * 1, mace: fa + side * 1.2,
  };
  const charge = Math.min(1, (h.actT + CHARGE.start) / chargeFull(WEAPONS[h.weapon], h));
  const kit = kitPose(h, now, fa, side, charge);
  if (kit) return kit;
  if (h.act === 'charge') {
    // Held past the flash, the draw starts to shake (and the shot weakens).
    const over = h.actT + CHARGE.start > chargeFull(WEAPONS[h.weapon], h) + RELEASE.overdraw ? Math.sin(now * 70) * 0.09 : 0;
    if (ranged(h)) return { a: (h.weapon === 'staff' ? -Math.PI / 2 + side * 0.25 : fa) + over, ext: 0, reach: 0, pull: charge };
    // The healer lifts the mace to call down a smite.
    if (h.weapon === 'mace') return { a: -Math.PI / 2 + side * 0.2, ext: 0, reach: 0, pull: charge };
    if (h.weapon === 'spear') return { a: fa, ext: -5 * charge, reach: 0, pull: 0 };
    // The Rogue draws a dagger back over the shoulder to throw it.
    if (h.weapon === 'daggers') return { a: -Math.PI / 2 - side * (0.5 + 0.9 * charge), ext: 0, reach: 0, pull: charge };
    return { a: fa - side * (1.5 + 0.7 * charge) + Math.sin(now * 40) * 0.03 * charge, ext: 0, reach: 0, pull: 0 };
  }
  if (h.act === 'attack') {
    const s = currentSwing(h), t = h.actT;
    if (s.shot === 'smite') return { a: t < s.windup ? -Math.PI / 2 : fa, ext: 0, reach: 0, pull: t < s.windup ? 1 : 0 };
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
  if (h.blocking) return { a: h.weapon === 'sword' ? rest.sword! : fa + side * (h.weapon === 'greatsword' ? Math.PI / 2 : 1.3), ext: 0, reach: 0, pull: 0 };
  return { a: rest[h.weapon] ?? fa, ext: 0, reach: 0, pull: 0 };
}

/** A bow (`r` is half its length), its belly toward the target; the string pulls back with an arrow on it. */
function bow(c: Ctx, x: number, y: number, a: number, pull: number, r = 6): void {
  const dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx, gx = x + dx * 3, gy = y + dy * 3;
  const at = (k: number): [number, number] => [gx + nx * k - dx * ((k * k) / (r * 2.4)), gy + ny * k - dy * ((k * k) / (r * 2.4))];
  c.lit.fillStyle = r > 5 ? '#8b6a3a' : '#6b4a2b';
  for (let k = -r; k <= r; k += 0.5) {
    const [px, py] = at(k);
    c.lit.fillRect(Math.round(px), Math.round(py), 1, 1);
  }
  const draw = r > 5 ? 5 : 3, [ax, ay] = at(-r), [bx, by] = at(r), nock: [number, number] = [gx - dx * (2.6 + draw * pull), gy - dy * (2.6 + draw * pull)];
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

/**
 * A caster's tip: while the spell gathers, light draws in to it from around (faster and brighter as it
 * fills, white at full); as it goes, a flash at the tip.
 */
function tip(c: Ctx, h: Hero, tx: number, ty: number, el: string): void {
  // A held spell, or a tapped one being cast (it takes a moment, rooted in place).
  const cast = h.act === 'attack' && !h.heavy && h.actT < currentSwing(h).windup;
  if (h.act === 'charge' || cast) {
    const k = cast ? Math.min(0.99, h.actT / currentSwing(h).windup) : Math.min(1, (h.actT + CHARGE.start) / chargeFull(WEAPONS[h.weapon], h));
    for (let i = 0; i < 6; i++) {
      const f = (c.now * (1.2 + k) + i / 6) % 1, a = i * 1.05 + c.now * 0.7, r = 2 + 9 * (1 - f);
      c.glow.globalAlpha = 0.3 + 0.7 * f;
      c.glow.fillStyle = k >= 1 || i % 3 === 0 ? '#ffffff' : el;
      c.glow.fillRect(Math.round(tx + Math.cos(a) * r), Math.round(ty + Math.sin(a) * r * 0.7), 1, 1);
    }
    c.glow.globalAlpha = 1;
    if (k >= 1) (c.glow.fillStyle = '#ffffff'), c.glow.fillRect(Math.round(tx) - 1, Math.round(ty), 3, 1), c.glow.fillRect(Math.round(tx), Math.round(ty) - 1, 1, 3);
  } else if (h.act === 'attack' && currentSwing(h).shot) {
    const s = currentSwing(h), age = h.actT - s.windup;
    if (age < 0 || age > 0.1) return;
    // The flash as it goes: a bright cross, bigger for a held spell.
    const r = h.heavy ? 3 : 2;
    c.glow.fillStyle = '#ffffff';
    c.glow.fillRect(Math.round(tx) - r, Math.round(ty), r * 2 + 1, 1);
    c.glow.fillRect(Math.round(tx), Math.round(ty) - r, 1, r * 2 + 1);
    c.glow.fillStyle = el;
    c.glow.fillRect(Math.round(tx) - 1, Math.round(ty) - 1, 3, 3);
  }
}

export function drawWeapon(c: Ctx, h: Hero, px: number, py: number, p: Pose): void {
  const g = c.lit, ox = px + Math.cos(p.a) * p.ext, oy = py + Math.sin(p.a) * p.ext;
  const side = h.fx >= -0.2 ? 1 : -1, el = EL_COL[h.augments[h.relic]];
  if (drawKit(c, h, px, py, ox, oy, p)) {
    // (The Rogue's and Cleric's other kits: heldkits.ts.)
  } else if (h.weapon === 'sword') {
    line(g, ox, oy, p.a, 2, 12, '#dfe6ec');
    line(g, ox, oy, p.a, 0, 2, '#d4a537');
    // The edge flashes as the blow goes out.
    if (h.act === 'attack' && h.actT >= currentSwing(h).windup && h.actT < currentSwing(h).windup + 0.08) line(c.glow, ox, oy, p.a, 4, 12, '#ffffff');
  } else if (h.weapon === 'greatsword') {
    line(g, ox, oy, p.a, -2, 2, '#5a3d22');
    line(g, ox + Math.cos(p.a) * 2.5, oy + Math.sin(p.a) * 2.5, p.a + Math.PI / 2, -2, 2, '#d4a537');
    line(g, ox, oy, p.a, 3, 17, '#b9c1c8', 2);
    line(g, ox, oy, p.a, 4, 17, '#eef2f5');
  } else if (h.weapon === 'spear') {
    line(g, ox, oy, p.a, -7, 13, '#8b6a3a');
    line(g, ox, oy, p.a, 13, 17, '#dfe6ec', 2);
  } else if (WEAPONS[h.weapon].cls === 'RANGER' && h.act === 'attack' && !currentSwing(h).shot) {
    // The Ranger's short sword, out for a quick cut.
    line(g, ox, oy, p.a, 2, 9, '#dfe6ec');
    line(g, ox, oy, p.a, 0, 2, '#8b6a3a');
    line(g, ox + Math.cos(p.a) * 2, oy + Math.sin(p.a) * 2, p.a + Math.PI / 2, -1, 1, '#9aa3ad');
  } else if (h.weapon === 'longbow') bow(c, ox, oy, p.a, p.pull, 7);
  else if (h.weapon === 'shortbow') bow(c, ox, oy, p.a, p.pull, 4);
  else if (h.weapon === 'crossbow') {
    // Stock along the aim, the prod across it; a bolt sits on it unless it's reloading.
    const loaded = !(h.act === 'attack' && h.actT > currentSwing(h).windup + 0.1);
    line(g, ox, oy, p.a, -3, 6, '#5a3d22', 2);
    line(g, ox + Math.cos(p.a) * 5, oy + Math.sin(p.a) * 5, p.a + Math.PI / 2, -4, 4, '#9aa3ad');
    if (loaded) line(g, ox, oy, p.a, 1, 8, '#cfd6dc');
  } else if (h.weapon === 'wand' || h.weapon === 'rod') {
    line(g, ox, oy, p.a, 0, h.weapon === 'wand' ? 6 : 9, h.weapon === 'wand' ? '#6b4a2b' : '#9aa3ad');
    const tl = h.weapon === 'wand' ? 7 : 10, tx = ox + Math.cos(p.a) * tl, ty = oy + Math.sin(p.a) * tl, r = Math.round(p.pull * 2);
    c.glow.fillStyle = el;
    c.glow.fillRect(Math.round(tx - r / 2), Math.round(ty - r / 2), r + 1, r + 1);
    tip(c, h, tx, ty, el);
  } else if (h.weapon === 'staff') {
    line(g, ox, oy, p.a, -6, 12, '#6b4a2b');
    const tx = ox + Math.cos(p.a) * 13, ty = oy + Math.sin(p.a) * 13, r = 1 + Math.round(p.pull * 3);
    c.glow.fillStyle = el;
    c.glow.globalAlpha = 0.7 + 0.3 * Math.sin(c.now * 9);
    c.glow.fillRect(Math.round(tx - r / 2), Math.round(ty - r / 2), r + 1, r + 1);
    c.glow.globalAlpha = 1;
    c.glow.fillStyle = '#ffffff';
    c.glow.fillRect(Math.round(tx), Math.round(ty), 1, 1);
    tip(c, h, tx, ty, el);
  } else if (h.weapon === 'mace') {
    if (p.pull > 0) {
      c.glow.globalAlpha = 0.3 + 0.6 * p.pull;
      line(c.glow, ox, oy, p.a, 7, 12, p.pull >= 1 ? '#ffffff' : '#ffe9a8', 3);
      c.glow.globalAlpha = 1;
    }
    line(g, ox, oy, p.a, 0, 8, '#5a3d22');
    line(g, ox, oy, p.a, 8, 11, '#9aa3ad', 3);
    line(g, ox + Math.cos(p.a) * 9.5, oy + Math.sin(p.a) * 9.5, p.a + Math.PI / 2, -2.5, 2.5, '#cfd6dc');
    // The censer in the off hand, a coal lit from the Last Lantern swinging in it.
    censer(c, px, py, side);
  } else {
    // Twin daggers: one in each hand, the off hand trailing the swing.
    const lx = ox - side * 6, ly = oy + 1, la = p.a - side * 0.6;
    for (const [x0, y0, a] of [[ox, oy, p.a], [lx, ly, la]] as const) {
      line(g, x0, y0, a, 0, 2, '#2a2420');
      line(g, x0, y0, a, 2, 7, '#e6ecf0');
    }
  }
  if (h.act === 'charge' && !ranged(h) && bladeLength(h.weapon)) {
    const k = Math.min(1, (h.actT + CHARGE.start) / chargeFull(WEAPONS[h.weapon], h)), len = bladeLength(h.weapon);
    c.glow.globalAlpha = 0.4 + 0.5 * k * (0.6 + 0.4 * Math.sin(c.now * 30));
    line(c.glow, ox, oy, p.a, len - 4 * k - 2, len, k >= 1 ? '#ffffff' : '#ffd860');
    c.glow.globalAlpha = 1;
  }
  if (p.from !== undefined) {
    // Frozen on contact (the hitstop): the trail burns white and fuller, the impact frame.
    const hold = h.hitstop > 0, col = hold ? '#ffffff' : h.counter ? '#ffa040' : h.heavy ? '#ffe9a8' : '#ffffff';
    if (p.thrust) {
      c.glow.globalAlpha = hold ? 1 : 0.7;
      line(c.glow, px, py, p.a, 10, p.reach, col, hold ? 2 : 1);
      c.glow.globalAlpha = 1;
    } else if (hold) {
      // The room judges the whole arc as the blow lands: the contact frame shows all of it.
      const fa = Math.atan2(h.fy, h.fx);
      smear(c.glow, px, py, p.from, 2 * fa - p.from, p.reach * 0.55, p.reach, col);
    } else smear(c.glow, px, py, p.from, p.a, p.reach * 0.5, p.reach * 0.95, col);
  }
}
