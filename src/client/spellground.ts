/**
 * A Mage's spells on the floor, drawn at the size they're judged at (sim/staffrings.ts, sim/holds.ts):
 * the staff's wall of fire (filled, striped edge, flames standing up: firewalldraw.ts), its charged ring (crackling posts
 * round the edge, lightning jumping between them, sparks inside), the wand's storm stream
 * (streamdraw.ts) and its lightning strike's gold mark and bolt (skystrikedraw.ts). Flat view and the 2.5D overlay alike, by a projection of the floor to the screen, and
 * the light each gives off. Cosmetic only: Math.random is fine here.
 */
import type { ArenaRoom } from '../sim/room';
import type { Zone } from '../sim/types';
import type { Light } from './light';
import { EL_LIGHT } from './palette';
import { drawStreams, streamLights } from './streamdraw';
import { drawSkyBolts, drawSkyMarks, skyLights } from './skystrikedraw';
import { OX, OY, PX } from './world';
import { drawLadderGround } from './ladderground';
import { drawWalls, drawWalls3, wallLights } from './firewalldraw';

/** Floor (x, z) at height y (tiles) to the screen. */
type Proj = (x: number, y: number, z: number) => [number, number];

const STORM = ['#c8c070', '#fff27a', '#ffffff'];
const dot = (g: CanvasRenderingContext2D, x: number, y: number, col: string, a: number, h = 1) => {
  g.globalAlpha = a;
  g.fillStyle = col;
  g.fillRect(Math.round(x), Math.round(y), 1, h);
};

/** How far in it is: rising as it comes up, fading as it goes. */
const fade = (z: Zone, t: number) => Math.max(0, Math.min(1, (z.until - t) / 0.6, (t - (z.at ?? t) + 0.05) / 0.25));

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

/** Where a body is drawn now (the 2.5D view eases them). */
type At = (key: string, x: number, y: number) => [number, number];

function draw(g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj, ppu: number, at?: At, over = false): void {
  // The staff's wall of fire (firewalldraw.ts; over the 3D picture, with the bodies in it cut out), then its charged ring.
  if (over) drawWalls3(g, room, P, ppu, at);
  else drawWalls(g, room, P, ppu);
  for (const z of room.zones) if (z.kind === 'stormring' && room.time < z.until) charged(g, z, P, room.time);
  // The movement ladder's caltrops, burst and roar, the same way (ladderground.ts).
  drawLadderGround(g, room, P, ppu);
  drawSkyMarks(g, room, P, ppu);
  drawStreams(g, room, P, at);
  g.globalAlpha = 1;
}

/** The flat view's glow layer. */
export function drawSpellGround(g: CanvasRenderingContext2D, room: ArenaRoom, cx: number, cy: number): void {
  draw(g, room, (x, y, z) => [OX + x * PX - cx, OY + z * PX - cy - y * PX], PX);
}

/** The flat view, over everyone: a lightning strike's bolt (skystrikedraw.ts). */
export const drawSpellSky = (g: CanvasRenderingContext2D, room: ArenaRoom, cx: number, cy: number): void =>
  drawSkyBolts(g, room, (x, y, z) => [OX + x * PX - cx, OY + z * PX - cy - y * PX]);

/** The 2.5D overlay (`P` the camera's own projection, `ppu` its pixels a tile, `at` where bodies are
 *  drawn), over everything already, so a strike's bolt too. */
export const drawSpellGround3 = (g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj, ppu: number, at?: At): void => (draw(g, room, P, ppu, at, true), drawSkyBolts(g, room, P));

/** Their light, in tiles (`at` places one for the caller's view): a wall of fire, a charged ring, a storm stream, a strike. */
export function spellLights<L>(room: ArenaRoom, at: (x: number, y: number, r: number, i: number, c: [number, number, number]) => L): L[] {
  const out: L[] = wallLights(room, at);
  for (const z of room.zones) {
    if (z.kind !== 'stormring' || room.time >= z.until) continue;
    out.push(at(z.x, z.y, z.r + 1.2, (0.55 + Math.random() * 0.2) * fade(z, room.time), EL_LIGHT[z.el]));
  }
  return out.concat(streamLights(room, at), skyLights(room, at));
}

/** The flat view's lights for them. */
export const spellLightsFlat = (room: ArenaRoom, cx: number, cy: number): Light[] =>
  spellLights(room, (x, y, r, i, c) => ({ x: OX + x * PX - cx, y: OY + y * PX - cy - 6, r: r * PX, i, c }));
