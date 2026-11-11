/**
 * The Haulier's other shapes (client/hauldraw.ts draws it standing): flat on its back, legs up, or sitting
 * up to rise (a cart hit it: sim/haulcarts.ts); the plates it shed lying on the floor (phase 2); the chain
 * whirling round it (the drag). Drawing only.
 */
import type { Ctx } from './draw';
import { line, stars } from './draw';
import { PAL, type HPose } from './haulpose';

/** A rect in the Haulier's own frame: `dx` forward (flipped by `f`), `dy` up from its feet. */
export function R(g: CanvasRenderingContext2D, f: number, X: number, Y: number, dx: number, dy: number, w: number, h: number, col: string): void {
  g.fillStyle = col;
  g.fillRect(f > 0 ? X + dx : X - dx - w, Y + dy, w, h);
}

type K = typeof PAL;

/** On its back (a cart took it), or sat up on one arm, dazed. */
export function drawLying(c: Ctx, f: number, X: number, Y: number, p: HPose, k: K, bare: boolean, dead: boolean): void {
  const g = c.lit, r = (dx: number, dy: number, w: number, h: number, col: string) => R(g, f, X, Y, dx, dy, w, h, col);
  const sit = p.lie === 'sit', thump = !dead && p.fallT < 0.25 ? Math.round((1 - p.fallT / 0.25) * 2) : 0;
  const px = (dx: number) => X + f * dx;
  if (sit) {
    // Hip behind, the back propped up on one arm, the legs out along the floor.
    line(g, px(-8), Y - 5, f > 0 ? -1.0 : Math.PI + 1.0, 0, 11, bare ? k.skin : k.iron, 9);
    if (!bare) line(g, px(-7), Y - 8, f > 0 ? -1.0 : Math.PI + 1.0, 2, 8, k.ironHi, 2);
    r(-11, -4, 18, 4, bare ? k.skinLo : k.iron), r(4, -4, 8, 4, k.ironLo);
    r(-3, -21, 8, 7, k.skin), r(-3, -21, 8, bare ? 1 : 4, bare ? k.skinHi : k.iron);
    r(-12, -9, 3, 9, k.skin), r(-14, -1, 4, 2, k.skin);
    c.glow.fillStyle = k.eyeMad, c.glow.fillRect(px(2), Y - 17, 1, 1);
    return;
  }
  // Head behind, the chest up, the knees drawn up and kicking.
  const kick = dead ? 0 : Math.sin(c.now * 11) * 0.18 * Math.min(1, (p.fallT + 0.2));
  r(-14, -8 + thump, 14, 8, bare ? k.skin : k.skinLo);
  if (bare) r(-14, -8 + thump, 14, 2, k.skinHi), r(-9, -3 + thump, 8, 1, k.skinLo);
  else r(-13, -8 + thump, 12, 6, k.iron), r(-13, -8 + thump, 12, 1, k.ironHi), r(-6, -7 + thump, 1, 5, k.ironLo), r(-11, -5 + thump, 2, 2, k.rust), r(-3, -6 + thump, 1, 1, k.rivet);
  r(-21, -8 + thump, 8, 7, k.skin);
  if (!bare) r(-21, -8 + thump, 8, 4, k.iron), r(-20, -8 + thump, 4, 1, k.ironHi);
  r(-1, -4 + thump, 4, 3, k.leather);
  for (const [hx, ang, w] of [[1, -1.25 + kick, 4], [-1, -1.05 - kick, 4]] as [number, number, number][]) {
    const a = f > 0 ? ang : Math.PI - ang;
    line(g, px(hx + 1), Y - 5 + thump, a, 0, 11, bare ? k.skin : k.skinLo, w);
    if (!bare) line(g, px(hx + 1) + Math.cos(a) * 5, Y - 5 + thump + Math.sin(a) * 5, a, 0, 5, k.iron, w);
    g.fillStyle = k.ironLo, g.fillRect(Math.round(px(hx + 1) + Math.cos(a) * 12 - 3), Math.round(Y - 5 + thump + Math.sin(a) * 12 - 1), 6, 3);
  }
  r(-12, -14, 3, 7, k.skin), r(-11, -16, 2, 3, k.skin);
  // The pick where it dropped it.
  line(g, px(-3), Y + 4, f > 0 ? 0 : Math.PI, 0, 15, PAL.wood, 2);
  r(10, 1, 3, 6, k.ironLo), r(10, 1, 1, 5, k.ironHi);
  c.glow.fillStyle = dead ? '#000000' : k.eyeMad;
  if (!dead) c.glow.fillRect(f > 0 ? X - 14 : X + 14 - 1, Y - 5 + thump, 1, 1);
  if (!dead) stars(c, px(-17), Y - 13, 3, 6);
}

/** Its plates lying where it shed them: a breastplate in two halves, the cap, pauldrons, greaves. */
export function drawPlates(c: Ctx, X: number, Y: number): void {
  const g = c.lit, r = (x: number, y: number, w: number, h: number, col: string) => ((g.fillStyle = col), g.fillRect(X + x, Y + y, w, h));
  r(-30, 8, 9, 5, PAL.iron), r(-30, 8, 9, 1, PAL.ironHi), r(-30, 12, 9, 1, PAL.ironLo), r(-27, 9, 2, 2, PAL.rust);
  r(-19, 11, 8, 5, PAL.iron), r(-19, 11, 8, 1, PAL.ironHi), r(-17, 14, 3, 1, PAL.rust), r(-14, 12, 1, 1, PAL.rivet);
  r(17, 12, 7, 4, PAL.iron), r(17, 12, 7, 1, PAL.ironHi), r(18, 14, 5, 2, PAL.ironLo), r(21, 8, 3, 4, PAL.iron), r(21, 8, 3, 1, PAL.ironHi);
  r(-6, 19, 6, 3, PAL.iron), r(-6, 19, 6, 1, PAL.ironHi), r(4, 17, 6, 3, PAL.iron), r(4, 17, 6, 1, PAL.ironHi), r(6, 19, 3, 1, PAL.rust);
  r(26, 17, 6, 2, PAL.iron), r(26, 17, 6, 1, PAL.ironHi);
  g.fillStyle = PAL.rivet;
  for (const [x, y] of [[-29, 10], [-21, 10], [-18, 13], [18, 13], [-2, 20], [8, 18]]) g.fillRect(X + x, Y + y, 1, 1);
}

/**
 * The chain whirled round it, on the glow layer so it shows over the floor: a ring of links `share` of the
 * way out to the drag's radius, a heavy head at its lead and a tail of links behind it, with sparks. Drawn
 * in world pixels about its feet (not in the body's scaled frame), so the ring is the telegraph's size.
 */
export function drawChainRing(c: Ctx, X: number, Y: number, rad: number, w: { r: number; sp: number }): void {
  const g = c.glow, R = Math.max(6, rad * w.r), n = Math.max(10, Math.round(R * 0.6)), lead = c.now * w.sp;
  g.save();
  for (let i = 0; i < n; i++) {
    const a = lead - (i / n) * Math.PI * 2 * 0.85, sn = Math.sin(a), x = Math.round(X + Math.cos(a) * R), y = Math.round(Y - 2 + sn * R * 0.9);
    const body = sn < 0 && Math.abs(x - X) < 10 && y > Y - 44;
    g.globalAlpha = (body ? 0.35 : 1) * (1 - (i / n) * 0.55);
    g.fillStyle = '#2a2420', g.fillRect(x - 2, y - 2, 6, 6);
    g.fillStyle = i % 2 ? '#f2eee4' : '#9aa8c0', g.fillRect(x - 1, y - 1, 4, 4);
    g.fillStyle = i % 2 ? '#9aa8c0' : '#f2eee4', g.fillRect(x, y, 2, 2);
    if (i % 3 === 0) (g.fillStyle = '#ffffff'), g.fillRect(x - 1, y - 1, 2, 2);
  }
  g.globalAlpha = 1;
  // The heavy head: a spiked ball, burning at the tip.
  const hx = Math.round(X + Math.cos(lead) * R), hy = Math.round(Y - 2 + Math.sin(lead) * R * 0.9);
  g.fillStyle = '#ff7a30', g.fillRect(hx - 3, hy - 3, 7, 7);
  g.fillStyle = '#ffe9a0', g.fillRect(hx - 2, hy - 2, 5, 5);
  g.fillStyle = '#ffffff', g.fillRect(hx - 1, hy - 1, 3, 3);
  g.fillStyle = '#ff9a40';
  for (const [dx, dy] of [[-5, 0], [5, 0], [0, -5], [0, 5]]) g.fillRect(hx + dx, hy + dy, 1, 1);
  // Sparks thrown off the head, outwards.
  if (w.sp > 8) for (let i = 0; i < 7; i++) {
    const a = lead - i * 0.11, d = R + 2 + ((c.now * 40 + i * 7) % 9), sx = Math.round(X + Math.cos(a) * d + Math.random() * 3), sy = Math.round(Y - 2 + Math.sin(a) * d * 0.9 + Math.random() * 3);
    g.fillStyle = i % 2 ? '#ffd27a' : '#ffffff', g.fillRect(sx, sy, 1, 1);
  }
  g.restore();
}
