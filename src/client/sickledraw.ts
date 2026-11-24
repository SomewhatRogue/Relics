/**
 * The chain sickle, drawn (Kyle, 2026-11-23: "change all of it, like a rope dart chain thing"; the rules in
 * sim/sickle.ts and sim/hook.ts, the weapon id still `rapier`). A short dark haft, a hooked steel blade off its
 * head, and a long iron chain from the butt that hangs in a loop to a small weight at rest, trails behind a cut,
 * runs out of the hand while the chain spins (the whirl itself is sicklespin.ts) or while the sickle is out on
 * it (the line and the head in flight: drawHook in relicsdraw.ts calls sickleHead). Light from the upper left:
 * the blade's back is the bright edge, its inner curve the dark one; clean dark outline on the haft.
 */
import type { Hero } from '../sim/types';
import type { Ctx } from './draw';
import { HS, hline as line } from './heroscale';
import type { Pose } from './held';

const HAFT = '#4a3220', WRAP = '#2a2420', STEEL = '#e6ecf0', EDGE = '#9aa3ad', LINK = ['#6a6470', '#9aa3ad'], WEIGHT = '#5a5560';

const px = (g: CanvasRenderingContext2D, x: number, y: number, col: string) => {
  g.fillStyle = col;
  g.fillRect(Math.round(x), Math.round(y), 1, 1);
};

/** The hooked blade off the haft's head at (x, y), the haft running along `a`; `bend` +1 or -1 picks the side it hooks to. */
function blade(c: Ctx, x: number, y: number, a: number, bend: number, flash: boolean): void {
  const dx = Math.cos(a), dy = Math.sin(a), nx = -dy * bend, ny = dx * bend;
  // Out from the head, then curving back toward the hand: five steps along the curve, the back bright, the inside dark.
  const pts: [number, number][] = [[0.5, 0], [1.5, 0.9], [2.5, 1.5], [3.6, 1.6], [4.6, 1.1], [5.4, 0.2], [5.8, -0.9], [5.7, -1.9]];
  for (let i = 0; i < pts.length; i++) {
    const [o, f] = pts[i], sx = x + (nx * o + dx * f) * HS, sy = y + (ny * o + dy * f) * HS;
    px(c.lit, sx, sy, STEEL);
    px(c.lit, sx - dx * HS * 0.8, sy - dy * HS * 0.8, EDGE);
    if (flash) px(c.glow, sx, sy, '#ffffff');
  }
  // A glint on the blade's back, unlit, so it reads in the dark as steel does.
  const [go, gf] = pts[3];
  px(c.glow, x + (nx * go + dx * gf) * HS, y + (ny * go + dy * gf) * HS, '#dfe8f2');
}

/** Links of chain from (x, y) along a sagging line to (tx, ty), `sag` pixels of droop at the middle. */
function chain(c: Ctx, x: number, y: number, tx: number, ty: number, sag: number): void {
  const d = Math.hypot(tx - x, ty - y), n = Math.max(2, Math.round(d / HS));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    px(c.lit, x + (tx - x) * t, y + (ty - y) * t + Math.sin(t * Math.PI) * sag, LINK[i & 1]);
  }
}

/** The little iron weight at the chain's end. */
function weight(c: Ctx, x: number, y: number): void {
  c.lit.fillStyle = WEIGHT;
  c.lit.fillRect(Math.round(x) - 1, Math.round(y), 2, 2);
  px(c.lit, x - 1, y, EDGE);
}

/** The sickle in hand at (ox, oy) along the pose; `out` the white of a cut landing. Body at (px, py). */
export function drawSickle(c: Ctx, h: Hero, px0: number, py0: number, ox: number, oy: number, p: Pose, out: boolean): void {
  const side = h.fx >= -0.2 ? 1 : -1, a = p.a, dx = Math.cos(a), dy = Math.sin(a);
  // Spinning, or the sickle out on its chain: only the chain runs out of the fist.
  // (Spinning, the whirl itself is sicklespin.ts's, out of this fist: nothing more here, so it's one chain and one blade.)
  if (h.act === 'charge') return;
  if (h.chainOut) {
    for (let k = 0; k < 3; k++) px(c.lit, ox + dx * k * HS, oy + dy * k * HS, LINK[k & 1]);
    // The slack of the chain looped over the other hand.
    chain(c, ox, oy, px0 - side * 6 * HS, py0 + 1 * HS, 2 * HS);
    return;
  }
  // The haft, its grip wrapped dark, and the blade off its head.
  line(c.lit, ox, oy, a, -1, 2, WRAP);
  line(c.lit, ox, oy, a, 2, 6, HAFT);
  const hx = ox + dx * 6 * HS, hy = oy + dy * 6 * HS;
  // The point leads the cut: it hooks the way the swing goes (held.ts swings alternate with the combo).
  const swing = (h.heavy ? 1 : h.combo % 2 ? -1 : 1) * side;
  blade(c, hx, hy, a, h.act === 'attack' ? swing : -side, out);
  // The chain from the butt: trailing behind a cut, else hanging in a loop to the weight by the hip, swaying.
  const bx = ox - dx * HS, by = oy - dy * HS;
  if (h.act === 'attack') {
    const tx = bx - dx * 6 * HS, ty = by - dy * 6 * HS + 2 * HS;
    chain(c, bx, by, tx, ty, HS), weight(c, tx, ty);
  } else {
    const sway = Math.sin(c.now * 2.6) * HS, tx = px0 - side * 2 * HS + sway, ty = py0 + 9 * HS;
    chain(c, bx, by, tx, ty, 2 * HS), weight(c, tx, ty);
  }
}

/** The sickle in flight at the end of its chain (relicsdraw.ts drawHook), flying along `a`. */
export function sickleHead(c: Ctx, x: number, y: number, a: number): void {
  line(c.lit, x, y, a + Math.PI, 0, 3, HAFT);
  blade(c, x, y, a + Math.PI, 1, false);
  px(c.glow, x, y, '#cfe8ff');
}
