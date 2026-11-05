/**
 * A staff's wall of fire (sim/firewall.ts judges it), drawn at the size it's judged at and where the room
 * has it: a band on the floor `r` either side of its middle and FIRE_WALL.deep through, filled in a warm
 * orange-red with a flicker of hotter fire over it, its edge striped all the way round (the game's sign
 * for "this hurts you, get out", because it burns friends too), and tall flame tongues standing up all
 * along it with embers lifting off, so it reads as a wall rolling and then standing. Orange-red, not the
 * goblins' pure red, and never gold (gold spares friends). Flat view and the 2.5D overlay alike
 * (spellground.ts calls it with each view's projection), and the light it gives.
 * Cosmetic only: Math.random is fine here.
 */
import { FIRE_WALL } from '../shared/tuning';
import { inWall } from '../sim/firewall';
import type { ArenaRoom } from '../sim/room';
import type { Zone } from '../sim/types';

type Proj = (x: number, y: number, z: number) => [number, number];

/** The wall's fire (the fire pit's colours): its body, the flicker, the tips; the stripes are the striped telegraph's. */
export const WALL = { body: '#f2622a', flick: '#ff8c32', hot: '#ffb050', dark: '#a8321a', stripe: ['#ffd040', '#2a1408'] };

const clamp = (v: number) => Math.max(0, Math.min(1, v));
/** How much of it is up: rising the moment it's raised, going out at the end. */
const wallUp = (z: Zone, t: number) => clamp((z.until - t) / 0.6);
const walls = (room: ArenaRoom) => room.zones.filter((z) => z.kind === 'firewall' && room.time < z.until);

/** A point on the wall's floor: `u` along its line (-r to r), `v` through it (-deep/2 to deep/2), at height `h`. */
const pt = (z: Zone, u: number, v: number) => [z.x - (z.ay ?? 0) * u + (z.ax ?? 0) * v, z.y + (z.ax ?? 0) * u + (z.ay ?? 0) * v] as const;

const dot = (g: CanvasRenderingContext2D, x: number, y: number, col: string, a: number, h = 1) => {
  g.globalAlpha = clamp(a);
  g.fillStyle = col;
  g.fillRect(Math.round(x), Math.round(y), 1, h);
};

/** The band on the floor, projected, as a path; returns its box on screen. */
function band(g: CanvasRenderingContext2D, z: Zone, P: Proj): [number, number, number, number] {
  const d = FIRE_WALL.deep / 2, c = [pt(z, -z.r, -d), pt(z, z.r, -d), pt(z, z.r, d), pt(z, -z.r, d)].map(([x, y]) => P(x, 0.02, y));
  g.beginPath();
  c.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  const xs = c.map((p) => p[0]), ys = c.map((p) => p[1]);
  return [Math.floor(Math.min(...xs)), Math.floor(Math.min(...ys)), Math.ceil(Math.max(...xs)), Math.ceil(Math.max(...ys))];
}

/** One wall. `ppu`: the view's pixels a tile. */
function wall(g: CanvasRenderingContext2D, z: Zone, P: Proj, t: number, ppu: number): void {
  const k = wallUp(z, t), rolling = t < (z.at ?? 0), d = FIRE_WALL.deep / 2;
  // The band, filled, and a flicker of hotter fire over it in a dither that shifts every frame.
  const [x0, y0, x1, y1] = band(g, z, P);
  g.fillStyle = WALL.body;
  g.globalAlpha = 0.55 * k;
  g.fill();
  g.save();
  g.clip();
  for (let y = y0; y <= y1; y += 2) for (let x = x0 + ((y >> 1) & 1); x <= x1; x += 2) {
    const f = Math.random();
    if (f > 0.5) dot(g, x, y, f > 0.92 ? WALL.hot : WALL.flick, (0.35 + 0.4 * f) * k);
    else if (f < 0.07) dot(g, x, y, WALL.dark, 0.5 * k);
  }
  g.restore();
  // The striped edge, all the way round: get out of it.
  const runs: [number, number, number, number][] = [[-z.r, -d, z.r, -d], [z.r, -d, z.r, d], [z.r, d, -z.r, d], [-z.r, d, -z.r, -d]];
  let s = 0;
  for (const [u0, v0, u1, v1] of runs) {
    const len = Math.hypot(u1 - u0, v1 - v0), m = Math.max(4, Math.round(len * ppu * 2));
    for (let i = 0; i < m; i++) {
      const f = i / m, [wx, wy] = pt(z, u0 + (u1 - u0) * f, v0 + (v1 - v0) * f), [x, y] = P(wx, 0.03, wy);
      dot(g, x, y, WALL.stripe[Math.floor((s + f * len) / 0.22) % 2], 0.95 * k);
    }
    s += len;
  }
  // Tall tongues of flame standing up all along it (back row first), tips hot, embers off the tops.
  const tall = (z.big ? 1.35 : 1.15) * Math.min(1, k * 1.5), cols = Math.max(12, Math.round(z.r * 2 * ppu * 0.9));
  for (const row of [-0.5, 0.5]) for (let i = 0; i < cols; i++) {
    const u = -z.r + ((i + 0.5 + (Math.random() - 0.5) * 0.6) / cols) * z.r * 2, v = row * d * (0.6 + Math.random() * 0.4);
    const ends = 1 - Math.pow(Math.abs(u) / z.r, 4) * 0.55, sway = 0.55 + 0.45 * Math.sin(t * 11 + i * 1.7 + row * 3);
    const h = tall * ends * sway * (0.75 + Math.random() * 0.25) * (row < 0 ? 1 : 0.8), [wx, wy] = pt(z, u, v);
    // Rolling, the flames lean back the way it came.
    const lean = rolling ? 0.25 * h : 0, [bx, by] = P(wx, 0, wy), [tx, top] = P(wx - (z.ax ?? 0) * lean, h, wy - (z.ay ?? 0) * lean);
    const n = Math.max(1, Math.round(by - top));
    dot(g, (bx + tx) / 2, top, i % 3 ? WALL.body : WALL.dark, 0.85 * k, n);
    dot(g, (bx + tx * 3) / 4, top, WALL.flick, 0.9 * k, Math.max(1, Math.round(n * 0.55)));
    dot(g, tx, top, WALL.hot, 0.95 * k, Math.max(1, Math.round(n * 0.15)));
    if (Math.random() > 0.9) dot(g, tx + (Math.random() - 0.5) * 4, top - 2 - Math.random() * 7, WALL.hot, 0.75 * k);
  }
}

/** Every wall of fire in the room, by the caller's projection. */
export function drawWalls(g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj, ppu: number): void {
  for (const z of walls(room)) wall(g, z, P, room.time, ppu);
  g.globalAlpha = 1;
}

/** Their light, in tiles (`at` places one for the caller's view): warm, a few along each wall. */
export function wallLights<L>(room: ArenaRoom, at: (x: number, y: number, r: number, i: number, c: [number, number, number]) => L): L[] {
  const out: L[] = [];
  for (const z of walls(room)) {
    const i = (0.8 + Math.random() * 0.15) * wallUp(z, room.time);
    for (const u of [-0.6, 0, 0.6]) {
      const [x, y] = pt(z, u * z.r, 0);
      out.push(at(x, y, 1.9, i, [1, 0.5, 0.22]));
    }
  }
  return out;
}

/** Where a body is drawn now (the 2.5D view eases them). */
type At = (key: string, x: number, y: number) => [number, number];
let scratch: HTMLCanvasElement | undefined;

/**
 * The 2.5D overlay lies over the whole 3D picture, bodies and all, so the wall is painted on a scratch
 * canvas first and each body standing in it is cut out (an upright oval the body's size), as the flat
 * view's sprites erase the glow under them: a goblin burning in it stays in sight.
 */
export function drawWalls3(g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj, ppu: number, at?: At): void {
  const ws = walls(room);
  if (!ws.length) return;
  const W = g.canvas.width, H = g.canvas.height;
  scratch ??= document.createElement('canvas');
  if (scratch.width !== W || scratch.height !== H) (scratch.width = W), (scratch.height = H);
  const s = scratch.getContext('2d')!;
  s.setTransform(g.getTransform());
  s.clearRect(0, 0, W, H);
  drawWalls(s, room, P, ppu);
  s.globalCompositeOperation = 'destination-out';
  s.globalAlpha = 1;
  const bodies = [...room.enemies.filter((e) => e.act !== 'dead').map((e) => ['e:' + e.id, e, e.radius] as const), ...room.heroes.filter((h) => h.act !== 'down').map((h) => ['h:' + h.id, h, 0.32] as const)];
  for (const [key, b, rad] of bodies) {
    if (!ws.some((z) => inWall(z, b, rad + 0.3))) continue;
    const [x, y] = at ? at(key, b.x, b.y) : [b.x, b.y], [fx, fy] = P(x, 0, y), [, top] = P(x, rad * 3.2, y), w = rad * ppu * 1.15;
    s.beginPath();
    s.ellipse(fx, (fy + top) / 2, w, Math.max(w, (fy - top) / 2 + 1), 0, 0, Math.PI * 2);
    s.fill();
  }
  s.globalCompositeOperation = 'source-over';
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.drawImage(scratch, 0, 0);
  g.restore();
}
