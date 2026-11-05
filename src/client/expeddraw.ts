/**
 * An expedition in the world, in both views (scene.ts for the flat one, three/overlay3d.ts for 2.5D;
 * each passes its own projection from tiles on the ground to screen pixels): a ring of gold dots on the
 * ground round each place you stand at to do a job (the cookpot, the barrow shrine, a wayside shrine,
 * the beacon once it's open), filling as it's done; the beacon's fire once lit; and a pale point at the
 * screen's edge toward each friend off screen, with their name. Drawing only.
 */
import { EXPED } from '../shared/tuning';
import { ringOf } from '../shared/expedrings';
import type { ArenaRoom } from '../sim/room';
import { drawText, textWidth } from './pixfont';

export type Ground = (x: number, y: number) => [number, number];
const FRIEND = '#7ad0ff';

/** A dotted ring on the ground, `share` of it bright (how far along). */
function ring(g: CanvasRenderingContext2D, P: Ground, x: number, y: number, r: number, share: number, now: number): void {
  // A hold's ring is wide (EXPED.holdR): closer dots, and two in three of the unlit shown, so it reads at night.
  const big = r > 3, n = Math.max(24, Math.round(r * (big ? 20 : 14)));
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2 - Math.PI / 2, [px, py] = P(x + Math.cos(t) * r, y + Math.sin(t) * r);
    const lit = i / n < share, beat = (i + Math.floor(now * 6)) % 3;
    if (!lit && (big ? beat === 0 : beat)) continue;
    g.fillStyle = lit ? '#ffd27a' : '#a0782a';
    g.fillRect(Math.round(px), Math.round(py), lit ? 2 : 1, lit ? 2 : 1);
  }
}

/** The rings where a job is done by standing there (drawn under bodies). */
export function drawExpedGround(g: CanvasRenderingContext2D, room: ArenaRoom, P: Ground, now: number): void {
  const x = room.exped;
  if (!x || room.indoors) return;
  for (const q of [...x.goals, ...x.sides]) {
    if (q.done || (q.kind !== 'larder' && q.kind !== 'shrine' && q.kind !== 'pray')) continue;
    ring(g, P, q.x, q.y, ringOf(q.kind), q.p, now);
  }
  if (x.phase === 'open') ring(g, P, x.zone.x, x.zone.y, x.zone.r, x.lit / EXPED.call, now);
  if (x.phase === 'hold' || x.phase === 'leave') ring(g, P, x.zone.x, x.zone.y, x.zone.r, x.phase === 'leave' ? 1 : x.held / EXPED.extract, now);
}

/** The beacon once lit: a pile of logs with a tall fire on it (drawn over everything). Returns where it burns, for the light. */
export function drawBeacon(g: CanvasRenderingContext2D, room: ArenaRoom, P: Ground, now: number, s = 1): { x: number; y: number }[] {
  const x = room.exped;
  if (!x || room.indoors) return [];
  const [bx, by] = P(x.zone.x, x.zone.y);
  g.fillStyle = '#3a2614';
  for (let i = 0; i < 4; i++) g.fillRect(Math.round(bx - 9 * s + i * 2 * s), Math.round(by - (2 + i * 3) * s), Math.round((18 - i * 4) * s), Math.round(3 * s));
  if (x.phase !== 'hold' && x.phase !== 'leave') return [];
  for (let i = 0; i < 22; i++) {
    const h = (10 + i * 1.7 + Math.sin(now * 11 + i) * 2) * s, w = Math.max(1, (12 - i * 0.5) * s);
    g.fillStyle = i < 6 ? '#fff2b0' : i < 14 ? '#ffb040' : '#d8502a';
    g.fillRect(Math.round(bx - w / 2 + Math.sin(now * 7 + i * 0.7) * 2 * s), Math.round(by - h), Math.round(w), Math.max(1, Math.round(2 * s)));
  }
  return [{ x: x.zone.x, y: x.zone.y }];
}

/** Each friend off screen: a pale point at the edge toward them, and their name beside it. */
export function friendMarks(g: CanvasRenderingContext2D, room: ArenaRoom, me: string, P: Ground, w: number, h: number, top: number, bottom: number): void {
  if (!room.exped) return;
  const m = 10;
  for (const f of room.heroes) {
    if (f.id === me || f.id === 'squire') continue;
    const [sx, sy] = P(f.x, f.y);
    if (sx >= 0 && sx <= w && sy >= top && sy <= h - bottom) continue;
    const ex = Math.max(m, Math.min(w - m, sx)), ey = Math.max(top + m, Math.min(h - bottom - m, sy)), dx = sx - ex, dy = sy - ey, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    g.fillStyle = f.act === 'down' ? '#ff6a5a' : FRIEND;
    for (let k = 0; k < 4; k++) for (let s = -(3 - k); s <= 3 - k; s++) g.fillRect(Math.round(ex + ux * (2 + k) - uy * s), Math.round(ey + uy * (2 + k) + ux * s), 1, 1);
    const name = (f.tag ?? '').toUpperCase().slice(0, 8), tw = textWidth(name);
    drawText(g, name, Math.round(Math.max(2, Math.min(w - tw - 2, ex - ux * 8 - tw / 2))), Math.round(ey - uy * 8 - 3), f.act === 'down' ? '#ff6a5a' : FRIEND);
  }
}
