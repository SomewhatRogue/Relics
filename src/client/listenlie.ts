/**
 * THE LISTENER's other shapes (client/listendraw.ts draws it standing): flat on its back, dazed, a column
 * across it, or sat up on one arm and shaking its head; its dead. Drawing only.
 */
import { line, stars, type Ctx } from './draw';
import { PAL, type LPose } from './listenpose';

type K = typeof PAL;

/** A rect in its own frame: `dx` forward (flipped by `f`), `dy` up from its feet. */
export function R(g: CanvasRenderingContext2D, f: number, X: number, Y: number, dx: number, dy: number, w: number, h: number, col: string): void {
  g.fillStyle = col;
  g.fillRect(f > 0 ? X + dx : X - dx - w, Y + dy, w, h);
}

/** Its ears, long and ragged, lying or listening: from the head (hx, hy) at screen angle `a` (already flipped for facing). */
export function ear(g: CanvasRenderingContext2D, hx: number, hy: number, a: number, len: number, k: K, far = false): void {
  line(g, hx, hy, a, 0, len, far ? k.earLo : k.ear, 3);
  line(g, hx, hy, a, 1, len * 0.7, far ? k.skinDk : k.earLo, 1);
  line(g, hx, hy, a + 0.12, len * 0.5, len + 1, far ? k.earLo : k.skinLo, 1);
  // The tear and the nick in its rim.
  g.fillStyle = k.skinDk;
  g.fillRect(Math.round(hx + Math.cos(a - 0.3) * len * 0.62), Math.round(hy + Math.sin(a - 0.3) * len * 0.62), 1, 1);
}

/** On its back (a column fell on it), or sat up on one arm, dazed. */
export function drawLie(c: Ctx, f: number, X: number, Y: number, p: LPose, k: K, dead: boolean): void {
  const g = c.lit, sit = p.lie === 'sit', r = (dx: number, dy: number, w: number, h: number, col: string) => R(g, f, X, Y, dx, dy, w, h, col);
  const wob = sit ? Math.round(Math.sin(c.now * 4)) : 0;
  if (!sit) {
    // Flat on its back, the knees up: the long pale belly, the big hump under it.
    r(-24, -7, 7, 6, k.skin), r(-22, -12, 5, 6, k.skinLo), r(-17, -2, 5, 2, k.skinDk), r(-26, -2, 6, 2, k.skinDk);
    r(-15, -10, 20, 10, k.skin), r(-15, -2, 20, 2, k.skinLo), r(-13, -9, 14, 5, k.belly), r(-14, -10, 18, 1, k.skinHi);
    r(-12, -6, 6, 2, k.rag), r(-12, -4, 4, 2, k.ragLo), r(-3, -7, 5, 1, k.skinLo);
    r(4, -10, 10, 9, k.skin), r(4, -3, 10, 2, k.skinLo), r(4, -10, 10, 1, k.skinHi), r(12, -6, 3, 3, k.skinLo), r(6, -2, 8, 2, k.skinDk);
    r(8, -7, 4, 3, '#1c1a20'), r(9, -6, 2, 1, k.bone);
    // One arm flung up and over, the other trailing, claws open.
    line(g, X + f * 2, Y - 9, f > 0 ? -1.15 : Math.PI + 1.15, 0, 12, k.skin, 3);
    line(g, X + f * 2, Y - 3, f > 0 ? 0.35 : Math.PI - 0.35, 0, 15, k.skinLo, 3);
    r(11, -22, 1, 2, k.bone), r(13, -21, 1, 2, k.bone);
  } else {
    // Sat up, one hand on the floor, the head hung.
    r(-20, -3, 11, 3, k.skinDk), r(-16, -9, 10, 7, k.skin), r(-15, -3, 10, 2, k.skinLo);
    r(-12, -22 + wob, 14, 14, k.skin), r(-12, -10 + wob, 14, 2, k.skinLo), r(-10, -20 + wob, 9, 4, k.skinHi), r(-6, -15 + wob, 7, 4, k.belly);
    r(-4, -14 + wob, 7, 3, k.rag), r(-14, -26 + wob, 8, 8, k.skinLo);
    r(2, -19 + wob, 9, 8, k.skin), r(3, -12 + wob, 8, 3, k.skinLo), r(2, -19 + wob, 9, 1, k.skinHi), r(6, -9 + wob, 3, 1, k.bone);
    line(g, X + f * 2, Y - 14 + wob, f > 0 ? 1.1 : Math.PI - 1.1, 0, 13, k.skin, 3);
    line(g, X - f * 6, Y - 14 + wob, f > 0 ? 2.2 : Math.PI - 2.2, 0, 11, k.skinLo, 3);
  }
  // The ears flopped either side of the head.
  const hx = X + f * (sit ? 4 : 8), hy = Y + (sit ? -17 + wob : -7);
  ear(g, hx - f * 2, hy, f > 0 ? 2.7 : Math.PI - 2.7, 11, k, true);
  ear(g, hx + f * 2, hy + 1, f > 0 ? 0.5 : Math.PI - 0.5, 11, k);
  // The eyes: still shining, but swimming, one wider than the other.
  if (!dead) {
    const ex = (dx: number, dy: number, w: number, a: number) => ((c.glow.globalAlpha = a), (c.glow.fillStyle = k.eye), c.glow.fillRect(f > 0 ? X + dx : X - dx - w, Y + dy, w, 2));
    const sw = Math.floor(c.now * 3) % 2;
    if (sit) ex(7 + sw, -16 + wob, 2, 0.8), ex(4, -16 + wob, 2, 0.45);
    else ex(10, -8, 2, 0.8 - 0.3 * sw), ex(7 + sw, -8, 2, 0.4);
    c.glow.globalAlpha = 1;
  }
  if (p.stars) stars(c, X + f * (sit ? 4 : 8), Y - (sit ? 29 : 17), 4, 8);
}
