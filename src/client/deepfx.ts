/**
 * The upright view's moving bits: arrows flying away up the field and stuck in it, things knocked
 * loose, the goblin archers' arrows coming up at the wall, fog banks lying across the field, the
 * parapet's torches, the hero from behind with the watch bow raised at the sight, and the sight.
 */
import { BOW, FOES, NIGHT } from '../shared/watchtune';
import { DEEP } from '../shared/deeptune';
import { aimOf, drawOf } from '../sim/watchshot';
import type { WatchState } from '../sim/watchtypes';
import type { Hero } from '../sim/types';
import { drawHero } from './actors';
import { dith } from './watchland';
import { flame } from './watchgobs';
import { merlon, PARAPET } from './deepland';
import { TORCH_AT, proj, type Lens } from './deepview';

type G2 = CanvasRenderingContext2D;
const px = (g: G2, x: number, y: number, col: string) => ((g.fillStyle = col), g.fillRect(Math.round(x), Math.round(y), 1, 1));
/** A line of pixels from (x0, y0) to (x1, y1). */
function seg(g: G2, x0: number, y0: number, x1: number, y1: number, col: string, tip?: string): void {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (let i = 0; i <= n; i++) px(g, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, i === n && tip ? tip : col);
}

/** Arrows: flying away (the shaft back toward you), standing in the field where they missed, and the archers' coming up. */
export function drawDeepArrows(lit: G2, s: WatchState, l: Lens): void {
  for (const p of s.pins) {
    const [x, y, sc] = proj(l, p.x, 0, p.d ?? 0), h = Math.max(1, Math.round(sc * 0.5));
    seg(lit, x, y, x + sc * 0.08, y - h, '#d8c48a', '#e8e0d0');
  }
  for (const a of s.arrows) {
    const [x, y] = proj(l, a.x, a.y, a.d!), back = 0.7 / Math.hypot(a.vx, a.vy, a.vd!);
    const [bx, by] = proj(l, a.x - a.vx * back, a.y - a.vy * back, a.d! - a.vd! * back);
    seg(lit, bx, by, x, y, '#d8c48a', '#b8bcc8');
    px(lit, bx, by, '#e8e0d0');
  }
  for (const d of s.darts) {
    const k = Math.min(1, (s.t - d.t0) / FOES.arrowFlight), dd = (d.d0 ?? 0) * (1 - k) - 0.5 * k, arc = 3 * 4 * k * (1 - k);
    const [x, y] = proj(l, d.x0 + (d.x1 - d.x0) * k, d.y0 + (d.y1 - d.y0) * k + arc, dd);
    const [bx, by] = proj(l, d.x0 + (d.x1 - d.x0) * (k - 0.04), d.y0 + (d.y1 - d.y0) * (k - 0.04) + arc, dd + (d.d0 ?? 0) * 0.04);
    seg(lit, bx, by, x, y, '#8a7a5a', '#c8c0b0');
  }
}

/** Helmets, planks, torches and glanced arrows, turning as they fall. */
export function drawDeepBits(lit: G2, glow: G2, s: WatchState, l: Lens, now: number): void {
  for (const b of s.bits) {
    const [x, y, sc] = proj(l, b.x, b.y, b.d ?? 0), r = Math.max(1, sc * 0.17), c = Math.cos(b.rot), sn = Math.sin(b.rot);
    if (b.kind === 'helmet') {
      // A filled iron cap, turning.
      for (let i = -r; i <= r; i += 0.5) for (let j = 0; j <= Math.sqrt(Math.max(0, r * r - i * i)) * 0.8; j += 0.5) px(lit, x + c * i + sn * j, y + sn * i - c * j, j < 0.6 ? '#a4a2ae' : '#7a7884');
      if (!b.rest || s.t - b.t < 2) px(glow, x + Math.sin(now * 20) * r * 0.6, y - r * 0.6, '#e8ecf8');
    } else if (b.kind === 'plank') seg(lit, x - c * r, y - sn * r, x + c * r, y + sn * r, '#7a5230');
    else if (b.kind === 'arrow') seg(lit, x - c * r, y - sn * r, x + c * r, y + sn * r, '#d8c48a', '#e8e0d0');
    else {
      seg(lit, x, y, x + c * r, y + sn * r, '#7a5230');
      if (s.t - b.t < 6) flame(glow, Math.round(x) - 1, Math.round(y) - 1, now, Math.max(1, Math.round(sc * 0.1)));
    }
  }
}

/** Fog banks lying across the field, pale and dithered in steps, rolling in toward the wall. */
export function drawDeepFog(lit: G2, s: WatchState, l: Lens): void {
  lit.fillStyle = '#a4a8b0';
  for (const b of s.fogs) {
    if (s.t < b.at) continue;
    const near = b.x0 - b.v * (s.t - b.at), far = near + b.w;
    if (far < DEEP.reach) continue;
    const [, yn] = proj(l, 0, 0, Math.max(DEEP.reach, near)), [, yf, scf] = proj(l, 0, 0, far), top = Math.max(l.hz, yf - DEEP.fogHigh * scf);
    for (let y = Math.floor(top); y < Math.min(yn, l.par); y++) {
      const k = (y - top) / Math.max(1, yn - top), f = Math.sin(Math.max(0, Math.min(1, k)) * Math.PI) * NIGHT.fogThick * 0.6;
      for (let x = 0; x < l.lw; x++) if (dith(x + Math.floor(s.t * 3), y, Math.round(f * 4) / 4.6)) lit.fillRect(x, y, 1, 1);
    }
  }
}

/** The parapet's torches on two merlons. */
export function drawParapetTorches(lit: G2, glow: G2, l: Lens, now: number): void {
  for (const k of TORCH_AT) {
    let x = Math.round(l.lw * k);
    while (!merlon(x, l.lw) && x > 0) x--;
    const y = l.par - merlon(x, l.lw);
    lit.fillStyle = '#3a3a44';
    lit.fillRect(x - 3, y - 4, 1, 5);
    flame(glow, x - 4, y - 5, now, 2);
  }
}

/** The hero from behind, twice size, on the walk under the parapet, the watch bow raised at the sight. */
export function drawDeepHero(lit: G2, glow: G2, hero: Hero, s: WatchState, l: Lens, now: number): void {
  const c = (drawDeepHero as { c?: [HTMLCanvasElement, HTMLCanvasElement] }).c ??= [document.createElement('canvas'), document.createElement('canvas')];
  for (const k of c) (k.width = 40), (k.height = 40);
  const [cl, cg] = c.map((k) => k.getContext('2d')!);
  drawHero({ lit: cl, glow: cg, now, t: now }, { ...hero, fx: 0, fy: -1, act: 'idle', actT: 0, moving: false, blocking: false }, 20, 36, 'bare', now);
  const hx = l.cx + 14, feet = l.par + PARAPET + 14;
  lit.drawImage(c[0], hx - 40, feet - 72, 80, 80);
  glow.drawImage(c[1], hx - 40, feet - 72, 80, 80);
  // The bow, up at the sight from the hero's hands; the string back as far as it's drawn.
  const [ax, ay] = aimOf(s), sx = l.cx + ax * l.f, sy = l.hz + ay * l.f, bx = hx - 10, by = feet - 34;
  const dx = sx - bx, dy = sy - by, n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n, pull = s.draw > 0 ? 2 + drawOf(s) * 6 : 0;
  for (let i = -9; i <= 9; i++) px(lit, bx - uy * i + ux * (3 - (i * i) / 27), by + ux * i + uy * (3 - (i * i) / 27), '#8a5a30');
  for (let i = -9; i <= 9; i++) px(lit, bx - uy * i - ux * pull * (1 - Math.abs(i) / 9), by + ux * i - uy * pull * (1 - Math.abs(i) / 9), '#c8c0b0');
  if (s.t >= s.nockAt) seg(lit, bx - ux * pull, by - uy * pull, bx + ux * 6, by + uy * 6, '#d8c48a', '#b8bcc8');
}

/** The sight: a cross, and a ring closing as the string comes back (gold at a full draw). */
export function drawDeepSight(glow: G2, s: WatchState, l: Lens): void {
  const [ax, ay] = aimOf(s), x = Math.round(l.cx + ax * l.f), y = Math.round(l.hz + ay * l.f), p = drawOf(s);
  const col = s.draw > 0 && p >= BOW.hard ? '#ffd27a' : '#e8e0d0';
  glow.fillStyle = col;
  glow.fillRect(x - 6, y, 3, 1), glow.fillRect(x + 4, y, 3, 1), glow.fillRect(x, y - 6, 1, 3), glow.fillRect(x, y + 4, 1, 3);
  if (s.draw <= 0) return;
  const r = 10 - p * 5;
  for (let a = 0; a < Math.PI * 2; a += 0.15) px(glow, x + Math.cos(a) * r, y + Math.sin(a) * r, col);
}
