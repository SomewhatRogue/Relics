/** Drawing the Ranger's hound (a rough grey wolfhound) and their snares on the ground. */
import type { Hound, Snare } from '../sim/types';
import { shadow, type Ctx } from './draw';

/**
 * How a hound looks while it plays or is petted (idlehound.ts): its tail going, sitting, a stick in its
 * mouth, its head down to the ground, its tongue out, leaning in a pixel, up off the ground (pixels).
 */
export interface Mood { wag?: boolean; sit?: boolean; stick?: boolean; headDown?: boolean; happy?: boolean; lick?: boolean; lean?: number; lift?: number; moving?: boolean }
const CALM: Mood = {};

/** The hound at (x, y) on screen, its feet there; legs going when it runs. `m`: how it plays (idlehound.ts). */
export function drawHound(c: Ctx, d: Hound, x: number, y: number, m: Mood = CALM, fx = d.fx, down = !!d.down): void {
  if (d.state === 'fled' && d.t > 2) return;
  const moving = m.moving ?? d.moving, f = fx >= 0 ? 1 : -1, step = moving ? Math.floor(c.now * 12) % 2 : 0;
  const g = c.lit, X = Math.round(x) + f * (m.lean ?? 0), Y = Math.round(y) - (m.lift ?? 0);
  const px = (dx: number, dy: number, w: number, h: number, col: string) => ((g.fillStyle = col), g.fillRect(X + (f > 0 ? dx : -dx - w + 1), Y + dy, w, h));
  shadow(c, x, y, 5);
  // Lying flat: legs tucked, chin on its paws, eyes open; the tail thumps when it wags.
  if (down) {
    px(-5, -4, 10, 4, '#6a5e52'), px(-5, -4, 10, 1, '#4a4038'), px(-8, m.wag ? -3 : -2, 3, 1, '#5a4e44');
    px(4, -5, 4, 3, '#6a5e52'), px(7, -3, 2, 1, '#4a4038'), px(4, -6, 1, 1, '#3a3028'), px(6, -4, 1, 1, '#141218');
    return;
  }
  // The head's place: up when sitting, to the ground when it's sniffing or picking something up.
  const hy = m.sit ? -13 : m.headDown ? -7 : -10, hx = m.sit ? 2 : m.headDown ? 5 : 4;
  if (m.sit) {
    // Sitting up: the haunch round on the floor, the chest upright on straight front legs, the tail along the floor.
    px(m.wag ? -7 : -6, m.wag ? -2 : -1, 3, 1, '#5a4e44');
    px(-4, -4, 5, 4, '#6a5e52'), px(-4, -4, 3, 1, '#4a4038'), px(-3, -1, 3, 1, '#3a3028');
    px(0, -9, 4, 6, '#6a5e52'), px(0, -9, 1, 5, '#4a4038');
    px(2, -3, 1, 3, '#3a3028'), px(3, -3, 1, 3, '#3a3028');
  } else {
    // Legs, body (darker along the back), tail up (swinging when it wags), head and ears forward.
    px(-4, -3, 1, 3 - step, '#3a3028'), px(-2, -3, 1, 2 + step, '#3a3028'), px(2, -3, 1, 3 - step, '#3a3028'), px(4, -3, 1, 2 + step, '#3a3028');
    px(-5, -7, 10, 4, '#6a5e52');
    px(-5, -7, 10, 1, '#4a4038');
    if (m.wag !== undefined) px(m.wag ? -8 : -7, m.wag ? -9 : -10, 2, 2, '#5a4e44');
    else px(-7, -9 + (moving ? step : 0), 2, 3, '#5a4e44');
  }
  px(hx, hy, 4, 4, '#6a5e52');
  px(hx + 3, hy + 1, 2, 2, '#4a4038');
  px(hx, hy - 1, 1, 2, '#3a3028'), px(hx + 2, hy - 1, 1, 1, '#3a3028');
  // Eyes shut a moment when it's happy.
  px(hx + 2, hy + 1, 1, 1, m.happy && Math.floor(c.now * 2) % 3 === 0 ? '#3a3028' : '#141218');
  const mx = hx + 4, my = hy + 2;
  if (m.happy || m.lick) px(mx, my + 1, 1, m.lick ? 2 : 1, '#e87a8a');
  // A stick held crosswise in the jaws: out past the snout and back past the cheek.
  if (m.stick) px(hx + 1, my + 1, 6, 1, '#8b6a3a'), px(hx + 6, my + 1, 1, 1, '#6b4a2b');
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
