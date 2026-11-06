/**
 * The upright view's goblins, facing you, painted from their zones (sim/deepzones.ts) at their distance:
 * every pixel whose middle falls in a zone, the same test the arrow's crossing is, so what you see is
 * what's judged. Far off they're a few pixels and a glowing eye; near, legs, rags, a big green head,
 * whatever they carry, and the arrows stuck in them. Fog and distance dim them; at the wall they sink
 * behind the parapet.
 */
import { DEEP_SHAPES, DEEP } from '../shared/deeptune';
import type { Box, Disc } from '../shared/watchtune';
import { deepAt } from '../sim/deepzones';
import { deepFogAt } from '../sim/watchnight';
import type { Gob, WatchState } from '../sim/watchtypes';
import { EYE as EYE_COL, flame } from './watchgobs';
import { proj, type Lens } from './deepview';

const SKIN = '#6b7b32', SKIN_DARK = '#4e5c24', LEG = '#3a4a1f', RAG = '#4a3a2a', RAG_DARK = '#3a2c20', TOOTH = '#e8e0c8';
const IRON = '#7a7884', IRON_LIT = '#a4a2ae', WOOD = '#7a5230', WOOD_DARK = '#4a3420', SHIELD = '#9a6c3a', FLETCH = '#e8e0d0', SHAFT = '#d8c48a';
type G2 = CanvasRenderingContext2D;

/** Fill every pixel whose middle is inside the box (feet at fx, fy; sc pixels a metre; y up). */
function box(g: G2, fx: number, fy: number, sc: number, b: Box, col: string): number {
  const x0 = Math.ceil(fx + b.x0 * sc - 0.5), x1 = Math.floor(fx + b.x1 * sc - 0.5), y0 = Math.ceil(fy - b.y1 * sc - 0.5), y1 = Math.floor(fy - b.y0 * sc - 0.5);
  if (x1 < x0 || y1 < y0) return 0;
  g.fillStyle = col;
  g.fillRect(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
  return (x1 - x0 + 1) * (y1 - y0 + 1);
}
function disc(g: G2, fx: number, fy: number, sc: number, c: Disc, col: string, onlyAbove = Infinity): number {
  const cx = fx + c.x * sc, cy = fy - c.y * sc, r = c.r * sc;
  g.fillStyle = col;
  let n = 0;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r && y < onlyAbove) g.fillRect(x, y, 1, 1), n++;
  return n;
}

export function drawDeepGob(lit: G2, glow: G2, s: WatchState, g: Gob, l: Lens, now: number): void {
  const { u, d } = deepAt(g), sh = DEEP_SHAPES[g.kind];
  let [fx, fy, sc] = proj(l, u, 0, d);
  const fog = deepFogAt(s.fogs, s.t, d, 0.8), fade = g.state === 'dead' ? Math.max(0, Math.min(1, 6 - (s.t - g.at))) : 1;
  lit.save();
  glow.save();
  if (g.state === 'gone') {
    // Down out of sight behind the parapet.
    fy += Math.min(sc * 1.6, (s.t - g.at) * sc * 4);
    for (const c of [lit, glow]) c.beginPath(), c.rect(0, 0, l.lw, l.par - 1), c.clip();
  }
  lit.globalAlpha = (1 - fog * 0.85) * fade;
  if (g.state === 'dead') return fallen(lit, g, fx, fy, sc), lit.restore(), glow.restore();
  // Legs (the one in shadow trades sides each stride), rags and a belt, arms, the head.
  const step = Math.floor(g.walked / 0.6) % 2 === 1, mid = (sh.legs.x0 + sh.legs.x1) / 2;
  let n = box(lit, fx, fy, sc, sh.legs, LEG);
  if (sc > 6) box(lit, fx, fy, sc, step ? { ...sh.legs, x1: mid } : { ...sh.legs, x0: mid }, SKIN_DARK);
  n += box(lit, fx, fy, sc, sh.body, RAG);
  if (sc > 10) box(lit, fx, fy, sc, { ...sh.body, y1: sh.body.y0 + 0.08 }, RAG_DARK), box(lit, fx, fy, sc, { x0: sh.body.x1, y0: sh.body.y1 - 0.3, x1: sh.body.x1 + 0.08, y1: sh.body.y1 - 0.05 }, SKIN);
  n += disc(lit, fx, fy, sc, sh.head, SKIN);
  const hx = fx + sh.head.x * sc, hy = fy - sh.head.y * sc, hr = sh.head.r * sc;
  if (sc > 8) {
    // Long ears out to the sides, teeth.
    lit.fillStyle = SKIN;
    lit.fillRect(Math.round(hx - hr - 1.5), Math.round(hy - 1), 2, 1), lit.fillRect(Math.round(hx + hr - 0.5), Math.round(hy - 1), 2, 1);
    lit.fillStyle = TOOTH;
    lit.fillRect(Math.round(hx - 1), Math.round(hy + hr * 0.45), 2, 1);
  }
  if (g.helmet) disc(lit, fx, fy, sc, sh.head, IRON, Math.round(hy - hr * 0.15)), sc > 8 && box(lit, fx, fy, sc, { x0: sh.head.x - sh.head.r - 0.03, y0: sh.head.y + 0.01, x1: sh.head.x + sh.head.r + 0.03, y1: sh.head.y + 0.05 }, IRON_LIT);
  if (g.kind === 'archer' && sc > 3) box(lit, fx, fy, sc, { x0: sh.body.x1 + 0.04, y0: 0.5, x1: sh.body.x1 + 0.09, y1: 1.35 }, WOOD);
  if (sh.shield && g.shieldHp > 0) {
    box(lit, fx, fy, sc, sh.shield, SHIELD);
    if (sc > 6) {
      // Planks, an iron rim along the top, a boss in the middle; cracks for each arrow it's taken.
      for (let y = sh.shield.y0 + 0.17; y < sh.shield.y1 - 0.08; y += 0.17) box(lit, fx, fy, sc, { ...sh.shield, y0: y, y1: y + 0.025 }, WOOD_DARK);
      box(lit, fx, fy, sc, { ...sh.shield, y0: sh.shield.y1 - 0.05 }, IRON_LIT);
      box(lit, fx, fy, sc, { x0: -0.06, y0: 0.58, x1: 0.06, y1: 0.7 }, IRON);
    }
  }
  if (sh.torch && g.torch) {
    const t = sh.torch, mx = (t.x0 + t.x1) / 2;
    box(lit, fx, fy, sc, { x0: mx - 0.02, y0: t.y0, x1: mx + 0.02, y1: t.y1 - 0.18 }, WOOD);
    flame(glow, Math.round(fx + mx * sc) - 1, Math.round(fy - (t.y1 - 0.12) * sc), now, Math.max(1, Math.round(sc * 0.1)));
  }
  // The arrows in it: the shaft's end and its white fletching, pointing back at you.
  for (const k of g.stuck) {
    const x = Math.round(fx + k.dx * sc), y = Math.round(fy - k.dy * sc);
    if (sc > 5) (lit.fillStyle = SHAFT), lit.fillRect(x, y - 1, 1, 1);
    lit.fillStyle = FLETCH;
    lit.fillRect(x, y, 1, 1);
  }
  // Too far to fill a pixel: a dot where it is, so it's seen.
  if (n === 0) (lit.fillStyle = RAG), lit.fillRect(Math.round(fx), Math.round(fy - sc * 0.7), 1, 1);
  if (g.burning >= 0) for (let i = -1; i <= 1; i++) flame(glow, Math.round(fx + i * sc * 0.15), Math.round(fy - sc * 0.8), now + i, Math.max(1, Math.round(sc * 0.08)));
  // The eyes, glowing through the dark (fog and distance swallow them too).
  glow.globalAlpha = 1 - fog * 0.8;
  glow.fillStyle = EYE_COL;
  const ew = sc > 14 ? 2 : 1, ey = Math.round(hy - hr * 0.1);
  if (sc > 7) glow.fillRect(Math.round(hx - hr * 0.45) - ew + 1, ey, ew, 1), glow.fillRect(Math.round(hx + hr * 0.45), ey, ew, 1);
  else if (d < DEEP.far - 2 || sc > 2) glow.fillRect(Math.round(hx), Math.round(hy), 1, 1);
  lit.restore();
  glow.restore();
}

/** Lying on its back where it fell: a dark length on the field, the arrows still in it. */
function fallen(lit: G2, g: Gob, fx: number, fy: number, sc: number): void {
  const w = Math.max(1, Math.round(sc * 1.1)), h = Math.max(1, Math.round(sc * 0.22));
  lit.fillStyle = g.how === 'fire' ? '#2a2420' : SKIN_DARK;
  lit.fillRect(Math.round(fx - w / 2), Math.round(fy - h), w, h);
  lit.fillStyle = RAG;
  lit.fillRect(Math.round(fx - w / 2 + w * 0.3), Math.round(fy - h), Math.max(1, Math.round(w * 0.4)), h);
  lit.fillStyle = FLETCH;
  for (const k of g.stuck) lit.fillRect(Math.round(fx + k.dy * sc * 0.5 - w / 4), Math.round(fy - h - 1), 1, 1);
}
