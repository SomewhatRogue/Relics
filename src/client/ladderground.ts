/**
 * The movement ladder's ground, drawn from the room's own zones at the size they're judged at
 * (sim/ladderrogue.ts, laddermage.ts, taunt.ts): a Rogue's caltrops (iron points scattered over the
 * patch, its edge dotted so the reach reads), a BLINK BURST's ring of the element, and a TAUNT's roar
 * out to its reach in red. Flat view and the 2.5D overlay alike (spellground.ts calls it with its
 * projection). Cosmetic only.
 */
import type { ArenaRoom } from '../sim/room';
import type { Zone } from '../sim/types';
import { EL_COL } from './palette';

type Proj = (x: number, y: number, z: number) => [number, number];

const dot = (g: CanvasRenderingContext2D, x: number, y: number, col: string, a: number) => {
  g.globalAlpha = Math.max(0, Math.min(1, a));
  g.fillStyle = col;
  g.fillRect(Math.round(x), Math.round(y), 1, 1);
};

/** The round edge of a zone at `r`, dotted every `step` of a turn. */
function edge(g: CanvasRenderingContext2D, z: Zone, r: number, P: Proj, col: string, a: number, n: number, gap = 1): void {
  for (let i = 0; i < n; i++) {
    if (i % gap) continue;
    const t = (i / n) * Math.PI * 2, [x, y] = P(z.x + Math.cos(t) * r, 0.02, z.y + Math.sin(t) * r);
    dot(g, x, y, col, a);
  }
}

/** Caltrops: points in a fixed scatter (by the patch's place, so they hold still), the edge dotted. */
function caltrops(g: CanvasRenderingContext2D, z: Zone, P: Proj, t: number, ppu: number): void {
  const k = Math.min(1, (z.until - t) / 0.8, (t - (z.at ?? t)) / 0.15 + 0.2), n = Math.round(z.r * z.r * 20);
  let s = Math.floor(z.x * 977 + z.y * 131) >>> 0;
  const rnd = () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * z.r * 0.95, [x, y] = P(z.x + Math.cos(a) * d, 0.02, z.y + Math.sin(a) * d);
    // A spike: a bright point over two dark feet.
    dot(g, x, y - 1, '#e8e4f0', k);
    dot(g, x - 1, y, '#4a4652', k);
    dot(g, x + 1, y, '#6a6672', k);
    dot(g, x, y, '#9a96a4', k);
  }
  edge(g, z, z.r, P, '#a8a4b4', 0.7 * k, Math.max(24, Math.round(z.r * ppu * 4)), 2);
}

/** A ring sweeping out to the zone's reach and holding there as it fades: the reach that was judged. */
function ring(g: CanvasRenderingContext2D, z: Zone, P: Proj, t: number, ppu: number, col: string, fill: boolean): void {
  const life = Math.max(0.01, z.until - (z.at ?? z.until - 0.4)), p = Math.min(1, (t - (z.at ?? t)) / (life * 0.4)), k = Math.min(1, (z.until - t) / (life * 0.6));
  const n = Math.max(32, Math.round(z.r * ppu * 7));
  edge(g, z, z.r, P, col, 0.95 * k, n);
  edge(g, z, z.r * p, P, '#ffffff', 0.6 * k * (1 - p * 0.5), n, 2);
  if (!fill) return;
  for (let i = 0; i < z.r * z.r * 18; i++) {
    const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * z.r * p, [x, y] = P(z.x + Math.cos(a) * d, 0.05, z.y + Math.sin(a) * d);
    dot(g, x, y, col, 0.6 * k);
  }
}

/** Every ladder zone in the room, by the caller's projection (`ppu`: its pixels a tile). */
export function drawLadderGround(g: CanvasRenderingContext2D, room: ArenaRoom, P: Proj, ppu: number): void {
  for (const z of room.zones) {
    if (room.time >= z.until) continue;
    if (z.kind === 'caltrops') caltrops(g, z, P, room.time, ppu);
    else if (z.kind === 'blinkburst') ring(g, z, P, room.time, ppu, EL_COL[z.el as keyof typeof EL_COL] ?? '#c9a8ff', true);
    else if (z.kind === 'taunt') ring(g, z, P, room.time, ppu, '#e23a30', false);
  }
  g.globalAlpha = 1;
}
