/**
 * What hangs on a hall's back wall, painted once into the room's still layer (world.ts): the tower's
 * star chart, shields and a banner in the barracks, the town hall's vote boards, antlers, pelts and bows at the lodge, the church's
 * windows, the smith's tools, herbs drying, notices, the Drowned Rat's sign and its knife board, the valley's map.
 */
import type { GameMap } from '../shared/arena';
import { Rng } from '../shared/rng';
import { OX, OY, PX } from './world';

type Rect = (x: number, y: number, w: number, h: number, col: string) => void;
type Hang = NonNullable<GameMap['hangs']>[number];

const TOP = 14, LOW = OY - 8;

export function paintHangs(m: GameMap, rect: Rect): void {
  for (const h of m.hangs ?? []) {
    const x = Math.round(OX + h.x * PX), w = Math.round(h.w * PX), rng = new Rng(Math.round(h.x * 97 + h.w * 13));
    HANG[h.kind](rect, rng, x, w, h);
  }
}

const HANG: Record<Hang['kind'], (rect: Rect, rng: Rng, x: number, w: number, h: Hang) => void> = {
  stars(rect, rng, x, w) {
    // A chart of the sky on dark cloth: stars, the lines between them, a moon in the corner.
    rect(x, TOP, w, LOW - TOP, '#3a2818'), rect(x + 1, TOP + 1, w - 2, LOW - TOP - 2, '#141a2e');
    const pts: [number, number][] = [];
    for (let i = 0; i < w / 2; i++) pts.push([x + 2 + rng.int(w - 4), TOP + 2 + rng.int(LOW - TOP - 4)]);
    for (let i = 0; i + 1 < 6; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      for (let t = 0; t <= 1; t += 0.12) rect(Math.round(ax + (bx - ax) * t), Math.round(ay + (by - ay) * t), 1, 1, '#3a4a6a');
    }
    for (const [px, py] of pts) rect(px, py, 1, 1, rng.next() < 0.3 ? '#fff4c8' : '#c8d0e8');
    rect(x + w - 7, TOP + 3, 4, 4, '#e8e0c8'), rect(x + w - 6, TOP + 3, 3, 3, '#141a2e');
  },
  shields(rect, rng, x, w) {
    for (let sx = x + 2; sx < x + w - 9; sx += 11) {
      const c = [['#7a1d1d', '#d4a537'], ['#2a4a6a', '#d8d0bc'], ['#3a5a3a', '#8a8f9a']][rng.int(3)];
      rect(sx, TOP + 6, 9, 10, '#2a1d12'), rect(sx + 1, TOP + 7, 7, 8, c[0]), rect(sx + 1, TOP + 7, 3, 8, c[1]), rect(sx + 3, TOP + 10, 3, 2, '#8a8494');
    }
  },
  banner(rect, _rng, x, w) {
    // Wickhold's banner: a flame on dark red, ragged at the hem.
    rect(x - 1, TOP - 2, w + 2, 2, '#4a3420');
    rect(x, TOP, w, LOW - TOP - 4, '#5a1818');
    for (let i = 0; i < w; i += 3) rect(x + i, LOW - 4, 2, 2 + (i % 2), '#5a1818');
    const cx = x + Math.round(w / 2);
    rect(cx - 1, TOP + 10, 3, 6, '#d4a537'), rect(cx, TOP + 8, 1, 2, '#ffd27a');
  },
  vote(rect, _rng, x, w) {
    // A vote board: a plank frame round a sheet of old sailcloth, nailed at the corners (the words: voteboards.ts).
    rect(x, TOP + 1, w, LOW - TOP, '#4a3420'), rect(x + 2, TOP + 3, w - 4, LOW - TOP - 4, '#5e5240');
    for (const nx of [x + 2, x + w - 3]) for (const ny of [TOP + 3, LOW - 2]) rect(nx, ny, 1, 1, '#9aa3ad');
  },
  map(rect, rng, x, w) {
    rect(x, TOP, w, LOW - TOP - 4, '#6a5a3a'), rect(x + 1, TOP + 1, w - 2, LOW - TOP - 6, '#9a8a62');
    for (let i = 2; i < w - 2; i++) rect(x + i, TOP + 10 + Math.round(Math.sin(i * 0.2) * 5), 1, 1, '#3a5a7a');
    for (let i = 0; i < 8; i++) rect(x + 3 + rng.int(w - 6), TOP + 3 + rng.int(LOW - TOP - 12), 2, 2, i < 3 ? '#7a1d1d' : '#4a3a2a');
    rect(x + Math.round(w / 2), TOP + 14, 3, 3, '#d4a537');
  },
  antlers(rect, _rng, x, w) {
    const cx = x + Math.round(w / 2);
    rect(cx - 3, TOP + 10, 6, 4, '#5a3d22');
    for (const d of [-1, 1]) {
      for (let i = 0; i < 9; i++) rect(cx + d * (2 + i), TOP + 10 - Math.round(i * 0.7), 1, 1, '#d8ccb0');
      for (const k of [3, 6]) for (let j = 0; j < 4; j++) rect(cx + d * (2 + k), TOP + 8 - Math.round(k * 0.7) - j, 1, 1, '#c8bca0');
    }
  },
  pelts(rect, rng, x, w) {
    for (let px = x + 1; px < x + w - 8; px += 12) {
      const c = ['#6a4a2e', '#5a5048', '#7a5a3a'][rng.int(3)];
      rect(px, TOP + 2, 10, 1, '#3a2818');
      rect(px + 1, TOP + 3, 8, 16, c), rect(px, TOP + 5, 1, 4, c), rect(px + 9, TOP + 5, 1, 4, c), rect(px + 3, TOP + 19, 4, 3, c);
      rect(px + 2, TOP + 5, 6, 12, 'rgba(0,0,0,0.15)');
    }
  },
  bows(rect, _rng, x, w) {
    for (let bx = x + 3; bx < x + w - 6; bx += 12) {
      rect(bx + 3, TOP + 1, 2, 1, '#3a2818');
      for (let j = 0; j < 22; j++) rect(bx + Math.round(Math.sin((j / 21) * Math.PI) * 4), TOP + 2 + j, 1, 1, '#6b4a2b');
      rect(bx, TOP + 2, 1, 22, '#c8c0a8');
    }
    rect(x + w - 6, TOP + 6, 4, 14, '#4a3424'), rect(x + w - 6, TOP + 4, 1, 3, '#d8d0bc'), rect(x + w - 4, TOP + 3, 1, 4, '#d8d0bc');
  },
  window(rect, rng, x, w) {
    // A tall pointed window in coloured glass.
    const top = TOP - 4, bot = LOW - 2, cx = x + Math.round(w / 2);
    rect(x - 1, top + 3, w + 2, bot - top - 3, '#26222c');
    for (let y = top + 4; y < bot - 1; y += 3) for (let i = 1; i < w - 1; i += 3) {
      const arch = y - top < 6 && Math.abs(x + i - cx) > (y - top) * 0.9;
      if (!arch) rect(x + i, y, 2, 2, ['#3a4a8a', '#7a2a2a', '#d4a537', '#3a6a5a', '#5a3a7a'][rng.int(5)]);
    }
    rect(cx, top + 3, 1, bot - top - 3, '#26222c');
  },
  tools(rect, _rng, x, w) {
    // Tongs and hammers on pegs, a row of horseshoes.
    rect(x, TOP + 2, w, 1, '#4a3420');
    for (let tx = x + 3; tx < x + w - 4; tx += 7) {
      const hammer = (tx - x) % 14 < 7;
      rect(tx + 1, TOP + 3, 1, 14, '#5a3d22');
      if (hammer) rect(tx - 1, TOP + 15, 5, 3, '#6a6470');
      else rect(tx, TOP + 14, 1, 5, '#6a6470'), rect(tx + 2, TOP + 14, 1, 5, '#6a6470');
    }
    for (let hx = x + 4; hx < x + w - 6; hx += 8) rect(hx, TOP + 25, 5, 1, '#8a8494'), rect(hx, TOP + 25, 1, 4, '#8a8494'), rect(hx + 4, TOP + 25, 1, 4, '#8a8494');
  },
  herbs(rect, rng, x, w) {
    rect(x, TOP + 2, w, 1, '#8a7a5a');
    for (let hx = x + 3; hx < x + w - 3; hx += 6) {
      const c = ['#4a6a3a', '#6a7a3a', '#5a4a3a', '#7a6a8a'][rng.int(4)];
      rect(hx, TOP + 3, 1, 3, '#8a7a5a'), rect(hx - 2, TOP + 6, 5, 7 + rng.int(4), c), rect(hx - 1, TOP + 6, 3, 2, '#3a2818');
    }
  },
  notices(rect, rng, x, w) {
    rect(x, TOP + 4, w, LOW - TOP - 10, '#4a3420');
    for (let i = 0; i < Math.max(2, w / 5); i++) {
      const nx = x + 1 + rng.int(Math.max(1, w - 7)), ny = TOP + 5 + rng.int(Math.max(1, LOW - TOP - 20));
      rect(nx, ny, 6, 8, '#d8d0bc'), rect(nx + 1, ny + 2, 4, 1, '#6a6470'), rect(nx + 1, ny + 4, 3, 1, '#6a6470'), rect(nx + 2, ny, 1, 1, '#7a1d1d');
    }
  },
  sign(rect, _rng, x, w) {
    // The rat on its board, as crooked as the one outside.
    for (let i = 0; i < w; i++) rect(x + i, TOP + 6 + Math.round(i / 12), 1, 14, '#5a3d22');
    rect(x + 6, TOP + 11, 12, 5, '#2a2630'), rect(x + 18, TOP + 13, 6, 1, '#2a2630'), rect(x + 6, TOP + 10, 3, 2, '#2a2630');
  },
  knifeboard(rect, rng, x, w) {
    // A round of elm on a peg, its rings painted on and chipped, a few knives left in it, chalk tallies beside.
    const r = Math.floor(Math.min(w, LOW - TOP - 8) / 2) - 1, cx = x + Math.round(w / 2), cy = TOP + 4 + r;
    const RINGS = ['#c8a03a', '#8a2a22', '#d8d0bc', '#3a2a1c', '#d8d0bc'];
    rect(cx - 1, TOP + 1, 2, 3, '#2a1d12');
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > r + 0.4) continue;
      const ring = Math.min(4, Math.floor((d / (r + 0.4)) * 5)), chip = rng.next() < 0.08;
      rect(cx + dx, cy + dy, 1, 1, d > r - 0.6 ? '#2a1d12' : chip ? '#6a5034' : RINGS[ring]);
    }
    for (let i = 0; i < 3; i++) {
      const a = rng.next() * 6.28, k = rng.next() * r * 0.8, kx = cx + Math.round(Math.cos(a) * k), ky = cy + Math.round(Math.sin(a) * k);
      rect(kx, ky, 1, 1, '#9aa3ad'), rect(kx, ky + 1, 1, 3, '#3a2818');
    }
    for (let i = 0; i < 4; i++) rect(x + w - 2, cy - 4 + i * 2, 2, 1, '#c8c0b0');
  },
  shelves(rect, rng, x, w) {
    for (let y = TOP + 6; y < LOW - 4; y += 10) {
      rect(x, y, w, 1, '#5a3d22');
      for (let i = 2; i < w - 3; i += 4) if (rng.next() < 0.7) rect(x + i, y - 3, 2, 3, ['#3a6a5a', '#4a5a8a', '#7a6a3a', '#7a2a2a'][rng.int(4)]);
    }
  },
};
