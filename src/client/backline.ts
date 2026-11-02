/**
 * Drawing the back of the pack (shared/backline.ts): the hexer's staff with a skull fetish that glows
 * sickly green as it calls the ground up, and its bone horns; the drummer's drum on a strap and its
 * bone stick; and on the floor, the drum's reach (a faint ring, and a ripple out to it on every beat)
 * and a pulse at the feet of every goblin it has roused. Drawing only: the room says who drums.
 */
import { DRUMMER } from '../shared/tuning';
import type { Enemy } from '../sim/types';
import { line, type Ctx } from './draw';
import { PX } from './world';

const BONE = '#d8d0bc', WOOD = '#5a3d22', GREEN = '#9be040', PALE = '#d8ff90', DRUM = '#c8e050';

/**
 * What a hexer or drummer holds, drawn where the knife would be: `bx`, `by` its feet (posed), `ax`,
 * `ay` the weapon arm's offset this frame, `back` it faces away.
 */
export function drawKit(c: Ctx, e: Enemy, bx: number, by: number, ax: number, ay: number, t: number): void {
  const f = e.fx < -0.2 ? -1 : 1, hx = Math.round(bx + f * 3 + ax), hy = Math.round(by - 6 + ay), g = c.lit;
  if (e.variant === 'hexer') {
    // Bone horns on its head.
    g.fillStyle = BONE;
    for (const s of [-1, 1]) g.fillRect(Math.round(bx + s * 2), Math.round(by - 13), 1, 1), g.fillRect(Math.round(bx + s * 3), Math.round(by - 14), 1, 1);
    // The staff, held upright, a skull lashed on top with a rag of red.
    g.fillStyle = WOOD;
    g.fillRect(hx, hy - 9, 1, 14);
    g.fillStyle = BONE;
    g.fillRect(hx - 1, hy - 12, 3, 2);
    g.fillRect(hx, hy - 10, 1, 1);
    g.fillStyle = '#7a1d1d';
    g.fillRect(hx + f, hy - 9, 1, 2);
    const a = e.attack, k = a && a.kind === 'hex' && a.t < a.windup ? a.t / a.windup : 0;
    // The eyes in the skull glow; through the spell the glow swells and motes rise off it.
    c.glow.fillStyle = k ? PALE : GREEN;
    c.glow.fillRect(hx - 1, hy - 12, 1, 1), c.glow.fillRect(hx + 1, hy - 12, 1, 1);
    if (!k) return;
    const r = 1 + Math.round(k * 2.5);
    c.glow.fillStyle = GREEN;
    c.glow.globalAlpha = 0.35 + 0.3 * k;
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r && (x + y + Math.floor(c.now * 12)) % 2) c.glow.fillRect(hx + x, hy - 11 + y, 1, 1);
    c.glow.globalAlpha = 1;
    for (let i = 0; i < 3; i++) {
      const m = (c.now * 1.6 + i / 3 + e.id * 0.17) % 1;
      c.glow.fillStyle = i % 2 ? PALE : GREEN;
      c.glow.fillRect(Math.round(hx + Math.sin(m * 9 + i) * 2), Math.round(hy - 12 - m * 8), 1, 1);
    }
    return;
  }
  // The drummer: a strap over the shoulder, a drum slung at the hip on its stick side (it sticks out
  // past the body, so the outline says drummer), a bone for a stick.
  const dx = Math.round(f > 0 ? bx + 3 : bx - 9), dy = Math.round(by - 8);
  g.fillStyle = '#3a2a1a';
  for (let i = 0; i < 5; i++) g.fillRect(Math.round(bx - f * 3 + f * i), Math.round(by - 12 + i), 1, 1);
  g.fillStyle = '#141218';
  g.fillRect(dx - 1, dy - 1, 8, 7);
  g.fillStyle = '#6b3a22';
  g.fillRect(dx, dy, 6, 5);
  g.fillStyle = '#d8c49a';
  g.fillRect(dx, dy, 6, 2);
  g.fillStyle = '#a8946a';
  g.fillRect(dx, dy + 1, 6, 1);
  g.fillStyle = '#3a2a1a';
  g.fillRect(dx, dy + 3, 6, 1);
  g.fillStyle = BONE;
  g.fillRect(dx + 1, dy + 2, 1, 1), g.fillRect(dx + 4, dy + 2, 1, 1);
  // The stick: up and back between beats, down on the skin on the beat.
  const down = e.drumming && (t % DRUMMER.beat) / DRUMMER.beat < 0.2, sx = Math.round(dx + 3 - f), sy = Math.round(hy);
  line(g, sx, sy, down ? (f > 0 ? 1.2 : 1.9) : f > 0 ? -1.2 : -1.9, 0, down ? 2 : 5, BONE);
  if (down) (c.glow.fillStyle = DRUM), (c.glow.globalAlpha = 0.9), c.glow.fillRect(dx + 1, dy - 2, 4, 1), (c.glow.globalAlpha = 1);
}

type At = (e: Enemy) => [number, number];

/**
 * On the floor, before the bodies (so a body standing on it hides it): a drummer's reach, a ripple
 * out to it on each beat, and a pulse under each goblin it has roused. `at`: an enemy's place on screen.
 */
export function drawDrums(c: Ctx, enemies: Enemy[], at: At, t: number): void {
  const g = c.glow, k = (t % DRUMMER.beat) / DRUMMER.beat, R = DRUMMER.radius * PX;
  let any = false;
  for (const e of enemies) {
    if (!e.drumming || e.act === 'dead') continue;
    any = true;
    const [x, y] = at(e);
    dots(g, x, y, R, 6, 0.22);
    dots(g, x, y, R * (0.15 + 0.85 * k), 4, 0.55 * (1 - k));
  }
  if (!any) return;
  for (const e of enemies) {
    if (!e.roused || e.act === 'dead') continue;
    const [x, y] = at(e), rx = (e.kind === 'butcher' ? 10 : 6) + (k < 0.25 ? 1 : 0);
    g.fillStyle = DRUM;
    g.globalAlpha = k < 0.25 ? 0.85 : 0.45;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      g.fillRect(Math.round(x + Math.cos(a) * rx), Math.round(y + Math.sin(a) * rx * 0.4), 1, 1);
    }
  }
  g.globalAlpha = 1;
}

/** A dotted ring of radius `r` pixels, a dot every `gap`. */
function dots(g: CanvasRenderingContext2D, x: number, y: number, r: number, gap: number, alpha: number): void {
  const n = Math.max(8, Math.round((Math.PI * 2 * r) / gap));
  g.fillStyle = DRUM;
  g.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1);
  }
}
