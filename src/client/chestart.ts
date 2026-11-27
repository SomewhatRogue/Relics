/**
 * A chest, drawn by code the tile way (Kyle, 2026-11-27: "chests don't look cool enough in 2.5D"): three-quarter on,
 * light from the upper left, clean dark outlines, a few shades a material. Its trim by its tier: plain and fine iron,
 * forged and pre-war iron with a stone in the lock, touched and turning gold, hungry black iron veined red and
 * breathing. Shut, it sits heavy with a glint on its lock; opening, it shakes and the lid lifts on a seam of the tier's
 * light with motes rising; open, the lid stands back, coin glints inside and the tier's light comes up out of it.
 * Both views draw it (scene.ts, three/cards3d.ts); (x, y) is where it stands on the floor.
 */
import type { Chest } from '../sim/chests';
import { TIERS } from '../shared/gear';
import type { Ctx } from './draw';

const OUT = '#120c08';
const WOOD = ['#2e1d10', '#4a3019', '#6b4628', '#8a5e34', '#a8784a'];
const IRON = ['#25232b', '#45434e', '#6a6876', '#9a98a6'];
const GOLD = ['#5a3a10', '#9a6a1e', '#d4a537', '#ffe08a'];
const BLACK = ['#0e0c10', '#1e1a22', '#2e2834', '#4a4250'];

/** The trim's shades for a tier. */
const trimOf = (tier: Chest['tier']) => (tier === 'touched' || tier === 'turning' ? GOLD : tier === 'hungry' ? BLACK : IRON);

function rect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string): void {
  g.fillStyle = col;
  g.fillRect(x, y, w, h);
}

/** The box: front planks (lit from the left), its top edge, the bands and the lock. `L`, `T`: its left and the top of the front. */
function box(g: CanvasRenderingContext2D, L: number, T: number, trim: string[], tier: Chest['tier'], now: number, glow: CanvasRenderingContext2D, lit: boolean): void {
  const W = 24, H = 10;
  rect(g, L - 1, T - 1, W + 2, H + 2, OUT);
  rect(g, L, T, W, H, WOOD[2]);
  // Planks: a light top board, a seam, a shadowed foot; lighter to the left, darker to the right.
  rect(g, L, T, W, 1, WOOD[3]), rect(g, L, T + 4, W, 1, WOOD[1]), rect(g, L, T + H - 2, W, 2, WOOD[1]);
  rect(g, L, T, 2, H - 2, WOOD[3]), rect(g, L + W - 2, T, 2, H, WOOD[1]);
  rect(g, L + 6, T + 6, 2, 1, WOOD[1]), rect(g, L + 16, T + 2, 3, 1, WOOD[1]);
  // The bands: one at each end and the corners.
  for (const x of [L + 3, L + W - 6]) rect(g, x, T, 3, H, trim[1]), rect(g, x, T, 1, H, trim[2]), rect(g, x + 2, T, 1, H, trim[0]);
  for (const x of [L, L + W - 2]) rect(g, x, T + H - 3, 2, 3, trim[1]), rect(g, x, T, 2, 2, trim[1]);
  // The rivets catch the light.
  for (const x of [L + 4, L + W - 5]) rect(g, x, T + 2, 1, 1, trim[3]), rect(g, x, T + 7, 1, 1, trim[3]);
  // The lock plate, and its stone or keyhole.
  rect(g, L + 9, T + 1, 6, 6, OUT), rect(g, L + 10, T + 2, 4, 4, trim[2]), rect(g, L + 10, T + 2, 4, 1, trim[3]), rect(g, L + 13, T + 3, 1, 3, trim[1]);
  const stone = tier !== 'plain' && tier !== 'fine';
  if (stone && lit) {
    glow.fillStyle = TIERS[tier].col;
    glow.globalAlpha = 0.75 + 0.25 * Math.sin(now * (tier === 'hungry' ? 3 : 5));
    glow.fillRect(L + 11, T + 3, 2, 2);
    glow.globalAlpha = 1;
  } else rect(g, L + 11, T + 4, 2, 2, OUT);
  // Hungry: red veins in the black iron.
  if (tier === 'hungry' && lit) {
    glow.fillStyle = TIERS.hungry.col;
    glow.globalAlpha = 0.35 + 0.3 * Math.sin(now * 2.5);
    glow.fillRect(L + 4, T + 3, 1, 3), glow.fillRect(L + W - 5, T + 4, 1, 4), glow.fillRect(L + 2, T + H - 2, 3, 1);
    glow.globalAlpha = 1;
  }
}

/** The lid shut: domed, three boards, the bands over it; `L` its left, `B` its bottom edge. */
function lidShut(g: CanvasRenderingContext2D, L: number, B: number, trim: string[]): void {
  const rows: [number, number][] = [[3, 21 - 3], [1, 22], [0, 24], [0, 24], [0, 24], [0, 24]];
  rows.forEach(([x0, w], i) => rect(g, L + x0 - 1, B - rows.length + i - 1, w + 2, 1, OUT));
  rect(g, L - 1, B - 1, 26, 1, OUT);
  rows.forEach(([x0, w], i) => {
    const y = B - rows.length + i, shade = i === 0 ? WOOD[4] : i < 3 ? WOOD[3] : WOOD[2];
    rect(g, L + x0, y, w, 1, shade);
    rect(g, L + x0 + w - 3, y, 3, 1, WOOD[1]);
  });
  // The boards' seams along the top, and the lid's lip in shadow.
  rect(g, L + 2, B - 4, 20, 1, WOOD[2]), rect(g, L, B - 1, 24, 1, WOOD[1]);
  for (const x of [3, 18]) rect(g, L + x, B - 6, 3, 6, trim[1]), rect(g, L + x, B - 6, 1, 6, trim[2]), rect(g, L + x, B - 5, 3, 1, trim[3]);
  // The hasp hanging over the lock.
  rect(g, L + 10, B - 2, 4, 3, OUT), rect(g, L + 11, B - 2, 2, 2, trim[2]);
}

/** The lid standing back, open: seen from below, its inside dark, the bands on its rim; `lift` how far up it's swung (px). */
function lidBack(g: CanvasRenderingContext2D, L: number, B: number, trim: string[], lift: number): void {
  const h = Math.max(2, Math.min(7, lift));
  rect(g, L - 1, B - h - 1, 26, h + 2, OUT);
  rect(g, L, B - h, 24, h, WOOD[1]);
  rect(g, L, B - h, 24, 1, WOOD[2]);
  for (const x of [3, 18]) rect(g, L + x, B - h, 3, h, trim[0]), rect(g, L + x, B - h, 1, h, trim[1]);
}

/** Motes of the tier's light going up from `top`, `high` pixels at most. */
function motes(gl: CanvasRenderingContext2D, L: number, top: number, id: number, now: number, pulse: number, high: number): void {
  for (let i = 0; i < 6; i++) {
    const rise = (now * 16 + i * 5.7 + id) % high;
    gl.globalAlpha = (1 - rise / high) * pulse;
    gl.fillRect(L + 3 + ((i * 7 + id) % 18), Math.round(top - rise), 1, 1);
  }
}

/** A chest at (x, y) on the floor, shut, opening or open. */
export function drawChestArt(c: Ctx, ch: Chest, x: number, y: number): void {
  const g = c.lit, gl = c.glow, now = c.now, trim = trimOf(ch.tier), col = TIERS[ch.tier].col;
  const k = ch.state === 'shut' ? 0 : ch.state === 'opening' ? Math.min(1, ch.t / 1.2) : 1;
  // It strains as it gives: a shake that grows, then still once it's open.
  const jx = ch.state === 'opening' ? Math.round(Math.sin(now * 40) * (k > 0.6 ? 1 : 0.5)) : 0;
  const L = Math.round(x - 12 + jx), T = Math.round(y - 11);
  // Its shadow on the floor, longer to the lower right.
  g.globalAlpha = 0.45;
  rect(g, L + 1, T + 10, 26, 2, '#000000'), rect(g, L + 3, T + 12, 22, 1, '#000000');
  g.globalAlpha = 1;
  if (k <= 0) {
    box(g, L, T, trim, ch.tier, now, gl, true);
    lidShut(g, L, T, trim);
    // A glint running along the lid now and then.
    const run = (now * 0.7 + ch.id * 0.37) % 3;
    if (run < 1) (gl.globalAlpha = 0.6 * Math.sin(run * Math.PI)), (gl.fillStyle = '#ffffff'), gl.fillRect(L + 2 + Math.round(run * 20), T - 5, 2, 1), (gl.globalAlpha = 1);
  } else if (k < 0.75) {
    // Opening: the lid lifting on a seam of the tier's light, wider as it gives.
    const gap = Math.max(1, Math.round((k / 0.75) * 4)), pulse = ch.tier === 'hungry' ? 0.55 + 0.45 * Math.sin(now * 7) : 1;
    rect(g, L - 1, T - gap - 1, 26, gap + 1, OUT);
    box(g, L, T, trim, ch.tier, now, gl, true);
    gl.fillStyle = col;
    gl.globalAlpha = (0.6 + 0.4 * k) * pulse;
    gl.fillRect(L, T - gap, 24, gap);
    // Light spilling out round the lid's edges and up past it.
    for (let i = 0; i < 6; i++) (gl.globalAlpha = (0.5 - i * 0.08) * pulse), gl.fillRect(L - 1 - (i % 2), T - gap - 7 - i, 26 + (i % 2) * 2, 1);
    lidShut(g, L, T - gap, trim);
    motes(gl, L, T - gap - 6, ch.id, now, pulse, 12);
    gl.globalAlpha = 1;
  } else {
    // Open: the lid stood back behind, the dark mouth with the coin glints in it, the light coming up out of it.
    const pulse = ch.tier === 'hungry' ? 0.55 + 0.45 * Math.sin(now * 7) : 1;
    lidBack(g, L, T - 3, trim, 8);
    rect(g, L - 1, T - 4, 26, 5, OUT), rect(g, L, T - 3, 24, 3, '#0a0705');
    for (const [px, py, s] of [[4, -2, 0], [7, -3, 1.3], [10, -2, 2.1], [13, -3, 0.4], [16, -2, 1.7], [19, -2, 0.9]] as const) rect(g, L + px, T + py, 2, 1, Math.sin(now * 3 + s) > 0.3 ? '#ffe08a' : '#b8862a');
    box(g, L, T, trim, ch.tier, now, gl, true);
    gl.fillStyle = col;
    gl.globalAlpha = 0.85 * pulse;
    gl.fillRect(L + 1, T - 3, 22, 2);
    // The shaft: up out of the mouth, narrowing and fading, with a flicker along it.
    const tall = 24;
    for (let i = 0; i < tall; i++) {
      const w = Math.round(20 - (i / tall) * 10), fl = 0.85 + 0.15 * Math.sin(now * 9 + i * 0.7);
      gl.globalAlpha = (1 - i / tall) * 0.6 * pulse * fl;
      gl.fillRect(L + 12 - (w >> 1), T - 4 - i, w, 1);
    }
    motes(gl, L, T - 4, ch.id, now, pulse, 26);
    gl.globalAlpha = 1;
  }
  // Chained shut: two chains crossed over it.
  if (ch.chained && ch.state === 'shut') {
    for (let i = 0; i < 12; i++) {
      const cl = i % 2 ? IRON[2] : IRON[3];
      rect(g, L + i * 2 - 1, T - 6 + i, 3, 2, OUT), rect(g, L + 22 - i * 2, T - 6 + i, 3, 2, OUT);
      rect(g, L + i * 2, T - 6 + i, 2, 1, cl), rect(g, L + 22 - i * 2, T - 6 + i, 2, 1, cl);
    }
    // The padlock where they cross.
    rect(g, L + 10, T - 1, 5, 5, OUT), rect(g, L + 11, T, 3, 3, IRON[2]), rect(g, L + 11, T, 3, 1, IRON[3]);
  }
}
