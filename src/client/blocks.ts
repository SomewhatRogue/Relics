/**
 * Buildings, walls and fences (blocks) and the round things (trees, rocks, hay, wells, the Lantern),
 * drawn with the actors and sorted by their foot, so you walk behind a cottage or a tree. A block is
 * its footprint with a front wall rising from its bottom edge and a roof over it.
 */
import type { Block, Round } from '../shared/arena';
import { blit, type Ctx } from './draw';
import { drawText, textWidth } from './pixfont';
import { SPRITES } from './sprites';
import { OX, OY, PX } from './world';

/** Wall height (pixels), roof and wall colours, by kind. */
const LOOK: Record<Block['kind'], { tall: number; roof: string; ridge: string; wall: string; windows: boolean }> = {
  house: { tall: 20, roof: '#5a2e22', ridge: '#7a3e2a', wall: '#6a5a48', windows: true },
  barn: { tall: 28, roof: '#6a2a1a', ridge: '#8a3a22', wall: '#5a3d22', windows: false },
  hall: { tall: 24, roof: '#4a3a2a', ridge: '#5e4a34', wall: '#5e5248', windows: true },
  church: { tall: 40, roof: '#3a3a4a', ridge: '#4e4e60', wall: '#6a6470', windows: true },
  forge: { tall: 28, roof: '#3a3036', ridge: '#4a3e44', wall: '#4f4a5c', windows: true },
  stall: { tall: 12, roof: '#7a2a2a', ridge: '#d8c48a', wall: '#5a3d22', windows: false },
  tent: { tall: 14, roof: '#8a7a5a', ridge: '#a8986a', wall: '#6a5a40', windows: false },
  rockwall: { tall: 14, roof: '#45414c', ridge: '#55505e', wall: '#34313a', windows: false },
  fence: { tall: 8, roof: '#5a3d22', ridge: '#6b4a2b', wall: '#4a3420', windows: false },
  granary: { tall: 30, roof: '#6b5a3a', ridge: '#8a7448', wall: '#7a6a50', windows: false },
  wall: { tall: 20, roof: '#3b3746', ridge: '#4f4a5c', wall: '#2a2733', windows: false },
};

const cache = new WeakMap<Block, HTMLCanvasElement>();

function paint(b: Block): HTMLCanvasElement {
  const l = LOOK[b.kind], w = Math.round(b.w * PX), d = Math.round(b.h * PX), c = document.createElement('canvas');
  c.width = w;
  c.height = d + l.tall;
  const g = c.getContext('2d')!, rect = (x: number, y: number, ww: number, hh: number, col: string) => ((g.fillStyle = col), g.fillRect(x, y, ww, hh));
  // Roof over the footprint (raised by the wall's height), then the front wall below it.
  const roofH = d, wallY = roofH;
  rect(0, 0, w, roofH, l.roof);
  if (b.kind === 'rockwall') for (let i = 0; i < w * 2; i++) rect((i * 37) % w, (i * 13) % roofH, 2, 1, i % 3 ? '#3a3640' : '#55505e');
  else if (b.kind === 'fence') for (let x = 1; x < w; x += 5) rect(x, 0, 2, roofH + l.tall, '#6b4a2b');
  else {
    for (let y = 2; y < roofH; y += 3) rect(0, y, w, 1, l.ridge);
    rect(0, 0, w, 1, l.ridge);
  }
  if (b.kind !== 'fence') {
    rect(0, wallY, w, l.tall, l.wall);
    rect(0, wallY, w, 1, '#14121a');
    for (let y = wallY + 4; y < wallY + l.tall; y += 4) rect(0, y, w, 1, 'rgba(0,0,0,0.18)');
  }
  // A door in the middle of the front wall (not on rock, fences or stalls).
  if (l.windows || b.kind === 'barn' || b.kind === 'granary') {
    const dw = b.kind === 'barn' ? 12 : 6, dh = Math.min(l.tall - 3, b.kind === 'barn' ? 18 : 11);
    rect(Math.round(w / 2 - dw / 2), wallY + l.tall - dh, dw, dh, '#2a1e14');
    rect(Math.round(w / 2 - dw / 2), wallY + l.tall - dh, dw, 1, '#5a3d22');
  }
  if (b.kind === 'church') {
    // The bell tower over the door.
    rect(Math.round(w / 2 - 5), -0, 10, 6, '#4e4e60');
    rect(Math.round(w / 2 - 1), 1, 2, 4, '#b08a3a');
  }
  if (b.kind === 'stall') for (let x = 0; x < w; x += 6) rect(x, 0, 3, roofH, '#d8c48a');
  if (b.label) {
    const tw = textWidth(b.label), ty = b.kind === 'stall' ? wallY + 3 : wallY + 2;
    if (tw < w - 2) drawText(g, b.label, Math.round(w / 2 - tw / 2), ty, b.kind === 'stall' ? '#f0e0b0' : '#d8c48a');
  }
  return c;
}

/** (x, y) is the block's top-left on screen (the footprint's corner). */
export function drawBlock(c: Ctx, b: Block, x: number, y: number, lit: boolean): void {
  let cv = cache.get(b);
  if (!cv) cache.set(b, (cv = paint(b)));
  const l = LOOK[b.kind];
  c.lit.drawImage(cv, Math.round(x), Math.round(y - l.tall));
  c.glow.globalCompositeOperation = 'destination-out';
  c.glow.fillRect(Math.round(x), Math.round(y - l.tall), cv.width, cv.height);
  c.glow.globalCompositeOperation = 'source-over';
  if (!l.windows || !lit) return;
  // Lit windows either side of the door: someone lives here.
  const w = cv.width, wy = Math.round(y + b.h * PX - l.tall + 5);
  c.glow.fillStyle = '#ffd27a';
  for (const wx of [Math.round(w * 0.22), Math.round(w * 0.72)]) c.glow.fillRect(Math.round(x + wx), wy, 3, 3);
  if (b.kind === 'forge') (c.glow.fillStyle = Math.floor(c.now * 8) % 2 ? '#ff9a3c' : '#ff6a20'), c.glow.fillRect(Math.round(x + w / 2 - 2), Math.round(y + b.h * PX - 5), 4, 3);
}

export const blockFoot = (b: Block) => OY + (b.y + b.h) * PX;
export const blockAt = (b: Block): [number, number] => [OX + b.x * PX, OY + b.y * PX];

/** A round thing at its foot (x, y on screen). */
export function drawRound(c: Ctx, r: Round, x: number, y: number): void {
  if (r.kind === 'pillar') return blit(c, SPRITES.pillar, x, y + 5);
  blit(c, SPRITES[r.kind], x, y + Math.round(r.r * 6));
  if (r.kind === 'lantern') {
    // The Last Lantern: a flame that never goes out.
    const f = Math.floor(c.now * 9) % 3;
    c.glow.fillStyle = '#fff1b0';
    c.glow.fillRect(Math.round(x - 1), Math.round(y - 30 + Math.round(r.r * 6)), 3, 4);
    c.glow.fillStyle = f ? '#ffd27a' : '#ffb44c';
    c.glow.fillRect(Math.round(x), Math.round(y - 32 + Math.round(r.r * 6)), 1, 2);
  }
}
