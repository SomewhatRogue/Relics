/**
 * THE LISTENER in the flat view (docs/design/deep-layer-bosses.md section 1; numbers shared/listentune.ts): a
 * huge goblin gone blind in the old caves. Hunched, cave-pale grey-green, arms down to its knees, ears like
 * torn sails that never stop turning, white eyes that still shine (the glow layer, no pupils), rags. Posed by
 * client/listenpose.ts from the room's clocks; sunk into the floor for a drop and burst up out of it for a rise
 * (nothing drawn while it is under). Drawing only.
 */
import type { Enemy } from '../sim/types';
import { line, shadow, type Ctx } from './draw';
import { LISTENER } from '../shared/listentune';
import { drawLie, ear, R } from './listenlie';
import { listenPose, PAL, type LPose } from './listenpose';
import { PX } from './world';

const HIT = { ...PAL, skin: '#e4f0d4', skinLo: '#bccab0', skinHi: '#ffffff', skinDk: '#9aa88a', belly: '#f4fbe8', rag: '#d8d0c0', ear: '#e8d0cc' };
/** The art is drawn for 1.6 goblins; LISTENER.size is how big it is now. */
const FLAT = 1.6;
/** A throwaway layer for the outline passes, so only the lit body is stamped. */
let nullGlow: CanvasRenderingContext2D | null = null;
const quiet = () => (nullGlow ??= document.createElement('canvas').getContext('2d')!);

export function drawListener(c: Ctx, e: Enemy, x: number, y: number, t: number): void {
  // Under the floor (a drop, or the wind-up of a rise): nothing of it is here.
  if (e.under || e.boss?.under) return;
  const s = LISTENER.size / FLAT, gs = [c.lit, c.glow];
  for (const g of gs) g.save(), g.translate(x, y), g.scale(s, s), g.translate(-x, -y);
  try {
    const p = listenPose(e, t, c.now);
    if (p.pit > 0 && e.act !== 'dead') pit(c, x, y, p.pit);
    // Sunk into the floor: only what is above the floor line shows.
    if (p.sink > 0) for (const g of gs) g.beginPath(), g.rect(x - 90, y - 140, 180, 140 + 1), g.clip();
    if (e.act !== 'dead' && p.lie === 'none') {
      const g = c.lit, cc = { ...c, glow: quiet() };
      g.shadowColor = '#0a0d08', g.shadowBlur = 0;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) (g.shadowOffsetX = dx), (g.shadowOffsetY = dy), body(cc, e, x, y, t, p, true);
      g.shadowColor = 'rgba(0,0,0,0)', g.shadowOffsetX = 0, g.shadowOffsetY = 0;
    }
    body(c, e, x, y, t, p, false);
  } finally {
    for (const g of gs) g.restore();
  }
}

/** The hole opening under it (or left round it): a dark mouth, a broken rim of chips. */
function pit(c: Ctx, x: number, y: number, k: number): void {
  const g = c.lit, rx = Math.round(15 * k), ry = Math.max(1, Math.round(6.5 * k));
  for (let dy = -ry; dy <= ry; dy++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry + 0.01))));
    g.fillStyle = Math.abs(dy) > ry - 1 ? '#34303c' : Math.abs(dy) > ry - 2 ? '#1c1a22' : '#08070b';
    g.fillRect(Math.round(x - w), Math.round(y + dy), w * 2 + 1, 1);
  }
  g.fillStyle = '#5a5668';
  for (let i = 0; i < 7; i++) g.fillRect(Math.round(x + Math.cos(i * 0.9 + 0.3) * (rx + 2)), Math.round(y + Math.sin(i * 0.9 + 0.3) * (ry + 2)), 2, 1);
}

function body(c: Ctx, e: Enemy, x: number, y: number, t: number, p: LPose, rim: boolean): void {
  const f = e.fx < -0.2 ? -1 : 1, g = c.lit, dead = e.act === 'dead', k = t - e.hitAt < 0.09 && !dead ? HIT : PAL;
  const X = Math.round(x + p.ox), Y = Math.round(y + p.oy);
  if (!rim) shadow(c, x, y, p.lie === 'none' ? 15 : 22);
  if (dead) g.globalAlpha = Math.max(0, 1 - e.actT / e.actDur);
  if (p.lie !== 'none') return drawLie(c, f, X, Y, p, k, dead), void (g.globalAlpha = 1);
  const cr = p.crouch, l = p.lean, hang = p.sink > 0 ? Math.round(p.sink * 34) : 0;
  const r = (dx: number, dy: number, w: number, h: number, col: string) => R(g, f, X, Y + hang, dx, dy, w, h, col);
  const u = (dx: number, dy: number, w: number, h: number, col: string) => R(g, f, X, Y + hang, dx + Math.round(l * 0.6), dy + cr, w, h, col);
  const gl = (dx: number, dy: number, col: string, w = 1, h = 1) => ((c.glow.fillStyle = col), c.glow.fillRect(f > 0 ? X + dx + Math.round(l * 0.6) : X - dx - Math.round(l * 0.6) - w, Y + hang + dy + cr, w, h));
  // The far arm, long, behind the body.
  arm(g, X + f * (-2 + l * 0.4), Y + hang - 21 + cr, X + f * p.far[0], Y + hang + p.far[1], k.skinLo, k.skinDk, f, 3);
  // Legs: short, bowed, big flat feet; a heavy step lifts one at a time.
  const hl = Math.max(3, 8 - cr);
  for (const [dx, s] of [[-6, p.step], [1, -p.step]] as [number, number][]) {
    const lift = p.moving && s > 0.3 ? 1 : 0, top = -hl - lift;
    r(dx, top, 5, hl, k.skinLo), r(dx - 1, top + 1, 2, hl - 2, k.skin), r(dx + 1, -2 - lift, 7, 2, k.skin), r(dx + 6, -2 - lift, 2, 1, k.bone), r(dx + 1, -1 - lift, 7, 1, k.skinDk);
  }
  if (p.dust && Math.floor(c.now * 14) % 2) for (let i = 0; i < 4; i++) (g.fillStyle = '#8a8494'), g.fillRect(X - f * (7 + i * 3), Y - 1 - (i % 3), 2, 1);
  // The rag at its waist, frayed at the hem.
  u(-7, -12, 14, 4, k.rag), u(-7, -12, 14, 1, k.ragHi), u(-6, -8, 2, 2, k.rag), u(-2, -8, 2, 3, k.ragLo), u(2, -8, 2, 2, k.rag), u(5, -9, 1, 2, k.ragLo);
  // The torso: a great pale belly under a bent back; the hump rises behind the head.
  u(-9, -22, 17, 11, k.skin), u(-9, -13, 17, 3, k.skinLo), u(-3, -19, 9, 7, k.belly), u(-1, -14, 5, 1, k.skin), u(-8, -22, 15, 1, k.skinHi);
  u(-12, -28, 11, 9, k.skinLo), u(-11, -29, 8, 2, k.skin), u(-10, -29, 4, 1, k.skinHi), u(-12, -22, 3, 6, k.skinDk);
  for (let i = 0; i < 4; i++) u(-11 + i * 2, -30 + (i % 2), 1, 1, k.skinDk);
  u(4, -19, 1, 5, k.skinDk), u(-5, -17, 3, 1, k.skinDk);
  // A rope of rag over the shoulder and across the chest.
  line(g, X + f * (5 + l * 0.6), Y + hang - 25 + cr, f > 0 ? 1.75 : Math.PI - 1.75, 0, 12, k.ragHi, 1);
  line(g, X + f * (5 + l * 0.6), Y + hang - 24 + cr, f > 0 ? 1.75 : Math.PI - 1.75, 0, 12, k.rag, 1);
  // The head: low and forward on the neck, a long jaw hung open a little, a nose like a root.
  const hd = 6 + p.head[0], ht = -29 + p.head[1] + (p.charge ? 3 : 0) + (p.roar ? -2 : 0);
  u(hd, ht, 10, 9, k.skin), u(hd, ht, 10, 1, k.skinHi), u(hd + 1, ht + 2, 8, 1, k.skinDk), u(hd - 1, ht + 3, 2, 6, k.skinLo);
  u(hd + 10, ht + 3, 3, 4, k.skinLo), u(hd + 11, ht + 3, 2, 1, k.skin), u(hd + 11, ht + 6, 1, 1, k.skinDk);
  const jo = p.open ? 4 : 1;
  u(hd + 1, ht + 8, 10, 2 + jo, k.skinLo), u(hd + 2, ht + 8 + jo - 1, 8, 1, k.skinDk);
  if (p.open) u(hd + 2, ht + 9, 8, jo, '#2a0f10'), u(hd + 4, ht + 10, 4, jo - 1, '#7a2a28');
  for (const tx of [2, 5, 8]) u(hd + tx, ht + 8 + jo - 1 - (tx === 5 ? 0 : 1), 1, 2, k.bone);
  // Sunken sockets, the eyes in them: white, no pupils.
  u(hd + 6, ht + 3, 4, 3, '#16181a'), u(hd + 1, ht + 3, 3, 3, '#16181a');
  if (!p.sink) {
    const pulse = 0.5 + 0.5 * Math.sin(c.now * 5 + e.id), a = 0.3 + 0.2 * p.flare + 0.1 * pulse;
    c.glow.globalAlpha = a, gl(hd + 5, ht + 2, k.eye, 6, 5), gl(hd, ht + 2, k.eye, 5, 5), c.glow.globalAlpha = 1;
    gl(hd + 7, ht + 4, k.eye, 2, 2), gl(hd + 2, ht + 4, k.eye, 2, 2);
    if (p.flare > 0.5) gl(hd + 8, ht + 4, '#ffffff', 1, 1), gl(hd + 3, ht + 4, '#ffffff', 1, 1);
  }
  // The ears: always turning (the near one swings forward and back, the far one the other way), flicking at a sound.
  const jit = p.flick ? (Math.floor(c.now * 24) % 2 ? 0.3 : -0.25) : 0;
  const ex = X + f * (hd + 3 + Math.round(l * 0.6)), ey = Y + hang + ht + 3 + cr;
  const flip = (a: number) => (f > 0 ? a : Math.PI - a);
  ear(g, ex - f * 2, ey, flip(-2.55 - p.ear * 0.18 + jit), 13, k, true);
  ear(g, ex + f * 1, ey + 1, flip(-1.15 + (p.ear * 0.3) + (p.charge ? 2.2 : 0) - jit), 15, k);
  // The near arm: to the hand, or swung through the sweep's arc.
  const sx = X + f * (6 + l * 0.7), sy = Y + hang - 21 + cr;
  if (p.sweep) sweepArm(c, e, f, sx, sy, X, Y + hang, p.sweep.a0, p.sweep.k, k);
  else arm(g, sx, sy, X + f * p.hand[0], Y + hang + p.hand[1], k.skin, k.skinLo, f, 4);
  if (p.lump) lump(g, X + f * ((p.hand[0] + p.far[0]) / 2), Y + hang + Math.min(p.hand[1], p.far[1]) - 4, k);
  if (p.stars) for (let i = 0; i < 4; i++) { const a = c.now * 5 + i * 1.57; c.glow.fillStyle = i % 2 ? '#fff1b0' : '#ffe070', c.glow.fillRect(Math.round(X + Math.cos(a) * 8), Math.round(Y - 40 + Math.sin(a) * 3), 1, 1); }
  g.globalAlpha = 1;
}

/** A long arm in two bends (shoulder, a dropped elbow, the hand), a fist of claws at the end. */
function arm(g: CanvasRenderingContext2D, sx: number, sy: number, hx: number, hy: number, col: string, lo: string, f: number, w: number): void {
  const mx = (sx + hx) / 2 + f * 2, my = (sy + hy) / 2 + 3;
  const a1 = Math.atan2(my - sy, mx - sx), a2 = Math.atan2(hy - my, hx - mx);
  line(g, sx, sy, a1, 0, Math.hypot(mx - sx, my - sy), col, w);
  line(g, mx, my, a2, 0, Math.hypot(hx - mx, hy - my), col, w - 1);
  line(g, sx, sy + 1, a1, 2, Math.hypot(mx - sx, my - sy) - 1, lo, 1);
  g.fillStyle = lo, g.fillRect(Math.round(hx) - 2, Math.round(hy) - 1, 4, 3);
  g.fillStyle = PAL.bone;
  for (const d of [-2, 0, 2]) g.fillRect(Math.round(hx + f * 2) + d * 0, Math.round(hy) + d, 2, 1);
}

/** The sweep: one long arm, straight out, round the arc the room judges (shared/listentune.ts `sweep`), a pale streak behind its claws. */
function sweepArm(c: Ctx, e: Enemy, f: number, sx: number, sy: number, X: number, Y: number, a0: number, k: number, pal: typeof PAL): void {
  const reach = (LISTENER.sweep.range! * PX) / (LISTENER.size / FLAT) - 4, base = Math.atan2(e.fy || 0, e.fx || f), arc = ((LISTENER.sweep.arc ?? 220) * Math.PI) / 180;
  const ang = base + a0 + arc * k, hx = X + Math.cos(ang) * reach, hy = Y - 7 + Math.sin(ang) * reach * 0.9;
  const g = c.lit;
  line(g, sx, sy, Math.atan2(hy - sy, hx - sx), 0, Math.hypot(hx - sx, hy - sy), pal.skin, 4);
  line(g, sx, sy + 1, Math.atan2(hy - sy, hx - sx), 2, Math.hypot(hx - sx, hy - sy) - 2, pal.skinLo, 1);
  g.fillStyle = pal.bone, g.fillRect(Math.round(hx) - 1, Math.round(hy) - 2, 3, 5);
  // The streak: where the claws have been, fading.
  const q = c.glow;
  for (let i = 0; i < 14; i++) {
    const kk = k - i * 0.03;
    if (kk < 0) break;
    const aa = base + a0 + arc * kk;
    q.globalAlpha = 0.7 * (1 - i / 14), q.fillStyle = i < 3 ? '#ffffff' : '#cfe0c8';
    q.fillRect(Math.round(X + Math.cos(aa) * reach), Math.round(Y - 7 + Math.sin(aa) * reach * 0.9), 2, 2);
  }
  q.globalAlpha = 1;
}

/** A lump of rock torn off the wall: grey, jagged, grit hanging off it. */
export function lump(g: CanvasRenderingContext2D, x: number, y: number, k: typeof PAL): void {
  const px = Math.round(x), py = Math.round(y), P = (dx: number, dy: number, w: number, h: number, col: string) => ((g.fillStyle = col), g.fillRect(px + dx, py + dy, w, h));
  P(-5, -3, 10, 8, k.rockLo), P(-4, -5, 8, 3, k.rock), P(-5, -2, 10, 6, k.rock), P(-3, -5, 4, 1, k.rockHi), P(-5, -2, 2, 3, k.rockHi), P(2, 1, 3, 3, k.rockLo), P(-1, 3, 3, 1, k.rockLo), P(0, 0, 1, 1, k.rockLo), P(-6, 1, 1, 2, k.rock);
}
