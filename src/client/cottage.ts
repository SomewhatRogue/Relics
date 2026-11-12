/**
 * Cottages and barns out on a job, each looking like itself: thatch or shingle in one of a few
 * colours, plastered, whitewashed or stone walls, a lean-to on one side, a roof stove in, shutters
 * dark or windows lit and smoke from the chimney when the fire's going. All from the house's seed
 * (shared/houses.ts), the same one its inside comes from. The footprint never changes.
 */
import type { Block } from '../shared/arena';
import { house, type House } from '../shared/houses';
import type { Ctx } from './draw';

type Rect = (x: number, y: number, w: number, h: number, c: string) => void;

const known = new WeakMap<Block, House | null>();
/** A job's house, if this block is one (town buildings are drawn as they are). */
export function houseOf(b: Block): House | null {
  let h = known.get(b);
  if (h === undefined) known.set(b, (h = b.look !== undefined && (b.kind === 'house' || b.kind === 'barn') ? house(b.look, b.kind === 'barn' ? 'barn' : 'cottage') : null));
  return h;
}

/** Shingles: [roof, the lines between the rows]. Thatch: [straw, the darker strokes]. */
const SHINGLE = [['#5a2e22', '#7a3e2a'], ['#3e3a46', '#55505e'], ['#4a3424', '#6a4a30'], ['#3a4436', '#4e5a44']];
const THATCH = [['#8a7448', '#6b5a3a'], ['#6e6450', '#544a3a'], ['#5e4e30', '#46391f'], ['#5e6440', '#464c2e']];
const WALLS = ['#6a5a48', '#8a8070', '#5a5660'];

/** How wide the lean-to is, in pixels (0 with none). */
export const leanW = (h: House, w: number) => (h.leanTo ? Math.round(w * 0.28) : 0);

/** The two windows either side of the door, kept on the house proper (not the lean-to). */
export function windowsOf(h: House, w: number): number[] {
  const lw = leanW(h, w);
  return [Math.round(w * 0.22), Math.round(w * 0.72)].map((x) => (h.leanTo < 0 ? Math.max(x, lw + 3) : h.leanTo > 0 ? Math.min(x, w - lw - 6) : x));
}
/** Where the chimney stands on the roof (a cottage's; barns have none). */
export const chimneyOf = (h: House, w: number) => (h.leanTo > 0 ? Math.round(w * 0.2) : Math.round(w * 0.7));

/** A job's house as it stands: a better-off street's is stone under slate, no lean-to, shutters on the windows. */
export const asBuilt = (b: Block, h: House): House => (b.style === 'stone' ? { ...h, thatch: false, roof: 1, leanTo: 0 } : h);

/** Its roof, the lines between its rows, and its walls (the 2.5D view builds from these too: three/houses3d.ts). */
export function houseColours(b: Block, h: House): { roof: string; line: string; wall: string } {
  h = asBuilt(b, h);
  const [roof, line] = (h.thatch ? THATCH : SHINGLE)[h.roof % 4];
  return { roof, line, wall: b.kind === 'barn' ? '#5a3d22' : b.style === 'stone' ? WALLS[2] : WALLS[(h.roof + (h.thatch ? 1 : 0)) % 3] };
}

/** Paint the roof and front wall of a job's cottage or barn (the door and scorching come after). */
export function paintHouse(rect: Rect, b: Block, h: House, w: number, roofH: number, tall: number): void {
  h = asBuilt(b, h);
  const lw = leanW(h, w), lx = h.leanTo < 0 ? 0 : w - lw, mx = h.leanTo < 0 ? lw : 0, mw = w - lw, barn = b.kind === 'barn';
  roof(rect, h, mx, 0, mw, roofH);
  const wall = houseColours(b, h).wall;
  rect(mx, roofH, mw, tall, wall), rect(mx, roofH, mw, 1, '#14121a');
  if (barn) for (let x = mx + 2; x < mx + mw; x += 4) rect(x, roofH + 1, 1, tall - 1, '#4a3420');
  else if (wall === WALLS[2]) for (let y = roofH + 3; y < roofH + tall; y += 4) for (let x = mx + ((y >> 2) % 2) * 3; x < mx + mw; x += 6) rect(x, y, 5, 1, '#45414c');
  else for (const x of [mx, mx + mw - 2, mx + Math.round(mw * 0.35)]) rect(x, roofH + 1, 2, tall - 1, '#3e2a1a');
  // (Windows at 1.5x with the art pass, their sills where the bigger people's heads are.)
  if (!barn) for (const x of windowsOf(h, w)) rect(x - 1, roofH + tall - 24, 8, 8, '#3e2a1a'), rect(x + 1, roofH + tall - 22, 4, 4, '#14100c'), rect(x - 1, roofH + tall - 20, 8, 1, '#3e2a1a'), rect(x + 2, roofH + tall - 22, 1, 4, '#3e2a1a');
  if (b.style === 'stone') for (const x of windowsOf(h, w)) rect(x - 3, roofH + tall - 23, 2, 6, '#4a3424'), rect(x + 7, roofH + tall - 23, 2, 6, '#4a3424'), rect(x - 1, roofH + 1, 8, 1, '#6a6470');
  // Detail (the art pass): a sill under each window, a base course along the wall's foot, a crack or two.
  if (!barn) for (const x of windowsOf(h, w)) rect(x - 2, roofH + tall - 16, 10, 1, '#6a5a44'), rect(x - 1, roofH + tall - 15, 8, 1, '#2a2018');
  rect(mx, roofH + tall - 2, mw, 2, '#2e2a30');
  for (let x = mx + 3; x < mx + mw - 2; x += 7) rect(x, roofH + tall - 2, 1, 2, '#46424c');
  rect(mx + Math.round(mw * 0.15), roofH + 4, 1, 3, '#2a2420'), rect(mx + Math.round(mw * 0.15) + 1, roofH + 7, 1, 2, '#2a2420'), rect(mx + Math.round(mw * 0.82), roofH + 6, 1, 2, '#2a2420');
  if (lw) {
    // The lean-to: lower, rough boards, a plank roof.
    const drop = 7;
    rect(lx, drop, lw, roofH, '#4a3a2a');
    for (let y = drop + 2; y < drop + roofH; y += 3) rect(lx, y, lw, 1, '#3a2a1a');
    rect(lx, drop + roofH, lw, tall - drop, '#4a3420');
    for (let x = lx + 1; x < lx + lw; x += 3) rect(x, drop + roofH, 1, tall - drop, '#3a2818');
    rect(h.leanTo < 0 ? lw - 1 : lx, drop, 1, roofH + tall - drop, '#14121a');
  }
  if (!barn) {
    const cx = chimneyOf(h, w);
    rect(cx, 0, 6, Math.min(8, roofH - 2), '#57525e'), rect(cx, 0, 6, 2, '#2a2733'), rect(cx + 1, 3, 4, 1, '#45414c');
  }
  if (h.broken) hole(rect, b, mx, mw, roofH);
}

function roof(rect: Rect, h: House, x: number, y: number, w: number, d: number): void {
  const [base, line] = (h.thatch ? THATCH : SHINGLE)[h.roof % 4];
  rect(x, y, w, d, base);
  if (h.thatch) {
    // Straw laid in courses, a ragged eave along the bottom.
    for (let j = y + 1; j < y + d; j += 3) for (let i = x + (j % 2); i < x + w; i += 3) rect(i, j, 1, 2, line);
    for (let i = x; i < x + w; i += 2) rect(i, y + d - 1 - (i % 3 === 0 ? 1 : 0), 1, 2, line);
  } else {
    for (let j = y + 2; j < y + d; j += 3) {
      rect(x, j, w, 1, line);
      for (let i = x + ((j / 3) % 2) * 2; i < x + w; i += 5) rect(i, j - 2, 1, 2, line);
    }
  }
  rect(x, y, w, 1, line);
}

/** A roof stove in: a ragged hole, the rafters showing across it. */
function hole(rect: Rect, b: Block, mx: number, mw: number, roofH: number): void {
  const hx = mx + Math.round(mw * (b.x % 2 < 1 ? 0.18 : 0.45)), hw = Math.round(mw * 0.3), hh = Math.round(roofH * 0.6), hy = Math.round(roofH * 0.2);
  for (let j = 0; j < hh; j++) {
    const inset = Math.round(Math.abs(Math.sin(j * 1.7 + b.y)) * 3);
    rect(hx + inset, hy + j, hw - inset * 2 + (j % 2), 1, '#0d0b10');
  }
  for (let i = hx + 2; i < hx + hw; i += 5) rect(i, hy - 1, 2, hh + 2, '#3a2a1a');
}

/** Live on the glow: a lit house's windows (after dark) and the smoke off its chimney. */
export function drawLit(c: Ctx, h: House, x: number, top: number, w: number, roofH: number, tall: number, lamps = true): void {
  c.glow.fillStyle = '#ffd27a';
  // The windows show the fire only once it's dark enough to light the lamps (shared/lamps.ts).
  if (lamps) for (const wx of windowsOf(h, w)) c.glow.fillRect(Math.round(x + wx + 1), Math.round(top + roofH + tall - 22), 4, 4);
  const cx = x + chimneyOf(h, w) + 3;
  for (let j = 0; j < 5; j++) {
    const p = (c.now * 0.18 + j / 5 + x * 0.01) % 1;
    c.lit.globalAlpha = (1 - p) * 0.45;
    c.lit.fillStyle = p < 0.4 ? '#3a3438' : '#5a5458';
    c.lit.fillRect(Math.round(cx + Math.sin(p * 4 + j) * 2 + p * 10 - 2), Math.round(top - 2 - p * 30), 3 + Math.round(p * 3), 2);
  }
  c.lit.globalAlpha = 1;
  if (Math.floor(c.now * 4 + x) % 3 === 0) (c.glow.fillStyle = '#ff9a3c'), c.glow.fillRect(Math.round(cx), Math.round(top), 1, 1);
}
