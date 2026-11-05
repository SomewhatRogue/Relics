/**
 * The wand's lightning strike, seen (sim/skystrike.ts decides it; this only reads the room's zones of
 * kind 'skystrike'). While it's coming: its mark on the floor in the friendly gold (it spares friends, so
 * never the goblins' red), an unbroken ring at the very circle the room judges, a second ring closing in
 * from it as the moment comes, a dithered wash inside and sparks gathering. As it falls: a white-blue bolt
 * down out of the sky with forks off it, the circle flashing white-blue and a scorch fading, the whole
 * screen lit a beat (`skyFlash`, through the lighting pass in both views). Flat view and the 2.5D overlay
 * alike, by a projection of the floor to the screen. Cosmetic only: the bolt's kinks come from the spot,
 * so every frame draws it the same; sparks may use Math.random.
 */
import type { ArenaRoom } from '../sim/room';
import { inSkyStrike, strikeLead } from '../sim/skystrike';
import type { Zone } from '../sim/types';
import { SKY_STRIKE } from '../shared/tuning';

/** Floor (x, z) at height y (tiles) to the screen. */
type Proj = (x: number, y: number, z: number) => [number, number];

const GOLD = ['#ffd27a', '#ffe9a8', '#fff1b0'], COLD = ['#ffffff', '#c8dcff', '#9fb8ff'];
/** How long the bolt shows once down, how high it comes from (tiles), how far it wanders (tiles). */
const BOLT = { show: 0.16, high: 11, kink: 0.9 };

const strikes = (room: ArenaRoom) => room.zones.filter((z) => z.kind === 'skystrike' && room.time < z.until);
const hash = (n: number) => {
  const s = Math.sin(n * 91.7 + 13.1) * 43758.5453;
  return s - Math.floor(s);
};
const seed = (z: Zone) => Math.round(z.x * 97 + z.y * 13 + (z.at ?? 0) * 7);
const dot = (g: CanvasRenderingContext2D, x: number, y: number, col: string, a: number, w = 1) => {
  g.globalAlpha = Math.max(0, Math.min(1, a));
  g.fillStyle = col;
  g.fillRect(Math.round(x), Math.round(y), w, 1);
};

/** A ring on the floor `R` round, as unbroken dots at the view's scale. */
function ring(g: CanvasRenderingContext2D, z: Zone, R: number, P: Proj, ppu: number, col: (i: number) => string, a: number, w = 1): void {
  const n = Math.max(24, Math.round(R * 2 * Math.PI * ppu));
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2, [sx, sy] = P(z.x + Math.cos(t) * R, 0.02, z.y + Math.sin(t) * R);
    dot(g, sx, sy, col(i), a, w);
  }
}

/** While it's coming: the gold mark, `k` 0 (just called) to 1 (falling now). */
function mark(g: CanvasRenderingContext2D, z: Zone, k: number, P: Proj, ppu: number, t: number): void {
  // A dithered wash over the whole circle, thickening as it comes.
  const step = 1 / Math.max(4, ppu * 0.5);
  for (let y = -z.r; y <= z.r; y += step) for (let x = -z.r; x <= z.r; x += step) {
    if (!inSkyStrike(z, { x: z.x + x, y: z.y + y })) continue;
    const [sx, sy] = P(z.x + x, 0.02, z.y + y), q = (Math.round(sx) + Math.round(sy) * 3) % 4;
    if (q === 0 || (k > 0.5 && q === 2)) dot(g, sx, sy, '#ffd27a', 0.18 + 0.3 * k);
  }
  // The circle judged, unbroken and bright; the closing ring from its edge to the middle.
  ring(g, z, z.r, P, ppu, (i) => (i % 3 ? GOLD[1] : '#ffffff'), 0.75 + 0.25 * Math.sin(t * 30), z.big ? 2 : 1);
  if (k < 0.97) ring(g, z, z.r * (1 - k), P, ppu, () => GOLD[0], 0.55 + 0.4 * k);
  // Sparks gathering over it, more as it comes, and a faint glow climbing up into the sky.
  for (let i = 0; i < 3 + 8 * k; i++) {
    const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * z.r, [sx, sy] = P(z.x + Math.cos(a) * d, Math.random() * 1.2 * k, z.y + Math.sin(a) * d);
    dot(g, sx, sy, i % 2 ? GOLD[2] : COLD[1], 0.8);
  }
  g.globalAlpha = 1;
}

/** As it falls: the circle flashing white-blue, fading to a scorch, `a` s since it fell. */
function landed(g: CanvasRenderingContext2D, z: Zone, a: number, P: Proj, ppu: number): void {
  const k = Math.max(0, 1 - a / SKY_STRIKE.show);
  ring(g, z, z.r, P, ppu, (i) => COLD[i % 3], k, 2);
  for (let i = 0; i < 6 * k; i++) {
    const b = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * z.r, [sx, sy] = P(z.x + Math.cos(b) * d, 0.03, z.y + Math.sin(b) * d);
    dot(g, sx, sy, COLD[i % 3], k);
  }
  g.globalAlpha = 1;
}

/** On the floor (under bodies in the flat view): each strike's mark, or its circle as it lands. */
export function drawSkyMarks(g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj, ppu: number): void {
  for (const z of strikes(room)) {
    const lead = strikeLead(z, room.time);
    if (lead > 0) mark(g, z, 1 - lead / SKY_STRIKE.delay, P, ppu, room.time);
    else landed(g, z, room.time - (z.at ?? 0), P, ppu);
  }
}

/** A line two pixels wide, white with a cold halo either side. */
function seg(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, a: number, wide: number): void {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
    dot(g, x - 1 - wide, y, COLD[2], 0.6 * a, 4 + wide * 2);
    dot(g, x - wide / 2, y, '#ffffff', a, 2 + wide);
  }
}

/** Over everything: the bolt itself, for a blink, down out of the sky onto the middle, with two forks. */
export function drawSkyBolts(g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj): void {
  for (const z of strikes(room)) {
    const a = room.time - (z.at ?? 0);
    if (a < 0 || a >= BOLT.show) continue;
    const s = seed(z), n = 9, wide = z.big ? 1 : 0, fade = a < 0.05 ? 1 : 0.6 + 0.4 * Math.round(hash(s + Math.floor(a * 60)));
    let [px, py] = P(z.x + (hash(s) - 0.5) * 2 * BOLT.kink, BOLT.high, z.y);
    for (let i = 1; i <= n; i++) {
      const f = i / n, off = i === n ? 0 : (hash(s * 13 + i) - 0.5) * 2 * BOLT.kink * (1 - f * 0.6), [nx, ny] = P(z.x + off, BOLT.high * (1 - f), z.y);
      seg(g, px, py, nx, ny, fade, wide);
      // Forks off at two kinks, reaching down toward the edge of the circle.
      if (i === 4 || i === 6) {
        const side = hash(s + i) < 0.5 ? -1 : 1, [fx, fy] = P(z.x + off + side * z.r * 0.7, BOLT.high * (1 - f) * 0.45, z.y);
        seg(g, nx, ny, fx, fy, fade * 0.7, 0);
      }
      (px = nx), (py = ny);
    }
  }
  g.globalAlpha = 1;
}

/** How bright the screen goes now (0 to 1): full as one falls, a flicker, gone in a quarter second. */
export function skyFlash(room: ArenaRoom): number {
  let k = 0;
  for (const z of strikes(room)) {
    const a = room.time - (z.at ?? 0);
    if (a < 0 || a > 0.25) continue;
    const q = a / 0.25, v = q < 0.3 ? 1 : q < 0.5 ? 0.35 : q < 0.65 ? 0.75 : (1 - q) * 1.3;
    k = Math.max(k, v * (z.big ? 1 : 0.8));
  }
  return k;
}

/** Their light, in tiles (`at` places one for the caller's view): gold as it comes, a cold blaze as it falls. */
export function skyLights<L>(room: ArenaRoom, at: (x: number, y: number, r: number, i: number, c: [number, number, number]) => L): L[] {
  const out: L[] = [];
  for (const z of strikes(room)) {
    const lead = strikeLead(z, room.time), a = room.time - (z.at ?? 0);
    if (lead > 0) out.push(at(z.x, z.y, z.r + 1, 0.25 + 0.4 * (1 - lead / SKY_STRIKE.delay), [1, 0.85, 0.45]));
    else out.push(at(z.x, z.y, z.r + 6 * Math.max(0, 1 - a / SKY_STRIKE.show), 1.5 * Math.max(0, 1 - a / SKY_STRIKE.show), [0.8, 0.88, 1]));
  }
  return out;
}
