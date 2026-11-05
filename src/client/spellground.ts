/**
 * A Mage's spells on the floor, drawn at the size they're judged at (sim/staffrings.ts, sim/holds.ts):
 * the staff's ring of fire (flames licking up all round its band), its charged ring (crackling posts
 * round the edge, lightning jumping between them, sparks inside), and a lightning strike's mark before it
 * falls (a red circle filling, with the striped edge of a blow that can't be blocked: friends in a party
 * get hurt by it too). Flat view and the 2.5D overlay alike, by a projection of the floor to the screen,
 * and the light each gives off. Cosmetic only: Math.random is fine here.
 */
import { FLAME_RING } from '../shared/tuning';
import type { ArenaRoom } from '../sim/room';
import type { Bolt, Zone } from '../sim/types';
import type { Light } from './light';
import { EL_LIGHT } from './palette';
import { OX, OY, PX } from './world';
import { drawLadderGround } from './ladderground';

/** Floor (x, z) at height y (tiles) to the screen. */
type Proj = (x: number, y: number, z: number) => [number, number];

const FIRE = ['#ff6a20', '#ff9a3c', '#ffd27a'], STORM = ['#c8c070', '#fff27a', '#ffffff'];
const dot = (g: CanvasRenderingContext2D, x: number, y: number, col: string, a: number, h = 1) => {
  g.globalAlpha = a;
  g.fillStyle = col;
  g.fillRect(Math.round(x), Math.round(y), 1, h);
};

/** How far in it is: rising as it comes up, fading as it goes. */
const fade = (z: Zone, t: number) => Math.max(0, Math.min(1, (z.until - t) / 0.6, (t - (z.at ?? t) + 0.05) / 0.25));

/** The ring of fire: flames all round its band, each a column of the fire's colours. */
function flames(g: CanvasRenderingContext2D, z: Zone, P: Proj, t: number, ppu: number): void {
  const k = fade(z, t), n = Math.max(24, Math.round(z.r * 2 * Math.PI * ppu * 0.6)), half = FLAME_RING.band / 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, f = Math.random(), off = (((i * 37) % 7) / 7 - 0.5) * half * 2;
    const x = z.x + Math.cos(a) * (z.r + off), y = z.y + Math.sin(a) * (z.r + off), tall = (z.big ? 0.75 : 0.55) * (0.5 + 0.5 * f) * Math.min(1, k * 1.5);
    const [bx, by] = P(x, 0, y), [, top] = P(x, tall, y), h = Math.max(1, Math.round(by - top));
    dot(g, bx, top, FIRE[Math.floor(f * 3)], (0.55 + 0.45 * f) * k, h);
    dot(g, bx, top, '#fff1b0', 0.8 * k);
    // Embers off the tops now and then.
    if (f > 0.85) dot(g, bx + (Math.random() - 0.5) * 3, top - 2 - Math.random() * 4, '#ffd27a', 0.7 * k);
  }
}

/** The charged ring: posts round the edge with lightning jumping between them, sparks inside. */
function charged(g: CanvasRenderingContext2D, z: Zone, P: Proj, t: number): void {
  const k = fade(z, t), n = Math.max(16, Math.round(z.r * 2 * Math.PI * 1.5)), pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, x = z.x + Math.cos(a) * z.r, y = z.y + Math.sin(a) * z.r;
    const [bx, by] = P(x, 0, y), [, top] = P(x, z.big ? 0.55 : 0.45, y);
    dot(g, bx, top, STORM[0], 0.8 * k, Math.max(1, Math.round(by - top)));
    dot(g, bx, top, '#ffffff', k);
    pts.push([bx, top + 1]);
  }
  // Lightning from post to post, re-jagged each frame; a few at a time.
  for (let i = 0; i < n; i++) {
    if (Math.random() > 0.55) continue;
    const [ax, ay] = pts[i], [cx, cy] = pts[(i + 1) % n], m = Math.max(2, Math.round(Math.hypot(cx - ax, cy - ay) / 2));
    for (let j = 0; j <= m; j++) dot(g, ax + ((cx - ax) * j) / m, ay + ((cy - ay) * j) / m + (Math.random() - 0.5) * 3, j % 2 ? STORM[1] : '#ffffff', 0.9 * k);
  }
  // Sparks over the floor inside it, and the faint round of it on the floor.
  for (let i = 0; i < Math.round(z.r * z.r * 3); i++) {
    const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * z.r, [sx, sy] = P(z.x + Math.cos(a) * d, 0.05, z.y + Math.sin(a) * d);
    dot(g, sx, sy, STORM[Math.floor(Math.random() * 3)], 0.5 * k);
  }
  // Its edge on the floor, unbroken, so the reach reads at a glance.
  for (let i = 0; i < n * 8; i++) {
    const a = (i / (n * 8)) * Math.PI * 2, [sx, sy] = P(z.x + Math.cos(a) * z.r, 0, z.y + Math.sin(a) * z.r);
    dot(g, sx, sy, i % 3 ? STORM[1] : '#ffffff', (0.55 + 0.25 * Math.sin(t * 9 + i)) * k);
  }
}

/** A lightning strike's mark, `k` (0..1) of the way to falling: red filling from the middle, a striped edge. */
function mark(g: CanvasRenderingContext2D, b: Bolt, P: Proj, ppu: number): void {
  const k = Math.min(1, b.t / Math.max(0.01, b.flight)), R = b.burst, step = 1 / Math.max(4, ppu);
  for (let y = -R; y <= R; y += step) for (let x = -R; x <= R; x += step) {
    const d = Math.hypot(x, y);
    if (d > R) continue;
    const [sx, sy] = P(b.x + x, 0.02, b.y + y), sxr = Math.round(sx), syr = Math.round(sy);
    if (R - d < 0.1) {
      // The striped edge of a blow that can't be blocked.
      const stripe = Math.floor((x + y) * 3.2) % 2 === 0;
      dot(g, sx, sy, stripe ? '#ffd040' : '#2a1408', 1);
    } else if (d < R * k) {
      if ((sxr + syr) % 2) dot(g, sx, sy, '#e23a30', 0.6);
    } else if ((sxr * 3 + syr) % 4 === 0) dot(g, sx, sy, '#b02a22', 0.85);
  }
  g.globalAlpha = 1;
}

function draw(g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj, ppu: number): void {
  for (const z of room.zones) {
    if (room.time >= z.until) continue;
    if (z.kind === 'flamering') flames(g, z, P, room.time, ppu);
    else if (z.kind === 'stormring') charged(g, z, P, room.time);
  }
  for (const b of room.bolts) if (b.kind === 'strike') mark(g, b, P, ppu);
  // The movement ladder's caltrops, burst and roar, the same way (ladderground.ts).
  drawLadderGround(g, room, P, ppu);
  g.globalAlpha = 1;
}

/** The flat view's glow layer. */
export function drawSpellGround(g: CanvasRenderingContext2D, room: ArenaRoom, cx: number, cy: number): void {
  draw(g, room, (x, y, z) => [OX + x * PX - cx, OY + z * PX - cy - y * PX], PX);
}

/** The 2.5D overlay (`P` the camera's own projection, `ppu` its pixels a tile). */
export const drawSpellGround3 = (g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj, ppu: number): void => draw(g, room, P, ppu);

/** Their light, in tiles (`at` places one for the caller's view): the rings, and a strike as it falls. */
export function spellLights<L>(room: ArenaRoom, at: (x: number, y: number, r: number, i: number, c: [number, number, number]) => L): L[] {
  const out: L[] = [];
  for (const z of room.zones) {
    if ((z.kind !== 'flamering' && z.kind !== 'stormring') || room.time >= z.until) continue;
    const k = fade(z, room.time), fire = z.kind === 'flamering';
    out.push(at(z.x, z.y, z.r + 1.2, (fire ? 0.85 + Math.random() * 0.1 : 0.55 + Math.random() * 0.2) * k, EL_LIGHT[z.el]));
  }
  for (const b of room.bolts) if (b.kind === 'strike') out.push(at(b.x, b.y, b.burst + 0.6, 0.25 + 0.35 * Math.min(1, b.t / Math.max(0.01, b.flight)), [1, 0.4, 0.3]));
  return out;
}

/** The flat view's lights for them. */
export const spellLightsFlat = (room: ArenaRoom, cx: number, cy: number): Light[] =>
  spellLights(room, (x, y, r, i, c) => ({ x: OX + x * PX - cx, y: OY + y * PX - cy - 6, r: r * PX, i, c }));
