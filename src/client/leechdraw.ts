/**
 * THE LEECHMAN in the flat view (docs/design/deep-layer-bosses.md section 2; numbers shared/leechtune.ts): a big goblin of the
 * fen, sickly green, hunched, in black leather waders to the chest, mud to the knees, hung all over with leeches it lets
 * fasten on itself (they twitch and pulse), a coil of line and a hook at its hip. In the shallows the water line cuts across
 * its legs; on dry ground or drained mud its boots show. Posed by client/leechpose.ts from the room's clocks; the line, the
 * peat and the flung leeches are client/leechline.ts; lying down, crawling and dead are client/leechlie.ts. Drawing only.
 */
import type { Enemy } from '../sim/types';
import { LEECHMAN } from '../shared/leechtune';
import { line, shadow, type Ctx } from './draw';
import { leechLine } from './leechline';
import { crawlLeech, leechBits, lieLeech, mixHex, R } from './leechlie';
import { leechPose, PAL, type LeechPose } from './leechpose';
import { LEECH, wetAt } from './leechstate';

/** The art is drawn for 1.7 goblins; LEECHMAN.size is how big it is now. */
const FLAT = 1.7;
const HIT = { ...PAL, skin: '#e0f0c0', skinLo: '#b8cc98', skinHi: '#ffffff', skinDk: '#98ac78', wader: '#6a667a' };
let nullGlow: CanvasRenderingContext2D | null = null;
const quiet = () => (nullGlow ??= document.createElement('canvas').getContext('2d')!);

export function drawLeechman(c: Ctx, e: Enemy, x: number, y: number, t: number): void {
  const s = LEECHMAN.size / FLAT, gs = [c.lit, c.glow];
  for (const g of gs) g.save(), g.translate(x, y), g.scale(s, s), g.translate(-x, -y);
  try {
    const p = leechPose(e, t, c.now);
    if (e.act !== 'dead' && p.mode === 'stand') {
      const g = c.lit, cc = { ...c, glow: quiet() };
      g.shadowColor = '#080c06', g.shadowBlur = 0;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) (g.shadowOffsetX = dx), (g.shadowOffsetY = dy), body(cc, e, x, y, t, p, true, s);
      g.shadowColor = 'rgba(0,0,0,0)', g.shadowOffsetX = 0, g.shadowOffsetY = 0;
    }
    body(c, e, x, y, t, p, false, s);
  } finally {
    for (const g of gs) g.restore();
  }
}

function body(c: Ctx, e: Enemy, x: number, y: number, t: number, p: LeechPose, rim: boolean, s: number): void {
  const f = e.fx < -0.2 ? -1 : 1, g = c.lit, dead = e.act === 'dead', hit = t - e.hitAt < 0.09 && !dead, k = hit ? HIT : PAL;
  const X = Math.round(x + p.ox), Y = Math.round(y + p.oy), m = LEECH.map, lv = m ? wetAt(m, e.x, e.y) : 0;
  if (!rim && lv === 0 && p.mode === 'stand') shadow(c, x, y, 15);
  if (dead) g.globalAlpha = Math.max(0, 1 - e.actT / e.actDur);
  if (p.mode === 'crawl') return crawlLeech(c, e, f, X, Y, p, k, rim), void (g.globalAlpha = 1);
  if (p.mode === 'down' || p.mode === 'dead') return lieLeech(c, e, f, X, Y, p, k, lv, rim), void (g.globalAlpha = 1);
  // The water line across its legs: knee-high in the shallows, to the chest in the deep; mud to the knees on dry ground.
  const deep = lv === 2, wl = deep ? (p.mode === 'haulout' ? -14 : -23) : lv === 1 ? -7 : 9, wet = wl < 0;
  const out = p.mode === 'haulout', flail = p.mode === 'flounder' ? Math.sin(c.now * 17 + e.id) : 0;
  const cr = out ? 7 : p.crouch, l = out ? 9 : p.lean;
  const wt = (col: string) => mixHex(col, PAL.water, deep ? 0.88 : 0.5);
  const r = (dx: number, dy: number, w: number, h: number, col: string) => R(g, f, X, Y, dx, dy, w, h, col);
  const rw = (dx: number, dy: number, w: number, h: number, col: string) => {
    if (!wet || dy + h <= wl) return r(dx, dy, w, h, col);
    if (dy >= wl) return r(dx, dy, w, h, wt(col));
    r(dx, dy, w, wl - dy, col), r(dx, wl, w, dy + h - wl, wt(col));
  };
  const u = (dx: number, dy: number, w: number, h: number, col: string) => rw(dx + Math.round(l * 0.6), dy + cr, w, h, col);
  const gl = (dx: number, dy: number, col: string, w = 1, h = 1) => ((c.glow.fillStyle = col), c.glow.fillRect(f > 0 ? X + dx + Math.round(l * 0.6) : X - dx - Math.round(l * 0.6) - w, Y + dy + cr, w, h));
  const sx = X + f * (6 + l * 0.7), sy = Y - 33 + cr, fx0 = X + f * (-3 + l * 0.4);
  const hands = handsOf(e, p, f, X, Y, sx, sy, flail);
  // The far arm, behind the body.
  arm(g, fx0, sy, hands.far[0], hands.far[1], k.skinLo, k.skinDk, f, 3);
  // Legs: bowed, in black leather, boots caked in mud; a heavy wading step.
  for (const [dx, sg] of [[-7, p.step], [1, -p.step]] as [number, number][]) {
    const lift = p.moving && sg > 0.3 ? 2 : 0, hl = Math.max(7, 13 - Math.round(cr / 2)) + 0;
    rw(dx, -hl - lift, 6, hl, k.wader), rw(dx, -hl - lift, 1, hl, k.waderHi), rw(dx + 5, -hl - lift, 1, hl, k.waderLo);
    rw(dx - 1, -4 - lift, 8, 4, k.waderLo), rw(dx + 1, -4 - lift, 8, 2, k.wader), rw(dx + 1, -4 - lift, 7, 1, k.waderHi), rw(dx - 1, -1 - lift, 9, 1, '#0c0a10');
    if (!wet) r(dx - 1, -6 - lift, 8, 6, k.mud), r(dx, -7 - lift, 3, 1, k.mud), r(dx + 4, -7 - lift, 2, 1, k.mudLo), r(dx + 1, -3 - lift, 5, 1, k.mudLo), r(dx + 2, -5 - lift, 1, 1, '#7a6444');
  }
  // Wader bib and belly, a belt, the coil of line at its hip; skin above the leather, shoulders hunched high.
  u(-9, -31, 17, 20, k.wader), u(-9, -31, 2, 20, k.waderLo), u(7, -30, 1, 19, k.waderHi), u(-8, -31, 15, 1, k.waderHi), u(-5, -27, 2, 6, k.waderHi), u(2, -24, 1, 4, k.waderHi), u(-7, -13, 15, 2, k.waderLo), u(-3, -22, 4, 1, k.waderHi);
  u(-9, -17, 17, 2, k.strap), u(-9, -16, 17, 1, k.strapLo), u(0, -18, 2, 4, '#c8a050'), u(1, -17, 1, 2, k.strapLo);
  if (!p.cast && !p.whirl && !p.haul) coil(g, f, X, Y, Math.round(l * 0.6), cr, k);
  u(-9, -35, 17, 4, k.skin), u(-9, -35, 17, 1, k.skinHi), u(-9, -32, 17, 1, k.skinLo);
  u(-12, -39, 8, 6, k.skinLo), u(-11, -40, 6, 2, k.skin), u(-10, -40, 3, 1, k.skinHi), u(-12, -35, 2, 3, k.skinDk), u(-2, -38, 5, 4, k.skin);
  for (let i = 0; i < 3; i++) u(-11 + i * 2, -41 + (i % 2), 1, 1, k.skinDk);
  for (const sxx of [-3, 4]) u(sxx, -35, 2, 9, k.strap), u(sxx, -35, 1, 9, '#8a6e48');
  // The head: low and forward on the neck, a long jaw, a nose like a root, an ear swept back.
  const hd = 4 + p.head[0], ht = -40 + p.head[1] + (p.mode === 'flounder' ? -2 : 0);
  u(hd, ht, 10, 9, k.skin), u(hd, ht, 10, 1, k.skinHi), u(hd + 1, ht + 2, 9, 1, k.skinDk), u(hd - 1, ht + 3, 2, 6, k.skinLo);
  u(hd + 10, ht + 3, 3, 4, k.skinLo), u(hd + 11, ht + 3, 2, 1, k.skin), u(hd + 11, ht + 6, 1, 1, k.skinDk);
  const open = p.open || p.mode === 'flounder', jo = open ? 4 : 1;
  u(hd + 1, ht + 8, 10, 2 + jo, k.skinLo), u(hd + 2, ht + 8 + jo - 1, 8, 1, k.skinDk);
  if (open) u(hd + 2, ht + 9, 8, jo, '#2a0f10'), u(hd + 4, ht + 10, 4, jo - 1, '#7a2a28');
  for (const tx of [2, 5, 8]) u(hd + tx, ht + 8 + jo - 1 - (tx === 5 ? 0 : 1), 1, 2, k.bone);
  const ex = X + f * (hd - 1 + Math.round(l * 0.6)), ey = Y + ht + 4 + cr;
  line(g, ex, ey, f > 0 ? -2.75 : Math.PI + 2.75, 0, 11, k.skinLo, 3), line(g, ex, ey, f > 0 ? -2.75 : Math.PI + 2.75, 2, 9, k.skinDk, 1);
  u(hd + 6, ht + 3, 4, 3, '#14200a'), u(hd + 1, ht + 3, 3, 3, '#14200a');
  const pulse = 0.5 + 0.5 * Math.sin(c.now * 5 + e.id), a = 0.35 + 0.25 * p.flare + 0.1 * pulse;
  c.glow.globalAlpha = a, gl(hd + 5, ht + 2, k.eye, 6, 5), gl(hd, ht + 2, k.eye, 5, 5), c.glow.globalAlpha = 1;
  gl(hd + 7, ht + 4, k.eye, 2, 2), gl(hd + 2, ht + 4, k.eye, 2, 2);
  if (p.flare > 0.5) gl(hd + 8, ht + 4, '#ffffff', 1, 1), gl(hd + 3, ht + 4, '#ffffff', 1, 1);
  // The near arm, to the hand, or swung through its arc; then what is in it (the line, the peat, the leeches).
  if (!rim) leechLine(c, e, p, f, X, Y, hands.near, s);
  arm(g, sx, sy, hands.near[0], hands.near[1], k.skin, k.skinLo, f, 4);
  if (rim) return;
  leechBits(c, e, p, f, X, Y, cr, l, hands, wl, deep);
  if (p.stars) for (let i = 0; i < 4; i++) { const an = c.now * 5 + i * 1.57; c.glow.fillStyle = i % 2 ? '#fff1b0' : '#ffe070', c.glow.fillRect(Math.round(X + Math.cos(an) * 8), Math.round(Y - 48 + Math.sin(an) * 3), 1, 1); }
  g.globalAlpha = 1;
}

/** Where its hands are on screen this frame: from the pose, or round the arc of a swing. */
function handsOf(e: Enemy, p: LeechPose, f: number, X: number, Y: number, sx: number, sy: number, flail: number): { near: [number, number]; far: [number, number] } {
  let near: [number, number] = [X + f * p.hand[0], Y + p.hand[1]], far: [number, number] = [X + f * p.far[0], Y + p.far[1]];
  if (p.mode === 'flounder') (near = [X + f * (12 + flail * 3), Y - 44 + flail * 6]), (far = [X - f * (11 - flail * 3), Y - 44 - flail * 6]);
  else if (p.swing !== null) {
    // Wade-in blow: from over the shoulder round and down; punish: both fists from overhead down.
    const punish = e.boss?.cmove === 'punish', a0 = punish ? -1.75 : -2.5, a1 = punish ? 0.5 : 0.35, an = a0 + (a1 - a0) * p.swing, R0 = punish ? 20 : 23;
    near = [sx + f * Math.cos(an) * R0, sy + Math.sin(an) * R0 * 0.9];
    if (punish) far = [near[0] - f * 4, near[1] + 2];
  }
  return { near, far };
}

/** A long arm in two bends (shoulder, a dropped elbow, the hand), a bracer of leather, claws at the end. */
function arm(g: CanvasRenderingContext2D, sx: number, sy: number, hx: number, hy: number, col: string, lo: string, f: number, w: number): void {
  const mx = (sx + hx) / 2 + f * 1, my = (sy + hy) / 2 + 3;
  const a1 = Math.atan2(my - sy, mx - sx), a2 = Math.atan2(hy - my, hx - mx);
  line(g, sx, sy, a1, 0, Math.hypot(mx - sx, my - sy), col, w);
  line(g, mx, my, a2, 0, Math.hypot(hx - mx, hy - my), col, w - 1);
  line(g, sx, sy + 1, a1, 2, Math.hypot(mx - sx, my - sy) - 1, lo, 1);
  line(g, mx, my, a2, Math.hypot(hx - mx, hy - my) * 0.35, Math.hypot(hx - mx, hy - my) * 0.7, PAL.strap, w - 1);
  g.fillStyle = lo, g.fillRect(Math.round(hx) - 2, Math.round(hy) - 1, 4, 3);
  g.fillStyle = PAL.bone;
  for (const d of [-1, 1]) g.fillRect(Math.round(hx + f * 2), Math.round(hy) + d, 1, 1);
}

/** The coil of line on its hip, loops of cord, the hook hung from it. */
function coil(g: CanvasRenderingContext2D, f: number, X: number, Y: number, lean: number, cr: number, k: typeof PAL): void {
  const r = (dx: number, dy: number, w: number, h: number, col: string) => R(g, f, X, Y, dx + lean, dy + cr, w, h, col);
  r(4, -17, 8, 7, k.cordLo), r(5, -17, 6, 1, k.cord), r(4, -15, 8, 1, k.cord), r(5, -13, 6, 1, k.cord), r(6, -16, 4, 5, k.waderLo), r(7, -15, 2, 3, k.cordLo), r(10, -12, 1, 2, k.cord);
  r(10, -10, 1, 3, k.iron), r(9, -8, 1, 1, k.iron), r(8, -7, 2, 1, k.iron);
}
