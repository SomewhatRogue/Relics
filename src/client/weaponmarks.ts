/**
 * What a weapon's tier and element add on top of its colours, in hand (docs/design/gear-looks.md): green veins
 * creeping through cursed metal (PRE-WAR a couple, more each tier, glowing faintly on turning and hungry), and an
 * element's colour along the edge with a faint glow and a spark running up it now and then. Drawn along the
 * metal of each kit, at the angle and hand held.ts already worked out, so it swings with the blade.
 */
import { heldLook } from '../shared/gearlook';
import type { Tier } from '../shared/loot';
import { currentSwing } from '../sim/hero';
import type { Hero } from '../sim/types';
import type { Ctx } from './draw';
import { HS, hline } from './heroscale';
import type { Pose } from './held';
import { VEIN, VEIN_GLOW, elCol, glowingVeins } from './weaponlook';
import { NAMED, type Strokes } from './namedlooks';
import { WEAPONS } from '../shared/weapons';

/** Where each kit's metal runs along it from the hand (hero units, as held.ts draws them). */
const METAL: Partial<Record<Hero['weapon'], [number, number]>> = {
  sword: [3.6, 14.4], greatsword: [5, 20.4], spear: [13.2, 16.6], mace: [9.8, 14.6], daggers: [2.4, 6.6], rapier: [2.6, 14.6],
  spellblade: [2.4, 11.6], poisoner: [2.4, 8.6], censer: [2.4, 10.6], wand: [0.4, 5.6], staff: [-5, 11.6],
};
const VEINS: Record<Tier, number> = { plain: 0, fine: 0, forged: 0, tolmouth: 2, touched: 4, turning: 6, hungry: 8 };

/** Whether the kit in hand is its blade now (not the blowpipe up, the censer on its chain, or a Ranger's anything). */
function bladeOut(h: Hero): boolean {
  const s = h.act === 'attack' ? currentSwing(h) : null;
  if (h.weapon === 'poisoner') return !(h.act === 'charge' || (s && h.heavy));
  if (h.weapon === 'censer') return !(h.act === 'charge' || (s && s.burn));
  // (A Ranger's quick cut is the short sword, whatever bow they carry.)
  if (WEAPONS[h.weapon].cls === 'RANGER') return !(s && !s.shot);
  return true;
}

export function weaponMarks(c: Ctx, h: Hero, ox: number, oy: number, p: Pose): void {
  if (p.hide || !bladeOut(h)) return;
  const look = heldLook(h), named = look.named ? NAMED[look.named] : undefined;
  const nx = -Math.sin(p.a), ny = Math.cos(p.a);
  metal(c, h, look, !!named, ox, oy, p, nx, ny);
  // (Last, so the piece's own shape is never hidden under its veins.)
  if (named?.held) named.held(strokes(c, ox, oy, p.a));
}

/** Veins through cursed metal and an element along the edge, along the kit's metal. */
function metal(c: Ctx, h: Hero, look: ReturnType<typeof heldLook>, named: boolean, ox: number, oy: number, p: Pose, nx: number, ny: number): void {
  const span = METAL[h.weapon];
  if (!span) return;
  // (A named piece shows its shape first: fewer veins on it.)
  const n = named ? Math.min(3, VEINS[look.tier]) : VEINS[look.tier], el = elCol(look), [r0, r1] = span;
  if (!n && !el) return;
  for (let i = 0; i < n; i++) {
    const r = r0 + (r1 - r0) * ((i * 0.618 + 0.13) % 1), o = ((i % 3) - 1) * 0.6, x = ox + nx * o, y = oy + ny * o;
    hline(c.lit, x, y, p.a, r, r + 0.6, VEIN);
    hline(c.lit, x + nx * 0.6, y + ny * 0.6, p.a, r + 0.9, r + 1.2, VEIN);
    if (glowingVeins(look.tier)) {
      c.glow.globalAlpha = 0.25 + 0.3 * (0.5 + 0.5 * Math.sin(c.now * 2.2 + i * 1.7));
      hline(c.glow, x, y, p.a, r, r + 0.6, VEIN_GLOW);
      c.glow.globalAlpha = 1;
    }
  }
  if (el) {
    // The edge in the element's colour, breathing; a spark runs up it every couple of seconds.
    const ex = ox + nx * 0.7, ey = oy + ny * 0.7;
    c.glow.globalAlpha = 0.55 + 0.2 * Math.sin(c.now * 4);
    hline(c.glow, ex, ey, p.a, r0, r1, el);
    const t = (c.now * 0.55 + (h.x ?? 0) * 0.1) % 1;
    if (t < 0.35) {
      c.glow.globalAlpha = 1;
      c.glow.fillStyle = '#ffffff';
      const r = (r0 + (r1 - r0) * (t / 0.35)) * HS;
      c.glow.fillRect(Math.round(ex + Math.cos(p.a) * r), Math.round(ey + Math.sin(p.a) * r), 1, 1);
    }
    c.glow.globalAlpha = 1;
  }
}

/** A named piece's strokes, in the hand's frame (namedlooks.ts). */
function strokes(c: Ctx, ox: number, oy: number, a: number): Strokes {
  const ca = Math.cos(a), sa = Math.sin(a), at = (r: number, o: number): [number, number] => [ox + (ca * r - sa * o) * HS, oy + (sa * r + ca * o) * HS];
  return {
    now: c.now,
    along: (r0, r1, o, col, w) => hline(c.lit, ox - sa * o * HS, oy + ca * o * HS, a, r0, r1, col, w),
    across: (r, o0, o1, col, w) => hline(c.lit, ox + ca * r * HS, oy + sa * r * HS, a + Math.PI / 2, o0, o1, col, w),
    dot: (r, o, col, glow) => {
      const [x, y] = at(r, o).map(Math.round);
      c.lit.fillStyle = col;
      c.lit.fillRect(x, y, 1, 1);
      if (glow) (c.glow.globalAlpha = glow), (c.glow.fillStyle = col), c.glow.fillRect(x, y, 1, 1), (c.glow.globalAlpha = 1);
    },
  };
}
