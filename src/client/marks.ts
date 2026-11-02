/**
 * Marks on the floor, painted once into the map's still layer (world.ts): blood and the drag of a
 * body, scorch, a trampled patch, fallen fence boards and lamp posts, dug beds, beds in flower, fresh
 * graves. Paint only (shared/arena.ts `Mark`); the town's state decides which are there (shared/mend.ts).
 */
import type { GameMap, Mark } from '../shared/arena';
import { Rng } from '../shared/rng';
import { GROUND, type Painter } from './groundpaint';
import { OX, OY, PX } from './world';

type Rect = (x: number, y: number, w: number, h: number, col: string) => void;

const BLOOD = ['#4a1212', '#5a1616', '#3a0e0e', '#62201a'];
const FLOWERS = ['#d8a43a', '#e0c050', '#b04a3a', '#c8c0d8', '#d87a3a', '#9a5aa8'];

export function paintMarks(m: GameMap, rect: Rect): void {
  for (const k of m.marks ?? []) {
    const rng = new Rng(Math.round(k.x * 131 + k.y * 71 + k.w * 13)), x = Math.round(OX + k.x * PX), y = Math.round(OY + k.y * PX);
    const w = k.kind === 'path' ? k.w * PX : Math.max(2, Math.round(k.w * PX)), h = k.kind === 'path' ? k.h * PX : Math.max(2, Math.round(k.h * PX));
    (PAINT[k.kind] ?? GROUND[k.kind])?.(rect, rng, x, y, w, h, k);
  }
}

/** A blob: rows of an ellipse, ragged at the edge. */
function blob(rect: Rect, rng: Rng, x: number, y: number, w: number, h: number, cols: string[], fill = 0.85): void {
  const cx = x + w / 2, cy = y + h / 2;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const dx = (x + i - cx) / (w / 2), dy = (y + j - cy) / (h / 2), d = dx * dx + dy * dy;
    if (d < fill || (d < 1.15 && rng.next() < 0.35)) rect(x + i, y + j, 1, 1, cols[rng.int(cols.length)]);
  }
}

const PAINT: Partial<Record<Mark['kind'], Painter>> = {
  blood(rect, rng, x, y, w, h) {
    blob(rect, rng, x, y, w, h, BLOOD);
    // Spatter round the pool, and a darker heart where it's thickest.
    for (let i = 0; i < w / 2; i++) rect(x - 4 + rng.int(w + 8), y - 2 + rng.int(h + 4), 1 + rng.int(2), 1, BLOOD[rng.int(3)]);
    blob(rect, rng, x + w / 4, y + h / 4, Math.max(2, w / 2), Math.max(2, h / 2), ['#2e0a0a', '#3a0e0e'], 0.6);
  },
  drag(rect, rng, x, y, w, h) {
    // Two smeared lines where something was pulled along, fading.
    for (let j = 0; j < h; j++) if (rng.next() < 0.85 - (j / h) * 0.5) {
      rect(x + 1 + rng.int(2), y + j, 2, 1, BLOOD[rng.int(BLOOD.length)]);
      if (rng.next() < 0.6) rect(x + w - 3 + rng.int(2), y + j, 2, 1, BLOOD[rng.int(BLOOD.length)]);
    }
  },
  scorch(rect, rng, x, y, w, h) {
    blob(rect, rng, x, y, w, h, ['#201c1e', '#2a2426', '#1a1618', '#34282a'], 0.7);
    for (let i = 0; i < w / 3; i++) rect(x + rng.int(w), y + rng.int(h), 1, 1, '#4a3a2a');
  },
  trample(rect, rng, x, y, w, h) {
    // Churned earth where cobbles were lifted for a garden once, boot-printed and gone to weed.
    rect(x, y, w, h, '#2e271e');
    for (let i = 0; i < (w * h) / 6; i++) rect(x + rng.int(w), y + rng.int(h), 2, 1, ['#3a3024', '#241e17', '#36302a'][rng.int(3)]);
    for (let i = 0; i < (w * h) / 40; i++) rect(x + rng.int(w), y + rng.int(h), 1, 2, ['#3a4a2a', '#4a4a2a', '#2e3a22'][rng.int(3)]);
    for (let i = 0; i < w / 4; i++) rect(x + rng.int(w - 3), y + rng.int(h), 3, 2, '#1e1912');
  },
  green(rect, rng, x, y, w, h) {
    // The garden's ground once it's dug and fenced: short grass, a path of trodden earth.
    rect(x, y, w, h, '#26331f');
    for (let i = 0; i < (w * h) / 5; i++) rect(x + rng.int(w), y + rng.int(h), 1, 2, ['#2e3d25', '#3a4c2c', '#233021'][rng.int(3)]);
    rect(x + w - 30, y, 14, h, '#3a3024');
    for (let i = 0; i < h; i += 2) rect(x + w - 30 + rng.int(14), y + i, 2, 1, '#2e271e');
  },
  planks(rect, rng, x, y, w, h) {
    // Fence boards lying where they fell, one snapped.
    const along = w >= h;
    for (let i = 0, n = Math.max(2, Math.round((along ? w : h) / 12)); i < n; i++) {
      const o = Math.round(((along ? w : h) / n) * i);
      if (along) rect(x + o, y + rng.int(Math.max(1, h - 2)), 10 + rng.int(4), 2, i % 2 ? '#5a3d22' : '#4a3420');
      else rect(x + rng.int(Math.max(1, w - 2)), y + o, 2, 10 + rng.int(4), i % 2 ? '#5a3d22' : '#4a3420');
    }
  },
  fallenpost(rect, rng, x, y, w) {
    // A lamp post on its side, the cage broken, the glass in bits round it.
    rect(x, y + 2, w - 6, 2, '#2a2630');
    rect(x + w - 7, y, 6, 6, '#3a3640'), rect(x + w - 6, y + 1, 3, 3, '#1a1820');
    for (let i = 0; i < 5; i++) rect(x + w - 10 + rng.int(12), y - 2 + rng.int(9), 1, 1, '#8a9aa8');
  },
  beds(rect, rng, x, y, w, h) {
    // Dug earth in a timber edge, raked in rows.
    rect(x - 1, y - 1, w + 2, h + 2, '#4a3420');
    rect(x, y, w, h, '#3a2a1c');
    for (let j = 2; j < h; j += 3) for (let i = 1; i < w - 1; i++) if (rng.next() < 0.8) rect(x + i, y + j, 1, 1, '#4e3a26');
  },
  flowers(rect, rng, x, y, w, h, k) {
    PAINT.beds!(rect, rng, x, y, w, h, k);
    // Leaves first, then a flower on about half the plants, a colour to a patch.
    for (let j = 1; j < h - 1; j += 3) for (let i = 2; i < w - 2; i += 3) {
      rect(x + i - 1, y + j + 1, 3, 2, rng.next() < 0.5 ? '#2e4a24' : '#3a5a2a');
      if (rng.next() < 0.5) rect(x + i, y + j, 1 + rng.int(2), 1, FLOWERS[Math.floor(i / 14) % FLOWERS.length]);
    }
  },
  mound(rect, rng, x, y, w, h) {
    // A fresh grave: turned earth, a little heaped, and a stick for a marker till there's a stone.
    blob(rect, rng, x, y, w, h, ['#3a2e22', '#43352a', '#33281e'], 0.9);
    rect(x + 2, y + 1, w - 4, 1, '#54443a');
    rect(x + 2, y - 7, 1, 8, '#6b4a2b'), rect(x, y - 5, 5, 1, '#6b4a2b');
  },
};
