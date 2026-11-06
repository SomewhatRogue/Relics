/**
 * The world effects on the floor, drawn from the room's own state (shared/worldfx.ts): ice on the
 * shallows (clipped to the shallow water it's judged on), a butcher's meal as a red ring filling round
 * the body (a clock, not a blow, so no striped edge), a FED butcher's red pulse at its feet, an ironhide
 * crackling once lightning has gone into it, and a jolt crackling across the surface of the water it went
 * through (from the `pooljolt` event, along the body of water the room judged). Flat view and the 2.5D
 * overlay alike, by a projection of the floor to the screen. Cosmetic only: Math.random is fine here.
 */
import { MEAL, ROD } from '../shared/tuning';
import { bodyAt, shallowAt } from '../shared/waterbody';
import type { ArenaRoom } from '../sim/room';
import type { FightEvent, Ice } from '../sim/types';

/** Floor (x, z) at height y (tiles) to the screen. */
type Proj = (x: number, y: number, z: number) => [number, number];
/** Where a body is drawn now (the 2.5D view eases them). */
type At = (key: string, x: number, y: number) => [number, number];

const RED = '#e8352a', DARK = '#5a1010', GOLD = '#ffd27a';
const ICE = ['#e8f6ff', '#bfe4f6', '#9fcfe8'];
const SPARK = ['#ffffff', '#fff27a', '#cfe8ff'];

const px = (g: CanvasRenderingContext2D, x: number, y: number, col: string, a: number, s = 1) => {
  g.globalAlpha = Math.max(0, Math.min(1, a));
  g.fillStyle = col;
  g.fillRect(Math.round(x), Math.round(y), s, s);
};

/** A jolt seen recently: when (the wall clock), and the event. */
const pools: { at: number; ev: Extract<FightEvent, { k: 'pooljolt' }> }[] = [];
const LIFE = 0.45;
/** Called by the effects (fxworld.ts) for each jolt through water. */
export function notePool(ev: Extract<FightEvent, { k: 'pooljolt' }>): void {
  pools.push({ at: performance.now() / 1000, ev });
  if (pools.length > 24) pools.shift();
}

/** Ice: pale and stepped with a little dither, white at its edge, a crack or two; fading in and out. */
function ice(g: CanvasRenderingContext2D, room: ArenaRoom, i: Ice, P: Proj, ppu: number): void {
  const t = room.time, k = Math.max(0, Math.min(1, (t - i.at) / 0.2, (i.until - t) / 0.8));
  if (k <= 0) return;
  const step = Math.max(2 / ppu, 1 / 16), size = Math.max(1, Math.ceil(step * ppu)), m = room.map;
  for (let y = i.y - i.r; y <= i.y + i.r; y += step) for (let x = i.x - i.r; x <= i.x + i.r; x += step) {
    const d = Math.hypot(x - i.x, y - i.y);
    if (d > i.r || !shallowAt(m, x, y)) continue;
    const [sx, sy] = P(x, 0.02, y), cx = Math.round(x / step), cy = Math.round(y / step), edge = d > i.r - step * 1.5 || !shallowAt(m, x + step, y) || !shallowAt(m, x - step, y);
    const band = edge ? 0 : ((cx + cy * 3 + i.id) % 7 === 0 ? 0 : (cx ^ cy) & 1 ? 1 : 2);
    px(g, sx, sy, ICE[band], (edge ? 0.85 : 0.5) * k, size);
  }
  // A crack or two across it, the same each frame.
  for (let c = 0; c < 2; c++) {
    let a = i.id * 1.7 + c * 2.4, x = i.x, y = i.y;
    for (let s = 0; s < i.r * 6; s++) {
      a += Math.sin(i.id * 3 + s * 1.3 + c) * 0.5;
      (x += Math.cos(a) * 0.12), (y += Math.sin(a) * 0.12);
      if (Math.hypot(x - i.x, y - i.y) > i.r * 0.9 || !shallowAt(m, x, y)) break;
      const [sx, sy] = P(x, 0.03, y);
      px(g, sx, sy, '#ffffff', 0.8 * k);
    }
  }
}

let scratch: HTMLCanvasElement | undefined;
/** The 2.5D overlay lies over the whole 3D picture, so ice and a jolt's crackle are painted on a scratch canvas
 *  and each body standing in them cut out (as the wall of fire does: firewalldraw.ts); a goblin held on ice
 *  gets a rim of ice round its feet, in front of its legs. */
function layer3(g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj, ppu: number, at: At, paint: (s: CanvasRenderingContext2D) => void): void {
  const W = g.canvas.width, H = g.canvas.height;
  scratch ??= document.createElement('canvas');
  if (scratch.width !== W || scratch.height !== H) (scratch.width = W), (scratch.height = H);
  const s = scratch.getContext('2d')!;
  s.setTransform(g.getTransform());
  s.clearRect(0, 0, W, H);
  paint(s);
  s.globalCompositeOperation = 'destination-out';
  s.globalAlpha = 1;
  const bodies = [...room.enemies.filter((e) => e.act !== 'dead').map((e) => ['e:' + e.id, e, e.radius] as const), ...room.heroes.filter((h) => h.act !== 'down').map((h) => ['h:' + h.id, h, 0.32] as const)];
  const feet: [number, number, number][] = [];
  for (const [key, b, rad] of bodies) {
    const [x, y] = at(key, b.x, b.y), [fx, fy] = P(x, 0, y), [, top] = P(x, rad * 3.2, y), w = rad * ppu * 1.15;
    s.beginPath();
    s.ellipse(fx, (fy + top) / 2 - 1, w, Math.max(w, (fy - top) / 2), 0, 0, Math.PI * 2);
    s.fill();
    if ('kind' in b && b.onIce) feet.push([fx, fy, w]);
  }
  s.globalCompositeOperation = 'source-over';
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.drawImage(scratch, 0, 0);
  g.restore();
  for (const [fx, fy, w] of feet) for (let j = -w; j <= w; j += 1) px(g, fx + j, fy - 1 + Math.abs(j) * 0.2, j % 3 ? ICE[0] : '#ffffff', 0.9, 2);
  g.globalAlpha = 1;
}

/** A red ring round the body, filling with the meal (the full ring faint, the part gone bright). */
function clock(g: CanvasRenderingContext2D, x: number, y: number, share: number, P: Proj, ppu: number, t: number): void {
  const r = 0.75, n = Math.max(24, Math.round(r * 2 * Math.PI * ppu * 0.6));
  for (let j = 0; j < n; j++) {
    const a = -Math.PI / 2 + (j / n) * Math.PI * 2, [sx, sy] = P(x + Math.cos(a) * r, 0.03, y + Math.sin(a) * r), on = j / n <= share;
    px(g, sx - 1, sy, on ? RED : DARK, on ? 1 : 0.6, 2);
    if (on) px(g, sx - 1, sy - 1, '#ff7a60', 0.7, 2);
  }
  // The head of it, bright.
  const a = -Math.PI / 2 + share * Math.PI * 2, [hx, hy] = P(x + Math.cos(a) * r, 0.03, y + Math.sin(a) * r);
  px(g, hx - 1, hy - 1, '#ffb0a0', 0.6 + 0.4 * Math.sin(t * 20), 3);
}

/** A jagged line along the floor from a to b, re-jagged each frame. */
function zig(g: CanvasRenderingContext2D, P: Proj, ax: number, ay: number, bx: number, by: number, k: number, cols: string[], w = 1): void {
  const [x0, y0] = P(ax, 0.04, ay), [x1, y1] = P(bx, 0.04, by), n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / 2));
  let off = 0;
  for (let j = 0; j <= n; j++) {
    off = Math.max(-3, Math.min(3, off + (Math.random() - 0.5) * 2.4));
    const x = x0 + ((x1 - x0) * j) / n, y = y0 + ((y1 - y0) * j) / n + off;
    // A blue halo under a white core.
    if (w > 1) px(g, x - 1, y - 1, '#7ab8ff', k * 0.5, w + 1);
    px(g, x, y, cols[j % cols.length], k, w);
  }
}

/** A jolt: lines over the water to each goblin, sparks dancing across the body of water round it, friends ringed gold. */
function jolt(g: CanvasRenderingContext2D, room: ArenaRoom, ev: Extract<FightEvent, { k: 'pooljolt' }>, k: number, P: Proj, ppu: number): void {
  const thick = ppu > 20 ? 2 : 1;
  for (const [x, y] of ev.to) zig(g, P, ev.x, ev.y, x, y, k, SPARK, thick);
  const far = Math.max(2, ...ev.to.map(([x, y]) => Math.hypot(x - ev.x, y - ev.y)), ...ev.spared.map(([x, y]) => Math.hypot(x - ev.x, y - ev.y)));
  const near = (x: number, y: number) => [...ev.to, ...ev.spared].some(([bx, by]) => Math.hypot(bx - x, by - y) < 0.6);
  for (let j = 0; j < Math.round(far * far * 0.7) + 14; j++) {
    const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * (far + 0.8), x = ev.x + Math.cos(a) * d, y = ev.y + Math.sin(a) * d;
    // (Not over a body standing in it: they stay in sight.)
    if (bodyAt(room.map, x, y) !== ev.body || near(x, y)) continue;
    // A fork running over the surface.
    let sx = x, sy = y;
    for (let s = 0; s < 5; s++) {
      const nx = sx + (Math.random() - 0.5) * 0.7, ny = sy + (Math.random() - 0.5) * 0.5;
      if (bodyAt(room.map, nx, ny) !== ev.body) break;
      zig(g, P, sx, sy, nx, ny, k * 0.85, SPARK, 1);
      (sx = nx), (sy = ny);
    }
  }
  // Friends it passed by: a gold ring at their feet (it spares friends).
  for (const [x, y] of ev.spared) for (let j = 0; j < 20; j++) {
    const a = (j / 20) * Math.PI * 2, [sx, sy] = P(x + Math.cos(a) * 0.45, 0.04, y + Math.sin(a) * 0.45);
    px(g, sx, sy, GOLD, k, ppu > 20 ? 2 : 1);
  }
}

/** Crackling over an ironhide lightning has gone into. */
function crackle(g: CanvasRenderingContext2D, x: number, y: number, k: number, P: Proj): void {
  for (let j = 0; j < 3; j++) {
    let h = 0.1 + Math.random() * 0.2, a = Math.random() * Math.PI * 2, cx = x + Math.cos(a) * 0.3, cy = y + Math.sin(a) * 0.3;
    for (let s = 0; s < 5; s++) {
      const [sx, sy] = P(cx, h, cy);
      px(g, sx, sy, SPARK[s % 3], k);
      (h += 0.12 + Math.random() * 0.1), (cx += (Math.random() - 0.5) * 0.25), (cy += (Math.random() - 0.5) * 0.15);
    }
  }
}

/** Everything, in one view's projection. */
export function drawWorldGround(g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj, ppu: number, at?: At): void {
  const t = room.time, now = performance.now() / 1000;
  // Ice and a jolt's crackle: on the floor (flat), or round the bodies standing in them (2.5D).
  for (let j = pools.length - 1; j >= 0; j--) if (now - pools[j].at >= LIFE) pools.splice(j, 1);
  const floor = (s: CanvasRenderingContext2D) => {
    for (const i of room.ices ?? []) ice(s, room, i, P, ppu);
    for (const p of pools) jolt(s, room, p.ev, 1 - (now - p.at) / LIFE, P, ppu);
  };
  if (!at) floor(g);
  else if ((room.ices ?? []).length || pools.length) layer3(g, room, P, ppu, at, floor);
  for (const e of room.enemies) {
    if (e.act === 'dead') continue;
    const [ex, ey] = at ? at('e:' + e.id, e.x, e.y) : [e.x, e.y];
    if (e.meal) clock(g, e.meal.x, e.meal.y, Math.min(1, (t - e.meal.at) / Math.max(0.01, e.meal.until - e.meal.at)), P, ppu, t);
    if (e.fed) {
      // FED: a red pulse at its feet, beating.
      const beat = 0.5 + 0.5 * Math.sin(t * 7), r = 0.8 + 0.12 * beat;
      for (let j = 0; j < 40; j++) {
        const a = (j / 40) * Math.PI * 2, [sx, sy] = P(ex + Math.cos(a) * r, 0.03, ey + Math.sin(a) * r);
        if (j % 4 !== 3) px(g, sx, sy, RED, 0.5 + 0.45 * beat, 2);
      }
    }
    if (e.rodAt !== undefined && t - e.rodAt < ROD.glow) crackle(g, ex, ey, 1 - (t - e.rodAt) / ROD.glow, P);
  }
  g.globalAlpha = 1;
}

/** The light they give: ice a faint cold glow, a jolt a flash over the water, a meal a dull red. */
export function worldLights<L>(room: ArenaRoom, at: (x: number, y: number, r: number, i: number, c: [number, number, number]) => L): L[] {
  const out: L[] = [], now = performance.now() / 1000;
  for (const i of room.ices ?? []) if (room.time < i.until) out.push(at(i.x, i.y, i.r + 0.8, 0.18, [0.7, 0.9, 1]));
  for (const p of pools) out.push(at(p.ev.x, p.ev.y, 2.5, 0.5 * Math.max(0, 1 - (now - p.at) / LIFE), [0.85, 0.9, 1]));
  for (const e of room.enemies) if (e.meal && e.act !== 'dead') out.push(at(e.meal.x, e.meal.y, 1.4, 0.25, [1, 0.25, 0.2]));
  return out;
}

/** (For a test or a debug shot: how long a meal's clock runs.) */
export const MEAL_CLOCK = MEAL.time;
