/**
 * The Haulier in the flat view (docs/design/deep-bosses.md; numbers shared/haultune.ts): the biggest of the
 * ironhides, 1.6 times one, in plate off a smelt mill (riveted grey iron, rust) over sickly green skin that
 * shows at the joints, a smelter's cap with a stack on it, an ore pick, a chain at the belt. Posed by
 * client/haulpose.ts from the room's clocks; phase 2 it is bare, bigger and red-eyed, its plates lying where
 * it shed them. Drawing only.
 */
import type { Enemy } from '../sim/types';
import { ease, line, shadow, stars, type Ctx } from './draw';
import { currentMap } from '../shared/arena';
import { HAULIER } from '../shared/haultune';
import { drawChainRing, drawLying, drawPlates, R } from './haullie';
import { haulPose, PAL } from './haulpose';
import { PX } from './world';

/** Where each bare Haulier shed its plate (world pixels), kept from the first frame we saw it bare. */
const SHED = new Map<number, [number, number]>();
const HIT = { ...PAL, skin: '#d4f0a0', skinLo: '#a8c880', skinHi: '#ffffff', iron: '#d8d4cc', ironHi: '#ffffff', ironLo: '#a8a49c', rust: '#c8a888' };
/** The art is drawn for 1.6 ironhides; HAULIER.size is how big it is now. */
const FLAT = 1.6;
/** A throwaway layer for the outline passes, so only the lit body is stamped. */
let nullGlow: CanvasRenderingContext2D | null = null;
const quiet = () => (nullGlow ??= document.createElement('canvas').getContext('2d')!);

/** The Haulier: its outline (the body stamped dark a pixel each way), its body, then its chain ring and glows. */
export function drawHaulier(c: Ctx, e: Enemy, x: number, y: number, t: number): void {
  // In the air on a leap: carried toward where it'll land, lifted off its shadow (the room moves it as it lands).
  const L = leapOff(e);
  x += L.dx, y += L.dy;
  const s = HAULIER.size / FLAT, gs = [c.lit, c.glow];
  for (const g of gs) g.save(), g.translate(x, y), g.scale(s, s), g.translate(-x, -y);
  try {
    if (e.act !== 'dead') {
      const g = c.lit, cc = { ...c, glow: quiet() };
      g.shadowColor = '#0a0706', g.shadowBlur = 0;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) (g.shadowOffsetX = dx), (g.shadowOffsetY = dy), body(cc, e, x, y, t, true, L.up / s);
      g.shadowColor = 'rgba(0,0,0,0)', g.shadowOffsetX = 0, g.shadowOffsetY = 0;
    }
    body(c, e, x, y, t, false, L.up / s);
  } finally {
    for (const g of gs) g.restore();
  }
  const w = haulPose(e, t, c.now).whirl;
  if (w && e.attack && e.boss?.move === 'drag') drawChainRing(c, Math.round(x), Math.round(y), HAULIER.drag.radius! * PX, w);
  if (e.attack && e.boss?.move === 'crank') drawCrankChain(c, e, x, y, s);
}

/** The leap's flight now: how far along toward the landing (screen pixels) and how high; nothing when not in the air. */
function leapOff(e: Enemy): { dx: number; dy: number; up: number } {
  const a = e.attack;
  if (!a || e.boss?.move !== 'leap') return { dx: 0, dy: 0, up: 0 };
  const from = a.windup - HAULIER.air;
  if (a.t < from || a.t >= a.windup) return { dx: 0, dy: 0, up: 0 };
  const k = (a.t - from) / HAULIER.air, m = ease(k);
  return { dx: (a.cx - e.x) * PX * m, dy: (a.cy - e.y) * PX * m, up: Math.sin(Math.PI * k) * 34 };
}

/** The crank: its chain from its fists up to the winding gear's wheel, link by link, taut and jerking. */
function drawCrankChain(c: Ctx, e: Enemy, x: number, y: number, s: number): void {
  const gear = currentMap().gear;
  if (!gear) return;
  const p = haulPose(e, e.attack!.t, c.now), f = e.fx < -0.2 ? -1 : 1;
  const hx = x + f * (p.hand[0] + p.lean) * s, hy = y + (p.hand[1] + p.crouch) * s;
  const gx = x + (gear.x - e.x) * PX, gy = y + (gear.y - e.y) * PX - 34, d = Math.hypot(gx - hx, gy - hy), n = Math.floor(d / 3), g = c.lit;
  for (let i = 0; i <= n; i++) {
    const u = i / Math.max(1, n), jig = Math.sin(c.now * 30 + i) * (1 - u) * 1.2;
    g.fillStyle = i % 2 ? PAL.ironHi : PAL.iron;
    g.fillRect(Math.round(hx + (gx - hx) * u + jig), Math.round(hy + (gy - hy) * u), 2, 2);
  }
}

function body(c: Ctx, e: Enemy, x: number, y: number, t: number, rim: boolean, lift = 0): void {
  const b = e.boss!, bare = !!b.bare, mad = b.phase === 2, f = e.fx < -0.2 ? -1 : 1, g = c.lit, dead = e.act === 'dead';
  const p = haulPose(e, t, c.now), k = t - e.hitAt < 0.09 && !dead ? HIT : PAL;
  const X = Math.round(x + p.ox), Y = Math.round(y + p.oy - lift);
  if (bare && !SHED.has(e.id)) SHED.set(e.id, [e.x * PX, e.y * PX]);
  const shed = bare ? SHED.get(e.id) : undefined;
  if (!rim) shadow(c, x, y, p.lie === 'none' ? Math.max(7, 12 - Math.round(lift / 4)) : 16);
  if (shed && !rim) drawPlates(c, Math.round(x + shed[0] - e.x * PX), Math.round(y + shed[1] - e.y * PX));
  if (dead) g.globalAlpha = Math.max(0, 1 - e.actT / e.actDur);
  if (p.lie === 'down' || p.lie === 'sit') return drawLying(c, f, X, Y, p, k, bare, dead), void (g.globalAlpha = 1);
  const loose = !bare && mad && (b.roarUntil ?? -9) > t, off = e.cracked && !bare ? 1 : 0;
  const du = p.lie === 'knee' ? 6 : p.crouch, dl = p.lean + p.sway + (p.lie === 'knee' ? 2 : 0), up = p.arms === 'up';
  const r = (dx: number, dy: number, w: number, h: number, col: string) => R(g, f, X, Y, dx, dy, w, h, col);
  const u = (dx: number, dy: number, w: number, h: number, col: string) => R(g, f, X, Y, dx + dl, dy + du, w, h, col);
  const gl = (dx: number, dy: number, col: string, w = 1, h = 1) => ((c.glow.fillStyle = col), c.glow.fillRect(f > 0 ? X + dx + dl : X - dx - dl - w, Y + dy + du, w, h));
  // The far arm, hanging (or raised with the near one), and its pauldron.
  u(-12, up ? -27 : -19, 3, up ? 9 : 8, k.skin), u(-12, up ? -19 : -13, 3, 3, bare ? k.skinLo : k.iron);
  if (!up) u(-12, -11, 3, 3, k.skin);
  if (!bare) u(-13, -23 - (up ? 4 : 0), 7, 4, k.iron), u(-13, -23 - (up ? 4 : 0), 7, 1, k.ironHi), u(-12, -20 - (up ? 4 : 0), 1, 1, k.rivet);
  // The legs: skin at the knee, the greave, the boot. A heavy step lifts one at a time.
  const hl = Math.max(2, 7 - du);
  for (const [dx, s] of [[-6, p.step], [1, -p.step]] as [number, number][]) {
    const l = p.moving && s > 0.3 ? 1 : 0, top = -hl - l;
    r(dx, top, 5, hl, k.skin);
    if (hl > 3) bare ? (r(dx, top + 2, 5, 1, k.leather), r(dx, top + hl - 3, 5, 2, k.skinLo)) : (r(dx, top + 1, 5, hl - 3, k.iron), r(dx, top + 1, 1, hl - 3, k.ironHi), r(dx + 3, top + 2, 1, 1, k.rivet));
    r(dx - 1, -2 - l, 6, 2, k.ironLo), r(dx - 1, -2 - l, 6, 1, bare ? k.leather : k.rust);
  }
  if (p.moving && Math.abs(p.step) > 0.93) for (let i = 0; i < 3; i++) (g.fillStyle = '#8a8494'), g.fillRect(X - f * (4 + i * 3), Y - 1 - (i % 2), 2, 1);
  if (p.dig && Math.floor(c.now * 14) % 2) for (let i = 0; i < 4; i++) (g.fillStyle = '#8a8494'), g.fillRect(X + f * (6 + i * 2), Y - (i % 3), 1, 1);
  // The belt, with the tassets under it (a rag once the plate is gone) and the chain hung off it.
  if (bare) u(-7, -10, 14, 4, k.leather), u(-6, -6, 3, 2, k.leather), u(1, -6, 3, 2, k.leather);
  else u(-7, -10, 14, 4, k.iron), u(-7, -10, 14, 1, k.ironHi), u(-1, -9, 2, 3, k.ironLo), u(-6, -8, 2, 2, k.rust), u(4, -9, 1, 1, k.rivet);
  u(-8, -11, 16, 1, k.leather), u(-1, -11, 2, 1, '#b89a48');
  const sw = Math.round(Math.sin(c.now * 2.4 + e.id) + (p.moving ? p.step * 2 : 0));
  if (!p.whirl) for (let i = 0; i < 4; i++) u(-9 + (i > 1 ? sw : 0), -10 + i * 2, 2, 2, i % 2 ? k.ironHi : k.iron);
  // The torso: a riveted breastplate (split and askew once cracked), or a big green chest.
  if (bare) {
    u(-9, -20, 18, 9, k.skin), u(-9, -14, 18, 3, k.skinLo), u(-8, -19, 7, 3, k.skinHi), u(1, -19, 7, 3, k.skinHi), u(0, -15, 1, 4, k.skinLo), u(-5, -13, 10, 1, k.skinLo);
    for (let i = 0; i < 6; i++) u(-8 + i * 2, Math.round(-20 + i * 1.4), 2, 1, k.leather);
    u(3, -17, 1, 1, '#7a2a20'), u(5, -16, 1, 2, '#7a2a20'), u(-6, -12, 1, 1, '#7a2a20');
  } else if (!off) {
    u(-8, -20, 16, 9, k.iron), u(-7, -20, 14, 1, k.ironHi), u(-7, -19, 2, 6, k.ironHi), u(-8, -12, 16, 1, k.ironLo), u(0, -19, 1, 7, k.ironLo);
    u(2, -16, 3, 2, k.rust), u(-5, -14, 2, 3, k.rust), u(-6, -17, 1, 1, k.rivet), u(5, -17, 1, 1, k.rivet), u(-6, -13, 1, 1, k.rivet), u(5, -13, 1, 1, k.rivet);
    u(-9, -18, 1, 5, k.skin), u(8, -18, 1, 5, k.skin);
  } else {
    u(-9, -20, 8, 9, k.iron), u(1, -19, 8, 9, k.iron), u(-8, -20, 7, 1, k.ironHi), u(2, -19, 6, 1, k.ironHi), u(-1, -20, 2, 10, k.skinLo);
    u(-6, -13, 3, 2, k.rust), u(4, -15, 2, 2, k.rust), u(-5, -17, 1, 1, k.rivet), u(6, -16, 1, 1, k.rivet);
    const flare = t - (e.crackAt ?? -9) < 0.35, pu = 0.5 + 0.5 * Math.sin(c.now * 9), col = flare || pu > 0.5 ? '#fff6c0' : '#ffc020';
    c.glow.globalAlpha = 0.5 + 0.35 * pu;
    for (let i = 0; i < 9; i++) gl(-3, Math.round(-21 + i * 1.3), '#ffa010', 7);
    c.glow.globalAlpha = 1;
    for (let i = 0; i < 9; i++) gl(-1 + (i % 2), Math.round(-21 + i * 1.3), col, 3);
    if (Math.floor(c.now * 6) % 3 === 0) gl((Math.floor(c.now * 13) % 9) - 4, -22 - (Math.floor(c.now * 9) % 3), '#ffd27a');
  }
  if (bare && !dead) {
    // Bare, it sweats green heat: a wash over the chest and shoulders.
    const hot = 0.08 + 0.05 * Math.sin(c.now * 6);
    c.glow.globalAlpha = hot, gl(-10, -21, '#9aff50', 20, 11), gl(-13, -19, '#9aff50', 3, 6), c.glow.globalAlpha = 1;
  }
  // The head: a smelter's cap with its stack, a slit the eyes burn through, a jaw with tusks. Bare: brow, horns.
  const hd = 1 - p.headBack, ht = -27 - (p.headBack > 0 ? 1 : 0);
  u(hd - 4, ht, 8, 7, k.skin);
  if (bare) u(hd - 4, ht + 2, 8, 1, k.skinLo), u(hd - 3, ht - 1, 2, 1, k.skinHi), u(hd + 1, ht - 1, 2, 1, k.skinHi), u(hd - 6, ht + 2, 2, 2, k.skin), u(hd + 4, ht + 2, 2, 2, k.skin);
  else {
    u(hd - 4 + off, ht + off, 8, 4, k.iron), u(hd - 3 + off, ht + off, 4, 1, k.ironHi), u(hd - 4 + off, ht + 3 + off, 8, 1, k.ironLo), u(hd + 2 + off, ht + 1 + off, 1, 1, k.rivet), u(hd - 3 + off, ht + 2 + off, 1, 2, k.rust);
    u(hd - 1 + off, ht - 3 + off, 3, 3, k.iron), u(hd - 1 + off, ht - 3 + off, 1, 3, k.ironHi), u(hd - 2 + off, ht - 3 + off, 5, 1, k.ironLo);
  }
  u(hd + 1, ht + 6, 2, 2, '#d8d0b0'), u(hd - 3, ht + 6, 2, 2, '#d8d0b0');
  if (p.roar) u(hd - 2, ht + 4, 5, 3, '#2a0a0a'), u(hd - 1, ht + 5, 3, 1, '#c01810');
  const ec = p.reel && Math.floor(c.now * 10) % 2 ? '#6f8a30' : mad || bare ? PAL.eyeMad : PAL.eye;
  c.glow.globalAlpha = 0.35, gl(hd + 1, ht + 2, ec, 4, 3), gl(hd - 3, ht + 2, ec, 3, 3), c.glow.globalAlpha = 1;
  gl(hd + 2, ht + 3, ec, 2, 2), gl(hd - 2, ht + 3, ec, 2, 2);
  if (bare || mad) gl(hd + 2, ht + 4, '#ff3a10', 2), gl(hd - 2, ht + 4, '#ff3a10', 2), gl(hd + 3, ht + 3, '#ff9a60'), gl(hd - 2, ht + 3, '#ff9a60');
  // The smelter's stack smoulders: a hot mouth and a thread of ember rising.
  if (!bare && !dead) {
    const fl = Math.floor(c.now * 11 + e.id) % 3;
    gl(hd - 1 + off, ht - 4 + off, fl ? '#ff9a30' : '#ffe070', 3), gl(hd + off, ht - 5 + off - fl, '#ff6a20');
    if (fl === 0) gl(hd + off + ((Math.floor(c.now * 7) % 3) - 1), ht - 8 + off, '#ffc060');
  }
  if (p.roar) for (let i = 1; i <= 3; i++) gl(hd + 4 + i * 5, ht + 3 - i, 'rgba(255,150,90,' + (0.7 - i * 0.18) + ')', 1, 3 + i * 2);
  // The near arm, up to the hand on the pick; the pauldron over its shoulder.
  const sx = X + f * (8 + dl), sy = Y - 18 + du, hx = X + f * (p.hand[0] + dl), hy = Y + p.hand[1] + du, ang = Math.atan2(hy - sy, hx - sx), len = Math.hypot(hx - sx, hy - sy);
  line(g, sx, sy, ang, 0, len, k.skin, 3);
  if (!bare) line(g, sx, sy, ang, len * 0.5, len, k.iron, 3), line(g, sx, sy, ang, len * 0.5, len * 0.55, k.ironLo, 3);
  if (up) line(g, sx - f * 4, sy, Math.atan2(hy - sy, hx - sx + f * 3), 0, len, k.skin, 2);
  g.fillStyle = k.skinLo, g.fillRect(Math.round(hx) - 1, Math.round(hy) - 1, 3, 3);
  if (bare) u(4, -23, 7, 5, k.skinHi), u(4, -23, 7, 1, k.skin), u(5, -19, 5, 1, k.leather);
  else u(4 + off * 2, -24 + off * 3, 9, 5 - off, loose ? k.ironHi : k.iron), u(4 + off * 2, -24 + off * 3, 9, 1, k.ironHi), u(5 + off * 2, -21 + off * 3, 7, 1, k.ironLo), u(11 + off * 2, -22 + off * 3, 1, 1, k.rivet), u(6 + off * 2, -22 + off * 3, 2, 1, k.rust), u(8 + off * 2, -26, 2, 2, k.ironHi);
  // The pick: a long wooden haft and a double-pointed head.
  const pa = f > 0 ? p.pickA : Math.PI - p.pickA, tx = hx + Math.cos(pa) * 14, ty = hy + Math.sin(pa) * 14;
  line(g, hx, hy, pa, -4, 15, k.leather, 2), line(g, hx, hy, pa, -3, 14, PAL.wood, 1);
  const steel = k === HIT ? '#ffffff' : '#e4eef8', pn = pa + Math.PI / 2;
  line(g, tx, ty, pn, -8, 8, k.ironLo, 4), line(g, tx, ty, pn, -8, 8, '#a8b8c8', 2), line(g, tx, ty, pn, -7, 7, steel, 1);
  line(g, tx, ty, pn, -9, -7, steel, 1), line(g, tx, ty, pn, 7, 9, steel, 1);
  g.fillStyle = k.rust, g.fillRect(Math.round(tx) - 1, Math.round(ty) - 1, 3, 3);
  if (!dead) {
    // Its points catch the light; through a wind-up and the blow the head burns red along its length.
    const gc = c.glow, gn = p.glint, flick = 0.65 + 0.35 * Math.sin(c.now * 24);
    if (gn > 0) {
      gc.globalAlpha = (0.35 + 0.55 * gn) * flick;
      line(gc, tx, ty, pn, -9, 9, '#ff2a1a', 4), line(gc, tx, ty, pn, -8, 8, '#ff8060', 2);
      gc.globalAlpha = 1;
      for (const s of [-9, 9]) (gc.fillStyle = '#ffffff'), gc.fillRect(Math.round(tx + Math.cos(pn) * s) - 1, Math.round(ty + Math.sin(pn) * s) - 1, 2, 2);
      if (p.arms === 'up') line(gc, hx, hy, pa, 2, 14, '#ff6a40', 1);
    } else if (Math.floor(c.now * 1.4 + e.id) % 4 === 0) {
      for (const s of [-8, 8]) (gc.fillStyle = '#ffffff'), gc.fillRect(Math.round(tx + Math.cos(pn) * s), Math.round(ty + Math.sin(pn) * s), 1, 1);
    }
  }
  if (p.stuck) for (let i = 0; i < 5; i++) (g.fillStyle = i % 2 ? k.ironLo : '#8a8494'), g.fillRect(Math.round(tx) + (i - 2) * 3, Math.round(ty) + 4 - (i % 2) * 2, 2, 1);
  if (p.stars) stars(c, X + dl, Y - 33, 4, 8);
  g.globalAlpha = 1;
}
