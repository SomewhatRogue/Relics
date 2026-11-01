/**
 * Buildings, walls, fences and furniture (blocks) and the round things (trees, rocks, hay, wells, the
 * Lantern), drawn with the actors and sorted by their foot, so you walk behind a cottage or a tree. A
 * block is its footprint with a front wall rising from its bottom edge and a roof over it. Wooden ones
 * on a job char as they're hurt, burn with flames and smoke, and fall in to rubble.
 */
import type { Block, Round } from '../shared/arena';
import { blit, type Ctx } from './draw';
import { drawText, textWidth } from './pixfont';
import { SPRITES } from './sprites';
import { OX, OY, PX } from './world';

interface Look { tall: number; roof: string; ridge: string; wall: string; windows: boolean; furniture?: boolean }
/** Wall height (pixels), roof and wall colours, by kind. */
const LOOK: Record<Block['kind'], Look> = {
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
  den: { tall: 13, roof: '#4a3a24', ridge: '#5e4a2e', wall: '#3a2a1a', windows: false },
  counter: { tall: 10, roof: '#6b4a2b', ridge: '#7a5a34', wall: '#4a3420', windows: false, furniture: true },
  bed: { tall: 6, roof: '#7a6a8a', ridge: '#d8d0bc', wall: '#4a3420', windows: false, furniture: true },
  shelf: { tall: 20, roof: '#4a3420', ridge: '#4a3420', wall: '#5a3d22', windows: false, furniture: true },
  anvil: { tall: 8, roof: '#6a6470', ridge: '#8a8494', wall: '#34313a', windows: false, furniture: true },
  altar: { tall: 11, roof: '#d8d0bc', ridge: '#e8e0c8', wall: '#6a6470', windows: false, furniture: true },
  pew: { tall: 7, roof: '#5a3d22', ridge: '#6b4a2b', wall: '#3a2a1a', windows: false, furniture: true },
  bench: { tall: 8, roof: '#7a5a34', ridge: '#8b6a3a', wall: '#4a3420', windows: false, furniture: true },
  hearth: { tall: 12, roof: '#4a4652', ridge: '#57525e', wall: '#34313a', windows: false, furniture: true },
  sacks: { tall: 9, roof: '#9a8a5a', ridge: '#b0a06a', wall: '#7a6a48', windows: false, furniture: true },
};

/** 0 standing, 1 charred (under half its health), 2 burned down. */
const state = (b: Block) => (b.ruined ? 2 : b.maxHp && (b.hp ?? 0) < b.maxHp * 0.5 ? 1 : 0);
const cache = new WeakMap<Block, { s: number; c: HTMLCanvasElement }>();
const RUBBLE = 7;

function paint(b: Block, st: number): HTMLCanvasElement {
  const l = LOOK[b.kind], w = Math.round(b.w * PX), d = Math.round(b.h * PX), c = document.createElement('canvas');
  const g = c.getContext('2d')!, rect = (x: number, y: number, ww: number, hh: number, col: string) => ((g.fillStyle = col), g.fillRect(x, y, ww, hh));
  let seed = Math.round(b.x * 31 + b.y * 17);
  const rnd = (n: number) => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff), seed % n);
  if (st === 2) {
    // Rubble: ash over the footprint, charred beams, stubs of wall along the front.
    c.width = w;
    c.height = d + RUBBLE;
    rect(0, RUBBLE, w, d, '#1e1a18');
    for (let i = 0; i < w * 2; i++) rect(rnd(w), RUBBLE + rnd(d), 1, 1, ['#2a2420', '#151210', '#3a302a'][i % 3]);
    for (let i = 0; i < w / 5; i++) rect(rnd(w - 8), RUBBLE + rnd(Math.max(1, d - 2)), 6 + rnd(8), 2, '#2a1e14');
    for (let x = 0; x < w; x += 3) {
      const h = rnd(RUBBLE);
      rect(x, RUBBLE + d - h, 3, h, x % 2 ? '#2a2420' : '#3a2e24');
    }
    return c;
  }
  c.width = w;
  c.height = d + l.tall;
  // Roof over the footprint (raised by the wall's height), then the front wall below it.
  const roofH = d, wallY = roofH;
  rect(0, 0, w, roofH, l.roof);
  if (b.kind === 'rockwall') for (let i = 0; i < w * 2; i++) rect((i * 37) % w, (i * 13) % roofH, 2, 1, i % 3 ? '#3a3640' : '#55505e');
  else if (b.kind === 'fence') for (let x = 1; x < w; x += 5) rect(x, 0, 2, roofH + l.tall, '#6b4a2b');
  else if (b.kind === 'den') for (let i = 0; i < w; i += 3) rect(i, 0, 2, roofH, i % 2 ? '#3a2e1c' : '#5e4a2e');
  else if (!l.furniture) {
    for (let y = 2; y < roofH; y += 3) rect(0, y, w, 1, l.ridge);
    rect(0, 0, w, 1, l.ridge);
  } else rect(0, 0, w, 1, l.ridge);
  if (b.kind !== 'fence') {
    rect(0, wallY, w, l.tall, l.wall);
    rect(0, wallY, w, 1, '#14121a');
    if (!l.furniture) for (let y = wallY + 4; y < wallY + l.tall; y += 4) rect(0, y, w, 1, 'rgba(0,0,0,0.18)');
  }
  furnish(b, rect, w, roofH, wallY, l);
  // A door in the middle of the front wall.
  if (b.door || b.kind === 'den' || b.kind === 'granary') {
    const dw = b.kind === 'barn' ? 12 : b.kind === 'den' ? 8 : 6, dh = Math.min(l.tall - 3, b.kind === 'barn' ? 18 : 11);
    rect(Math.round(w / 2 - dw / 2), wallY + l.tall - dh, dw, dh, b.kind === 'den' ? '#0d0b10' : '#2a1e14');
    if (b.kind !== 'den') rect(Math.round(w / 2 - dw / 2), wallY + l.tall - dh, dw, 1, '#5a3d22');
  }
  if (b.kind === 'church') {
    // The bell tower over the door.
    rect(Math.round(w / 2 - 5), 0, 10, 6, '#4e4e60');
    rect(Math.round(w / 2 - 1), 1, 2, 4, '#b08a3a');
  }
  if (b.kind === 'stall') for (let x = 0; x < w; x += 6) rect(x, 0, 3, roofH, '#d8c48a');
  if (b.label) {
    const tw = textWidth(b.label), ty = b.kind === 'stall' ? wallY + 3 : wallY + 2;
    if (tw < w - 2) drawText(g, b.label, Math.round(w / 2 - tw / 2), ty, b.kind === 'stall' ? '#f0e0b0' : '#d8c48a');
  }
  if (st === 1) {
    // Scorched: blackened, the roof holed.
    g.globalCompositeOperation = 'source-atop';
    rect(0, 0, w, c.height, 'rgba(18,12,8,0.5)');
    g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < w / 6; i++) rect(rnd(w - 4), rnd(Math.max(1, roofH - 3)), 3 + rnd(4), 2 + rnd(3), '#0d0b10');
  }
  return c;
}

/** The details that make a bed a bed. */
function furnish(b: Block, rect: (x: number, y: number, w: number, h: number, c: string) => void, w: number, roofH: number, wallY: number, l: Look): void {
  if (b.kind === 'bed') rect(1, 1, w - 2, 5, '#d8d0bc'), rect(0, 7, w, roofH - 7, '#5a4a7a');
  if (b.kind === 'shelf') for (let y = wallY + 3; y < wallY + l.tall; y += 6) {
    rect(0, y, w, 1, '#3a2a1a');
    for (let x = 2; x < w - 2; x += 4) rect(x, y - 3, 2, 3, ['#7a2a2a', '#3a5a6a', '#8a7a3a', '#5a6a3a'][(x + y) % 4]);
  }
  if (b.kind === 'altar') rect(Math.round(w / 2) - 1, wallY + 2, 2, 7, '#d4a537'), rect(Math.round(w / 2) - 3, wallY + 4, 6, 2, '#d4a537');
  if (b.kind === 'sacks') for (let x = 1; x < w - 4; x += 6) rect(x, 2, 5, roofH - 3, '#b0a06a'), rect(x + 2, 1, 1, 2, '#6a5a3a');
  if (b.kind === 'anvil') rect(2, 2, w - 4, 2, '#a8a2b0');
  if (b.kind === 'pew' || b.kind === 'bench') rect(0, wallY + l.tall - 2, 2, 2, '#14121a'), rect(w - 2, wallY + l.tall - 2, 2, 2, '#14121a');
}

/** (x, y) is the block's top-left on screen (the footprint's corner). */
export function drawBlock(c: Ctx, b: Block, x: number, y: number, lit: boolean): void {
  const st = state(b);
  let got = cache.get(b);
  if (!got || got.s !== st) cache.set(b, (got = { s: st, c: paint(b, st) }));
  const cv = got.c, l = LOOK[b.kind], tall = st === 2 ? RUBBLE : l.tall, top = Math.round(y - tall);
  c.lit.drawImage(cv, Math.round(x), top);
  if (st === 2) {
    // Embers in the ash.
    for (let i = 0; i < 4; i++) if (Math.floor(c.now * 3 + i * 1.7 + b.x) % 3 === 0) {
      c.glow.fillStyle = i % 2 ? '#ff6a20' : '#a83a10';
      c.glow.fillRect(Math.round(x + ((i * 37 + b.y * 13) % cv.width)), Math.round(top + RUBBLE + ((i * 11) % Math.max(1, cv.height - RUBBLE))), 1, 1);
    }
    return;
  }
  c.glow.globalCompositeOperation = 'destination-out';
  c.glow.fillRect(Math.round(x), top, cv.width, cv.height);
  c.glow.globalCompositeOperation = 'source-over';
  const w = cv.width, foot = Math.round(y + b.h * PX);
  if (b.kind === 'den') {
    // Eyes in the dark of the den's mouth.
    c.glow.fillStyle = Math.floor(c.now * 0.8 + b.x) % 5 ? '#ff4a3a' : '#7a1d1d';
    c.glow.fillRect(Math.round(x + w / 2 - 2), foot - 7, 1, 1);
    c.glow.fillRect(Math.round(x + w / 2 + 1), foot - 7, 1, 1);
  }
  if ((b.burning ?? -1) >= 0) return flames(c, b, x, top, w, Math.round(b.h * PX), l.tall);
  if (!l.windows || !lit || b.maxHp) return;
  // Lit windows either side of the door: someone lives here.
  const wy = Math.round(y + b.h * PX - l.tall + 5);
  c.glow.fillStyle = '#ffd27a';
  for (const wx of [Math.round(w * 0.22), Math.round(w * 0.72)]) c.glow.fillRect(Math.round(x + wx), wy, 3, 3);
  if (b.kind === 'forge') (c.glow.fillStyle = Math.floor(c.now * 8) % 2 ? '#ff9a3c' : '#ff6a20'), c.glow.fillRect(Math.round(x + w / 2 - 2), Math.round(y + b.h * PX - 5), 4, 3);
}

/** A building on fire: flames over the roof (more as it burns down), smoke rising, the windows aglow. */
function flames(c: Ctx, b: Block, x: number, top: number, w: number, roofH: number, tall: number): void {
  const share = 1 - (b.hp ?? 0) / (b.maxHp || 1), n = Math.max(2, Math.round((w / 7) * (0.4 + 0.6 * share)));
  for (let i = 0; i < n; i++) {
    const fx = Math.round(x + ((i + 0.5) * w) / n + Math.sin(i * 2.3) * 3), fy = Math.round(top + roofH * (0.3 + 0.6 * ((i * 7) % 5) / 5));
    const h = 4 + Math.round(3 * (1 + Math.sin(c.now * 11 + i * 1.9)) + share * 4);
    for (let k = 0; k < h; k++) {
      c.glow.fillStyle = k < 2 ? '#fff1b0' : k < h / 2 ? '#ffb44c' : k < h - 1 ? '#ff7a28' : '#a83a10';
      const wob = Math.round(Math.sin(c.now * 9 + i + k * 0.7) * (k / 4));
      c.glow.fillRect(fx + wob - (k < h / 2 ? 1 : 0), fy - k, k < h / 2 ? 3 : 1, 1);
    }
  }
  // Smoke drifting up and off.
  for (let j = 0; j < 5; j++) {
    const p = (c.now * 0.35 + j * 0.2 + b.x * 0.13) % 1, r = 2 + p * 6;
    c.lit.globalAlpha = (1 - p) * 0.55;
    c.lit.fillStyle = '#3a363c';
    c.lit.fillRect(Math.round(x + w / 2 + Math.sin(p * 6 + j) * 6 + p * 14 - r), Math.round(top - p * 46 - r), Math.round(r * 2), Math.round(r * 1.6));
  }
  c.lit.globalAlpha = 1;
  c.glow.fillStyle = Math.floor(c.now * 12) % 2 ? '#ff9a3c' : '#ff6a20';
  for (const wx of [Math.round(w * 0.22), Math.round(w * 0.72)]) c.glow.fillRect(Math.round(x + wx), top + roofH + Math.round(tall / 3), 3, 3);
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
