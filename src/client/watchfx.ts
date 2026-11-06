/**
 * The Night Watch's moving bits: arrows in flight and in the ground, helmets and planks and torches
 * falling, the goblin archers' arrows coming up at the wall, the watch bow in the hero's hands with the
 * string drawn back, the sight and its aim line, and the words and points over the field.
 */
import { BOW, FOES, WATCH } from '../shared/watchtune';
import { drawOf, aimOf } from '../sim/watchshot';
import type { Bit, WatchState } from '../sim/watchtypes';
import { flame, stuckArrow } from './watchgobs';
import { drawText, textWidth } from './pixfont';

type G2 = CanvasRenderingContext2D;
const px = (g: G2, x: number, y: number, col: string) => ((g.fillStyle = col), g.fillRect(Math.round(x), Math.round(y), 1, 1));

/** Arrows: in flight (pointing the way they fly), in the ground where they missed, and the archers' coming up. */
export function drawArrows(lit: G2, s: WatchState): void {
  for (const p of s.pins) stuckArrow(lit, p.x, p.y, p.ang, 4);
  for (const a of s.arrows) {
    const ang = Math.atan2(a.vy, a.vx);
    stuckArrow(lit, a.x, a.y, ang, 6);
    px(lit, a.x + Math.cos(ang), a.y + Math.sin(ang), '#b8bcc8');
  }
  for (const d of s.darts) {
    const k = Math.min(1, (s.t - d.t0) / FOES.arrowFlight), arc = 18;
    const x = d.x0 + (d.x1 - d.x0) * k, y = d.y0 + (d.y1 - d.y0) * k - arc * 4 * k * (1 - k);
    const ang = Math.atan2(d.y1 - d.y0 - arc * 4 * (1 - 2 * k), d.x1 - d.x0);
    stuckArrow(lit, x, y, ang, 5);
  }
}

const HELMET = [[-2, -1], [-1, -2], [0, -2], [1, -2], [2, -1], [-2, 0], [-1, -1], [0, -1], [1, -1], [2, 0], [-3, 0], [3, 0]];
/** Things knocked loose, turning as they fall, then lying where they land. */
export function drawBits(lit: G2, glow: G2, s: WatchState, now: number): void {
  for (const b of s.bits) {
    const c = Math.cos(b.rot), sn = Math.sin(b.rot), at = (dx: number, dy: number): [number, number] => [b.x + dx * c - dy * sn, b.y + dx * sn + dy * c];
    if (b.kind === 'helmet') {
      for (const [dx, dy] of HELMET) px(lit, ...at(dx, dy), dy === 0 ? '#a4a2ae' : '#7a7884');
      // A glint on the iron as it turns, so it's seen spinning off in the dark.
      if (!b.rest || s.t - b.t < 2) px(glow, ...at(Math.round(Math.sin(now * 20) * 2), -2), '#e8ecf8');
    }
    else if (b.kind === 'plank') for (let i = -2; i <= 2; i++) px(lit, ...at(i, 0), '#7a5230'), px(lit, ...at(i, 1), '#4a3420');
    else if (b.kind === 'arrow') stuckArrow(lit, b.x, b.y, b.rot, 5);
    else torch(lit, glow, b, s.t, now);
  }
}

function torch(lit: G2, glow: G2, b: Bit, t: number, now: number): void {
  for (let i = 0; i < 5; i++) px(lit, b.x + Math.cos(b.rot + Math.PI / 2) * i, b.y + Math.sin(b.rot + Math.PI / 2) * i, '#7a5230');
  if (t - b.t < 6) flame(glow, b.x - 1, b.y - 1, now, 2);
}

/** The watch bow in the hero's hands, turned to the sight, the string back as far as it's drawn. */
export function drawBow(lit: G2, s: WatchState): void {
  const [ax, ay] = aimOf(s), ang = Math.atan2(ay - WATCH.bowY, ax - WATCH.bowX), ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
  const pull = s.draw > 0 ? 1 + drawOf(s) * 3 : 0, ready = s.t >= s.nockAt;
  for (let i = -5; i <= 5; i++) {
    const bend = 2 - (i * i) / 12.5;
    px(lit, WATCH.bowX + nx * i + ux * bend, WATCH.bowY + ny * i + uy * bend, '#8a5a30');
  }
  // The string, from tip to tip through the nock point.
  for (let i = -5; i <= 5; i++) {
    const back = pull * (1 - Math.abs(i) / 5);
    px(lit, WATCH.bowX + nx * i - ux * back, WATCH.bowY + ny * i - uy * back, '#c8c0b0');
  }
  // The next arrow on the string: its head a little past the bow, its fletching at the string.
  const len = Math.round(3 + pull);
  if (ready) for (let i = 0; i <= len; i++) px(lit, WATCH.bowX + ux * (3 - i), WATCH.bowY + uy * (3 - i), i === 0 ? '#b8bcc8' : i >= len - 1 ? '#e8e0d0' : '#d8c48a');
}

/** The sight: a cross, a ring closing as the string comes back (gold at a full draw), and a short dotted aim line. */
export function drawSight(glow: G2, s: WatchState, big: boolean): void {
  const [ax, ay] = aimOf(s), p = drawOf(s), full = s.draw > 0 && p >= BOW.hard, col = full ? '#ffd27a' : '#e8e0d0';
  const dx = ax - WATCH.bowX, dy = ay - WATCH.bowY, d = Math.hypot(dx, dy) || 1;
  glow.globalAlpha = 0.45;
  for (let i = 6; i < Math.min(30, d - 6); i += 3) px(glow, WATCH.bowX + (dx / d) * i, WATCH.bowY + (dy / d) * i, '#e8e0d0');
  glow.globalAlpha = 1;
  const gap = big ? 3 : 2, arm = big ? 3 : 2, x = Math.round(ax), y = Math.round(ay);
  glow.fillStyle = col;
  glow.fillRect(x - gap - arm, y, arm, 1), glow.fillRect(x + gap + 1, y, arm, 1);
  glow.fillRect(x, y - gap - arm, 1, arm), glow.fillRect(x, y + gap + 1, 1, arm);
  if (s.draw <= 0) return;
  const r = 9 - p * 4;
  for (let a = 0; a < Math.PI * 2; a += 0.2) px(glow, x + Math.cos(a) * r, y + Math.sin(a) * r, col);
}

/** Words and points rising off the field. */
export interface Say { s: string; x: number; y: number; col: string; t0: number; dur: number }
export function drawSays(glow: G2, says: Say[], now: number): void {
  for (const w of says) {
    const k = (now - w.t0) / w.dur;
    if (k < 0 || k > 1) continue;
    drawText(glow, w.s, Math.round(w.x - textWidth(w.s) / 2), Math.round(w.y - k * 10), w.col);
  }
}

/** The wall's torches: an iron bracket and the flame. */
export function drawTorches(lit: G2, glow: G2, at: [number, number][], now: number): void {
  for (const [x, y] of at) {
    lit.fillStyle = '#3a3a44';
    lit.fillRect(x, y + 1, 1, 4), lit.fillRect(x - 1, y + 1, 3, 1);
    flame(glow, x - 1, y, now, 2);
  }
}
