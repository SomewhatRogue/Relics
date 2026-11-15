/**
 * A lived-in world, slice 2: a job's ground strewn by what it is (shared/scatter.ts), painted into the floor
 * both views share (world.ts paintMap): tufts of grass, stones with a lit top, twigs, a bone or a skull, dead
 * leaves, low leafy clumps, moss, mushrooms at the roots of trees, the odd flower, gravel, and along water a dark wet edge and
 * reeds. Muted, so the light passes still do the work. Each from the map's own seed: every screen the same.
 */
import type { GameMap } from '../shared/arena';
import { Rng } from '../shared/rng';
import { scatterOf, type Scatter } from '../shared/scatter';
import { OX, OY, PX } from './world';

type Rect = (x: number, y: number, w: number, h: number, col: string) => void;

const TUFT = ['#3a4c2c', '#46582f', '#2e3e24', '#52643a'], LEAF = ['#5a3a22', '#6a4426', '#4a3020', '#7a5230'];
const STONE = ['#4e4a56', '#5a5662', '#46424e'], MOSS = ['#2e3e26', '#34462a', '#283622'];

function one(rect: Rect, rng: Rng, k: Scatter, x: number, y: number): void {
  const p = <T,>(a: T[]) => a[rng.int(a.length)], s = k.s;
  switch (k.k) {
    case 'tuft': {
      // A tuft: a dark root, five to nine blades fanning up from it, the tallest in the middle, the tips lit.
      const n = 5 + Math.round(s * 3);
      rect(x - Math.floor(n / 2), y, n, 1, '#1e2818');
      for (let i = 0; i < n; i++) {
        const dx = i - Math.floor(n / 2), h = 2 + rng.int(3) + Math.max(0, 3 - Math.abs(dx));
        rect(x + dx + (dx < 0 ? -1 : dx > 0 ? 1 : 0) * (h > 4 ? 1 : 0), y - h, 1, h, p(TUFT));
        rect(x + dx + (dx < 0 ? -1 : dx > 0 ? 1 : 0) * (h > 4 ? 1 : 0), y - h, 1, 1, '#5e7040');
      }
      return;
    }
    case 'clump': {
      // A low leafy clump: a dark underside, a rounded body in two greens, lit on top, a shadow at its foot.
      const w = 6 + Math.round(s * 4), h = 3 + Math.round(s * 2);
      rect(x - w / 2 - 1, y + 1, w + 2, 1, 'rgba(0,0,0,0.3)');
      for (let j = 0; j < h; j++) {
        const half = Math.round((w / 2) * Math.sqrt(1 - ((j - h + 0.5) / h) ** 2));
        for (let i = -half; i < half; i++) rect(x + i, y - j, 1, 1, j === 0 ? '#1e2a18' : j >= h - 1 ? '#4a5e34' : rng.next() < 0.3 ? '#3a4c2a' : '#2e4024');
      }
      for (let k = 0; k < 3; k++) rect(x - 2 + rng.int(5), y - h + rng.int(2), 1, 1, '#5e7444');
      return;
    }
    case 'stone': {
      // A stone: its shadow, its body, its lit top.
      const w = 3 + Math.round(s * 3), h = 2 + Math.round(s);
      rect(x - 1, y + h, w + 1, 1, 'rgba(0,0,0,0.35)');
      rect(x, y, w, h, p(STONE));
      rect(x + 1, y - 1, w - 2, 1, p(STONE));
      rect(x + 1, y - 1, w - 3, 1, '#6e6a78');
      rect(x + w - 1, y + 1, 1, h - 1, '#3a3642');
      return;
    }
    case 'gravel':
      for (let i = 0; i < 4 + rng.int(4); i++) rect(x + rng.int(7) - 3, y + rng.int(4) - 2, 1, 1, p(STONE));
      return;
    case 'twig': {
      // A thin stick, slanting, with a side shoot.
      const len = 3 + Math.round(s * 3), dir = rng.next() < 0.5 ? 1 : -1;
      for (let i = 0; i < len; i++) rect(x + i, y + Math.round((i * dir) / 2), 1, 1, i % 3 ? '#4a3a2a' : '#5a4632');
      rect(x + 2, y - 1 + (dir < 0 ? 0 : 1), 1, 1, '#4a3a2a');
      return;
    }
    case 'bone':
      if (rng.next() < 0.18) {
        // Now and then a skull, staring.
        rect(x, y - 2, 4, 3, '#bab4a4'), rect(x, y - 2, 4, 1, '#d0cabc'), rect(x + 1, y - 1, 1, 1, '#1e1a16'), rect(x + 3, y - 1, 1, 1, '#1e1a16');
        return;
      }
      rect(x, y, 4 + Math.round(s), 1, '#a8a294'), rect(x - 1, y - 1, 1, 3, '#bab4a4'), rect(x + 4 + Math.round(s), y - 1, 1, 3, '#bab4a4');
      return;
    case 'leaf':
      for (let i = 0; i < 3 + rng.int(4); i++) rect(x + rng.int(7) - 3, y + rng.int(5) - 2, 2, 1, p(LEAF));
      return;
    case 'moss': {
      const r = 2 + Math.round(s * 2);
      for (let j = -r; j <= r; j++) for (let i = -r * 2; i <= r * 2; i++) if ((i / 2) * (i / 2) + j * j < r * r && rng.next() < 0.6) rect(x + i, y + j, 1, 1, p(MOSS));
      return;
    }
    case 'shroom':
      // Two or three pale caps on stems, one bigger.
      for (let i = 0; i < 2 + rng.int(2); i++) {
        const ox = x + i * 3 - 2, big = i === 0;
        rect(ox + 1, y - (big ? 2 : 1), 1, big ? 2 : 1, '#c8bca0');
        rect(ox, y - (big ? 4 : 2), big ? 3 : 2, big ? 2 : 1, i % 2 ? '#8a5a3a' : '#b0a080');
      }
      return;
    case 'flower':
      rect(x, y - 2, 1, 2, TUFT[0]), rect(x, y - 3, 1, 1, rng.next() < 0.5 ? '#b8a040' : '#9a6a8a');
      if (rng.next() < 0.5) rect(x + 2, y - 2, 1, 2, TUFT[1]), rect(x + 2, y - 3, 1, 1, '#c8c0a8');
      return;
    case 'wet': {
      // The soft dark edge by water: a dithered patch, darker toward its middle.
      const r = 4 + Math.round(s * 4);
      for (let j = -r; j <= r; j++) for (let i = -r * 2; i <= r * 2; i++) {
        const d = (i / 2) * (i / 2) + j * j;
        if (d < r * r && (d < (r * r) / 3 || (i + j) % 2 === 0)) rect(x + i, y + j, 1, 1, d < (r * r) / 3 ? 'rgba(10,14,20,0.32)' : 'rgba(10,14,20,0.2)');
      }
      return;
    }
    case 'reed':
      for (let i = 0; i < 4; i++) {
        const h = 4 + rng.int(5);
        rect(x + i * 2 - 3, y - h, 1, h, i % 2 ? '#3a4a2a' : '#4a5a32');
        if (rng.next() < 0.4) rect(x + i * 2 - 3, y - h - 2, 1, 2, '#5a4632');
      }
  }
}

/** Paint the map's floor scatter (nothing on maps that have none). */
export function paintScatter(m: GameMap, rect: Rect): void {
  const { floor } = scatterOf(m);
  if (!floor.length) return;
  const rng = new Rng(m.w * 13 + m.h * 7 + floor.length);
  // The wet edge first, under everything else.
  for (const k of floor) if (k.k === 'wet') one(rect, rng, k, Math.round(OX + k.x * PX), Math.round(OY + k.y * PX));
  for (const k of floor) if (k.k !== 'wet') one(rect, rng, k, Math.round(OX + k.x * PX), Math.round(OY + k.y * PX));
}
