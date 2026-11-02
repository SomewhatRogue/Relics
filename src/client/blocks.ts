/**
 * Buildings, walls, fences and furniture (blocks) and the round things (trees, rocks, hay, wells, the
 * Lantern), drawn with the actors and sorted by their foot, so you walk behind a cottage or a tree. A
 * block is its footprint with a front wall rising from its bottom edge and a roof over it. Wooden ones
 * on a job char as they're hurt, burn with flames and smoke, and fall in to rubble.
 */
import type { Block, Round } from '../shared/arena';
import { drawLit, houseOf, paintHouse } from './cottage';
import { paintFate } from './wreck';
import { blit, type Ctx } from './draw';
import { furnish, mouth, type Look } from './furnish';
import { drawText, textWidth } from './pixfont';
import { SPRITES } from './sprites';
import { drawLife } from './streetlife';
import { wear, windowsLit } from './wear';
import { OX, OY, PX } from './world';

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
  tower: { tall: 64, roof: '#3a3050', ridge: '#4a3e66', wall: '#57525e', windows: true },
  tavern: { tall: 26, roof: '#4a2a1e', ridge: '#6a3a26', wall: '#5e4a36', windows: true },
  monument: { tall: 22, roof: '#6a6470', ridge: '#8a8494', wall: '#57525e', windows: false, furniture: true },
  rubble: { tall: 10, roof: '#45414c', ridge: '#55505e', wall: '#34313a', windows: false },
  cart: { tall: 9, roof: '#7a5a34', ridge: '#8b6a3a', wall: '#4a3420', windows: false, furniture: true },
  rack: { tall: 16, roof: '#4a3420', ridge: '#4a3420', wall: '#5a3d22', windows: false, furniture: true },
  partition: { tall: 22, roof: '#3e2a1a', ridge: '#5a3d22', wall: '#6a5e52', windows: false, furniture: true },
  loom: { tall: 18, roof: '#5a3d22', ridge: '#7a5a34', wall: '#3a2a1a', windows: false, furniture: true },
  gallows: { tall: 34, roof: '#5a3d22', ridge: '#5a3d22', wall: '#2e2016', windows: false, furniture: true },
  hurdle: { tall: 12, roof: '#3a2818', ridge: '#3a2818', wall: '#5a4a30', windows: false, furniture: true },
  pen: { tall: 9, roof: '#8a7448', ridge: '#6b4a2b', wall: '#5a3d22', windows: false, furniture: true },
};

/** 0 standing, 1 charred (under half its health), 2 burned down. */
const state = (b: Block) => (b.ruined ? 2 : b.maxHp && (b.hp ?? 0) < b.maxHp * 0.5 ? 1 : 0);
const cache = new WeakMap<Block, { s: number; c: HTMLCanvasElement }>();
const RUBBLE = 7;
type Rect = (x: number, y: number, w: number, h: number, c: string) => void;

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
  const roofH = d, wallY = roofH, home = houseOf(b);
  if (home) paintHouse(rect, b, home, w, roofH, l.tall);
  else furnished(g, b, rect, w, roofH, wallY, l);
  door(b, rect, w, wallY, l);
  if (home) paintFate(g, rect, b, w, roofH, l.tall);
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
  if (b.worn) wear(g, rect, b, w, roofH, wallY, l.tall);
  if (st === 1) {
    // Scorched: blackened, the roof holed.
    g.globalCompositeOperation = 'source-atop';
    rect(0, 0, w, c.height, 'rgba(18,12,8,0.5)');
    g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < w / 6; i++) rect(rnd(w - 4), rnd(Math.max(1, roofH - 3)), 3 + rnd(4), 2 + rnd(3), '#0d0b10');
  }
  return c;
}

/** Any block but a job's house: its roof, its front wall, then what makes it what it is. */
function furnished(g: CanvasRenderingContext2D, b: Block, rect: Rect, w: number, roofH: number, wallY: number, l: Look): void {
  rect(0, 0, w, roofH, l.roof);
  if (b.kind === 'rockwall' || b.kind === 'rubble') for (let i = 0; i < w * 2; i++) rect((i * 37) % w, (i * 13) % roofH, 2, 1, i % 3 ? '#3a3640' : '#55505e');
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
  furnish(g, b, rect, w, roofH, wallY, l);
}

/** A door in the middle of the front wall. */
function door(b: Block, rect: Rect, w: number, wallY: number, l: Look): void {
  if (!b.door && b.kind !== 'den' && b.kind !== 'granary') return;
  const dw = b.kind === 'barn' ? 12 : b.kind === 'den' ? 8 : 6, dh = Math.min(l.tall - 3, b.kind === 'barn' ? 18 : 11);
  rect(Math.round(w / 2 - dw / 2), wallY + l.tall - dh, dw, dh, b.kind === 'den' ? '#0d0b10' : '#2a1e14');
  if (b.kind !== 'den') rect(Math.round(w / 2 - dw / 2), wallY + l.tall - dh, dw, 1, '#5a3d22');
  // Barred: planks nailed across.
  if (b.locked) for (const k of [0.35, 0.7]) rect(Math.round(w / 2 - dw / 2) - 2, Math.round(wallY + l.tall - dh * k), dw + 4, 2, '#7a5a34');
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
  if ((b.burning ?? -1) >= 0 || b.smoulder) return flames(c, b, x, top, w, Math.round(b.h * PX), l.tall);
  if (b.kind === 'hearth' && b.look === 2) embers(c, x, top, w, Math.round(b.h * PX), l.tall);
  const home = houseOf(b);
  if (home) return void (home.lit && b.kind === 'house' && b.fate !== 'blocked' && drawLit(c, home, x, top, w, Math.round(b.h * PX), l.tall));
  if (!l.windows || !lit || b.maxHp) return;
  // Lit windows either side of the door: someone lives here.
  const wy = Math.round(y + b.h * PX - l.tall + 5);
  c.glow.fillStyle = '#ffd27a';
  for (const wx of windowsLit(b).map((k) => Math.round(w * k))) c.glow.fillRect(Math.round(x + wx), wy, 3, 3);
  if (b.kind === 'forge') (c.glow.fillStyle = Math.floor(c.now * 8) % 2 ? '#ff9a3c' : '#ff6a20'), c.glow.fillRect(Math.round(x + w / 2 - 2), Math.round(y + b.h * PX - 5), 4, 3);
}

/** A lit hearth: the mouth glowing, coals winking along its floor (the flame is the room's torch). */
function embers(c: Ctx, x: number, top: number, w: number, roofH: number, tall: number): void {
  const m = mouth(w, roofH, tall), g = c.glow, t = c.now;
  g.globalAlpha = 0.35 + 0.1 * Math.sin(t * 9);
  g.fillStyle = '#ff6a20';
  g.fillRect(Math.round(x + m.x + 1), Math.round(top + m.y + m.h - 5), m.w - 2, 4);
  g.globalAlpha = 1;
  for (let i = 1; i < m.w - 1; i += 2) {
    g.fillStyle = Math.floor(t * 6 + i * 1.3) % 3 ? '#ff9a3c' : '#fff1b0';
    g.fillRect(Math.round(x + m.x + i), Math.round(top + m.y + m.h - 2 - (i % 3 === 0 ? 1 : 0)), 1, 1);
  }
}

/** A building (or a wagon) on fire: tongues of flame with white-hot roots licking up off the roof, bits
 *  tearing loose and rising, embers drifting, and a thick column of smoke rolling off downwind. */
function flames(c: Ctx, b: Block, x: number, top: number, w: number, roofH: number, tall: number): void {
  const share = b.smoulder ? 0.8 : 1 - (b.hp ?? 0) / (b.maxHp || 1), t = c.now, g = c.glow;
  const n = Math.max(3, Math.round((w / 5) * (0.5 + 0.5 * share))), base = top + Math.round(roofH * 0.7);
  // Smoke first (behind): big soft billows, dark at the root and greying as they climb.
  for (let j = 0; j < 9; j++) {
    const p = (t * 0.22 + j / 9 + b.x * 0.13) % 1, r = 3 + p * 9;
    c.lit.globalAlpha = (1 - p) * 0.6;
    c.lit.fillStyle = p < 0.3 ? '#1e1a1c' : p < 0.6 ? '#3a3438' : '#5a5458';
    const sx = x + w / 2 + Math.sin(p * 5 + j * 1.7) * 5 + p * 22, sy = top - 6 - p * 60;
    c.lit.beginPath();
    c.lit.ellipse(Math.round(sx), Math.round(sy), r, r * 0.8, 0, 0, Math.PI * 2);
    c.lit.fill();
  }
  c.lit.globalAlpha = 1;
  // Tongues: each a tapering column, white then yellow then orange then red at the tip, flickering.
  const COL = ['#fffbe8', '#fff1b0', '#ffd27a', '#ffb44c', '#ff8a30', '#ff6a20', '#d8441a', '#9a2a10'];
  for (let i = 0; i < n; i++) {
    const fx = x + ((i + 0.5) * w) / n + Math.sin(i * 2.3) * 2, seed = i * 1.93 + b.x;
    const h = Math.round(6 + 5 * share + 4 * (0.5 + 0.5 * Math.sin(t * 9 + seed * 3)) + 3 * (0.5 + 0.5 * Math.sin(t * 23 + seed)));
    const half = 2 + Math.round(share * 1.5);
    for (let k = 0; k < h; k++) {
      const f = k / h, wide = Math.max(0, Math.round(half * (1 - f * f))), sway = Math.sin(t * 7 + seed + k * 0.45) * f * 2.5;
      for (let dx = -wide; dx <= wide; dx++) {
        const edge = Math.abs(dx) / (wide + 0.5);
        g.fillStyle = COL[Math.min(COL.length - 1, Math.floor((f * 0.75 + edge * 0.45) * COL.length))];
        g.fillRect(Math.round(fx + dx + sway), base - k, 1, 1);
      }
    }
    // A lick tearing loose and rising.
    const lp = (t * 1.6 + seed * 0.37) % 1;
    if (lp < 0.6) (g.fillStyle = lp < 0.3 ? '#ffd27a' : '#ff7a28'), g.fillRect(Math.round(fx + Math.sin(t * 5 + seed) * 2), Math.round(base - h - 2 - lp * 10), 1, lp < 0.3 ? 2 : 1);
  }
  // Embers drifting up and off.
  for (let e = 0; e < 10; e++) {
    const p = (t * 0.5 + e * 0.137 + b.y * 0.21) % 1;
    g.fillStyle = p < 0.5 ? '#ffd27a' : '#ff6a20';
    g.fillRect(Math.round(x + ((e * 37) % Math.max(1, w)) + Math.sin(t * 3 + e) * 3 + p * 10), Math.round(base - 6 - p * 50), 1, 1);
  }
  // The windows (a building) glow and flicker.
  if (b.smoulder) return;
  g.fillStyle = Math.floor(t * 12) % 2 ? '#ff9a3c' : '#ff6a20';
  for (const wx of [Math.round(w * 0.22), Math.round(w * 0.72)]) g.fillRect(Math.round(x + wx), top + roofH + Math.round(tall / 3), 3, 3);
}

export const blockFoot = (b: Block) => OY + (b.y + b.h) * PX;
export const blockAt = (b: Block): [number, number] => [OX + b.x * PX, OY + b.y * PX];

/** A round thing at its foot (x, y on screen). */
export function drawRound(c: Ctx, r: Round, x: number, y: number): void {
  if (r.kind === 'pillar') return blit(c, SPRITES.pillar, x, y + 5);
  if (r.kind === 'crows' || r.kind === 'moths' || r.kind === 'dog' || r.kind === 'smoke') return void drawLife(c, r, x, y);
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
