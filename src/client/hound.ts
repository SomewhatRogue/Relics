/** Drawing the Ranger's hound (a rough grey wolfhound) and their snares on the ground. */
import type { Hound, Snare } from '../sim/types';
import { shadow, type Ctx } from './draw';

/** The hound at (x, y) on screen, its feet there; legs going when it runs. */
export function drawHound(c: Ctx, d: Hound, x: number, y: number): void {
  if (d.state === 'fled' && d.t > 2) return;
  const g = c.lit, f = d.fx >= 0 ? 1 : -1, step = d.moving ? Math.floor(c.now * 12) % 2 : 0, X = Math.round(x), Y = Math.round(y);
  const px = (dx: number, dy: number, w: number, h: number, col: string) => ((g.fillStyle = col), g.fillRect(X + (f > 0 ? dx : -dx - w + 1), Y + dy, w, h));
  shadow(c, x, y, 5);
  // Legs, body (darker along the back), tail up, head and ears forward.
  px(-4, -3, 1, 3 - step, '#3a3028'), px(-2, -3, 1, 2 + step, '#3a3028'), px(2, -3, 1, 3 - step, '#3a3028'), px(4, -3, 1, 2 + step, '#3a3028');
  px(-5, -7, 10, 4, '#6a5e52');
  px(-5, -7, 10, 1, '#4a4038');
  px(-7, -9 + (d.moving ? step : 0), 2, 3, '#5a4e44');
  px(4, -10, 4, 4, '#6a5e52');
  px(7, -9, 2, 2, '#4a4038');
  px(4, -11, 1, 2, '#3a3028'), px(6, -11, 1, 1, '#3a3028');
  px(6, -9, 1, 1, '#141218');
  // Worrying something: teeth.
  if (d.state === 'bite') px(8, -8, 1, 1, '#e8e4ee');
}

/** A snare: a loop of rope pegged at both ends, a glint on the peg. */
export function drawSnare(c: Ctx, s: Snare, x: number, y: number): void {
  const g = c.lit, X = Math.round(x), Y = Math.round(y);
  g.fillStyle = '#8a6a3a';
  for (let a = 0; a < Math.PI * 2; a += 0.35) g.fillRect(Math.round(X + Math.cos(a) * 5), Math.round(Y + Math.sin(a) * 2), 1, 1);
  g.fillStyle = '#5a3d22';
  g.fillRect(X - 6, Y - 2, 1, 3);
  g.fillRect(X + 5, Y - 2, 1, 3);
  c.glow.fillStyle = Math.floor(c.now * 2 + s.x) % 3 ? '#9aa3ad' : '#e8f0ff';
  c.glow.fillRect(X + 5, Y - 2, 1, 1);
}
