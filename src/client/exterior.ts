/**
 * Each of Wickhold's halls looks like what it is from the street (blocks.ts paints the plain block,
 * then this dresses it, by its door): the mage's tower round with a crooked slate cone and slit
 * windows lit odd colours, coloured smoke from its flue; shields and a banner on the barracks; logs,
 * antlers and pelts at the hunters' lodge; the church's empty belfry and a round window; casks and a
 * lamp at the Drowned Rat; the forge's chimney stack, smoking; notices at the town hall; herbs drying
 * at the infirmary. Live bits (lit slits, smoke) are drawn each frame by `liveOutside`.
 */
import type { Block } from '../shared/arena';
import type { Ctx } from './draw';
import { witchColour } from './hallsdraw';

type Rect = (x: number, y: number, w: number, h: number, c: string) => void;

/** Slit windows on the tower's face, as fractions (across, down). */
const SLITS: [number, number][] = [[0.24, 0.18], [0.7, 0.36], [0.46, 0.55], [0.22, 0.7]];

export function dressOutside(g: CanvasRenderingContext2D, b: Block, rect: Rect, w: number, roofH: number, wallY: number, tall: number): void {
  const bot = wallY + tall, mid = Math.round(w / 2);
  switch (b.door) {
    case 'tower': {
      // The roof: a cone of slates, its tip bent over, a vane on it.
      g.clearRect(0, 0, w, roofH);
      for (let y = 0; y < roofH; y++) {
        const k = (y + 1) / roofH, half = Math.round((w / 2) * Math.pow(k, 0.85)), cx = Math.round(mid + Math.pow(1 - k, 2.2) * 9);
        const band = Math.floor(y / 4) % 2 ? '#3a3050' : '#45385e';
        rect(cx - half, y, half * 2, 1, band);
        rect(cx - half, y, Math.max(1, Math.round(half * 0.35)), 1, '#2a2240');
      }
      rect(mid + 8, 0, 1, 4, '#2a2630'), rect(mid + 6, 0, 5, 1, '#8a8494'), rect(mid + 10, 1, 2, 1, '#d4a537');
      rect(Math.round(w * 0.7), Math.round(roofH * 0.45), 4, 6, '#57525e');
      // The wall: round, so darker at both edges, stone in courses.
      for (let y = wallY; y < bot; y += 5) for (let x = (y / 5) % 2 ? 0 : 4; x < w; x += 8) rect(x, y, 1, 5, '#3e3a46');
      for (let x = 0; x < w; x++) {
        const e = Math.abs(x - w * 0.42) / (w * 0.58);
        if (e > 0.45) rect(x, wallY, 1, tall, `rgba(10,8,16,${((e - 0.45) * 0.9).toFixed(2)})`);
      }
      for (const [fx, fy] of SLITS) rect(Math.round(w * fx), Math.round(wallY + tall * fy), 2, 7, '#0d0b10');
      rect(0, bot - 3, w, 3, '#3e3a46');
      return;
    }
    case 'hall': {
      // The barracks: shields along the wall, a banner over the door, crossed spears.
      for (let x = 4; x < w - 10; x += 16) {
        if (Math.abs(x + 4 - mid) < 10) continue;
        rect(x, wallY + 6, 8, 9, '#2a1d12'), rect(x + 1, wallY + 7, 6, 7, x % 32 ? '#7a1d1d' : '#2a4a6a'), rect(x + 3, wallY + 9, 2, 2, '#8a8494');
      }
      rect(mid - 4, wallY + 1, 8, 9, '#5a1818'), rect(mid - 1, wallY + 4, 2, 3, '#d4a537');
      return;
    }
    case 'lodge': {
      // Logs, ends showing; antlers over the door; pelts hung to dry; a bow.
      for (let y = wallY + 1; y < bot; y += 4) rect(0, y, w, 1, '#3a2818'), rect(0, y + 1, 3, 3, '#7a5a34'), rect(w - 3, y + 1, 3, 3, '#7a5a34');
      for (const d of [-1, 1]) for (let i = 0; i < 7; i++) rect(mid + d * (1 + i), wallY + 3 - Math.round(i * 0.5), 1, 1, '#d8ccb0');
      rect(mid - 2, wallY + 3, 4, 2, '#5a3d22');
      for (let x = w - 22; x < w - 6; x += 7) rect(x, wallY + 4, 5, 10, '#6a4a2e'), rect(x + 1, wallY + 14, 3, 2, '#6a4a2e');
      for (let j = 0; j < 12; j++) rect(8 + Math.round(Math.sin((j / 11) * Math.PI) * 3), wallY + 4 + j, 1, 1, '#6b4a2b');
      return;
    }
    case 'church': {
      // A round window over the door, in coloured glass.
      const cy = wallY + 9;
      for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) {
        const d = x * x + y * y;
        if (d <= 25) rect(mid + x, cy + y, 1, 1, d > 16 ? '#3e3a46' : (x + y) % 3 ? '#3a4a8a' : (x * y) % 2 ? '#7a2a2a' : '#d4a537');
      }
      return;
    }
    case 'tavern':
      // Casks by the door, and a lamp on a bracket.
      for (const x of [mid - 16, mid - 10]) rect(x, bot - 7, 5, 7, '#6b4a2b'), rect(x, bot - 5, 5, 1, '#2a2630');
      rect(mid + 5, wallY + 4, 4, 1, '#2a2630'), rect(mid + 7, wallY + 5, 3, 4, '#5a4a2a');
      return;
    case 'forge':
      // A stone chimney stack up through the roof; horseshoes over the door; the quench barrel.
      rect(w - 16, 2, 9, 14, '#4a4652'), rect(w - 16, 14, 9, 2, '#2e2a34'), rect(w - 16, 2, 9, 2, '#6a6470'), rect(w - 14, 1, 5, 2, '#14121a');
      for (const x of [mid - 7, mid + 3]) rect(x, wallY + 3, 4, 1, '#8a8494'), rect(x, wallY + 3, 1, 3, '#8a8494'), rect(x + 3, wallY + 3, 1, 3, '#8a8494');
      rect(8, bot - 8, 7, 8, '#5a3d22'), rect(9, bot - 8, 5, 2, '#1e2a36');
      return;
    case 'townhall':
      // Notices nailed by the door, the town's banner, worn steps.
      rect(mid + 8, wallY + 6, 10, 9, '#4a3420');
      for (const [x, y] of [[mid + 9, wallY + 7], [mid + 13, wallY + 8], [mid + 10, wallY + 11]]) rect(x, y, 4, 4, '#d8d0bc');
      rect(8, wallY + 2, 6, 12, '#5a1818'), rect(10, wallY + 6, 2, 3, '#d4a537');
      rect(mid - 6, bot - 2, 12, 2, '#6a6470');
      return;
    case 'infirmary':
      // Herbs drying under the eaves, a lamp by the door.
      rect(4, wallY + 1, w - 8, 1, '#8a7a5a');
      for (let x = 6; x < w - 6; x += 6) if (Math.abs(x - mid) > 6) rect(x, wallY + 2, 3, 6, x % 12 ? '#4a6a3a' : '#6a5a3a');
      rect(mid + 5, wallY + 6, 3, 4, '#5a4a2a');
      return;
  }
}

/** The tower's slits lit odd colours, coloured smoke from its flue; smoke from the forge's stack. */
export function liveOutside(c: Ctx, b: Block, x: number, top: number, w: number, roofH: number, tall: number): void {
  if (b.door === 'tower') {
    const col = witchColour(c.now), wallY = top + roofH;
    SLITS.forEach(([fx, fy], i) => {
      const k = (Math.sin(c.now * (0.6 + i * 0.3) + i * 2) + 1) / 2;
      c.glow.fillStyle = i % 2 ? `rgb(${Math.round(col[0] * 255)},${Math.round(col[1] * 255)},${Math.round(col[2] * 255)})` : k > 0.5 ? '#9fe8ff' : '#c9a8ff';
      c.glow.fillRect(Math.round(x + w * fx), Math.round(wallY + tall * fy + 2), 2, 4);
    });
    smoke(c, x + w * 0.7 + 2, top + roofH * 0.45, [`rgb(${Math.round(col[0] * 160)},${Math.round(col[1] * 160)},${Math.round(col[2] * 180)})`, '#4a4458'], 0.9);
  }
  if (b.door === 'forge') {
    smoke(c, x + w - 12, top + 2, ['#3a3640', '#4a4652'], 1);
    if (Math.floor(c.now * 5) % 4 === 0) (c.glow.fillStyle = '#ff9a3c'), c.glow.fillRect(Math.round(x + w - 12 + Math.sin(c.now * 9) * 2), Math.round(top - 2), 1, 1);
  }
}

function smoke(c: Ctx, x: number, y: number, cols: string[], rate: number): void {
  const g = c.lit;
  for (let i = 0; i < 7; i++) {
    const k = (c.now * 0.18 * rate + i / 7) % 1, s = 2 + Math.round(k * 6);
    g.globalAlpha = 0.55 * (1 - k);
    g.fillStyle = cols[i % cols.length];
    g.fillRect(Math.round(x + Math.sin(k * 6 + i) * 3 + k * 10 - s / 2), Math.round(y - k * 40 - s / 2), s, s);
  }
  g.globalAlpha = 1;
}
