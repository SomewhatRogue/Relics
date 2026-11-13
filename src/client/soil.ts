/**
 * What the ground is made of (shared/arena.ts `Soil`, shared/ground.ts), painted once into the floor
 * canvas over the cobbles. Every 2x2 block of pixels asks which shape it falls in (the last one wins),
 * with the shapes' edges broken up by a seeded noise so nothing ends in a straight line; where the
 * answer is cobble, the floor's own cobbles show. Each material has its own colour family, dark enough
 * for the stepped lighting, apart enough to read on a phone at night.
 */
import type { GameMap, Soil } from '../shared/arena';
import { OX, OY, PX } from './world';

/** A repeatable hash of a cell (0 to 1). */
const hash = (x: number, y: number, s: number) => {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
/** Smooth value noise at a scale (tiles per lump). */
function noise(x: number, y: number, scale: number, s: number): number {
  const fx = x / scale, fy = y / scale, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
  const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
  const a = hash(ix, iy, s), b = hash(ix + 1, iy, s), c = hash(ix, iy + 1, s), d = hash(ix + 1, iy + 1, s);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

/** How far inside a shape a point is, in tiles (negative outside). */
function depth(s: Soil, x: number, y: number): number {
  if (s.line !== undefined) {
    const l2 = s.w * s.w + s.h * s.h, t = l2 ? Math.max(0, Math.min(1, ((x - s.x) * s.w + (y - s.y) * s.h) / l2)) : 0;
    return s.line - Math.hypot(x - s.x - s.w * t, y - s.y - s.h * t);
  }
  const rx = s.w / 2, ry = s.h / 2, cx = s.x + rx, cy = s.y + ry;
  if (!s.round) return Math.min(rx - Math.abs(x - cx), ry - Math.abs(y - cy));
  return (1 - Math.hypot((x - cx) / rx, (y - cy) / ry)) * Math.min(rx, ry);
}

/** Each material: its colours, dark to light, and what turns up in it. */
const FAMILY: Record<Exclude<Soil['mat'], 'cobble' | 'shade'>, string[]> = {
  earth: ['#38312c', '#3d3630', '#433b34', '#484039'],
  swept: ['#433e38', '#48433d', '#4e4842', '#534d46'],
  mud: ['#251f19', '#2a231c', '#2f271f', '#342b22'],
  wet: ['#1e2226', '#23282d', '#282e34', '#2e353c'],
  straw: ['#4a3e26', '#55472a', '#62532f', '#3e3420'],
  ash: ['#232224', '#29282b', '#302e31', '#1c1b1d'],
  grass: ['#233021', '#26331f', '#2b3923', '#2e3d25'],
  furrow: ['#2a221a', '#30271d', '#362c21', '#3c3125'],
  crop: ['#4a3e24', '#544628', '#5e4f2c', '#433822'],
  flags: ['#5c5766', '#625d6c', '#68626f', '#57525f'],
};

/** A shape's box, grown by as far as the noise can push an edge (tiles). */
const box = (s: Soil) => {
  const pad = (s.line ?? 0) + 1.2, x0 = Math.min(s.x, s.x + s.w), y0 = Math.min(s.y, s.y + s.h);
  return [x0 - pad, y0 - pad, x0 + Math.abs(s.w) + pad, y0 + Math.abs(s.h) + pad];
};

const rgb = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const RGB = new Map<string, number[]>();
const toRgb = (h: string) => RGB.get(h) ?? (RGB.set(h, rgb(h)), RGB.get(h)!);

/** What a cell is made of: the last shape it falls in, edges wobbled by noise. */
function matAt(soil: Soil[], boxes: number[][], x: number, y: number): Soil['mat'] {
  const wob = (noise(x, y, 1.6, 7) - 0.5) * 1.1 + (noise(x, y, 0.45, 11) - 0.5) * 0.45;
  for (let i = soil.length - 1; i >= 0; i--) {
    const b = boxes[i];
    if (soil[i].mat === 'shade') continue;
    if (x > b[0] && y > b[1] && x < b[2] && y < b[3] && depth(soil[i], x, y) + wob > 0) return soil[i].mat;
  }
  return 'cobble';
}

/** A 2x2 block's colour in a material. */
function colourAt(mat: Exclude<Soil['mat'], 'cobble' | 'shade'>, x: number, y: number, px: number, py: number): string {
  // Flagstones: 16 by 10, every other course set over by half, each stone its own grey, the joints dark.
  if (mat === 'flags') {
    const row = Math.floor(py / 10), sx = px + (row % 2 ? 8 : 0), col = Math.floor(sx / 16);
    if (py % 10 === 0 || sx % 16 === 0) return '#34313b';
    const k = hash(col, row, 13);
    return hash(px, py, 4) < 0.03 ? '#3a3640' : FAMILY.flags[Math.floor(k * 4)];
  }
  const fam = FAMILY[mat], k = noise(x, y, 2.2, 3) * 0.8 + hash(px, py, 5) * 0.3, r = hash(px, py, 9);
  const col = fam[Math.min(fam.length - 1, Math.floor(k * fam.length))];
  if (mat === 'earth' || mat === 'swept') return r < 0.025 ? '#57525e' : r < 0.035 ? '#2e2820' : col;
  if (mat === 'mud') return r < 0.03 ? '#3a4044' : r < 0.06 ? '#1c1813' : col;
  if (mat === 'wet') return r < 0.05 ? '#4a5866' : col;
  // Grass in tufts; a field ploughed in rows (dark in the furrow, lighter on the ridge); grain in ears.
  if (mat === 'grass') return r < 0.12 ? ['#3a4c2c', '#46582f', '#1d2818'][Math.floor(r * 30) % 3] : col;
  if (mat === 'furrow') return px % 8 < 4 ? fam[0] : r < 0.06 ? '#4e4232' : fam[2 + (py % 4 < 2 ? 1 : 0)];
  if (mat === 'crop') return r < 0.35 ? ['#8a7a3a', '#a08c44', '#6b5a2e', '#b8a050'][Math.floor(r * 40) % 4] : col;
  if (mat === 'straw') return r < 0.3 ? ['#8a7a3a', '#a08c44', '#6b5a2e'][Math.floor(r * 10) % 3] : col;
  return r < 0.04 ? '#6a5a4a' : col;
}

/** Paint the soil straight into the floor's pixels: material per 4x4 block, colour per 2x2. */
export function paintSoil(m: GameMap, g: CanvasRenderingContext2D): void {
  const soil = m.soil;
  if (!soil?.length) return;
  const boxes = soil.map(box), W = m.w * PX, H = m.h * PX, img = g.getImageData(OX, OY, W, H), d = img.data;
  for (let by = 0; by < H; by += 4) for (let bx = 0; bx < W; bx += 4) {
    const mat = matAt(soil, boxes, (bx + 2) / PX, (by + 2) / PX);
    if (mat === 'cobble' || mat === 'shade') continue;
    for (let py = by; py < Math.min(H, by + 4); py += 2) for (let px = bx; px < Math.min(W, bx + 4); px += 2) {
      const [r, gg, b] = toRgb(colourAt(mat, px / PX, py / PX, px, py));
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
        const o = ((py + j) * W + px + i) * 4;
        (d[o] = r), (d[o + 1] = gg), (d[o + 2] = b), (d[o + 3] = 255);
      }
    }
  }
  // Shade: under a tree's crown the ground is darker, dappled where light gets through the leaves.
  for (const s of soil) {
    if (s.mat !== 'shade') continue;
    const [x0, y0, x1, y1] = box(s);
    for (let py = Math.max(0, Math.floor(y0 * PX / 2) * 2); py < Math.min(H, y1 * PX); py += 2) for (let px = Math.max(0, Math.floor(x0 * PX / 2) * 2); px < Math.min(W, x1 * PX); px += 2) {
      const x = px / PX, y = py / PX, wob = (noise(x, y, 1.1, 21) - 0.5) * 0.9;
      if (depth(s, x, y) + wob <= 0) continue;
      const k = noise(x, y, 0.7, 23) > 0.68 ? 0.84 : 0.66;
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
        const o = ((py + j) * W + px + i) * 4;
        (d[o] = d[o] * k), (d[o + 1] = d[o + 1] * k), (d[o + 2] = d[o + 2] * k * 1.04);
      }
    }
  }
  g.putImageData(img, OX, OY);
}
