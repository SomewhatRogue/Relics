/**
 * A staff's fire pit on the floor (sim/firepit.ts judges it), drawn at the size it's judged at: while it
 * catches, the circle filling from the middle in a warm orange-red; then the whole circle burning, a
 * flicker of hotter fire over it, flames licking up and embers lifting. Its edge is striped all the way
 * round from the moment it's dropped, the game's sign for "this hurts you, get out", because it burns
 * friends too. Orange-red, not the goblins' pure red, and never gold (gold spares friends). Flat view and
 * the 2.5D overlay alike (spellground.ts calls it with each view's projection), and the light it gives.
 * Cosmetic only: Math.random is fine here.
 */
import { FIRE_PIT } from '../shared/tuning';
import type { ArenaRoom } from '../sim/room';
import type { Zone } from '../sim/types';

type Proj = (x: number, y: number, z: number) => [number, number];

/** The pit's fire: its body, the flicker over it, the tongues. The stripes are the striped telegraph's. */
export const PIT = { body: '#f2622a', flick: '#ff8c32', hot: '#ffb050', dark: '#a8321a', stripe: ['#ffd040', '#2a1408'] };

const clamp = (v: number) => Math.max(0, Math.min(1, v));
/** How far it has caught (0 just dropped, 1 burning), and how much of it is left as it goes out. */
export const pitCatch = (z: Zone, t: number) => clamp((t - ((z.at ?? t) - FIRE_PIT.catch)) / FIRE_PIT.catch);
const pitFade = (z: Zone, t: number) => clamp((z.until - t) / 0.6);

/** The circle `r` round, projected, as a path. */
function disc(g: CanvasRenderingContext2D, z: Zone, r: number, P: Proj, n: number): [number, number, number, number] {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, [x, y] = P(z.x + Math.cos(a) * r, 0.02, z.y + Math.sin(a) * r);
    if (i) g.lineTo(x, y);
    else g.moveTo(x, y);
    (x0 = Math.min(x0, x)), (y0 = Math.min(y0, y)), (x1 = Math.max(x1, x)), (y1 = Math.max(y1, y));
  }
  g.closePath();
  return [Math.floor(x0), Math.floor(y0), Math.ceil(x1), Math.ceil(y1)];
}

const dot = (g: CanvasRenderingContext2D, x: number, y: number, col: string, a: number, h = 1) => {
  g.globalAlpha = clamp(a);
  g.fillStyle = col;
  g.fillRect(Math.round(x), Math.round(y), 1, h);
};

/** One pit. `ppu`: the view's pixels a tile. */
function pit(g: CanvasRenderingContext2D, z: Zone, P: Proj, t: number, ppu: number): void {
  const p = pitCatch(z, t), lit = t >= (z.at ?? 0), k = pitFade(z, t), n = Math.max(32, Math.round(z.r * ppu * 2));
  // The whole circle faintly, so the reach reads at once, and the part caught filled.
  disc(g, z, z.r, P, n);
  g.fillStyle = PIT.body;
  g.globalAlpha = 0.18 * k;
  g.fill();
  const [x0, y0, x1, y1] = disc(g, z, z.r * (lit ? 1 : p), P, n);
  g.globalAlpha = (lit ? 0.5 : 0.45 + 0.1 * Math.sin(t * 30)) * k;
  g.fill();
  if (lit) {
    // A flicker of hotter fire over it, in a dither that shifts every frame; dark scorches between.
    g.save();
    g.clip();
    for (let y = y0; y <= y1; y += 2) for (let x = x0 + ((y >> 1) & 1); x <= x1; x += 2) {
      const f = Math.random();
      if (f > 0.55) dot(g, x, y, f > 0.93 ? PIT.hot : PIT.flick, (0.35 + 0.4 * f) * k);
      else if (f < 0.08) dot(g, x, y, PIT.dark, 0.5 * k);
    }
    g.restore();
    // Flames licking up all over it, and embers off the tops.
    for (let i = 0, m = Math.round(z.r * z.r * (z.big ? 9 : 7)); i < m; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * z.r * 0.95, f = Math.random();
      const fx = z.x + Math.cos(a) * d, fy = z.y + Math.sin(a) * d, tall = (z.big ? 0.5 : 0.4) * (0.3 + 0.7 * f) * Math.min(1, k * 1.5);
      const [bx, by] = P(fx, 0, fy), [, top] = P(fx, tall, fy);
      dot(g, bx, top, f > 0.6 ? PIT.flick : PIT.body, (0.6 + 0.4 * f) * k, Math.max(1, Math.round(by - top)));
      dot(g, bx, top, PIT.hot, 0.8 * k);
      if (f > 0.9) dot(g, bx + (Math.random() - 0.5) * 3, top - 2 - Math.random() * 5, PIT.hot, 0.7 * k);
    }
  }
  // The striped edge, two pixels deep, all the way round from the drop: get out of it.
  const m = Math.max(48, Math.round(z.r * ppu * 7));
  for (let i = 0; i < m; i++) {
    const a = (i / m) * Math.PI * 2, col = PIT.stripe[Math.floor((a / (Math.PI * 2)) * 36) % 2];
    for (const r of [z.r, z.r - 1 / ppu]) {
      const [x, y] = P(z.x + Math.cos(a) * r, 0.03, z.y + Math.sin(a) * r);
      dot(g, x, y, col, 0.95 * k);
    }
  }
}

/** Every fire pit in the room, by the caller's projection. */
export function drawPits(g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj, ppu: number): void {
  for (const z of room.zones) if (z.kind === 'firepit' && room.time < z.until) pit(g, z, P, room.time, ppu);
  g.globalAlpha = 1;
}

/** Their light, in tiles (`at` places one for the caller's view): a low glow as it catches, then a warm one. */
export function pitLights<L>(room: ArenaRoom, at: (x: number, y: number, r: number, i: number, c: [number, number, number]) => L): L[] {
  const out: L[] = [];
  for (const z of room.zones) {
    if (z.kind !== 'firepit' || room.time >= z.until) continue;
    const lit = room.time >= (z.at ?? 0), i = lit ? (0.85 + Math.random() * 0.12) * pitFade(z, room.time) : 0.35 * pitCatch(z, room.time);
    out.push(at(z.x, z.y, z.r + 1.2, i, [1, 0.5, 0.22]));
  }
  return out;
}

/** Where a body is drawn now (the 2.5D view eases them). */
type At = (key: string, x: number, y: number) => [number, number];
let scratch: HTMLCanvasElement | undefined;

/**
 * The 2.5D overlay lies over the whole 3D picture, bodies and all, so the pit is painted on a scratch
 * canvas first and each body standing on it is cut out (an upright oval the body's size), as the flat
 * view's sprites erase the glow under them: a goblin burning in it stays in sight.
 */
export function drawPits3(g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj, ppu: number, at?: At): void {
  const pits = room.zones.filter((z) => z.kind === 'firepit' && room.time < z.until);
  if (!pits.length) return;
  const W = g.canvas.width, H = g.canvas.height;
  scratch ??= document.createElement('canvas');
  if (scratch.width !== W || scratch.height !== H) (scratch.width = W), (scratch.height = H);
  const s = scratch.getContext('2d')!;
  s.setTransform(g.getTransform());
  s.clearRect(0, 0, W, H);
  drawPits(s, room, P, ppu);
  s.globalCompositeOperation = 'destination-out';
  s.globalAlpha = 1;
  const bodies = [...room.enemies.filter((e) => e.act !== 'dead').map((e) => ['e:' + e.id, e, e.radius] as const), ...room.heroes.filter((h) => h.act !== 'down').map((h) => ['h:' + h.id, h, 0.32] as const)];
  for (const [key, b, rad] of bodies) {
    if (!pits.some((z) => Math.hypot(b.x - z.x, b.y - z.y) <= z.r + rad + 0.3)) continue;
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
