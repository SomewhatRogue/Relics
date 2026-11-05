/**
 * The wand's storm stream, seen (sim/stream.ts decides it; this only reads the hero's `stream`): a jagged
 * line of lightning from the wand's tip to the goblin it holds, re-jagged every frame, flickering, and
 * brighter, thicker and forking more at each step of build (a flare as each tap adds one). With nothing
 * in reach it crackles a little way out of the hand, as built as the stream is. Flat view and the 2.5D overlay alike, by a projection of the floor to the screen, and its
 * light. Cosmetic only: Math.random is fine here.
 */
import type { ArenaRoom } from '../sim/room';
import { STREAM_TOP, streaming } from '../sim/stream';
import type { Enemy, Hero } from '../sim/types';

/** Floor (x, z) at height y (tiles) to the screen. */
type Proj = (x: number, y: number, z: number) => [number, number];
/** Where a body is drawn now (2.5D eases them; flat draws them where they are). */
type At = (key: string, x: number, y: number) => [number, number];
const here: At = (_k, x, y) => [x, y];

/** How far built, 0 (one step) to 1 (all three). */
const builtK = (h: Hero) => (Math.min(STREAM_TOP, h.stream!.step ?? 1) - 1) / (STREAM_TOP - 1);
/** A flare as a tap adds a step: 1 at the tap, gone in a fifth of a second. */
const flareK = (h: Hero, now: number) => Math.max(0, 1 - (now - h.stream!.at) / 0.2);

/** The streams on now: the hero, the goblin held (if any), how far built, and the tap's flare. */
export function streamsOn(room: ArenaRoom): { h: Hero; e?: Enemy; k: number; f: number }[] {
  const out: { h: Hero; e?: Enemy; k: number; f: number }[] = [];
  for (const h of room.heroes) {
    if (!streaming(h, room.time)) continue;
    const e = h.stream!.id ? room.enemies.find((o) => o.id === h.stream!.id && o.act !== 'dead') : undefined;
    out.push({ h, e, k: builtK(h), f: flareK(h, room.time) });
  }
  return out;
}

/** One jagged line of single pixels from a to b, `wob` px of wander. */
function jag(g: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, col: string, a: number, wob: number, thick: number): void {
  const n = Math.max(2, Math.round(Math.hypot(bx - ax, by - ay) / 5));
  g.globalAlpha = a;
  g.fillStyle = col;
  let px = ax, py = ay;
  for (let i = 1; i <= n; i++) {
    const t = i / n, last = i === n, nx = ax + (bx - ax) * t + (last ? 0 : (Math.random() - 0.5) * wob), ny = ay + (by - ay) * t + (last ? 0 : (Math.random() - 0.5) * wob);
    const steps = Math.max(1, Math.round(Math.hypot(nx - px, ny - py)));
    for (let s = 0; s <= steps; s++) g.fillRect(Math.round(px + ((nx - px) * s) / steps), Math.round(py + ((ny - py) * s) / steps), thick, thick);
    (px = nx), (py = ny);
  }
}

/** Every stream, drawn. */
export function drawStreams(g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj, at: At = here): void {
  for (const { h, e, k, f } of streamsOn(room)) {
    const [hx, hz] = at('h:' + h.id, h.x, h.y), [ax, ay] = P(hx + h.fx * 0.35, 0.72, hz + h.fy * 0.35);
    if (!e) {
      // Nothing in reach: a short crackle out of the hand, longer and brighter the more it's built.
      const [bx, by] = P(hx + h.fx * (1.1 + 0.5 * k), 0.7, hz + h.fy * (1.1 + 0.5 * k));
      if (Math.random() < 0.7 + 0.2 * k) jag(g, ax, ay, bx, by, k > 0.5 ? '#ffffff' : '#fff27a', 0.7 + 0.3 * Math.max(k, f), 5, k >= 1 ? 2 : 1);
      continue;
    }
    const [ex, ez] = at('e:' + e.id, e.x, e.y), [bx, by] = P(ex, 0.55, ez);
    // It flickers: now and then a frame dims, less often the more it's built (never in a tap's flare).
    const flick = f > 0 ? 1 : Math.random() < 0.25 - 0.15 * k ? 0.45 : 1, hot = Math.min(1, k + 0.5 * f);
    // Each step thicker: a wide faint halo (two pixels from the second step, three at the third), the
    // bright line (two pixels at the third), and a white core from the second.
    jag(g, ax, ay, bx, by, '#c8c070', (0.35 + 0.35 * hot) * flick, 7 + 4 * k, 1 + Math.round(2 * k));
    jag(g, ax, ay, bx, by, '#fff27a', (0.6 + 0.4 * hot) * flick, 4 + 3 * k, k >= 1 ? 2 : 1);
    if (k > 0.3 || f > 0) jag(g, ax, ay, bx, by, '#ffffff', (0.4 + 0.6 * hot) * flick, 3, 1);
    // Forks off the line, more at each step.
    for (let i = 0; i < Math.round(1 + 5 * k + 2 * f); i++) {
      const t = 0.2 + Math.random() * 0.7, fx = ax + (bx - ax) * t, fy = ay + (by - ay) * t;
      jag(g, fx, fy, fx + (Math.random() - 0.5) * (8 + 10 * k), fy + (Math.random() - 0.5) * (6 + 8 * k), '#fff27a', 0.7 * flick, 3, 1);
    }
    // Fully built, the low pulse it hops on to a second goblin: a thin, faint line.
    const o = h.stream!.hop ? room.enemies.find((x) => x.id === h.stream!.hop && x.act !== 'dead') : undefined;
    if (o) {
      const [ox, oz] = at('e:' + o.id, o.x, o.y), [cx, cy] = P(ox, 0.55, oz);
      jag(g, bx, by, cx, cy, '#fff27a', 0.55 * flick, 4, 1);
      g.globalAlpha = 0.8;
      g.fillStyle = '#ffffff';
      g.fillRect(Math.round(cx + (Math.random() - 0.5) * 5), Math.round(cy + (Math.random() - 0.5) * 5), 1, 1);
    }
    // Sparks where it bites.
    g.globalAlpha = 0.9;
    g.fillStyle = '#ffffff';
    for (let i = 0; i < 2 + 4 * k; i++) g.fillRect(Math.round(bx + (Math.random() - 0.5) * 8), Math.round(by + (Math.random() - 0.5) * 8), 1, 1);
  }
  g.globalAlpha = 1;
}

/** Their light, in tiles (`at` places one for the caller's view): along the line, brighter as it builds. */
export function streamLights<L>(room: ArenaRoom, at: (x: number, y: number, r: number, i: number, c: [number, number, number]) => L): L[] {
  const out: L[] = [];
  for (const { h, e, k, f } of streamsOn(room)) {
    const x = e ? (h.x + e.x) / 2 : h.x + h.fx * 0.6, y = e ? (h.y + e.y) / 2 : h.y + h.fy * 0.6;
    out.push(at(x, y, 1.6 + 1.8 * k + f, (0.35 + 0.55 * k + 0.3 * f) * (0.8 + Math.random() * 0.3), [1, 0.95, 0.6]));
  }
  return out;
}
