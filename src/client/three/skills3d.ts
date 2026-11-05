/**
 * The skills taught after the first, in 2.5D, from the same room data the flat view draws them from
 * (skillsdraw.ts): the ring a Shield Stamp, a Fire Ring or Censer Light fills while it winds up; a
 * Volley's marked spot, then arrows coming down into it; a fire ring burning on; a Storm Tether's
 * lightning; a Censer Chain's links. Drawn on the flat layer over the 3D view, placed on the floor (or
 * at chest height) by the camera's own sums, and their light given to the 3D lights. Cosmetic only:
 * Math.random is fine here.
 */
import { FIRE_RING, LIGHT, RELICS, STAMP } from '../../shared/tuning';
import type { ArenaRoom } from '../../sim/room';
import type { Lerp } from './actors3d';
import type { L3 } from './lights3d';
import type { Proj } from './overlay3d';

const WINDS: Partial<Record<string, { r: number; col: string }>> = {
  stamp: { r: STAMP.radius, col: '#e0d8c8' },
  firering: { r: FIRE_RING.radius, col: '#ff9a3c' },
  light: { r: LIGHT.radius, col: '#fff1b0' },
};

/** A ring of single pixels on the floor round (x, z), `R` tiles out: dotted when `dots`. */
function ring(g: CanvasRenderingContext2D, P: Proj, ppu: number, x: number, z: number, R: number, col: string, a: number, dots = false): void {
  const n = Math.max(12, Math.round(Math.PI * 2 * R * ppu));
  g.fillStyle = col;
  g.globalAlpha = a;
  for (let i = 0; i < n; i++) {
    if (dots && i % 3) continue;
    const t = (i / n) * Math.PI * 2, [px, py] = P(x + Math.cos(t) * R, 0.04, z + Math.sin(t) * R);
    g.fillRect(Math.round(px), Math.round(py), 1, 1);
  }
  g.globalAlpha = 1;
}

/** A line of pixels from a to b (screen), every `gap` pixels `w` wide, jittered by `jit`. */
function line(g: CanvasRenderingContext2D, a: [number, number], b: [number, number], col: string, gap = 1, w = 1, jit = 0): void {
  const segs = jit ? Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 5)) : 1;
  let [px, py] = a;
  g.fillStyle = col;
  for (let i = 1; i <= segs; i++) {
    const k = i / segs, nx = a[0] + (b[0] - a[0]) * k + (i < segs ? (Math.random() - 0.5) * jit : 0), ny = a[1] + (b[1] - a[1]) * k + (i < segs ? (Math.random() - 0.5) * jit : 0);
    const n = Math.max(1, Math.round(Math.hypot(nx - px, ny - py)));
    for (let s = 0; s <= n; s += gap) g.fillRect(Math.round(px + ((nx - px) * s) / n), Math.round(py + ((ny - py) * s) / n), w, 1);
    (px = nx), (py = ny);
  }
}

export function drawSkills3(g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj, lerp: Lerp, ppu: number, now: number): void {
  const t = room.time;
  for (const h of room.heroes) {
    const w = WINDS[h.relic];
    if (!w || h.act !== 'throw') continue;
    const wind = RELICS[h.relic].windup, k = Math.min(1, h.actT / wind), [x, z] = lerp('h:' + h.id, h.x, h.y);
    if (h.actT > wind) continue;
    ring(g, P, ppu, x, z, w.r, w.col, 0.9);
    ring(g, P, ppu, x, z, w.r * k, w.col, 0.55);
  }
  for (const zn of room.zones) {
    if (!zn.kind) continue;
    const fade = Math.min(1, (zn.until - t) / 0.6);
    if (zn.kind === 'volley') {
      const waiting = t < (zn.at ?? 0);
      ring(g, P, ppu, zn.x, zn.y, zn.r, '#e8d8a0', waiting ? 0.5 + 0.3 * Math.sin(now * 18) : 0.7 * fade, waiting);
      if (waiting) continue;
      // Arrows coming down: short bright streaks falling into the spot.
      g.globalAlpha = 0.85 * fade;
      for (let i = 0; i < 7; i++) {
        const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * zn.r, ax = zn.x + Math.cos(a) * d, az = zn.y + Math.sin(a) * d, hi = 0.4 + Math.random() * 1.2;
        line(g, P(ax, hi + 0.5, az), P(ax, hi, az), '#f4ecd0');
      }
      g.globalAlpha = 1;
    } else if (zn.kind === 'fire') {
      // Burning on: a flickering ring of flame with embers lifting off it.
      const n = Math.max(12, Math.round(Math.PI * 2 * zn.r * ppu));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, f = Math.random(), [px, py] = P(zn.x + Math.cos(a) * zn.r, f * 0.25, zn.y + Math.sin(a) * zn.r);
        g.fillStyle = f > 0.7 ? '#ffd27a' : '#ff6a20';
        g.globalAlpha = (0.5 + f * 0.5) * fade;
        g.fillRect(Math.round(px), Math.round(py), 1, 1 + Math.round(f * 2));
      }
      g.globalAlpha = 1;
    }
  }
  for (const h of room.heroes) {
    const e = h.tether && room.enemies.find((o) => o.id === h.tether!.id);
    if (!e) continue;
    const [hx, hz] = lerp('h:' + h.id, h.x, h.y), [ex, ez] = lerp('e:' + e.id, e.x, e.y);
    line(g, P(hx, 0.9, hz), P(ex, 0.8, ez), '#fff27a', 1, 1, 6);
  }
  for (const b of [...room.heroes.map((h) => ['h:' + h.id, h] as const), ...room.enemies.map((e) => ['e:' + e.id, e] as const)]) {
    const [key, o] = b;
    if (!o.tow) continue;
    const [x, z] = lerp(key, o.x, o.y);
    line(g, P(x, 0.55, z), P(o.tow.x, 0.55, o.tow.y), '#ffe9a8', 3, 2);
  }
}

/** Their light, as the flat view gives it (skillsdraw.ts skillLights), in tiles for the 3D lights. */
export function skillLights3(room: ArenaRoom, out: L3[]): void {
  for (const z of room.zones) {
    if (!z.kind || z.kind === 'firepit' || z.kind === 'stormring' || z.kind === 'caltrops' || z.kind === 'taunt') continue;
    const k = Math.min(1, (z.until - room.time) / 0.6);
    if (z.kind === 'fire') out.push({ x: z.x, y: 0.7, z: z.y, r: z.r * 1.6 + 0.6, i: 0.9 * k, c: [1, 0.55, 0.25], f: 15 });
    else if (room.time >= (z.at ?? 0)) out.push({ x: z.x, y: 1, z: z.y, r: z.r + 0.8, i: 0.3 * k, c: [1, 0.92, 0.7] });
  }
  for (const h of room.heroes) {
    const e = h.tether && room.enemies.find((o) => o.id === h.tether!.id);
    if (e) out.push({ x: (h.x + e.x) / 2, y: 1, z: (h.y + e.y) / 2, r: 3.4, i: 0.6, c: [1, 0.95, 0.6] });
    const w = WINDS[h.relic];
    if (w && h.act === 'throw' && h.actT <= RELICS[h.relic].windup) out.push({ x: h.x, y: 0.9, z: h.y, r: w.r + 0.8, i: 0.35, c: h.relic === 'firering' ? [1, 0.55, 0.25] : [1, 0.9, 0.65] });
  }
}
