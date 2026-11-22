/**
 * The living world, L3: laundry lines. Between two houses that face each other across a lane (two to four tiles) a
 * line is strung at about two tiles up, sagging a little, with three to five cloths pegged on it in dull colours that
 * stir a pixel. Found from the map (the walls that face across a lane), so they stay right if the town is laid out
 * again. The foot is the line's middle; it is drawn to either side, and never wider than a card (96 pixels).
 */
import type { GameMap } from '../shared/arena';
import { doorAt } from '../shared/arena';
import type { Ctx } from './draw';

export interface Line { x: number; y: number; len: number; seed: number }

const hash = (a: number, b: number) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const HOMES = new Set(['house', 'hall', 'forge', 'tavern']);
/** Dull cloth: grey, rust, blue-grey, bone, moss, each with its lit and shaded tone. */
const TONES = [['#6a6a5c', '#8a8a78', '#46463c'], ['#74483c', '#946050', '#4c2e26'], ['#4c5c68', '#6a7c88', '#303c46'], ['#8e8870', '#aaa48a', '#64604c'], ['#5a6644', '#78865a', '#3a442c']];

/** The lane lines the map's houses allow: at most three, each at least four tiles from the last. */
export function laundryLines(m: GameMap, taken: { x: number; y: number }[] = []): Line[] {
  const homes = m.blocks.filter((b) => HOMES.has(b.kind) && !b.ruined && b.w >= 2 && b.h >= 2);
  const doors = homes.filter((b) => b.door || b.face || b.kind === 'house').map((b) => doorAt(b));
  const out: Line[] = [];
  const cands: Line[] = [];
  for (const a of homes) for (const b of homes) {
    const gap = b.x - (a.x + a.w);
    if (a === b || gap < 2 || gap > 4) continue;
    const y0 = Math.max(a.y, b.y) + 0.5, y1 = Math.min(a.y + a.h, b.y + b.h) - 0.5;
    if (y1 - y0 < 0.5) continue;
    // The y's worth trying: spaced down the shared stretch.
    for (let y = y0; y <= y1; y += 0.5) {
      const xa = a.x + a.w, xb = b.x;
      if (doors.some((d) => Math.abs(d.y - y) < 0.4 && (Math.abs(d.x - xa) < 0.9 || Math.abs(d.x - xb) < 0.9))) continue;
      if (m.blocks.some((o) => o !== a && o !== b && !o.ruined && o.x < xb + 0.2 && o.x + o.w > xa - 0.2 && o.y < y + 0.5 && o.y + o.h > y - 0.5)) continue;
      if (m.rounds.some((r) => r.x > xa - 0.3 && r.x < xb + 0.3 && Math.abs(r.y - y) < (r.kind === 'pots' || r.kind === 'post' ? 0.4 : 0.7) && (r.kind === 'tree' || r.kind === 'post' || r.kind === 'well' || r.kind === 'clothesline' || r.kind === 'pots'))) continue;
      if (taken.some((t) => Math.abs(t.y - y) < 1.1 && (Math.abs(t.x - xa) < 1.1 || Math.abs(t.x - xb) < 1.1))) continue;
      cands.push({ x: (xa + xb) / 2, y, len: gap, seed: hash(a.x + b.x, y) });
    }
  }
  cands.sort((p, q) => p.seed - q.seed);
  for (const l of cands) if (out.length < 3 && out.every((o) => Math.hypot(o.x - l.x, o.y - l.y) > 2.4)) out.push(l);
  return out;
}

const R = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string) => ((g.fillStyle = col), g.fillRect(x, y, w, h));

/** One cloth hanging from (x, y): a shirt, a sheet, a rag or trousers, its foot swaying up to a pixel. */
function cloth(g: CanvasRenderingContext2D, x: number, y: number, kind: number, tone: string[], sway: number): void {
  const rows = kind === 0 ? 8 : kind === 1 ? 11 : kind === 2 ? 6 : 10, w = kind === 1 ? 8 : kind === 2 ? 5 : kind === 3 ? 6 : 5;
  for (let j = 0; j < rows; j++) {
    const o = Math.round((sway * j) / rows), shirt = kind === 0 && j < 3, legs = kind === 3 && j >= 5;
    const ww = shirt ? 8 : w, x0 = x - Math.floor(ww / 2) + o;
    if (legs) {
      R(g, x0, y + j, 2, 1, tone[0]), R(g, x0 + w - 2, y + j, 2, 1, tone[0]);
      R(g, x0, y + j, 1, 1, tone[1]);
      continue;
    }
    R(g, x0, y + j, ww, 1, j === rows - 1 ? tone[2] : tone[0]);
    R(g, x0, y + j, 1, 1, tone[1]), R(g, x0 + ww - 1, y + j, 1, 1, tone[2]);
    if (j === 0) R(g, x0, y, ww, 1, tone[1]);
  }
}

export function drawLine(c: Ctx, l: Line, px: number, py: number): void {
  const g = c.lit, X = Math.round(px), Y = Math.round(py), W = Math.round(l.len * 20), half = Math.floor(W / 2);
  const sag = (i: number) => Math.round(3 * (1 - Math.pow((2 * i) / W - 1, 2)));
  for (let i = 0; i <= W; i++) R(g, X - half + i, Y + sag(i), 1, 1, i % 2 ? '#b4a478' : '#8a7c58');
  const n = 3 + Math.floor(l.seed * 3);
  for (let k = 0; k < n; k++) {
    const i = Math.round(((k + 0.5) / n) * W + (hash(l.seed * 9, k) - 0.5) * 4), sway = Math.sin(c.now * 0.8 + l.seed * 20 + k * 1.7) * 1.2;
    const kind = Math.floor(hash(l.seed * 5, k + 3) * 4);
    cloth(g, X - half + i, Y + sag(i) + 1, kind, TONES[Math.floor(hash(l.seed * 7, k) * TONES.length)], sway);
    R(g, X - half + i - 1, Y + sag(i), 1, 2, '#d4c8a0');
  }
}
